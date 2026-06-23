#!/usr/bin/env python3
"""
generate_bot_audios.py
----------------------
Regenerates pre-synthesized audio files for the 4 core bot lines using Sarvam AI
with the pronunciation normalization layer applied.
"""

import os
from tts_engine import speak

def main():
    # Core variables for test generation
    name = "Mahima Dangi"
    amount = 5000
    bank_name = "ICICI"

    # Define the 4 core bot lines
    core_lines = {
        "greeting": f"Hello, kya meri baat {name} se ho rahi hai?",
        "amount_due": f"Aapka {amount} rupaye ka amount due hai hamare bank mein.",
        "bank_name": f"Main {bank_name} bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon.",
        "payment_confirm": "Theek hai, maine aapko payment link bhej diya hai aapke number par. Dhanyavaad, aapka din shubh ho!"
    }

    output_dir = "audio_output"
    os.makedirs(output_dir, exist_ok=True)

    print("=" * 60)
    print("Pre-synthesizing core bot lines using Sarvam AI with normalization...")
    print("=" * 60)

    for key, text in core_lines.items():
        filename = os.path.join(output_dir, f"{key}.mp3")
        print(f"\nSynthesizing line '{key}':")
        print(f"  Raw Text: {text}")
        try:
            speak(text, filename, engine="sarvam")
            print(f"  Saved to: {filename}")
        except Exception as e:
            print(f"  Error synthesizing '{key}': {e}")

    print("\n" + "=" * 60)
    print("Core audio pre-synthesis completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()
