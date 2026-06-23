"""
main.py  —  FastAPI backend for Hindi Voice Bot POC
Run: uvicorn main:app --reload --port 8000
"""

import os
import uuid
import json
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

# Mount audio files as static
app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")

# In-memory session store  {session_id -> CallContext}
sessions: dict[str, CallContext] = {}
# Track audio files per session  {session_id -> [{"turn": n, "state": ..., "filename": ...}]}
session_audio: dict[str, list] = {}

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class StartRequest(BaseModel):
    name: str
    amount: int
    bank_name: str = "ICICI"

class ReplyRequest(BaseModel):
    session_id: str
    user_text: str

class BotTurn(BaseModel):
    bot_text: str
    audio_url: Optional[str]
    state: str
    is_over: bool
    succeeded: bool
    turn: int

class SessionResponse(BaseModel):
    session_id: str
    turn: BotTurn

class HistoryEntry(BaseModel):
    session_id: str
    name: str
    amount: int
    bank_name: str
    result: str
    date: str
    transcript: list

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _tts(text: str, filename: str) -> Optional[str]:
    """Generate audio file; returns audio URL or None on failure."""
    path = AUDIO_DIR / filename
    try:
        speak_to_file(text, str(path))
        return f"/audio/{filename}"
    except Exception as e:
        print(f"[TTS] Failed: {e}")
        return None


def _make_turn(ctx: CallContext, bot_text: str, session_id: str) -> BotTurn:
    turn_num = len(session_audio.get(session_id, []))
    filename = f"{session_id}_turn{turn_num}.mp3"
    audio_url = _tts(bot_text, filename)

    entry = {
        "turn": turn_num,
        "state": ctx.state.value,
        "filename": filename,
        "audio_url": audio_url,
        "bot_text": bot_text,
        "timestamp": datetime.now().isoformat(),
    }
    session_audio.setdefault(session_id, []).append(entry)

    return BotTurn(
        bot_text=bot_text,
        audio_url=audio_url,
        state=ctx.state.value,
        is_over=is_call_over(ctx),
        succeeded=call_succeeded(ctx),
        turn=turn_num,
    )


def _save_history(session_id: str, ctx: CallContext):
    history = []
    if HISTORY_FILE.exists():
        try:
            history = json.loads(HISTORY_FILE.read_text())
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
    HISTORY_FILE.write_text(json.dumps(history, ensure_ascii=False, indent=2))


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "ok", "service": "Hindi Voice Bot API"}

@app.get("/health")
def health():
    return {"status": "healthy", "sessions": len(sessions)}


@app.post("/start", response_model=SessionResponse)
def start_conversation(req: StartRequest):
    session_id = str(uuid.uuid4())
    ctx = CallContext(name=req.name.strip(), amount=req.amount, bank_name=req.bank_name.strip())
    sessions[session_id] = ctx
    session_audio[session_id] = []

    greeting = bot_say(ctx)
    turn = _make_turn(ctx, greeting, session_id)

    return SessionResponse(session_id=session_id, turn=turn)


@app.post("/reply", response_model=SessionResponse)
def reply(req: ReplyRequest):
    ctx = sessions.get(req.session_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Session not found")
    if is_call_over(ctx):
        raise HTTPException(status_code=400, detail="Conversation already ended")

    intent = detect_intent(req.user_text, ctx.name)
    bot_text = process_user_reply(ctx, req.user_text)

    if not bot_text:
        bot_text = ""

    turn = _make_turn(ctx, bot_text, req.session_id)

    # Attach intent info (not in BotTurn model, extend via custom dict)
    if is_call_over(ctx):
        _save_history(req.session_id, ctx)

    return SessionResponse(session_id=req.session_id, turn=turn)


@app.get("/session/{session_id}")
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
        "audio_files": session_audio.get(session_id, []),
    }


@app.get("/intent")
def detect_intent_endpoint(text: str):
    intent = detect_intent(text)
    return {"text": text, "intent": intent.value}


@app.get("/audio-files")
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


@app.delete("/audio-files/{filename}")
def delete_audio_file(filename: str):
    path = AUDIO_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    path.unlink()
    return {"deleted": filename}


@app.get("/history")
def get_history():
    if not HISTORY_FILE.exists():
        return {"history": []}
    try:
        history = json.loads(HISTORY_FILE.read_text())
        return {"history": history}
    except Exception:
        return {"history": []}


@app.delete("/history/{session_id}")
def delete_history(session_id: str):
    if not HISTORY_FILE.exists():
        raise HTTPException(status_code=404, detail="No history found")
    history = json.loads(HISTORY_FILE.read_text())
    history = [h for h in history if h.get("session_id") != session_id]
    HISTORY_FILE.write_text(json.dumps(history, ensure_ascii=False, indent=2))
    return {"deleted": session_id}


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
