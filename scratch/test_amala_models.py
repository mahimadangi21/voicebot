# scratch/test_amala_models.py
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

def test_model(model_name, speaker_name):
    api_key = os.environ.get("SARVAM_API_KEY")
    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }
    
    # We use the normalized text
    text = "Main आई सी आई सी आई bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon."
    
    payload = {
        "text": text,
        "speaker": speaker_name,
        "target_language_code": "hi-IN",
        "pace": 1.0
    }
    if model_name:
        payload["model"] = model_name
        
    print(f"Testing model={model_name} speaker={speaker_name}...")
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            audio_content = "".join(data["audios"])
            audio_bytes = base64.b64decode(audio_content)
            print(f"--> SUCCESS! Size: {len(audio_bytes)} bytes")
            # Save file
            filename = f"audio_output/test_model_{model_name or 'none'}_{speaker_name}.mp3"
            with open(filename, "wb") as f:
                f.write(audio_bytes)
            print(f"--> Saved to: {filename}")
        else:
            print(f"--> Failed: {response.text}")
    except Exception as e:
        print(f"--> Error: {e}")

def main():
    # Test amala with different models
    test_model("bulbul:v1", "amala")
    test_model("bulbul:v2", "amala")
    test_model(None, "amala")
    
    # Test ritu with different models
    test_model("bulbul:v1", "ritu")
    test_model("bulbul:v2", "ritu")

if __name__ == "__main__":
    main()
