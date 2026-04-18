import logging
import time
import json
import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import config

#gets spotify data using spotipy, with retry/backoff for rate limits and in-memory caching for artist genres

logger = logging.getLogger(__name__)

MAX_RETRIES = 2
MAX_RETRY_AFTER = 60
CACHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cache")


def _create_spotify_client():
    """Create a Spotify client, using cached token directly if still valid to avoid rate-limited refresh."""
    auth_manager = SpotifyOAuth(
        client_id=config.SPOTIFY_CLIENT_ID,
        client_secret=config.SPOTIFY_CLIENT_SECRET,
        redirect_uri=config.SPOTIFY_REDIRECT_URI,
        scope="user-read-currently-playing user-read-playback-state user-read-recently-played",
        open_browser=False,
    )

    # Try to use the cached token directly without triggering a refresh
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r") as f:
                token_info = json.load(f)
            if not auth_manager.is_token_expired(token_info):
                logger.info("Using cached Spotify token directly (still valid)")
                return spotipy.Spotify(auth=token_info["access_token"], retries=0, requests_timeout=10)
            else:
                logger.info("Cached token expired, attempting refresh")
        except Exception as e:
            logger.warning(f"Could not read cached token: {e}")

    # Fallback: let spotipy handle auth normally
    return spotipy.Spotify(auth_manager=auth_manager, retries=0, requests_timeout=10)


class SpotifyClient:
    def __init__(self):
        self.sp = _create_spotify_client()
        self._genre_cache = {}
        self._last_track_cache = None
        self.rate_limited = False

    def _call_with_retry(self, func, *args, **kwargs):
        """Call a Spotify API function with retry/backoff on 429 rate limits."""
        for attempt in range(MAX_RETRIES):
            try:
                result = func(*args, **kwargs)
                self.rate_limited = False
                return result
            except spotipy.exceptions.SpotifyException as e:
                if e.http_status == 429:
                    retry_after = int(e.headers.get("Retry-After", 5)) if e.headers else 5
                    retry_after = min(retry_after, MAX_RETRY_AFTER)
                    logger.warning(f"Rate limited (429). Retrying after {retry_after}s (attempt {attempt + 1}/{MAX_RETRIES})")
                    self.rate_limited = True
                    time.sleep(retry_after)
                elif e.http_status == 401:
                    logger.warning("Token expired mid-session, recreating client")
                    self.sp = _create_spotify_client()
                    return None
                else:
                    raise
            except Exception as e:
                if "rate" in str(e).lower() or "limit" in str(e).lower():
                    logger.warning(f"Rate limit detected: {e}")
                    self.rate_limited = True
                    return None
                raise
        logger.error(f"Rate limited after {MAX_RETRIES} retries, backing off")
        self.rate_limited = True
        return None
# fetches the currently playing track name, returns none if nothing is playing
    def get_now_playing(self):
        """Returns track info dict or None if nothing is playing."""
        try:
            result = self._call_with_retry(self.sp.current_user_playing_track)

            if result is None or not result.get("is_playing"):
                return None

            track = result["item"]
            artist_id = track["artists"][0]["id"]

            images = track["album"].get("images", [])
            album_art_url = images[0]["url"] if images else None

            track_info = {
                "name": track["name"],
                "artist": track["artists"][0]["name"],
                "album": track["album"]["name"],
                "album_art_url": album_art_url,
                "artist_genres": self._get_artist_genres(artist_id),
                "popularity": track.get("popularity", 0),
            }

            self._last_track_cache = track_info
            return track_info

        except spotipy.exceptions.SpotifyException as e:
            logger.error(f"Spotify API error: {e}")
            return None
        except Exception as e:
            if "rate" in str(e).lower() or "limit" in str(e).lower():
                self.rate_limited = True
            logger.error(f"Spotify error: {e}")
            return None
# fetches last 5 recently played tracks (reduced from 10 to save API calls)
    def get_recent_tracks(self, limit=5):
        """Returns list of recently played tracks with name and artist."""
        try:
            results = self._call_with_retry(self.sp.current_user_recently_played, limit=limit)
            if results is None:
                return []
            tracks = []
            seen = set()
            for item in results.get("items", []):
                t = item["track"]
                key = (t["name"], t["artists"][0]["name"])
                if key in seen:
                    continue
                seen.add(key)
                tracks.append({
                    "name": t["name"],
                    "artist": t["artists"][0]["name"],
                    "genres": self._genre_cache.get(t["artists"][0].get("id"), []),
                })
            return tracks
        except Exception as e:
            logger.error(f"Error fetching recent tracks: {e}")
            return []
# looks up an artists genre
    def _get_artist_genres(self, artist_id):
        """Get genres for the artist, with in-memory caching."""
        if artist_id in self._genre_cache:
            return self._genre_cache[artist_id]
        try:
            artist = self._call_with_retry(self.sp.artist, artist_id)
            genres = artist.get("genres", []) if artist else []
            self._genre_cache[artist_id] = genres
            return genres
        except Exception:
            return []
