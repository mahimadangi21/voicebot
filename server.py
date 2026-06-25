# main.py  —  FastAPI backend for Hindi Voice Bot POC
import os
import uuid
import json
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from conversation_engine import (
    CallContext, bot_say, process_user_reply, is_call_over, call_succeeded,
    detect_intent, State, Intent
)
from tts_engine import speak_to_file

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(title="Hindi Voice Bot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUDIO_DIR = Path("audio_output")
AUDIO_DIR.mkdir(exist_ok=True)

HISTORY_FILE = Path("conversation_history.json")
SESSIONS_FILE = "sessions.json"

# In-memory session store  {session_id -> CallContext}
sessions: dict[str, CallContext] = {}

def load_sessions():
    global sessions
    if not os.path.exists(SESSIONS_FILE):
        sessions = {}
        return
    try:
        with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            sessions = {}
            for sid, sdata in data.items():
                ctx = CallContext(
                    name=sdata["name"],
                    amount=sdata["amount"],
                    bank_name=sdata["bank_name"],
                    state=State[sdata["state"]],
                    unclear_retries=sdata["unclear_retries"],
                    max_unclear_retries=sdata["max_unclear_retries"],
                    transcript=[tuple(item) for item in sdata["transcript"]],
                    promise_date=sdata.get("promise_date", ""),
                    callback_time=sdata.get("callback_time", ""),
                    engine=sdata.get("engine", "sarvam"),
                    voice=sdata.get("voice", "male")
                )
                sessions[sid] = ctx
        print(f"[SESSION PERSIST] Loaded {len(sessions)} sessions from {SESSIONS_FILE}")
    except Exception as e:
        print(f"[SESSION PERSIST] Error loading sessions: {e}")
        sessions = {}

def save_sessions():
    try:
        data = {}
        for sid, ctx in sessions.items():
            data[sid] = {
                "name": ctx.name,
                "amount": ctx.amount,
                "bank_name": ctx.bank_name,
                "state": ctx.state.name,
                "unclear_retries": ctx.unclear_retries,
                "max_unclear_retries": ctx.max_unclear_retries,
                "transcript": ctx.transcript,
                "promise_date": ctx.promise_date,
                "callback_time": ctx.callback_time,
                "engine": getattr(ctx, "engine", "sarvam"),
                "voice": getattr(ctx, "voice", "male")
            }
        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[SESSION PERSIST] Error saving sessions: {e}")

@app.on_event("startup")
def startup_event():
    load_sessions()

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class StartRequest(BaseModel):
    name: str
    amount: int
    bank_name: str = "ICICI"
    engine: Optional[str] = "sarvam"
    voice: Optional[str] = "male"

class ReplyRequest(BaseModel):
    session_id: str
    user_text: str

class TTSRequest(BaseModel):
    text: str
    session_id: Optional[str] = None
    engine: Optional[str] = None
    voice: Optional[str] = None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _save_history(session_id: str, ctx: CallContext):
    history = []
    if HISTORY_FILE.exists():
        try:
            history = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        except Exception:
            history = []

    result = "succeeded" if call_succeeded(ctx) else ctx.state.value
    entry = {
        "session_id": session_id,
        "name": ctx.name,
        "amount": ctx.amount,
        "bank_name": ctx.bank_name,
        "result": result,
        "date": datetime.now().isoformat(),
        "transcript": ctx.transcript,
    }
    history.append(entry)
    HISTORY_FILE.write_text(json.dumps(history, ensure_ascii=False, indent=2), encoding="utf-8")

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "healthy", "sessions": len(sessions)}

@app.post("/api/start")
def start_conversation(req: StartRequest):
    sid = str(uuid.uuid4())[:8]
    engine = req.engine.strip().lower() if req.engine else "sarvam"
    voice = req.voice.strip().lower() if req.voice else "male"
    ctx = CallContext(
        name=req.name.strip(),
        amount=req.amount,
        bank_name=req.bank_name.strip(),
        engine=engine,
        voice=voice
    )
    sessions[sid] = ctx
    save_sessions()

    # Get the opening greeting
    text = bot_say(ctx)
    fname = f"{sid}_turn_00.mp3"

    # Generate the TTS file
    try:
        speak_to_file(text, str(AUDIO_DIR / fname), engine=engine, voice=voice)
    except Exception as e:
        print(f"[TTS] Start audio generation failed: {e}")

    # Save session again to persist the greeting log in transcript
    save_sessions()

    return {
        "session_id": sid,
        "bot_text": text,
        "audio_url": f"/audio/{fname}"
    }

