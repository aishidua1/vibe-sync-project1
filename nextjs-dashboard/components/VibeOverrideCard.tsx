interface Props {
  originalScore: number;
  overrideScore: number | null;
  onOverride: (score: number) => void;
  onClear: () => void;
}

export default function VibeOverrideCard({ originalScore, overrideScore, onOverride, onClear }: Props) {
  const isActive = overrideScore !== null;
  const displayScore = overrideScore ?? originalScore;

  return (
    <div className={`card vibe-override ${isActive ? "override-active" : ""}`}>
      <h2>MY VIBE, MY RULES</h2>
      <p className="override-description">
        AI got it wrong? Adjust your vibe score to match how <em>you</em> feel about your music right now.
      </p>

      <div className="override-slider-section">
        <input
          type="range"
          min={0}
          max={100}
          value={displayScore}
          onChange={(e) => onOverride(Number(e.target.value))}
          className="override-slider"
        />
        <div className="override-score-label">
          <span className="override-score-value">{displayScore}</span>
          <span className="override-score-max">/ 100</span>
        </div>
      </div>

      <div className="override-presets">
        <button className="preset-btn preset-perfect" onClick={() => onOverride(95)}>
          Perfect vibe
        </button>
        <button className="preset-btn preset-good" onClick={() => onOverride(75)}>
          Works for me
        </button>
        <button className="preset-btn preset-meh" onClick={() => onOverride(45)}>
          Not ideal
        </button>
      </div>

      {isActive && (
        <button className="override-reset" onClick={onClear}>
          Reset to AI score ({originalScore})
        </button>
      )}
    </div>
  );
}
