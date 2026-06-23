# scratch/test_v2_speakers.py
import os
import sys
import requests
import json
import base64
from dotenv import load_dotenv

load_dotenv()

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def test_v2():
    api_key = os.environ.get("SARVAM_API_KEY")
    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }
    
    # We use the normalized text
    text = "Main आई सी आई सी आई bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon."
    
    speakers = ["anushka", "abhilash", "manisha", "vidya", "arya", "karun", "hitesh"]
    target_size = 334968
    
    print(f"Testing {len(speakers)} bulbul:v2 speakers...")
    for speaker in speakers:
        payload = {
            "text": text,
            "speaker": speaker,
            "target_language_code": "hi-IN",
            "model": "bulbul:v2",
            "pace": 1.0
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                audio_content = "".join(data["audios"])
                audio_bytes = base64.b64decode(audio_content)
                size = len(audio_bytes)
                print(f"Speaker: {speaker:<10} | Size: {size} bytes")
                if size == target_size:
                    print(f"*** MATCH FOUND! Speaker '{speaker}' generated the target file. ***")
            else:
                print(f"Speaker: {speaker:<10} | Failed: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Speaker: {speaker:<10} | Error: {e}")

if __name__ == "__main__":
    test_v2()
