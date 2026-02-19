import { TrackInfo } from "@/lib/types";

interface Props {
  track?: TrackInfo;
}

export default function VinylRecord({ track }: Props) {
  const albumArt = track?.album_art_url;

  return (
    <div className="vinyl-container">
      <div className="vinyl-record">
        <div className="vinyl-grooves">
          <div
            className="vinyl-label"
            style={
              albumArt
                ? { backgroundImage: `url(${albumArt})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          />
        </div>
        <div className="vinyl-hole" />
      </div>
      {track && (
        <div className="vinyl-info">
          <p className="vinyl-track-name">{track.name}</p>
          <p className="vinyl-track-artist">{track.artist}</p>
          <p className="vinyl-track-album">{track.album}</p>
        </div>
      )}
    </div>
  );
}
