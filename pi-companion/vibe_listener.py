"""Socket.io client that listens for vibe_update events from the Node.js server.

Mirrors the pattern in python-client/emitter.py but as a receiver.
"""

import socketio

from config import NODE_SERVER_URL
from led_controller import LedController


class VibeListener:
    """Connects to the Node.js server and forwards vibe updates to the LED controller."""

    def __init__(self, led_controller: LedController):
        self.led = led_controller
        self.sio = socketio.Client(
            reconnection=True,
            reconnection_delay=5,
            logger=False,
        )
        self._register_handlers()

    def _register_handlers(self):
        @self.sio.event
        def connect():
            print(f"[VibeListener] Connected to server at {NODE_SERVER_URL}")

        @self.sio.event
        def disconnect():
            print("[VibeListener] Disconnected from server")

        @self.sio.event
        def connect_error(data):
            print(f"[VibeListener] Connection error: {data}")

        @self.sio.on("vibe_update")
        def on_vibe_update(data):
            vibe_type = data.get("type", "UNKNOWN")
            severity = data.get("severity", "")
            score = data.get("compatibility_score", "")
            label = f"{vibe_type}"
            if severity:
                label += f" ({severity})"
            if score != "":
                label += f" score={score}"
            print(f"[VibeListener] Received: {label}")
            self.led.update_state(data)

    def connect(self):
        """Connect to the Node.js server."""
        print(f"[VibeListener] Connecting to {NODE_SERVER_URL} ...")
        self.sio.connect(NODE_SERVER_URL)

    def wait(self):
        """Block until disconnected."""
        self.sio.wait()

    def disconnect(self):
        """Disconnect from the server."""
        if self.sio.connected:
            self.sio.disconnect()
