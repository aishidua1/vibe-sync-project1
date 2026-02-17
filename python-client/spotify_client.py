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

            track_info = {
                "name": track["name"],
                "artist": track["artists"][0]["name"],
                "album": track["album"]["name"],
                "artist_genres": self._get_artist_genres(artist_id),
                "popularity": track.get("popularity", 0),
            }

            # Attempt audio features (will 403 for new apps post-Nov 2024)
            audio_features = self._try_get_audio_features(track["id"])
            if audio_features:
                track_info["audio_features"] = audio_features

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

    def _try_get_audio_features(self, track_id):
        """Try to get audio features. Returns None on 403 (deprecated)."""
        try:
            features = self.sp.audio_features([track_id])
            if features and features[0]:
                f = features[0]
                return {
                    "valence": f["valence"],
                    "energy": f["energy"],
                    "tempo": f["tempo"],
                    "danceability": f["danceability"],
                }
        except Exception as e:
            logger.info(f"Audio features unavailable (likely deprecated): {e}")
        return None
