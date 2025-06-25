import sys
import json
import requests
import time
from collections import defaultdict
from difflib import SequenceMatcher

# Last.fm API - much faster than MusicBrainz
LASTFM_API_KEY = '8de1b85b41034d5ab4e2cdcea5f39195'  # Default API key
LASTFM_API = 'https://ws.audioscrobbler.com/2.0/'

# Check if custom API key is provided
if len(sys.argv) >= 3:
    LASTFM_API_KEY = sys.argv[2]

# Simple cache
artist_cache = {}
album_cache = {}

def is_similar(str1, str2, threshold=0.8):
    """Check if two strings are similar using fuzzy matching"""
    return SequenceMatcher(None, str1.lower(), str2.lower()).ratio() > threshold

def get_artist_info(artist_name):
    if artist_name in artist_cache:
        return artist_cache[artist_name]
    
    params = {
        'method': 'artist.search',
        'artist': artist_name,
        'api_key': LASTFM_API_KEY,
        'format': 'json',
        'limit': 5
    }
    
    try:
        r = requests.get(LASTFM_API, params=params, timeout=10)
        data = r.json()
        artists = data.get('results', {}).get('artistmatches', {}).get('artist', [])
        
        if artists:
            # Find best match
            for artist in artists:
                if artist['name'].lower() == artist_name.lower():
                    artist_cache[artist_name] = artist
                    return artist
            # Return first result if no exact match
            artist_cache[artist_name] = artists[0]
            return artists[0]
    except Exception as e:
        print(f"Error searching for artist {artist_name}: {e}", file=sys.stderr)
    
    artist_cache[artist_name] = None
    return None

def get_artist_albums(artist_name):
    if f"{artist_name}_albums" in album_cache:
        return album_cache[f"{artist_name}_albums"]
    
    params = {
        'method': 'artist.gettopalbums',
        'artist': artist_name,
        'api_key': LASTFM_API_KEY,
        'format': 'json',
        'limit': 50
    }
    
    try:
        r = requests.get(LASTFM_API, params=params, timeout=10)
        data = r.json()
        albums = data.get('topalbums', {}).get('album', [])
        album_cache[f"{artist_name}_albums"] = albums
        return albums
    except Exception as e:
        print(f"Error getting albums for {artist_name}: {e}", file=sys.stderr)
        album_cache[f"{artist_name}_albums"] = []
        return []

def get_artist_top_tracks(artist_name):
    if f"{artist_name}_tracks" in album_cache:
        return album_cache[f"{artist_name}_tracks"]
    
    params = {
        'method': 'artist.gettoptracks',
        'artist': artist_name,
        'api_key': LASTFM_API_KEY,
        'format': 'json',
        'limit': 50  # Increased limit to catch more tracks
    }
    
    try:
        r = requests.get(LASTFM_API, params=params, timeout=10)
        data = r.json()
        tracks = data.get('toptracks', {}).get('track', [])
        album_cache[f"{artist_name}_tracks"] = tracks
        return tracks
    except Exception as e:
        print(f"Error getting top tracks for {artist_name}: {e}", file=sys.stderr)
        return []

def get_artist_recent_tracks(artist_name):
    """Get recent tracks to catch newer releases"""
    params = {
        'method': 'artist.gettoptracks',
        'artist': artist_name,
        'api_key': LASTFM_API_KEY,
        'format': 'json',
        'limit': 20,
        'period': '1month'  # Recent tracks from last month
    }
    
    try:
        r = requests.get(LASTFM_API, params=params, timeout=10)
        data = r.json()
        tracks = data.get('toptracks', {}).get('track', [])
        return tracks
    except Exception as e:
        print(f"Error getting recent tracks for {artist_name}: {e}", file=sys.stderr)
        return []

def get_album_tracks(artist_name, album_name):
    cache_key = f"{artist_name}_{album_name}"
    if cache_key in album_cache:
        return album_cache[cache_key]
    
    params = {
        'method': 'album.getinfo',
        'artist': artist_name,
        'album': album_name,
        'api_key': LASTFM_API_KEY,
        'format': 'json'
    }
    
    try:
        r = requests.get(LASTFM_API, params=params, timeout=10)
        data = r.json()
        tracks = data.get('album', {}).get('tracks', {}).get('track', [])
        track_names = [track['name'] for track in tracks] if tracks else []
        album_cache[cache_key] = track_names
        return track_names
    except Exception as e:
        print(f"Error getting tracks for {album_name}: {e}", file=sys.stderr)
        album_cache[cache_key] = []
        return []

if len(sys.argv) < 2:
    print(json.dumps({'error': 'No scan result provided'}))
    sys.exit(1)

with open(sys.argv[1], 'r', encoding='utf-8') as f:
    local_tracks = json.load(f)

# Group local tracks by artist
collection = defaultdict(list)
for t in local_tracks:
    collection[t['artist']].append(t)

missing_tracks = []
new_albums = []
new_songs = []
processed_artists = 0
total_artists = len(collection)

