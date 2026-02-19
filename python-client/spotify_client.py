import logging
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import config

logger = logging.getLogger(__name__)


class SpotifyClient:
    def __init__(self):
        self.sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
            client_id=config.SPOTIFY_CLIENT_ID,
            client_secret=config.SPOTIFY_CLIENT_SECRET,
            redirect_uri=config.SPOTIFY_REDIRECT_URI,
            scope="user-read-currently-playing user-read-playback-state user-read-recently-played",
        ))

    def get_now_playing(self):
        """Returns track info dict or None if nothing is playing."""
        try:
            result = self.sp.current_user_playing_track()

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
            results = self.sp.current_user_recently_played(limit=limit)
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
        """Get genres for the artist."""
        try:
            artist = self.sp.artist(artist_id)
            return artist.get("genres", [])
        except Exception:
            return []

