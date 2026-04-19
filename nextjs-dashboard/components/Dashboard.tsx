"use client";

import { useVibeSync } from "@/hooks/useVibeSync";
import { GlowingEffect } from "./GlowingEffect";
import VinylRecord from "./VinylRecord";
import VibeStatusCard from "./VibeStatusCard";
import NextEventCard from "./NextEventCard";
import SuggestionBanner from "./SuggestionBanner";
import RecommendationsCard from "./RecommendationsCard";
import VibeOverrideCard from "./VibeOverrideCard";

function GlowCard({ children, disableGlow = false }: { children: React.ReactNode; disableGlow?: boolean }) {
  if (disableGlow) {
    return <div className="glow-wrapper">{children}</div>;
  }
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

export default function Dashboard({ disableGlow = false }: { disableGlow?: boolean }) {
  const { state, nextEvent, connected, scoreOverride, originalScore, applyOverride, clearOverride, source, toggleSource } = useVibeSync();

  const isIdle = state.type === "IDLE";

  return (
    <div className="container">
      <header>
        <h1>VIBE-SYNC</h1>
        <div className="header-controls">
          <button
            type="button"
            onClick={toggleSource}
            className={`source-toggle source-${source}`}
            title={source === "live" ? "Switch to mock data" : "Switch to live data"}
          >
            {source === "live" ? "LIVE DATA" : "DEMO DATA"}
          </button>
          <span
            className={`connection-status ${connected ? "connected" : "disconnected"}`}
          >
            {connected ? "Live" : "Reconnecting..."}
          </span>
        </div>
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
              <GlowCard disableGlow={disableGlow}>
                <div className="card vinyl-card">
                  <VinylRecord track={state.now_playing} />
                </div>
              </GlowCard>
            </div>
            <div className="grid-top-right">
              <GlowCard disableGlow={disableGlow}>
                <NextEventCard event={nextEvent} />
              </GlowCard>
              {state.type === "VIBE_MISMATCH" && state.transition_suggestion && (
                <GlowCard disableGlow={disableGlow}>
                  <SuggestionBanner suggestion={state.transition_suggestion} />
                </GlowCard>
              )}
            </div>
            <div className="grid-bottom-left">
              <GlowCard disableGlow={disableGlow}>
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
              <GlowCard disableGlow={disableGlow}>
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

          {originalScore != null && (
            <div className="override-section">
              <GlowCard disableGlow={disableGlow}>
                <VibeOverrideCard
                  originalScore={originalScore}
                  overrideScore={scoreOverride}
                  onOverride={applyOverride}
                  onClear={clearOverride}
                />
              </GlowCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
