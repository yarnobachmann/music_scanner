import os
import sys
import json
import re
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3

def split_artists(artist_string):
    """Split combined artist names into individual artists."""
    if not artist_string:
        return [artist_string]
    
    # Don't split artists that are likely band names with / in them
    # Common patterns to preserve
    band_patterns = ['AC/DC', 'N/A', 'BT/GD']
    for pattern in band_patterns:
        if pattern.lower() in artist_string.lower():
            # For now, just return the original if it contains known band patterns
            # This could be made more sophisticated later
            pass
    
    # Common separators for multiple artists (order matters - more specific first)
    separators = [' / ', ' feat. ', ' featuring ', ' ft. ', ' ft ', 
                  ' & ', ' and ', ' with ', ' vs. ', ' vs ', ' x ', ' X ']
    
    # Start with the original string
    artists = [artist_string]
    
    # Apply each separator
    for sep in separators:
        new_artists = []
        for artist in artists:
            # Split by separator and clean up
            split_parts = [part.strip() for part in artist.split(sep) if part.strip()]
            new_artists.extend(split_parts)
        artists = new_artists
    
    # Handle standalone '/' only if it's clearly separating different artists
    # (not for band names like AC/DC)
    if len(artists) == 1 and '/' in artists[0]:
        artist = artists[0]
        # Only split on '/' if it doesn't look like a band name
        if not any(pattern.lower() in artist.lower() for pattern in ['ac/dc', 'n/a']):
            # Split on '/' but be careful
            parts = [part.strip() for part in artist.split('/') if part.strip()]
            if len(parts) > 1:
                # Check if the parts look like separate artist names (not abbreviations)
                if all(len(part) > 2 and ' ' not in part[:3] for part in parts):
                    artists = parts
    
    # Remove duplicates while preserving order
    seen = set()
    unique_artists = []
    for artist in artists:
        if artist.lower() not in seen:
            seen.add(artist.lower())
            unique_artists.append(artist)
    
    return unique_artists

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
            
            # Split combined artists and create separate entries for each
            artists = split_artists(artist.strip())
            for individual_artist in artists:
                rows.append({
                    'artist': individual_artist,
                    'album': album.strip(),
                    'track': title.strip(),
                    'filename': fname,
                    'path': os.path.relpath(full_path, dir)
                })

# Set stdout encoding to utf-8 for Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print(json.dumps(rows, ensure_ascii=False)) 