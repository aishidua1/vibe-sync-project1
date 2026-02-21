"use client";

import { useVibeSync } from "@/hooks/useVibeSync";
import VinylRecord from "./VinylRecord";
import VibeStatusCard from "./VibeStatusCard";
import NextEventCard from "./NextEventCard";
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
          <div className="grid-layout">
            <div className="grid-top-left">
              <VinylRecord
                track={state.now_playing}
              />
            </div>
            <div className="grid-top-right">
              <NextEventCard
                event={
                  state.type === "VIBE_MISMATCH" ? state.next_event : undefined
                }
              />
              <SuggestionBanner
                suggestion={
                  state.type === "VIBE_MISMATCH"
                    ? state.transition_suggestion
                    : null
                }
              />
            </div>
            <div className="grid-bottom-left">
              {state.song_recommendations && state.song_recommendations.length > 0 ? (
                <RecommendationsCard recommendations={state.song_recommendations} />
              ) : (
                <div className="card">
                  <h2>RECOMMENDED</h2>
                  <p className="label">No recommendations yet</p>
                </div>
              )}
            </div>
            <div className="grid-bottom-right">
              <VibeStatusCard
                type={state.type}
                score={state.compatibility_score}
                severity={
                  state.type === "VIBE_MISMATCH" ? state.severity : undefined
                }
                musicMood={state.music_mood}
                taskIntent={state.task_intent}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
