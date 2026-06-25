# scratch/check_speaker.py
import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

from tts_engine import speak

def main():
    text = "Hello, kya meri baat Mahima Dangi ji se ho rahi hai?"
    file_female = "audio_output/test_female_ritu.mp3"
    print("Generating with female voice...")
    try:
        speak(text, file_female, engine="sarvam", voice="female")
        print(f"Success! File generated at {file_female}")
    except Exception as e:
        print(f"Error generating female voice: {e}")

if __name__ == "__main__":
    main()
