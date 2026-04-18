"""Configuration for the Pi Companion service.

Loads settings from environment variables / .env file.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Node.js server connection
NODE_SERVER_URL = os.getenv("NODE_SERVER_URL", "http://localhost:3001")

# LED strip configuration
LED_COUNT = int(os.getenv("LED_COUNT", "16"))
LED_PIN = int(os.getenv("LED_PIN", "18"))  # GPIO18 (PWM0)
LED_BRIGHTNESS = int(os.getenv("LED_BRIGHTNESS", "128"))  # 0-255
LED_FREQ_HZ = 800000   # WS2812B signal frequency
LED_DMA = 10            # DMA channel for generating signal
LED_INVERT = False      # True to invert signal (when using NPN transistor level shift)
LED_CHANNEL = 0         # PWM channel (0 for GPIO18)
