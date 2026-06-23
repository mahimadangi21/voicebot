# server.py
import os
import uuid
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from conversation_engine import CallContext, bot_say, process_user_reply, is_call_over, State
from tts_engine import speak_to_file

app = Flask(__name__)
# Enable CORS for frontend communication
CORS(app)

AUDIO_DIR = "audio_output"
SESSIONS_FILE = "sessions.json"
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
                    callback_time=sdata.get("callback_time", "")
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
                "callback_time": ctx.callback_time
            }
        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[SESSION PERSIST] Error saving sessions: {e}")

@app.route("/api/start", methods=["POST"])
def start():
    data = request.json or {}
    name = data.get("name", "Jitesh Soni").strip()
    amount_str = data.get("amount", "5000")
    
    try:
        amount = int(amount_str)
    except ValueError:
        amount = 5000
        
    bank_name = data.get("bank_name", "ICICI").strip()
    
    sid = str(uuid.uuid4())[:8]
    ctx = CallContext(name=name, amount=amount, bank_name=bank_name)
    sessions[sid] = ctx
    save_sessions()
    
    # Get the opening greeting
    text = bot_say(ctx)
    fname = f"{sid}_turn_00.mp3"
    
    # Generate the TTS file
    speak_to_file(text, os.path.join(AUDIO_DIR, fname))
    
    # Save session again to persist the greeting log in transcript
    save_sessions()
    
    return jsonify({
        "session_id": sid,
        "bot_text": text,
        "audio_url": f"/audio/{fname}"
    })

@app.route("/api/reply", methods=["POST"])
def reply():
    data = request.json or {}
    sid = data.get("session_id")
    user_text = data.get("user_text", "").strip()
    
    load_sessions()  # Ensure we have the latest sessions from file
    
    print(f"[REPLY DEBUG] Received sid: '{sid}'")
    print(f"[REPLY DEBUG] Available session keys in memory: {list(sessions.keys())}")
    
    ctx = sessions.get(sid)
    if not ctx:
        print(f"[REPLY DEBUG] Session '{sid}' not found in memory!")
        return jsonify({"error": "Session not found"}), 404
        
    if is_call_over(ctx):
        return jsonify({"error": "Conversation already ended"}), 400
        
    # Process user text and get the bot's next reply
    bot_text = process_user_reply(ctx, user_text)
    save_sessions()  # Save updated state and transcript
    
    # Generate TTS audio file
    fname = f"{sid}_turn_{uuid.uuid4().hex[:6]}.mp3"
    speak_to_file(bot_text, os.path.join(AUDIO_DIR, fname))
    
    return jsonify({
        "bot_text": bot_text,
        "audio_url": f"/audio/{fname}",
        "state": ctx.state.name,
        "is_terminal": is_call_over(ctx)
    })

@app.route("/api/tts", methods=["POST"])
def tts_only():
    """
    Synthesizes arbitrary text using the locked DEFAULT_SPEAKER / DEFAULT_MODEL
    voice (Sarvam rohan/bulbul:v3, gTTS Devanagari fallback) and returns an
    audio URL. Used by the frontend whenever it needs to play a bot line that
    is generated locally (e.g. endCallGracefully) but must use the locked voice
    rather than the browser's built-in speech synthesis.
    """
    data = request.json or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "'text' field is required"}), 400

    fname = f"tts_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(AUDIO_DIR, fname)
    try:
        speak_to_file(text, filepath)
        return jsonify({"audio_url": f"/audio/{fname}", "bot_text": text})
    except Exception as e:
        print(f"[TTS ENDPOINT] Error synthesizing: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/audio/<filename>")
def audio(filename):
    return send_from_directory(AUDIO_DIR, filename)

if __name__ == "__main__":
    os.makedirs(AUDIO_DIR, exist_ok=True)
    load_sessions()
    print("Starting Hindi Voice Bot Flask server on port 5000...")
    app.run(port=5000, debug=True, use_reloader=False)
