"""LED controller for WS2812B NeoPixel strip.

Drives LEDs with color and animation patterns based on vibe state.
"""

import threading
import time
import math

try:
    from rpi_ws281x import PixelStrip, Color
    HAS_HARDWARE = True
except ImportError:
    HAS_HARDWARE = False

from config import LED_COUNT, LED_PIN, LED_BRIGHTNESS, LED_FREQ_HZ, LED_DMA, LED_INVERT, LED_CHANNEL

# Vibe state color definitions (R, G, B)
COLORS = {
    "IDLE": (255, 255, 255),          # White
    "SYNCED": (0, 255, 0),            # Green
    "LOW": (255, 255, 0),             # Yellow
    "MEDIUM": (255, 140, 0),          # Orange
    "HIGH": (255, 0, 0),              # Red
}

# Pulse cycle times in seconds per severity
PULSE_SPEEDS = {
    "LOW": 1.0,
    "MEDIUM": 0.5,
    "HIGH": 0.25,
}


class MockPixelStrip:
    """Stand-in for PixelStrip when rpi_ws281x is unavailable (dev/testing)."""

    def __init__(self, *args, **kwargs):
        self._leds = [(0, 0, 0)] * (args[0] if args else 16)

    def begin(self):
        pass

    def setPixelColor(self, i, color):
        self._leds[i] = color

    def show(self):
        pass

    def numPixels(self):
        return len(self._leds)


def _color(r, g, b):
    """Create a color value compatible with both real and mock strips."""
    if HAS_HARDWARE:
        return Color(r, g, b)
    return (r, g, b)


class LedController:
    """Controls WS2812B LED strip based on vibe state updates."""

    def __init__(self):
        if HAS_HARDWARE:
            self.strip = PixelStrip(
                LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA,
                LED_INVERT, LED_BRIGHTNESS, LED_CHANNEL,
            )
        else:
            print("[LedController] rpi_ws281x not available — using mock strip")
            self.strip = MockPixelStrip(LED_COUNT)

        self.strip.begin()

        # Current state
        self._vibe_type = "IDLE"
        self._severity = None
        self._compatibility_score = 100

        # Animation thread control
        self._running = True
        self._lock = threading.Lock()
        self._thread = threading.Thread(target=self._animation_loop, daemon=True)
        self._thread.start()

    def update_state(self, vibe_state: dict):
        """Update LED state from a vibe_update event payload."""
        with self._lock:
            self._vibe_type = vibe_state.get("type", "IDLE")
            self._severity = vibe_state.get("severity")
            self._compatibility_score = vibe_state.get("compatibility_score", 100)

    def _animation_loop(self):
        """Continuously renders the current animation frame."""
        while self._running:
            with self._lock:
                vibe_type = self._vibe_type
                severity = self._severity
                score = self._compatibility_score

            if vibe_type == "IDLE":
                self._breathe(*COLORS["IDLE"])
            elif vibe_type == "SYNCED":
                # Brightness scales with compatibility score (50-100% of configured brightness)
                brightness_factor = 0.5 + (score / 200)
                r, g, b = COLORS["SYNCED"]
                r = int(r * brightness_factor)
                g = int(g * brightness_factor)
                b = int(b * brightness_factor)
                self._fill(r, g, b)
                time.sleep(0.05)
            elif vibe_type == "VIBE_MISMATCH" and severity:
                color_key = severity if severity in COLORS else "LOW"
                speed = PULSE_SPEEDS.get(severity, 1.0)
                self._pulse(*COLORS[color_key], cycle_time=speed)
            else:
                self._fill(50, 50, 50)
                time.sleep(0.1)

    def _fill(self, r, g, b):
        """Set all LEDs to a solid color."""
        color = _color(r, g, b)
        for i in range(self.strip.numPixels()):
            self.strip.setPixelColor(i, color)
        self.strip.show()

    def _breathe(self, r, g, b, cycle_time=3.0):
        """Slow breathing animation — fade in and out."""
        t = time.time() % cycle_time
        # Sine wave mapped to 0.05–1.0 brightness range
        factor = 0.05 + 0.95 * ((math.sin(2 * math.pi * t / cycle_time - math.pi / 2) + 1) / 2)
        self._fill(int(r * factor), int(g * factor), int(b * factor))
        time.sleep(0.03)

    def _pulse(self, r, g, b, cycle_time=1.0):
        """Pulsing animation — sharp on/off cycle."""
        t = time.time() % cycle_time
        # Sine wave mapped to 0.1–1.0 brightness
        factor = 0.1 + 0.9 * ((math.sin(2 * math.pi * t / cycle_time - math.pi / 2) + 1) / 2)
        self._fill(int(r * factor), int(g * factor), int(b * factor))
        time.sleep(0.02)

    def cleanup(self):
        """Turn off all LEDs and stop the animation thread."""
        self._running = False
        if self._thread.is_alive():
            self._thread.join(timeout=2)
        self._fill(0, 0, 0)
        print("[LedController] LEDs off, cleanup complete")
