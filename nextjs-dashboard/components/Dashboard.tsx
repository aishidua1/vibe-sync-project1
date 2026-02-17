"use client";

import { useVibeSync } from "@/hooks/useVibeSync";
import NowPlayingCard from "./NowPlayingCard";
import VibeStatusCard from "./VibeStatusCard";
import NextEventCard from "./NextEventCard";
import AnalysisCard from "./AnalysisCard";
import SuggestionBanner from "./SuggestionBanner";
import RecommendationsCard from "./RecommendationsCard";

export default function Dashboard() {
  const { state, connected } = useVibeSync();

  const isIdle = state.type === "IDLE";

  return (
    <div className="container">
      <header>
        <h1>VIBE-SYNC</h1>
        <span
          className={`connection-status ${connected ? "connected" : "disconnected"}`}
        >
          {connected ? "Live" : "Reconnecting..."}
        </span>
      </header>
      <p className="subtitle">Desk Companion</p>

      {isIdle ? (
        <div className="idle-state">
          <div className="idle-icon">&#9835;</div>
          <p>{state.type === "IDLE" ? state.message : "No music playing"}</p>
        </div>
      ) : (
        <>
          <div className="cards">
            <NowPlayingCard
              track={state.type !== "IDLE" ? state.now_playing : undefined}
              musicMood={state.type !== "IDLE" ? state.music_mood : ""}
            />
            <VibeStatusCard
              type={state.type}
              score={state.type !== "IDLE" ? state.compatibility_score : undefined}
              severity={
                state.type === "VIBE_MISMATCH" ? state.severity : undefined
              }
            />
            <NextEventCard
              event={
                state.type === "VIBE_MISMATCH" ? state.next_event : undefined
              }
            />
            <AnalysisCard
              musicMood={state.type !== "IDLE" ? state.music_mood : ""}
              taskIntent={state.type !== "IDLE" ? state.task_intent : ""}
            />
          </div>
          <SuggestionBanner
            suggestion={
              state.type === "VIBE_MISMATCH"
                ? state.transition_suggestion
                : null
            }
          />
          {state.type !== "IDLE" && state.song_recommendations && state.song_recommendations.length > 0 && (
            <RecommendationsCard recommendations={state.song_recommendations} />
          )}
        </>
      )}
    </div>
  );
}
