# scratch/check_file_mtime.py
import os
import datetime

path = "audio_output/08cedcb2_turn_7d0413.mp3"
if os.path.exists(path):
    stat = os.stat(path)
    mtime = datetime.datetime.fromtimestamp(stat.st_mtime)
    print(f"File: {path}")
    print(f"Size: {stat.st_size} bytes")
    print(f"Modification Time: {mtime}")
else:
    print(f"File {path} not found")
