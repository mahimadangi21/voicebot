# scratch/list_audio_mtimes.py
import os
import datetime

dir_path = "audio_output"
files = []
for f in os.listdir(dir_path):
    p = os.path.join(dir_path, f)
    if os.path.isfile(p):
        stat = os.stat(p)
        files.append((f, stat.st_size, datetime.datetime.fromtimestamp(stat.st_mtime)))

files.sort(key=lambda x: x[2])
for f, size, mtime in files:
    print(f"{mtime.strftime('%Y-%m-%d %H:%M:%S')} | {size:8d} bytes | {f}")
