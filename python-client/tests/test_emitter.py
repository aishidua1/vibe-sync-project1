import pytest
from unittest.mock import MagicMock, patch
from tests.mock_data import MOCK_TRACK_INFO, MOCK_CALENDAR_EVENTS


@patch("emitter.socketio.Client")
def test_emit_idle(mock_client_cls):
    from emitter import Emitter

    mock_sio = MagicMock()
    mock_client_cls.return_value = mock_sio

    emitter = Emitter("http://localhost:3001")
    emitter.emit_idle()

    mock_sio.emit.assert_called_once_with("vibe_idle", {})


@patch("emitter.socketio.Client")
def test_emit_context(mock_client_cls):
    from emitter import Emitter

    mock_sio = MagicMock()
    mock_client_cls.return_value = mock_sio

    emitter = Emitter("http://localhost:3001")
    emitter.emit_context(MOCK_TRACK_INFO, MOCK_CALENDAR_EVENTS)

    mock_sio.emit.assert_called_once_with("vibe_context", {
        "track": MOCK_TRACK_INFO,
        "events": MOCK_CALENDAR_EVENTS,
    })


@patch("emitter.socketio.Client")
def test_connect(mock_client_cls):
    from emitter import Emitter

    mock_sio = MagicMock()
    mock_client_cls.return_value = mock_sio

    emitter = Emitter("http://localhost:3001")
    emitter.connect()

    mock_sio.connect.assert_called_once_with("http://localhost:3001")


@patch("emitter.socketio.Client")
def test_disconnect(mock_client_cls):
    from emitter import Emitter

    mock_sio = MagicMock()
    mock_client_cls.return_value = mock_sio

    emitter = Emitter("http://localhost:3001")
    emitter.disconnect()

    mock_sio.disconnect.assert_called_once()