@app.post("/api/reply")
def reply(req: ReplyRequest):
    load_sessions()  # Ensure we have the latest sessions from file
    sid = req.session_id
    user_text = req.user_text.strip()

    ctx = sessions.get(sid)
    if not ctx:
        raise HTTPException(status_code=404, detail="Session not found")

    if is_call_over(ctx):
        raise HTTPException(status_code=400, detail="Conversation already ended")

    # Process user text and get the bot's next reply
    bot_text = process_user_reply(ctx, user_text)
    save_sessions()  # Save updated state and transcript

    if bot_text == "[continue_listening]":
        return {
            "bot_text": "[continue_listening]",
            "audio_url": "",
            "state": ctx.state.name,
            "is_terminal": False,
            "no_op": True
        }

    # Generate TTS audio file
    fname = f"{sid}_turn_{uuid.uuid4().hex[:6]}.mp3"
    try:
        speak_to_file(
            bot_text,
            str(AUDIO_DIR / fname),
            engine=getattr(ctx, "engine", "sarvam"),
            voice=getattr(ctx, "voice", "male")
        )
    except Exception as e:
        print(f"[TTS] Reply audio generation failed: {e}")

    if is_call_over(ctx):
        _save_history(sid, ctx)

    payment_link = None
    if ctx.state == State.PAYMENT_CONFIRM or ctx.state.name == "PAYMENT_CONFIRM":
        import urllib.parse
        safe_name = urllib.parse.quote(ctx.name)
        safe_bank = urllib.parse.quote(ctx.bank_name)
        payment_link = f"https://pay.bankconnect.mock/pay/{sid}?amt={ctx.amount}&cust={safe_name}&bk={safe_bank}"

    return {
        "bot_text": bot_text,
        "audio_url": f"/audio/{fname}",
        "state": ctx.state.name,
        "is_terminal": is_call_over(ctx),
        "payment_link": payment_link
    }

@app.post("/api/tts")
def tts_only(req: TTSRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="'text' field is required")

    engine = req.engine
    voice = req.voice
    if req.session_id:
        ctx = sessions.get(req.session_id)
        if ctx:
            engine = engine or getattr(ctx, "engine", "sarvam")
            voice = voice or getattr(ctx, "voice", "male")

    engine = engine or "sarvam"
    voice = voice or "male"

    fname = f"tts_{uuid.uuid4().hex[:8]}.mp3"
    filepath = str(AUDIO_DIR / fname)
    try:
        speak_to_file(text, filepath, engine=engine, voice=voice)
        return {"audio_url": f"/audio/{fname}", "bot_text": text}
    except Exception as e:
        print(f"[TTS ENDPOINT] Error synthesizing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/session/{session_id}")
def get_session(session_id: str):
    ctx = sessions.get(session_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": session_id,
        "name": ctx.name,
        "amount": ctx.amount,
        "bank_name": ctx.bank_name,
        "state": ctx.state.value,
        "is_over": is_call_over(ctx),
        "succeeded": call_succeeded(ctx),
        "transcript": ctx.transcript,
    }

@app.get("/api/intent")
def detect_intent_endpoint(text: str):
    intent = detect_intent(text)
    return {"text": text, "intent": intent.value}

@app.get("/api/audio-files")
def list_audio_files():
    files = []
    for f in sorted(AUDIO_DIR.glob("*.mp3")):
        stat = f.stat()
        files.append({
            "filename": f.name,
            "url": f"/audio/{f.name}",
            "size_bytes": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        })
    return {"files": files}

@app.delete("/api/audio-files/{filename}")
def delete_audio_file(filename: str):
    path = AUDIO_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    path.unlink()
    return {"deleted": filename}

@app.get("/api/history")
def get_history():
    if not HISTORY_FILE.exists():
        return {"history": []}
    try:
        history = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        return {"history": history}
    except Exception:
        return {"history": []}

