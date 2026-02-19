interface Props {
  type: string;
  score?: number;
  severity?: string;
  musicMood?: string;
  taskIntent?: string;
}

export default function VibeStatusCard({ type, score, severity, musicMood, taskIntent }: Props) {
  let circleClass = "score-circle";
  if (type === "SYNCED") {
    circleClass += " synced";
  } else if (severity === "HIGH") {
    circleClass += " high";
  } else if (severity === "MEDIUM") {
    circleClass += " medium";
  } else if (type === "VIBE_MISMATCH") {
    circleClass += " low";
  } else {
    circleClass += " idle";
  }

  const statusText = type === "SYNCED" ? "SYNCED" : type === "VIBE_MISMATCH" ? "MISMATCH" : "\u2014";

  return (
    <div className="card vibe-status">
      <h2>VIBE STATUS</h2>
      <div className="vibe-status-content">
        <div className="vibe-score-section">
          <div className={circleClass}>
            <span>{score != null ? score : "\u2014"}</span>
          </div>
          <p className="status-label">{statusText}</p>
          {severity && type === "VIBE_MISMATCH" && (
            <span className={`severity-badge ${severity.toLowerCase()}`}>
              {severity}
            </span>
          )}
        </div>
        <div className="vibe-analysis-section">
          <p className="label">
            Music: <span>{musicMood || "\u2014"}</span>
          </p>
          <p className="label">
            Task: <span>{taskIntent || "\u2014"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
