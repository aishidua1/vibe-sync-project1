// React component that displays the user's next calendar event, including the event name, 
// time until the event, and a brief description. If there are no upcoming events, it shows 
// a placeholder message. It receives the event data as props from the parent component, which 
// is updated in real-time via Socket.io.

import { CalendarEvent } from "@/lib/types";

interface Props {
  event?: CalendarEvent;
}

function buildCalendarUrl(event: CalendarEvent): string | null {
  const start = new Date(event.start_time);
  if (isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 60 * 60 * 1000); // default 1 hour
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.summary,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.description || "",
    location: event.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function NextEventCard({ event }: Props) {
  return (
    <div className="card next-event">
      <h2>NEXT EVENT</h2>
      <p className="event-name">
        {event?.summary || "No upcoming events"}
      </p>
      <p className="event-time">
        {event?.minutes_until != null
          ? `in ${event.minutes_until} minutes`
          : "\u2014"}
      </p>
      <p className="event-description">{event?.description || "\u2014"}</p>
      {event && (() => {
        const url = buildCalendarUrl(event);
        return url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="calendar-btn"
          >
            Open in Calendar
          </a>
        ) : null;
      })()}
    </div>
  );
}
