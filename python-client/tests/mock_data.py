"""Shared mock API responses for testing."""

MOCK_SPOTIFY_PLAYING = {
    "is_playing": True,
    "item": {
        "id": "abc123",
        "name": "Blinding Lights",
        "artists": [{"id": "artist1", "name": "The Weeknd"}],
        "album": {"name": "After Hours"},
        "popularity": 92,
    },
}

MOCK_SPOTIFY_NOT_PLAYING = {
    "is_playing": False,
    "item": None,
}

MOCK_ARTIST = {
    "genres": ["canadian pop", "pop"],
}

MOCK_AUDIO_FEATURES = [{
    "valence": 0.334,
    "energy": 0.730,
    "tempo": 171.005,
    "danceability": 0.514,
}]

MOCK_CALENDAR_RESPONSE = {
    "items": [
        {
            "summary": "CS 531 Lecture",
            "description": "Deep learning chapter 5",
            "start": {"dateTime": "2026-02-17T14:00:00-05:00"},
            "end": {"dateTime": "2026-02-17T15:15:00-05:00"},
            "status": "confirmed",
        },
        {
            "summary": "Cancelled Meeting",
            "description": "",
            "start": {"dateTime": "2026-02-17T15:30:00-05:00"},
            "end": {"dateTime": "2026-02-17T16:00:00-05:00"},
            "status": "cancelled",
        },
    ]
}

MOCK_RECENTLY_PLAYED = {
    "items": [
        {
            "track": {
                "name": "Starboy",
                "artists": [{"id": "artist1", "name": "The Weeknd"}],
            },
        },
        {
            "track": {
                "name": "Save Your Tears",
                "artists": [{"id": "artist1", "name": "The Weeknd"}],
            },
        },
        {
            "track": {
                "name": "Levitating",
                "artists": [{"id": "artist2", "name": "Dua Lipa"}],
            },
        },
    ]
}

MOCK_TRACK_INFO = {
    "name": "Blinding Lights",
    "artist": "The Weeknd",
    "album": "After Hours",
    "artist_genres": ["canadian pop", "pop"],
    "popularity": 92,
}

MOCK_CALENDAR_EVENTS = [
    {
        "summary": "CS 531 Lecture",
        "description": "Deep learning chapter 5",
        "start_time": "2026-02-17T14:00:00-05:00",
        "minutes_until": 45,
        "location": "",
    }
]