@app.delete("/api/history/{session_id}")
def delete_history(session_id: str):
    if not HISTORY_FILE.exists():
        raise HTTPException(status_code=404, detail="No history found")
    history = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
    history = [h for h in history if h.get("session_id") != session_id]
    HISTORY_FILE.write_text(json.dumps(history, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"deleted": session_id}

# Test routes calling engine logic directly
@app.post("/test/happy-path")
def test_happy_path():
    import time
    start = time.time()
    try:
        ctx = CallContext(name="Test User", amount=5000, bank_name="ICICI")
        bot_say(ctx)
        process_user_reply(ctx, "haan")
        process_user_reply(ctx, "konse bank se ho")
        process_user_reply(ctx, "ha bhejdo")
        passed = call_succeeded(ctx)
        elapsed = round((time.time() - start) * 1000, 2)
        return {"test": "happy_path", "passed": passed, "elapsed_ms": elapsed, "final_state": ctx.state.value}
    except Exception as e:
        elapsed = round((time.time() - start) * 1000, 2)
        return {"test": "happy_path", "passed": False, "elapsed_ms": elapsed, "error": str(e)}

@app.post("/test/wrong-number")
def test_wrong_number():
    import time
    start = time.time()
    try:
        ctx = CallContext(name="Test User", amount=5000, bank_name="ICICI")
        bot_say(ctx)
        process_user_reply(ctx, "nahi galat number hai")
        passed = ctx.state == State.CALL_ENDED_WRONG_NUMBER
        elapsed = round((time.time() - start) * 1000, 2)
        return {"test": "wrong_number", "passed": passed, "elapsed_ms": elapsed, "final_state": ctx.state.value}
    except Exception as e:
        elapsed = round((time.time() - start) * 1000, 2)
        return {"test": "wrong_number", "passed": False, "elapsed_ms": elapsed, "error": str(e)}

@app.post("/test/refusal")
def test_refusal():
    import time
    start = time.time()
    try:
        ctx = CallContext(name="Test User", amount=5000, bank_name="ICICI")
        bot_say(ctx)
        process_user_reply(ctx, "haan")
        process_user_reply(ctx, "nahi nahi mujhe nahi pay karna")
        passed = ctx.state == State.CALL_ENDED_REFUSED
        elapsed = round((time.time() - start) * 1000, 2)
        return {"test": "refusal", "passed": passed, "elapsed_ms": elapsed, "final_state": ctx.state.value}
    except Exception as e:
        elapsed = round((time.time() - start) * 1000, 2)
        return {"test": "refusal", "passed": False, "elapsed_ms": elapsed, "error": str(e)}

@app.post("/test/unclear")
def test_unclear():
    import time
    start = time.time()
    try:
        ctx = CallContext(name="Test User", amount=5000, bank_name="ICICI")
        bot_say(ctx)
        process_user_reply(ctx, "kya bol rahe ho")
        process_user_reply(ctx, "kuch samajh nahi aaya")
        passed = ctx.state == State.CALL_ENDED_UNCLEAR
        elapsed = round((time.time() - start) * 1000, 2)
        return {"test": "unclear", "passed": passed, "elapsed_ms": elapsed, "final_state": ctx.state.value}
    except Exception as e:
        elapsed = round((time.time() - start) * 1000, 2)
        return {"test": "unclear", "passed": False, "elapsed_ms": elapsed, "error": str(e)}

# Mount static files for synthesized audio
app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")

# Serve React SPA Frontend static assets
DIST_DIR = Path("frontend/dist")

@app.get("/{path:path}")
def serve_frontend(path: str):
    if not path:
        return FileResponse(DIST_DIR / "index.html")
    file_path = DIST_DIR / path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    return FileResponse(DIST_DIR / "index.html")

if __name__ == "__main__":
    import uvicorn
    # Default to 7860 on Hugging Face Spaces or inside Docker container, otherwise use 5000 locally
    default_port = 7860 if "SPACE_ID" in os.environ or os.path.exists("/.dockerenv") else 5000
    port = int(os.environ.get("PORT", default_port))
    print(f"Starting Hindi Voice Bot FastAPI server on port {port}...")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
