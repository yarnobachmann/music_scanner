import sys
import json
import requests
import time
from collections import defaultdict
from difflib import SequenceMatcher
from datetime import datetime, timedelta
import io

# Configure stdout to handle Unicode properly on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Last.fm API - much faster than MusicBrainz
LASTFM_API_KEY = '8de1b85b41034d5ab4e2cdcea5f39195'  # Default API key
LASTFM_API = 'https://ws.audioscrobbler.com/2.0/'

# Check if custom API key is provided
if len(sys.argv) >= 3:
    LASTFM_API_KEY = sys.argv[2]

# Simple cache
artist_cache = {}
album_cache = {}
track_cache = {}

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

def get_album_info_with_date(artist_name, album_name):
    """Get album info including release date."""
    cache_key = f"{artist_name}_{album_name}_info"
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
        album_info = data.get('album', {})
        
        # Extract release date if available
        release_date = None
        release_year = None
        wiki = album_info.get('wiki', {})
        if wiki and 'published' in wiki:
            try:
                # Last.fm date format: "01 Jan 2023, 00:00"
                date_str = wiki['published'].split(',')[0]  # Remove time part
                release_date = datetime.strptime(date_str, "%d %b %Y")
                release_year = release_date.year
            except:
                pass
        
        result = {
            'tracks': [track['name'] for track in album_info.get('tracks', {}).get('track', [])],
            'release_date': release_date,
            'release_year': release_year,
            'playcount': album_info.get('playcount', '0')
        }
        album_cache[cache_key] = result
        return result
    except Exception as e:
        print(f"Error getting album info for {album_name}: {e}", file=sys.stderr)
        result = {'tracks': [], 'release_date': None, 'release_year': None, 'playcount': '0'}
        album_cache[cache_key] = result
        return result

def get_track_info(artist_name, track_name):
    """Get individual track info including release year from Last.fm."""
    cache_key = f"{artist_name}_{track_name}_track_info"
    if cache_key in track_cache:
        return track_cache[cache_key]
    
    params = {
        'method': 'track.getinfo',
        'artist': artist_name,
        'track': track_name,
        'api_key': LASTFM_API_KEY,
        'format': 'json'
    }
    
    try:
        r = requests.get(LASTFM_API, params=params, timeout=10)
        data = r.json()
        track_info = data.get('track', {})
        
        # Try to get release year from track's album info
        release_year = None
        album_info = track_info.get('album', {})
        if album_info and 'title' in album_info:
            album_name = album_info['title']
            # Get full album info to get release date
            album_details = get_album_info_with_date(artist_name, album_name)
            release_year = album_details.get('release_year')
        
        result = {
            'release_year': release_year,
            'album': album_info.get('title', 'Unknown') if album_info else 'Unknown'
        }
        track_cache[cache_key] = result
        return result
    except Exception as e:
        print(f"Error getting track info for {artist_name} - {track_name}: {e}", file=sys.stderr)
        result = {'release_year': None, 'album': 'Unknown'}
        track_cache[cache_key] = result
        return result

def is_recent_release(release_date, months=6):
    """Check if a release date is within the specified number of months."""
    if not release_date:
        return False
    cutoff_date = datetime.now() - timedelta(days=months * 30)
    return release_date >= cutoff_date

if len(sys.argv) < 2:
    print(json.dumps({'error': 'No scan result provided'}))
    sys.exit(1)

with open(sys.argv[1], 'r', encoding='utf-8') as f:
    local_tracks = json.load(f)

# Group local tracks by artist
collection = defaultdict(list)
for t in local_tracks:
    collection[t['artist']].append(t)

all_missing_tracks = []  # This will contain EVERYTHING missing
processed_artists = 0
total_artists = len(collection)

