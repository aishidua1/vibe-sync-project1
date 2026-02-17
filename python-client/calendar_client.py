import os
import datetime
import logging
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import config

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]


class CalendarClient:
    def __init__(self):
        self.service = self._authenticate()

    def _authenticate(self):
        """Handles OAuth2 flow with token caching."""
        creds = None

        if os.path.exists(config.GOOGLE_TOKEN_PATH):
            creds = Credentials.from_authorized_user_file(
                config.GOOGLE_TOKEN_PATH, SCOPES
            )

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    config.GOOGLE_CREDENTIALS_PATH, SCOPES
                )
                creds = flow.run_local_server(port=0)

            os.makedirs(os.path.dirname(config.GOOGLE_TOKEN_PATH), exist_ok=True)
            with open(config.GOOGLE_TOKEN_PATH, "w") as token:
                token.write(creds.to_json())

        return build("calendar", "v3", credentials=creds)

    def get_upcoming_events(self, hours=2):
        """Returns list of events in the next N hours."""
        try:
            now = datetime.datetime.utcnow()
            time_min = now.isoformat() + "Z"
            time_max = (now + datetime.timedelta(hours=hours)).isoformat() + "Z"

            result = self.service.events().list(
                calendarId="primary",
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy="startTime",
            ).execute()

            events = []
            for event in result.get("items", []):
                if event.get("status") == "cancelled":
                    continue

                start = event["start"].get("dateTime", event["start"].get("date"))
                events.append({
                    "summary": event.get("summary", "Untitled Event"),
                    "description": event.get("description", ""),
                    "start_time": start,
                    "minutes_until": self._minutes_until(start),
                    "location": event.get("location", ""),
                })

            return events

        except Exception as e:
            logger.error(f"Calendar API error: {e}")
            return []

    @staticmethod
    def _minutes_until(start_time_str):
        """Calculate minutes from now until the event start."""
        try:
            start = datetime.datetime.fromisoformat(
                start_time_str.replace("Z", "+00:00")
            )
            now = datetime.datetime.now(datetime.timezone.utc)
            delta = (start - now).total_seconds() / 60
            return round(max(0, delta))
        except Exception:
            return 0
