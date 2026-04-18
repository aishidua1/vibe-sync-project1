"""Pi Companion — entry point.

Connects to the Vibe-Sync Node.js server via Socket.io and drives
a WS2812B LED strip to reflect the current vibe state.
"""

import signal
import sys

from led_controller import LedController
from vibe_listener import VibeListener


def main():
    print("=== Vibe-Sync Pi Companion ===")

    led = LedController()
    listener = VibeListener(led)

    # Graceful shutdown on SIGINT / SIGTERM
    def shutdown(sig, frame):
        print("\n[main] Shutting down...")
        listener.disconnect()
        led.cleanup()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        listener.connect()
        listener.wait()
    except Exception as e:
        print(f"[main] Error: {e}")
    finally:
        led.cleanup()


if __name__ == "__main__":
    main()
