#!/usr/bin/env python3
"""
compare_tts.py
--------------
A testing utility to compare Sarvam AI and gTTS output on the same sentence.
Usage:
    python compare_tts.py "Aapka 5000 amount due hai ICICI bank mein."
"""

import sys
import os
from tts_engine import speak, normalize_for_tts

def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

    if len(sys.argv) > 1:
        test_text = " ".join(sys.argv[1:])
    else:
        test_text = "Hello, aapka 5000 rupaye ka amount due hai ICICI bank mein. OTP send kar diya hai."

    print("=" * 60)
    print(f"Original Text   : {test_text}")
    print(f"Normalized Text : {normalize_for_tts(test_text)}")
    print("=" * 60)

    output_dir = "audio_output"
    os.makedirs(output_dir, exist_ok=True)

    sarvam_file = os.path.join(output_dir, "compare_sarvam.mp3")
    gtts_file = os.path.join(output_dir, "compare_gtts.mp3")

    # 1. Synthesize with Sarvam (automatically normalizes)
    print("\n[1/2] Generating Sarvam AI version...")
    try:
        speak(test_text, sarvam_file, engine="sarvam")
        print(f"--> Saved to: {sarvam_file}")
    except Exception as e:
        print(f"--> Failed generating Sarvam version: {e}")

    # 2. Synthesize with gTTS (raw/plain text comparison)
    print("\n[2/2] Generating gTTS version...")
    try:
        speak(test_text, gtts_file, engine="gtts")
        print(f"--> Saved to: {gtts_file}")
    except Exception as e:
        print(f"--> Failed generating gTTS version: {e}")

    print("\nComparison generation completed! You can now listen and compare both files.")
    print("=" * 60)

if __name__ == "__main__":
    main()
