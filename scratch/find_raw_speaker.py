# scratch/find_raw_speaker.py
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from tts_engine import speak_with_sarvam

def main():
    text = "Main ICICI bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon."
    target_size = 334968
    
    speakers = [
        "aditya", "ritu", "ashutosh", "priya", "neha", "rahul", "pooja", "rohan", 
        "simran", "kavya", "amit", "dev", "ishita", "shreya", "ratan", "varun", 
        "manan", "sumit", "roopa", "kabir", "aayan", "shubh", "advait", "anand", 
        "tanya", "tarun", "sunny", "mani", "gokul", "vijay", "shruti", "suhani", 
        "mohit", "kavitha", "rehan", "soham", "rupali", "niharika"
    ]
    
    print(f"Searching {len(speakers)} bulbul:v3 speakers with raw text...")
    for speaker in speakers:
        filename = f"audio_output/test_raw_{speaker}.mp3"
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
                print(f"\n*** MATCH FOUND! Speaker '{speaker}' generated the target file with raw text (size: {size} bytes). ***\n")
            if os.path.exists(filename):
                os.remove(filename)
        except Exception as e:
            pass

if __name__ == "__main__":
    main()
