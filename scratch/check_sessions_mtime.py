# scratch/check_sessions_mtime.py
import os
import datetime

path = "sessions.json"
if os.path.exists(path):
    stat = os.stat(path)
    print(f"sessions.json mtime: {datetime.datetime.fromtimestamp(stat.st_mtime)}")
else:
    print("sessions.json not found")
