import logging
import time
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import config

logger = logging.getLogger(__name__)

MAX_RETRIES = 3


class SpotifyClient:
    def __init__(self):
        self.sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
            client_id=config.SPOTIFY_CLIENT_ID,
            client_secret=config.SPOTIFY_CLIENT_SECRET,
            redirect_uri=config.SPOTIFY_REDIRECT_URI,
            scope="user-read-currently-playing user-read-playback-state user-read-recently-played",
        ))
        self._genre_cache = {}

    def _call_with_retry(self, func, *args, **kwargs):
        """Call a Spotify API function with retry/backoff on 429 rate limits."""
        for attempt in range(MAX_RETRIES):
            try:
                return func(*args, **kwargs)
            except spotipy.exceptions.SpotifyException as e:
                if e.http_status == 429:
                    retry_after = int(e.headers.get("Retry-After", 5)) if e.headers else 5
                    logger.warning(f"Rate limited (429). Retrying after {retry_after}s (attempt {attempt + 1}/{MAX_RETRIES})")
                    time.sleep(retry_after)
                else:
                    raise
        logger.error(f"Rate limited after {MAX_RETRIES} retries, giving up")
        return None

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

            return track_info

        except spotipy.exceptions.SpotifyException as e:
            logger.error(f"Spotify API error: {e}")
            return None

    def get_recent_tracks(self, limit=10):
        """Returns list of recently played tracks with name, artist, and genres."""
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
                artist_id = t["artists"][0]["id"]
                tracks.append({
                    "name": t["name"],
                    "artist": t["artists"][0]["name"],
                    "genres": self._get_artist_genres(artist_id),
                })
            return tracks
        except Exception as e:
            logger.error(f"Error fetching recent tracks: {e}")
            return []

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

