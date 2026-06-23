# scratch/find_bulbul_v3_speaker.py
import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

from tts_engine import speak_with_sarvam, normalize_for_tts

def main():
    raw_text = "Main ICICI bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon."
    text = normalize_for_tts(raw_text)
    target_size = 334968
    
    speakers = [
        "aditya", "ritu", "ashutosh", "priya", "neha", "rahul", "pooja", "rohan", 
        "simran", "kavya", "amit", "dev", "ishita", "shreya", "ratan", "varun", 
        "manan", "sumit", "roopa", "kabir", "aayan", "shubh", "advait", "anand", 
        "tanya", "tarun", "sunny", "mani", "gokul", "vijay", "shruti", "suhani", 
        "mohit", "kavitha", "rehan", "soham", "rupali", "niharika"
    ]
    
    print(f"Searching {len(speakers)} bulbul:v3 speakers...")
    
    for speaker in speakers:
        filename = f"audio_output/test_v3_{speaker}.mp3"
        if os.path.exists(filename):
            try:
                os.remove(filename)
            except:
                pass
            
        try:
            speak_with_sarvam(text, filename, voice=speaker)
            size = os.path.getsize(filename)
            print(f"Speaker: {speaker:<10} | Size: {size} bytes")
            if size == target_size:
                print(f"\n*** MATCH FOUND! Speaker '{speaker}' generated the target file (size: {size} bytes). ***\n")
                # Keep the file and clean others later
            else:
                if os.path.exists(filename):
                    os.remove(filename)
        except Exception as e:
            print(f"Speaker: {speaker:<10} | Error: {e}")

if __name__ == "__main__":
    main()
