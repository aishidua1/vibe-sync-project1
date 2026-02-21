// React component that displays the currently playing track information, including the track 
// name, artist, album, and the detected music mood. It receives the track information and music
// mood as props from the parent component, which is updated in real-time via Socket.io.

import { TrackInfo } from "@/lib/types";

interface Props {
  track?: TrackInfo;
  musicMood: string;
}

export default function NowPlayingCard({ track, musicMood }: Props) {
  return (
    <div className="card now-playing">
      <h2>NOW PLAYING</h2>
      <p className="track-name">{track?.name || "\u2014"}</p>
      <p className="track-artist">{track?.artist || "\u2014"}</p>
      <p className="track-album">{track?.album || "\u2014"}</p>
      <p className="label">
        Mood: <span>{musicMood || "\u2014"}</span>
      </p>
    </div>
  );
}