for artist, tracks in collection.items():
    processed_artists += 1
    print(f"Processing artist {processed_artists}/{total_artists}: {artist} ({len(tracks)} local tracks)", file=sys.stderr)
    
    # Check if artist exists
    artist_info = get_artist_info(artist)
    if not artist_info:
        print(f"Could not find artist: {artist}, continuing with limited data...", file=sys.stderr)
    
    # Get artist data from Last.fm
    all_albums = get_artist_albums(artist)
    top_tracks = get_artist_top_tracks(artist)
    recent_tracks = get_artist_recent_tracks(artist)
    
    # Get local data
    local_albums = set(track['album'] for track in tracks if track['album'])
    local_track_names = set(track['track'] for track in tracks)
    
    # Step 1: Find ALL missing album tracks
    for album_info in all_albums:
        if isinstance(album_info, dict):
            album_name = album_info['name']
            playcount = int(album_info.get('playcount', 0))
            
            # Skip very unpopular albums
            if playcount < 2000:
                continue
                
            # Check if we have this album locally (with fuzzy matching)
            has_album = any(is_similar(album_name, local_album) for local_album in local_albums)
            
            if not has_album:
                # Get all tracks from this missing album
                album_info_detailed = get_album_info_with_date(artist, album_name)
                album_tracks = album_info_detailed['tracks']
                release_date = album_info_detailed['release_date']
                release_year = album_info_detailed['release_year']
                
                # Add all tracks from this missing album
                for track_name in album_tracks:
                    # Don't add if we already have this track locally
                    has_track = any(is_similar(track_name, local_track) for local_track in local_track_names)
                    if not has_track:
                        all_missing_tracks.append({
                            'artist': artist,
                            'album': album_name,
                            'track': track_name,
                            'release_date': release_date,
                            'release_year': release_year,
                            'type': 'album_track',
                            'playcount': playcount
                        })
    
    # Step 2: Find missing singles (popular tracks NOT from known albums)
    for track_info in top_tracks:
        if isinstance(track_info, dict):
            track_name = track_info['name']
            playcount = int(track_info.get('playcount', 0))
            
            # Skip very unpopular tracks
            if playcount < 100:
                continue
                
            # Check if we have this track locally
            has_track = any(is_similar(track_name, local_track) for local_track in local_track_names)
            
            if not has_track:
                # Check if this track belongs to any known album
                is_from_known_album = False
                source_album = "Popular Single"
                
                for album_info in all_albums:
                    if isinstance(album_info, dict):
                        album_tracks = get_album_tracks(artist, album_info['name'])
                        if any(is_similar(track_name, album_track) for album_track in album_tracks):
                            is_from_known_album = True
                            source_album = album_info['name']
                            break
                
                # Only add if it's NOT already added as part of an album
                already_added = any(
                    t['artist'] == artist and is_similar(t['track'], track_name) 
                    for t in all_missing_tracks
                )
                
                if not already_added:
                    # Try to get track-specific info for release year
                    track_details = get_track_info(artist, track_name)
                    track_release_year = track_details.get('release_year')
                    
                    all_missing_tracks.append({
                        'artist': artist,
                        'album': source_album,
                        'track': track_name,
                        'release_date': None,  # Singles often don't have release dates in Last.fm
                        'release_year': track_release_year,
                        'type': 'single' if not is_from_known_album else 'album_track',
                        'playcount': playcount
                    })
    
    # Step 3: Check recent tracks for very new releases
    for track_info in recent_tracks:
        if isinstance(track_info, dict):
            track_name = track_info['name']
            playcount = int(track_info.get('playcount', 0))
            
            # Check if we have this track locally
            has_track = any(is_similar(track_name, local_track) for local_track in local_track_names)
            
            if not has_track:
                # Check if already added
                already_added = any(
                    t['artist'] == artist and is_similar(t['track'], track_name) 
                    for t in all_missing_tracks
                )
                
                if not already_added:
                    # Try to determine source album
                    source_album = "Recent Release"
                    is_from_known_album = False
                    
                    for album_info in all_albums:
                        if isinstance(album_info, dict):
                            album_tracks = get_album_tracks(artist, album_info['name'])
                            if any(is_similar(track_name, album_track) for album_track in album_tracks):
                                is_from_known_album = True
                                source_album = album_info['name']
                                break
                    
                    # Try to get track-specific info for release year
                    track_details = get_track_info(artist, track_name)
                    track_release_year = track_details.get('release_year')
                    
                    all_missing_tracks.append({
                        'artist': artist,
                        'album': source_album,
                        'track': track_name,
                        'release_date': None,
                        'release_year': track_release_year,
                        'type': 'recent_single' if not is_from_known_album else 'album_track',
                        'playcount': playcount
                    })
    
    # Count missing tracks for this artist
    artist_missing_count = len([t for t in all_missing_tracks if t['artist'] == artist])
    print(f"  → Found {artist_missing_count} missing tracks for {artist}", file=sys.stderr)
    
    # Rate limiting
    time.sleep(0.1)

