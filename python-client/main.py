import time
import logging
import config
from spotify_client import SpotifyClient
from calendar_client import CalendarClient
from emitter import Emitter
from utils import setup_logging

# main entry point for the Python client that initializes Spotify and Calendar clients, 
# connects to the Node.js server via the Emitter, and runs a polling loop to fetch data and emit events.

setup_logging()
logger = logging.getLogger(__name__)


def poll_cycle(spotify, calendar, emitter):
    """Single iteration of the polling loop."""
    track = spotify.get_now_playing()

    if track is None:
        emitter.emit_idle()
        return

    events = calendar.get_upcoming_events(hours=2)
    recent_tracks = spotify.get_recent_tracks()
    emitter.emit_context(track, events, recent_tracks)


def main():
    spotify = SpotifyClient()
    calendar = CalendarClient()
    emitter = Emitter(config.NODE_SERVER_URL)

    emitter.connect()
    logger.info(f"Polling every {config.POLLING_INTERVAL}s.")

    try:
        while True:
            try:
                poll_cycle(spotify, calendar, emitter)
            except Exception as e:
                logger.error(f"Poll cycle error: {e}", exc_info=True)

            time.sleep(config.POLLING_INTERVAL)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        emitter.disconnect()


if __name__ == "__main__":
    main()
