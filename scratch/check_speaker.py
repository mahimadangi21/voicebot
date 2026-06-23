# scratch/check_speaker.py
import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

from tts_engine import speak

def main():
    text = "Main ICICI bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon."
    
    # Generate with 'anushka'
    file_anushka = "audio_output/test_anushka.mp3"
    print("Generating with 'anushka'...")
    try:
        speak(text, file_anushka, engine="sarvam")
        os.environ["SARVAM_API_KEY"] = os.environ.get("SARVAM_API_KEY", "") # Keep key
        # We need to temporarily force the speaker name to anushka in speak_with_sarvam
        # Let's inspect speak_with_sarvam signature and behavior.
    except Exception as e:
        print(f"Error anushka: {e}")

    # Let's also print the file size of the target file
    target = "audio_output/08cedcb2_turn_7d0413.mp3"
    if os.path.exists(target):
        print(f"Target file: {target} size: {os.path.getsize(target)} bytes")
    else:
        print("Target file not found")

if __name__ == "__main__":
    main()
