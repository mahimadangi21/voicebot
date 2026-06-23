# scratch/test_tts_fallback.py
import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

# Force invalid key to trigger fallback
os.environ["SARVAM_API_KEY"] = "INVALID_KEY_TO_FORCE_FALLBACK"

from tts_engine import speak, hinglish_to_devanagari

def run_fallback_test():
    print("==============================================================")
    print(" TESTING TTS FALLBACK PATH (FORCING SARVAM FAILURE)")
    print("==============================================================")

    bot_lines = [
        ("greeting_fallback", "Hello, kya meri baat Jitesh Soni se ho rahi hai?"),
        ("amount_due_fallback", "Aapka 5000 rupaye ka amount due hai hamare bank mein."),
        ("bank_name_fallback", "Main ICICI bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon."),
        ("payment_confirm_fallback", "Theek hai, maine aapko payment link bhej diya hai aapke number par. Dhanyavaad, aapka din shubh ho!")
    ]

    output_dir = "audio_output"
    os.makedirs(output_dir, exist_ok=True)

    for name, text in bot_lines:
        filename = os.path.join(output_dir, f"{name}.mp3")
        print(f"\n--- Testing Fallback for line: '{name}' ---")
        print(f"Original text: {text}")
        
        # Test what translation happens
        transliterated = hinglish_to_devanagari(text)
        print(f"Transliterated for gTTS: '{transliterated}'")

        if os.path.exists(filename):
            os.remove(filename)

        try:
            # This should raise exception in Sarvam and catch it, then fall back to gTTS
            speak(text, filename, engine="sarvam")
            if os.path.exists(filename):
                size = os.path.getsize(filename)
                print(f"SUCCESS: Generated fallback audio {filename} ({size} bytes)")
            else:
                print(f"FAILED: File {filename} was not created.")
        except Exception as e:
            print(f"FAILED: Exception occurred during speak: {e}")

if __name__ == "__main__":
    run_fallback_test()
