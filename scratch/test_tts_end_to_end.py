# scratch/test_tts_end_to_end.py
import os
import sys
import io

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

from tts_engine import speak

def run_verification():
    print("==============================================================")
    print(" RUNNING TTS END-TO-END VERIFICATION (4 CORE LINES)")
    print("==============================================================")

    bot_lines = [
        ("greeting", "Hello, kya meri baat Jitesh Soni se ho rahi hai?"),
        ("amount_due", "Aapka 5000 rupaye ka amount due hai hamare bank mein."),
        ("bank_name", "Main ICICI bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon."),
        ("payment_confirm", "Theek hai, maine aapko payment link bhej diya hai aapke number par. Dhanyavaad, aapka din shubh ho!")
    ]

    output_dir = "audio_output"
    os.makedirs(output_dir, exist_ok=True)

    success_count = 0

    for name, text in bot_lines:
        filename = os.path.join(output_dir, f"{name}.mp3")
        print(f"\n--- Synthesizing line: '{name}' ---")
        print(f"Original text: {text}")

        # Delete file if it exists to ensure fresh generation
        if os.path.exists(filename):
            os.remove(filename)

        try:
            # We explicitly synthesize with Sarvam AI to verify no fallbacks occur
            speak(text, filename, engine="sarvam")
            if os.path.exists(filename):
                size = os.path.getsize(filename)
                print(f"SUCCESS: Generated {filename} ({size} bytes)")
                
                # Check for reasonable minimum size to verify it is not cut off
                # Complete audio for these sentences should be at least 30KB
                if size > 30000:
                    print("--> Size check: PASSED (Healthy audio file size)")
                    success_count += 1
                else:
                    print("--> WARNING: Audio file size is suspiciously small! (Possibly cut off)")
            else:
                print(f"FAILED: File {filename} was not created.")
        except Exception as e:
            print(f"FAILED: Exception occurred during synthesis: {e}")

    print("\n==============================================================")
    print(f" VERIFICATION RESULTS: {success_count}/{len(bot_lines)} PASSED")
    print("==============================================================")
    
    assert success_count == len(bot_lines), "Verification failed: not all files generated successfully with healthy sizes."
    print("ALL CORE TTS LINES GENERATED SUCCESSFULLY WITH NO CUT-OFFS!")

if __name__ == "__main__":
    run_verification()
