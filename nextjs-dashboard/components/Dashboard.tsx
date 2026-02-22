"use client";

import { useVibeSync } from "@/hooks/useVibeSync";
import { GlowingEffect } from "./GlowingEffect";
import VinylRecord from "./VinylRecord";
import VibeStatusCard from "./VibeStatusCard";
import NextEventCard from "./NextEventCard";
import SuggestionBanner from "./SuggestionBanner";
import RecommendationsCard from "./RecommendationsCard";

function GlowCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="glow-wrapper">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={3}
      />
      {children}
    </div>
  );
}

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
              <GlowCard>
                <div className="card vinyl-card">
                  <VinylRecord track={state.now_playing} />
                </div>
              </GlowCard>
            </div>
            <div className="grid-top-right">
              <GlowCard>
                <NextEventCard
                  event={
                    state.type === "VIBE_MISMATCH" ? state.next_event : undefined
                  }
                />
              </GlowCard>
              {state.type === "VIBE_MISMATCH" && state.transition_suggestion && (
                <GlowCard>
                  <SuggestionBanner suggestion={state.transition_suggestion} />
                </GlowCard>
              )}
            </div>
            <div className="grid-bottom-left">
              <GlowCard>
                {state.song_recommendations && state.song_recommendations.length > 0 ? (
                  <RecommendationsCard recommendations={state.song_recommendations} />
                ) : (
                  <div className="card">
                    <h2>RECOMMENDED</h2>
                    <p className="label">No recommendations yet</p>
                  </div>
                )}
              </GlowCard>
            </div>
            <div className="grid-bottom-right">
              <GlowCard>
                <VibeStatusCard
                  type={state.type}
                  score={state.compatibility_score}
                  severity={
                    state.type === "VIBE_MISMATCH" ? state.severity : undefined
                  }
                  musicMood={state.music_mood}
                  taskIntent={state.task_intent}
                />
              </GlowCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
