# scratch/test_tts_long_sentence.py
import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

from tts_engine import speak, hinglish_to_devanagari

def run_long_sentence_test():
    print("==============================================================")
    print(" TESTING TTS WITH A LONG, COMPLEX HINGLISH SENTENCE")
    print("==============================================================")

    # Realistic long sentence combining greeting, bank name, amount, and payment confirmation query
    long_text = (
        "Namaste, main ICICI bank recovery department se bol raha hoon. Kya meri baat Jitesh Soni se ho rahi hai? "
        "Aapka 5000 rupaye ka loan amount due hai hamare bank mein. Agar aap abhi pay kar rahe ho, to main aapko "
        "payment link bhej deta hoon aur check kar leta hoon. Kripya confirm kijiye."
    )

    print(f"Original Long Text (Length: {len(long_text)} chars):")
    print(f"  {long_text}\n")

    # 1. Inspect transliteration
    transliterated = hinglish_to_devanagari(long_text)
    print(f"Transliterated for gTTS:")
    print(f"  {transliterated}\n")

    output_dir = "audio_output"
    os.makedirs(output_dir, exist_ok=True)

    # 2. Test Primary Engine (Sarvam AI)
    print("--- Running Test 1: Primary Engine (Sarvam AI) ---")
    filename_primary = os.path.join(output_dir, "long_sentence_primary.mp3")
    if os.path.exists(filename_primary):
        os.remove(filename_primary)
        
    try:
        # Should call Sarvam AI
        speak(long_text, filename_primary, engine="sarvam")
        if os.path.exists(filename_primary):
            size = os.path.getsize(filename_primary)
            print(f"SUCCESS: Generated primary audio file: {filename_primary} ({size} bytes)")
        else:
            print("FAILED: Primary audio file was not created.")
    except Exception as e:
        print(f"FAILED: Exception in primary engine: {e}")

    # 3. Test Fallback Engine (gTTS)
    print("\n--- Running Test 2: Fallback Engine (gTTS) ---")
    filename_fallback = os.path.join(output_dir, "long_sentence_fallback.mp3")
    if os.path.exists(filename_fallback):
        os.remove(filename_fallback)

    # Temporarily remove API key to force fallback
    old_key = os.environ.get("SARVAM_API_KEY")
    os.environ["SARVAM_API_KEY"] = ""

    try:
        speak(long_text, filename_fallback, engine="sarvam")
        if os.path.exists(filename_fallback):
            size = os.path.getsize(filename_fallback)
            print(f"SUCCESS: Generated fallback audio file: {filename_fallback} ({size} bytes)")
        else:
            print("FAILED: Fallback audio file was not created.")
    except Exception as e:
        print(f"FAILED: Exception in fallback engine: {e}")
    finally:
        # Restore key
        if old_key is not None:
            os.environ["SARVAM_API_KEY"] = old_key

if __name__ == "__main__":
    run_long_sentence_test()
