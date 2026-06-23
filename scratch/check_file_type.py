# scratch/check_file_type.py
import os

path = "audio_output/08cedcb2_turn_7d0413.mp3"
if os.path.exists(path):
    with open(path, "rb") as f:
        header = f.read(128)
    print(f"File size: {os.path.getsize(path)} bytes")
    print(f"Header hex: {header.hex()[:100]}")
    print(f"Header ascii: {header[:100]}")
else:
    print("File not found")
