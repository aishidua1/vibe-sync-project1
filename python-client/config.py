import os
from dotenv import load_dotenv

load_dotenv()

# Spotify
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:8888/callback")

# App Settings
POLLING_INTERVAL = int(os.getenv("POLLING_INTERVAL", "30"))

# Node.js Server
NODE_SERVER_URL = os.getenv("NODE_SERVER_URL", "http://localhost:3001")

# Google Calendar
GOOGLE_CREDENTIALS_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "credentials", "google_credentials.json"
)
GOOGLE_TOKEN_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "credentials", "google_token.json"
)
