import pytest
from unittest.mock import MagicMock, patch
from tests.mock_data import (
    MOCK_SPOTIFY_PLAYING,
    MOCK_SPOTIFY_NOT_PLAYING,
    MOCK_ARTIST,
    MOCK_AUDIO_FEATURES,
    MOCK_RECENTLY_PLAYED,
)


@patch("spotify_client.SpotifyOAuth")
@patch("spotify_client.spotipy.Spotify")
def test_get_now_playing_with_audio_features(mock_spotify_cls, mock_oauth):
    from spotify_client import SpotifyClient

    mock_sp = MagicMock()
    mock_spotify_cls.return_value = mock_sp
    mock_sp.current_user_playing_track.return_value = MOCK_SPOTIFY_PLAYING
    mock_sp.artist.return_value = MOCK_ARTIST
    mock_sp.audio_features.return_value = MOCK_AUDIO_FEATURES

    client = SpotifyClient()
    result = client.get_now_playing()

    assert result is not None
    assert result["name"] == "Blinding Lights"
    assert result["artist"] == "The Weeknd"
    assert result["artist_genres"] == ["canadian pop", "pop"]
    assert "audio_features" in result
    assert result["audio_features"]["valence"] == 0.334


@patch("spotify_client.SpotifyOAuth")
@patch("spotify_client.spotipy.Spotify")
def test_get_now_playing_without_audio_features(mock_spotify_cls, mock_oauth):
    from spotify_client import SpotifyClient

    mock_sp = MagicMock()
    mock_spotify_cls.return_value = mock_sp
    mock_sp.current_user_playing_track.return_value = MOCK_SPOTIFY_PLAYING
    mock_sp.artist.return_value = MOCK_ARTIST
    mock_sp.audio_features.side_effect = Exception("403 Forbidden")

    client = SpotifyClient()
    result = client.get_now_playing()

    assert result is not None
    assert result["name"] == "Blinding Lights"
    assert "audio_features" not in result


@patch("spotify_client.SpotifyOAuth")
@patch("spotify_client.spotipy.Spotify")
def test_get_now_playing_nothing_playing(mock_spotify_cls, mock_oauth):
    from spotify_client import SpotifyClient

    mock_sp = MagicMock()
    mock_spotify_cls.return_value = mock_sp
    mock_sp.current_user_playing_track.return_value = None

    client = SpotifyClient()
    result = client.get_now_playing()

    assert result is None


@patch("spotify_client.SpotifyOAuth")
@patch("spotify_client.spotipy.Spotify")
def test_get_now_playing_not_playing(mock_spotify_cls, mock_oauth):
    from spotify_client import SpotifyClient

    mock_sp = MagicMock()
    mock_spotify_cls.return_value = mock_sp
    mock_sp.current_user_playing_track.return_value = MOCK_SPOTIFY_NOT_PLAYING

    client = SpotifyClient()
    result = client.get_now_playing()

    assert result is None


@patch("spotify_client.SpotifyOAuth")
@patch("spotify_client.spotipy.Spotify")
def test_get_recent_tracks(mock_spotify_cls, mock_oauth):
    from spotify_client import SpotifyClient

    mock_sp = MagicMock()
    mock_spotify_cls.return_value = mock_sp
    mock_sp.current_user_recently_played.return_value = MOCK_RECENTLY_PLAYED
    mock_sp.artist.return_value = MOCK_ARTIST

    client = SpotifyClient()
    result = client.get_recent_tracks(limit=10)

    assert len(result) == 3
    assert result[0]["name"] == "Starboy"
    assert result[0]["artist"] == "The Weeknd"
    assert result[0]["genres"] == ["canadian pop", "pop"]
    assert result[2]["name"] == "Levitating"
    assert result[2]["artist"] == "Dua Lipa"


@patch("spotify_client.SpotifyOAuth")
@patch("spotify_client.spotipy.Spotify")
def test_get_recent_tracks_handles_error(mock_spotify_cls, mock_oauth):
    from spotify_client import SpotifyClient

    mock_sp = MagicMock()
    mock_spotify_cls.return_value = mock_sp
    mock_sp.current_user_recently_played.side_effect = Exception("API Error")

    client = SpotifyClient()
    result = client.get_recent_tracks()

    assert result == []
