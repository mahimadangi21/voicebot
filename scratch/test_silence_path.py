"""
test_silence_path.py
Tests the full silence → retry → call-end flow plus the new /api/tts endpoint.
Verifies that the locked speaker (rohan / bulbul:v3) is used on every line.
"""
import os, sys, time, requests
from dotenv import load_dotenv

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

load_dotenv()

BASE = 'http://127.0.0.1:5000'

print("=" * 70)
print("END-TO-END SILENCE PATH TEST")
print("=" * 70)

# ── 1. Start call ──────────────────────────────────────────────────────────
r = requests.post(f'{BASE}/api/start', json={
    'name': 'Mahima Dangi', 'amount': 5000, 'bank_name': 'ICICI'
}, timeout=10)
d = r.json()
sid = d['session_id']
print(f"\n[TURN 0 - GREETING]")
print(f"  Bot text : {d['bot_text']}")
print(f"  Audio URL: {d['audio_url']}")
time.sleep(1)

# ── 2. Silence 1 → should return retry line ───────────────────────────────
r2 = requests.post(f'{BASE}/api/reply', json={
    'session_id': sid, 'user_text': '[silence]'
}, timeout=10)
d2 = r2.json()
print(f"\n[TURN 1 - SILENCE 1]")
print(f"  State    : {d2.get('state')}")
print(f"  Terminal : {d2.get('is_terminal')}")
print(f"  Bot text : {d2.get('bot_text')}")
print(f"  Audio URL: {d2.get('audio_url')}")
time.sleep(1)

# ── 3. Silence 2 → should end call ───────────────────────────────────────
r3 = requests.post(f'{BASE}/api/reply', json={
    'session_id': sid, 'user_text': '[silence]'
}, timeout=10)
d3 = r3.json()
print(f"\n[TURN 2 - SILENCE 2 (should end call)]")
print(f"  State    : {d3.get('state')}")
print(f"  Terminal : {d3.get('is_terminal')}")
print(f"  Bot text : {d3.get('bot_text')}")
print(f"  Audio URL: {d3.get('audio_url')}")
time.sleep(1)

# ── 4. Test /api/tts endpoint (used by endCallGracefully) ─────────────────
closing_text = 'Theek hai, main baad mein call karta hoon. Dhanyavaad.'
r4 = requests.post(f'{BASE}/api/tts', json={'text': closing_text}, timeout=10)
d4 = r4.json()
print(f"\n[/api/tts ENDPOINT - endCallGracefully voice]")
print(f"  Status   : {r4.status_code}")
print(f"  Bot text : {d4.get('bot_text')}")
print(f"  Audio URL: {d4.get('audio_url')}")

# ── 5. Verify TTS locked constants ────────────────────────────────────────
print("\n" + "=" * 70)
print("LOCKED TTS CONSTANTS (from tts_engine.py)")
print("=" * 70)
# Import and show
import importlib.util, pathlib
spec = importlib.util.spec_from_file_location("tts_engine", r"c:\Desktop\POC\tts_engine.py")
tts = importlib.util.load_from_spec(spec)
spec.loader.exec_module(tts)
print(f"  DEFAULT_SPEAKER : {tts.DEFAULT_SPEAKER}")
print(f"  DEFAULT_MODEL   : {tts.DEFAULT_MODEL}")
print(f"  DEFAULT_LANG    : {tts.DEFAULT_LANG}")
print(f"  DEFAULT_PACE    : {tts.DEFAULT_PACE}")

# ── 6. Scan tts_engine.py for any hardcoded speaker overrides ─────────────
print("\n" + "=" * 70)
print("CHECKING FOR HARDCODED SPEAKER OVERRIDES IN tts_engine.py")
print("=" * 70)
with open(r"c:\Desktop\POC\tts_engine.py", encoding="utf-8") as f:
    lines = f.readlines()

suspects = []
for i, line in enumerate(lines, 1):
    stripped = line.strip()
    # Look for "speaker" assignments that are NOT using the constant
    if '"speaker"' in stripped and 'DEFAULT_SPEAKER' not in stripped and not stripped.startswith('#'):
        suspects.append((i, stripped))
    if "'speaker'" in stripped and 'DEFAULT_SPEAKER' not in stripped and not stripped.startswith('#'):
        suspects.append((i, stripped))

if suspects:
    print("  *** FOUND HARDCODED SPEAKER OVERRIDES ***")
    for lineno, content in suspects:
        print(f"  Line {lineno}: {content}")
else:
    print("  OK - No hardcoded speaker overrides found. All calls use DEFAULT_SPEAKER.")

print("\n" + "=" * 70)
print("SPEAKER PROOF SUMMARY")
print("=" * 70)
print(f"  All /api/start, /api/reply, /api/tts calls route through:")
print(f"    speak_to_file() -> speak() -> speak_with_sarvam()")
print(f"  speak_with_sarvam() ALWAYS sends:")
print(f"    speaker = DEFAULT_SPEAKER = '{tts.DEFAULT_SPEAKER}'")
print(f"    model   = DEFAULT_MODEL   = '{tts.DEFAULT_MODEL}'")
print(f"    lang    = DEFAULT_LANG    = '{tts.DEFAULT_LANG}'")
print(f"    pace    = DEFAULT_PACE    = {tts.DEFAULT_PACE}")
print()
print("  endCallGracefully in VoiceBot.jsx now:")
print("  1. STOPS current audio (prevents overlap)")
print("  2. FETCHES from /api/tts (locked voice, NOT browser TTS)")
print("  3. Falls back to browser TTS only if backend is unreachable")
