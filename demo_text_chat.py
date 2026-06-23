"""
demo_text_chat.py
------------------
Run this to test the conversation logic by TYPING replies (fastest way
to demo the bot's "brain" to your manager without needing microphone/
speaker setup).

Each bot line is ALSO converted to a real Hindi .mp3 voice file using
the free gTTS engine, saved in ./audio_output/, so you can play them
back and prove "the bot speaks in Hindi" with actual audio.

Usage:
    python demo_text_chat.py

Then type replies like: Ha / Nahi / Konse bank se / Bhejdo
"""

import os
from conversation_engine import CallContext, bot_say, process_user_reply, is_call_over, call_succeeded
from tts_engine import speak_to_file

AUDIO_DIR = "audio_output"


def run_demo():
    os.makedirs(AUDIO_DIR, exist_ok=True)

    print("=" * 60)
    print("  HINDI VOICE BOT - POC (Text-input demo mode)")
    print("=" * 60)

    name = input("Enter customer name [default: Jitesh Soni]: ").strip() or "Jitesh Soni"
    amount_raw = input("Enter due amount [default: 5000]: ").strip() or "5000"
    amount = int(amount_raw)

    ctx = CallContext(name=name, amount=amount, bank_name="ICICI")

    turn = 0

    # First bot line (greeting) is spoken automatically, no user input needed yet
    bot_line = bot_say(ctx)
    _speak(bot_line, turn)
    turn += 1

    while not is_call_over(ctx):
        user_text = input("\nYou (type reply) > ").strip()
        if not user_text:
            continue

        bot_line = process_user_reply(ctx, user_text)
        if bot_line:
            _speak(bot_line, turn)
            turn += 1

        if is_call_over(ctx):
            break

    print("\n" + "=" * 60)
    if call_succeeded(ctx):
        print("CALL RESULT: SUCCESS - payment link would be sent now.")
        print(f"   -> [STUB] Sending SMS/WhatsApp payment link to {ctx.name}'s number...")
    else:
        print(f"CALL RESULT: ENDED -> final state = {ctx.state.value}")
    print("=" * 60)

    print("\nFull transcript:")
    for speaker, text in ctx.transcript:
        print(f"  [{speaker}] {text}")

    print(f"\nAll bot audio replies saved in ./{AUDIO_DIR}/ as bot_line_*.mp3")


def _speak(text: str, turn_index: int):
    print(f"\nBOT: {text}")
    path = os.path.join(AUDIO_DIR, f"bot_line_{turn_index}.mp3")
    try:
        speak_to_file(text, filename=path)
        print(f"   (voice saved -> {path})")
    except Exception as e:
        print(f"   [warning] TTS failed (likely no internet in this environment): {e}")


if __name__ == "__main__":
    run_demo()
