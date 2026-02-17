import logging
import socketio

logger = logging.getLogger(__name__)


class Emitter:
    """Socket.io client that sends vibe data to the Node.js server."""

    def __init__(self, server_url):
        self.server_url = server_url
        self.sio = socketio.Client(reconnection=True, reconnection_delay=5)
        self._setup_handlers()

    def _setup_handlers(self):
        @self.sio.event
        def connect():
            logger.info("Connected to Node.js Socket.io server")

        @self.sio.event
        def disconnect():
            logger.warning("Disconnected from Node.js Socket.io server")

        @self.sio.event
        def connect_error(data):
            logger.error(f"Socket.io connection error: {data}")

    def connect(self):
        """Connect to the Node.js server."""
        logger.info(f"Connecting to {self.server_url}...")
        self.sio.connect(self.server_url)

    def disconnect(self):
        """Disconnect from the Node.js server."""
        self.sio.disconnect()

    def emit_idle(self):
        """Emit vibe_idle when no music is playing."""
        self.sio.emit("vibe_idle", {})
        logger.info("Emitted vibe_idle")

    def emit_context(self, track, events, recent_tracks=None):
        """Emit vibe_context with track, calendar, and recent listening data."""
        self.sio.emit("vibe_context", {
            "track": track,
            "events": events,
            "recent_tracks": recent_tracks or [],
        })
        logger.info(f"Emitted vibe_context: {track['name']} by {track['artist']}")
