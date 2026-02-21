// React component that displays the analysis of the user's current music mood and task intent based on the AI's response.

interface Props {
  musicMood: string;
  taskIntent: string;
}

export default function AnalysisCard({ musicMood, taskIntent }: Props) {
  return (
    <div className="card analysis">
      <h2>ANALYSIS</h2>
      <p>
        Music: <span>{musicMood || "\u2014"}</span>
      </p>
      <p>
        Task: <span>{taskIntent || "\u2014"}</span>
      </p>
    </div>
  );
}
