// React component that displays the user's next calendar event, including the event name, 
// time until the event, and a brief description. If there are no upcoming events, it shows 
// a placeholder message. It receives the event data as props from the parent component, which 
// is updated in real-time via Socket.io.

import { CalendarEvent } from "@/lib/types";

interface Props {
  event?: CalendarEvent;
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
    </div>
  );
}
