import pytest
from unittest.mock import MagicMock, mock_open, patch
from tests.mock_data import MOCK_CALENDAR_RESPONSE


@patch("builtins.open", mock_open())
@patch("calendar_client.os.makedirs")
@patch("calendar_client.build")
@patch("calendar_client.InstalledAppFlow")
@patch("calendar_client.os.path.exists", return_value=False)
def test_get_upcoming_events(mock_exists, mock_flow, mock_build, mock_makedirs):
    from calendar_client import CalendarClient

    # Mock the OAuth flow
    mock_creds = MagicMock()
    mock_creds.valid = True
    mock_creds.to_json.return_value = '{"token": "mock"}'
    mock_flow.from_client_secrets_file.return_value.run_local_server.return_value = mock_creds

    # Mock the calendar service
    mock_service = MagicMock()
    mock_build.return_value = mock_service
    mock_service.events.return_value.list.return_value.execute.return_value = (
        MOCK_CALENDAR_RESPONSE
    )

    client = CalendarClient()
    events = client.get_upcoming_events(hours=2)

    # Should filter out cancelled events
    assert len(events) == 1
    assert events[0]["summary"] == "CS 531 Lecture"
    assert events[0]["description"] == "Deep learning chapter 5"


@patch("builtins.open", mock_open())
@patch("calendar_client.os.makedirs")
@patch("calendar_client.build")
@patch("calendar_client.InstalledAppFlow")
@patch("calendar_client.os.path.exists", return_value=False)
def test_get_upcoming_events_empty(mock_exists, mock_flow, mock_build, mock_makedirs):
    from calendar_client import CalendarClient

    mock_creds = MagicMock()
    mock_creds.valid = True
    mock_creds.to_json.return_value = '{"token": "mock"}'
    mock_flow.from_client_secrets_file.return_value.run_local_server.return_value = mock_creds

    mock_service = MagicMock()
    mock_build.return_value = mock_service
    mock_service.events.return_value.list.return_value.execute.return_value = {
        "items": []
    }

    client = CalendarClient()
    events = client.get_upcoming_events(hours=2)

    assert events == []


def test_minutes_until():
    from calendar_client import CalendarClient
    import datetime

    # A time 30 minutes from now
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)
    future_str = future.isoformat()

    result = CalendarClient._minutes_until(future_str)
    assert 29 <= result <= 31  # Allow slight timing variance
