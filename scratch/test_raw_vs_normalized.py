# scratch/test_raw_vs_normalized.py
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from tts_engine import speak_with_sarvam

def main():
    # 1. Raw text
    raw_text = "Main ICICI bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon."
    file_raw = "audio_output/test_raw.mp3"
    if os.path.exists(file_raw):
        os.remove(file_raw)
    speak_with_sarvam(raw_text, file_raw, voice="ritu")
    size_raw = os.path.getsize(file_raw)
    print(f"Raw text size (ritu): {size_raw} bytes")
    
    # Compare with target
    target_path = "audio_output/08cedcb2_turn_7d0413.mp3"
    if os.path.exists(target_path):
        target_size = os.path.getsize(target_path)
        print(f"Target size: {target_size} bytes")
        if size_raw == target_size:
            print("*** EXACT MATCH! The target file was generated using speaker 'ritu' with raw un-normalized text! ***")
    else:
        print("Target file not found")

if __name__ == "__main__":
    main()