for artist, tracks in collection.items():
    processed_artists += 1
    print(f"Processing artist {processed_artists}/{total_artists}: {artist} ({len(tracks)} local tracks)", file=sys.stderr)
    
    # Check if artist exists
    artist_info = get_artist_info(artist)
    if not artist_info:
        print(f"Could not find artist: {artist}, continuing with limited data...", file=sys.stderr)
        # Don't skip the artist, continue with what we can find
    
    # Get artist data from Last.fm
    all_albums = get_artist_albums(artist)
    top_tracks = get_artist_top_tracks(artist)
    recent_tracks = get_artist_recent_tracks(artist)
    
    # Get local data
    local_albums = set(track['album'] for track in tracks if track['album'])
    local_track_names = set(track['track'] for track in tracks)
    
    # Find new albums
    for album_info in all_albums:
        if isinstance(album_info, dict):
            album_name = album_info['name']
            playcount = int(album_info.get('playcount', 0))
            
            # Check if we have this album locally (with fuzzy matching)
            has_album = any(is_similar(album_name, local_album) for local_album in local_albums)
            
            if not has_album and playcount > 2000:  # Lower threshold for albums
                new_albums.append({
                    'artist': artist,
                    'album': album_name,
                    'playcount': playcount
                })
    
    # Check top tracks for ALL missing songs (both album tracks and singles)
    for track_info in top_tracks:
        if isinstance(track_info, dict):
            track_name = track_info['name']
            playcount = int(track_info.get('playcount', 0))
            
            # Check if we have this track locally (with fuzzy matching)
            has_track = any(is_similar(track_name, local_track) for local_track in local_track_names)
            
            if not has_track and playcount > 100:  # Much lower threshold for tracks
                # Try to determine which album it belongs to
                album_name = "Popular Track"  # Default for singles
                is_from_known_album = False
                
                # Check if it belongs to any of the artist's albums (not just ones we have)
                for album_info in all_albums:
                    if isinstance(album_info, dict):
                        album_tracks = get_album_tracks(artist, album_info['name'])
                        if any(is_similar(track_name, album_track) for album_track in album_tracks):
                            album_name = album_info['name']
                            is_from_known_album = True
                            break
                
                # Add ALL missing tracks to missing_tracks
                missing_tracks.append({
                    'artist': artist,
                    'album': album_name,
                    'track': track_name
                })
                
                # If it's NOT from a known album, also add to new_songs (singles)
                if not is_from_known_album:
                    new_songs.append({
                        'artist': artist,
                        'track': track_name,
                        'playcount': playcount
                    })
    
    # Check recent tracks for newer releases (like "Zombie")
    for track_info in recent_tracks:
        if isinstance(track_info, dict):
            track_name = track_info['name']
            playcount = int(track_info.get('playcount', 0))
            
            # Check if we have this track locally (with fuzzy matching)
            has_track = any(is_similar(track_name, local_track) for local_track in local_track_names)
            
            if not has_track:  # No playcount threshold for recent tracks
                # Try to determine if it's from an album or a single
                is_from_known_album = False
                album_name = "Recent Release"
                
                # Check if it belongs to any album
                for album_info in all_albums:
                    if isinstance(album_info, dict):
                        album_tracks = get_album_tracks(artist, album_info['name'])
                        if any(is_similar(track_name, album_track) for album_track in album_tracks):
                            is_from_known_album = True
                            album_name = album_info['name']
                            break
                
                # Add to missing tracks if not already added
                track_already_added = any(
                    t['artist'] == artist and is_similar(t['track'], track_name) 
                    for t in missing_tracks
                )
                
                if not track_already_added:
                    missing_tracks.append({
                        'artist': artist,
                        'album': album_name,
                        'track': track_name
                    })
                    
                    # If it's NOT from a known album, also add to new_songs
                    if not is_from_known_album:
                        song_already_added = any(
                            s['artist'] == artist and is_similar(s['track'], track_name) 
                            for s in new_songs
                        )
                        if not song_already_added:
                            new_songs.append({
                                'artist': artist,
                                'track': track_name,
                                'playcount': playcount
                            })
    
    # Note: We now check ALL popular tracks above, so no need for separate album-only checking
    
    # Count missing tracks for this artist
    artist_missing_count = len([t for t in missing_tracks if t['artist'] == artist])
    print(f"  → Found {artist_missing_count} missing tracks for {artist}", file=sys.stderr)
    
    # Rate limiting
    time.sleep(0.1)

# Sort results by popularity
missing_tracks = sorted(missing_tracks, key=lambda x: x['artist'])[:300]  # Increased limit
new_albums = sorted(new_albums, key=lambda x: x['playcount'], reverse=True)[:100]
new_songs = sorted(new_songs, key=lambda x: x['playcount'], reverse=True)[:100]

print(f"Final results: {len(missing_tracks)} missing tracks, {len(new_songs)} new songs", file=sys.stderr)

# Debug: Check overlap between missing tracks and new songs
missing_song_names = set(f"{t['artist']}:{t['track']}" for t in missing_tracks)
new_song_names = set(f"{s['artist']}:{s['track']}" for s in new_songs)
overlap = missing_song_names.intersection(new_song_names)
print(f"Overlap between missing tracks and new songs: {len(overlap)} tracks", file=sys.stderr)

result = {
    'missing_tracks': missing_tracks,
    'new_albums': new_albums,
    'new_songs': new_songs,
    'total_local_tracks': len(local_tracks),
    'total_artists': len(collection)
}

print(json.dumps(result, ensure_ascii=False, indent=2)) 