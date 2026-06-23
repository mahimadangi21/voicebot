# scratch/read_original_tts.py
import json
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

log_path = r"C:\Users\Mahima\.gemini\antigravity-ide\brain\90467521-029f-4896-9d9b-728fd9402cf7\.system_generated\logs\transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "tts_engine.py" in line and '"type":"VIEW_FILE"' in line:
            data = json.loads(line)
            content = data.get("content", "")
            if "speaker" in content:
                print(f"Found tts_engine.py VIEW_FILE on line {i}")
                lines = content.splitlines()
                for j, l in enumerate(lines[:300]):
                    # safe print encoding-wise
                    safe_line = l.encode('ascii', errors='replace').decode('ascii')
                    print(f"{j+1}: {safe_line}")
                break
