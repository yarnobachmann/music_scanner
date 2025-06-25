import os
import sys
import json
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3

if len(sys.argv) < 2:
    print(json.dumps({"error": "No directory provided"}))
    sys.exit(1)

dir = sys.argv[1]
rows = []
for dirpath, _, filenames in os.walk(dir):
    for fname in filenames:
        if fname.lower().endswith('.mp3'):
            full_path = os.path.join(dirpath, fname)
            artist, album, title = '', '', ''
            try:
                audio = MP3(full_path, ID3=EasyID3)
                artist = audio.get('artist', [''])[0]
                album = audio.get('album', [''])[0]
                title = audio.get('title', [''])[0]
            except Exception:
                pass
            # Fallback: parse from filename
            if not artist or not title:
                parts = fname[:-4].split(' - ')
                if len(parts) == 3:
                    artist, album, title = parts
                elif len(parts) == 2:
                    artist, title = parts
                else:
                    title = fname[:-4]
            rows.append({
                'artist': artist.strip(),
                'album': album.strip(),
                'track': title.strip(),
                'filename': fname,
                'path': os.path.relpath(full_path, dir)
            })

# Set stdout encoding to utf-8 for Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print(json.dumps(rows, ensure_ascii=False)) 