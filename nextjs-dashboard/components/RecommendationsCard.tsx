import { SongRecommendation } from "@/lib/types";

interface Props {
  recommendations: SongRecommendation[];
}

export default function RecommendationsCard({ recommendations }: Props) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="card recommendations-card">
      <h2>RECOMMENDED</h2>
      <ul className="recommendations-list">
        {recommendations.map((rec, i) => (
          <li key={i} className="recommendation-item">
            <span className="rec-title">{rec.title}</span>
            <span className="rec-artist">{rec.artist}</span>
            <span className="rec-reason">{rec.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
