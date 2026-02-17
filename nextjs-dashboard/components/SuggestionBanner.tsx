interface Props {
  suggestion: string | null | undefined;
}

export default function SuggestionBanner({ suggestion }: Props) {
  if (!suggestion) return null;

  return (
    <div className="suggestion-banner">
      <p>{suggestion}</p>
    </div>
  );
}
