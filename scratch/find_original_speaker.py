# scratch/find_original_speaker.py
import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

from tts_engine import speak_with_sarvam

def main():
    text = "Main आई सी आई सी आई bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon."
    target_size = 334968
    
    speakers = ["anushka", "ritu", "abhilash", "manisha", "vidya", "arya", "karun"]
    
    print("Searching for the speaker matching size 334,968 bytes...")
    
    for speaker in speakers:
        filename = f"audio_output/test_spk_{speaker}.mp3"
        if os.path.exists(filename):
            os.remove(filename)
            
        try:
            speak_with_sarvam(text, filename, voice=speaker)
            size = os.path.getsize(filename)
            print(f"Speaker: {speaker:<10} | Size: {size} bytes")
            if size == target_size:
                print(f"*** MATCH FOUND! Speaker '{speaker}' generated the target file. ***")
        except Exception as e:
            print(f"Speaker: {speaker:<10} | Error: {e}")

if __name__ == "__main__":
    main()