# Now generate the three lists according to your requirements:

# 1. Missing tracks: ALL missing tracks (no limit)
missing_tracks = []
for track in all_missing_tracks:
    missing_tracks.append({
        'artist': track['artist'],
        'album': track['album'],
        'track': track['track'],
        'year': track['release_year']
    })

# 2. New albums: Only albums from missing tracks that were released within 6 months
new_albums = []
album_tracks_map = {}

# Group missing tracks by album
for track in all_missing_tracks:
    if track['type'] == 'album_track':
        album_key = f"{track['artist']}|{track['album']}"
        if album_key not in album_tracks_map:
            album_tracks_map[album_key] = {
                'artist': track['artist'],
                'album': track['album'],
                'release_date': track['release_date'],
                'release_year': track['release_year'],
                'playcount': track['playcount'],
                'tracks': []
            }
        album_tracks_map[album_key]['tracks'].append(track['track'])

# Filter albums by release date (6 months)
for album_info in album_tracks_map.values():
    if is_recent_release(album_info['release_date'], months=6):
        new_albums.append({
            'artist': album_info['artist'],
            'album': album_info['album'],
            'playcount': album_info['playcount'],
            'year': album_info['release_year']
        })

# 3. New songs: Only very recent singles, heavily filtered to avoid old popular tracks
new_songs = []
for track in all_missing_tracks:
    if track['type'] in ['single', 'recent_single']:
        is_recent = track['type'] == 'recent_single'
        playcount = track['playcount']
        
        # Be much more restrictive to avoid old popular songs showing up as "new"
        # Only include tracks if they meet strict criteria for being recent:
        if is_recent:
            # Always include tracks from recent tracks API (most likely to be new)
            new_songs.append({
                'artist': track['artist'],
                'track': track['track'],
                'playcount': playcount,
                'year': track['release_year'],
                'source': 'recent'
            })
        elif playcount >= 50000:
            # For regular singles, only include if they have very high playcount
            # (indicating a major recent release that's gaining massive traction)
            # This helps avoid old popular songs while catching new viral hits
            new_songs.append({
                'artist': track['artist'],
                'track': track['track'],
                'playcount': playcount,
                'year': track['release_year'],
                'source': 'viral'
            })

# Sort results
missing_tracks = sorted(missing_tracks, key=lambda x: x['artist'])  # NO LIMIT
new_albums = sorted(new_albums, key=lambda x: x['playcount'], reverse=True)
# Sort new songs: recent tracks first, then viral hits by playcount
new_songs = sorted(new_songs, key=lambda x: (x['source'] != 'recent', -x['playcount']))

print(f"Final results: {len(missing_tracks)} missing tracks, {len(new_albums)} new albums, {len(new_songs)} new songs", file=sys.stderr)
print(f"New albums are filtered from missing tracks (6 months), new songs are heavily filtered recent/viral singles only", file=sys.stderr)

result = {
    'missing_tracks': missing_tracks,
    'new_albums': new_albums,
    'new_songs': new_songs,
    'total_local_tracks': len(local_tracks),
    'total_artists': len(collection)
}

print(json.dumps(result, ensure_ascii=False, indent=2)) 