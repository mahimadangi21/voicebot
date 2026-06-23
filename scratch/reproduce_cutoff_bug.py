# scratch/reproduce_cutoff_bug.py
import os
import sys

# Ensure PYTHONPATH is root
sys.path.append(os.getcwd())

from gtts import gTTS
from tts_engine import get_audio_duration, hinglish_to_devanagari

def reproduce():
    print("==============================================================")
    print(" REPRODUCING THE HINGLISH gTTS CUTOFF BUG ON PURPOSE")
    print("==============================================================")

    # A typical bot sentence loaded with Latin/English words
    raw_hinglish = "Main ICICI bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon."
    transliterated = hinglish_to_devanagari(raw_hinglish)

    print(f"Raw Hinglish Input: '{raw_hinglish}'")
    print(f"Transliterated Input: '{transliterated}'")

    os.makedirs("audio_output", exist_ok=True)
    file_raw = "audio_output/repro_raw_hinglish.mp3"
    file_trans = "audio_output/repro_transliterated.mp3"

    if os.path.exists(file_raw):
        os.remove(file_raw)
    if os.path.exists(file_trans):
        os.remove(file_trans)

    # 1. Synthesize RAW Hinglish via gTTS
    print("\n[Step 1] Synthesizing raw Hinglish via gTTS...")
    tts_raw = gTTS(text=raw_hinglish, lang="hi")
    tts_raw.save(file_raw)
    dur_raw = get_audio_duration(file_raw)
    size_raw = os.path.getsize(file_raw)
    print(f"-> Raw Hinglish gTTS Duration: {dur_raw:.2f} seconds | File size: {size_raw} bytes")

    # 2. Synthesize TRANSLITERATED Devanagari via gTTS
    print("\n[Step 2] Synthesizing transliterated Devanagari via gTTS...")
    tts_trans = gTTS(text=transliterated, lang="hi")
    tts_trans.save(file_trans)
    dur_trans = get_audio_duration(file_trans)
    size_trans = os.path.getsize(file_trans)
    print(f"-> Transliterated gTTS Duration: {dur_trans:.2f} seconds | File size: {size_trans} bytes")

    # 3. Analyze differences
    print("\n[Step 3] Bug Comparison Analysis:")
    diff_sec = dur_trans - dur_raw
    ratio = dur_raw / dur_trans if dur_trans > 0 else 0
    print(f"-> Duration Difference: {diff_sec:.2f} seconds")
    print(f"-> Ratio (Raw / Trans): {ratio:.2%}")

    # Expected: raw Hinglish is cut off (so its duration is significantly shorter than Devanagari)
    if ratio < 0.70:
        print("\n[BUG REPRODUCED SUCCESSFULLY!]")
        print("Raw Hinglish was cut off mid-way by gTTS because it choked on Latin characters.")
        print(f"Transliterated Devanagari audio is {diff_sec:.2f}s longer and contains the full speech.")
    else:
        print("\n[ANALYSIS]")
        print("Note: The duration ratio is close, but we must verify if the words were actually spoken.")
        print("Typically, gTTS completely skips or swallows Latin words when speaking in Hindi (hi) mode.")

if __name__ == "__main__":
    reproduce()
