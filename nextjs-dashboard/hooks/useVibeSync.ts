// Custom React hook that connects to the Node.js server via Socket.io to receive real-time updates on the user's vibe state

"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { VibeState } from "@/lib/types";

const SERVER_URL =
  process.env.NEXT_PUBLIC_NODE_SERVER_URL || "http://localhost:3001";

export function useVibeSync() {
  const [rawState, setRawState] = useState<VibeState>({
    type: "IDLE",
    message: "Connecting...",
  });
  const [scoreOverride, setScoreOverride] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io(SERVER_URL);

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("vibe_update", (data: VibeState) => {
      setRawState(data);
      setScoreOverride(null); // reset override when new data arrives
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const applyOverride = useCallback((newScore: number) => {
    setScoreOverride(newScore);
  }, []);

  const clearOverride = useCallback(() => {
    setScoreOverride(null);
  }, []);

  // Build the effective state with the override applied
  let state = rawState;
  if (scoreOverride !== null && rawState.type !== "IDLE") {
    const severity =
      scoreOverride < 30 ? "HIGH" as const :
      scoreOverride < 50 ? "MEDIUM" as const :
      scoreOverride < 60 ? "LOW" as const : undefined;

    if (scoreOverride >= 60) {
      state = {
        ...rawState,
        type: "SYNCED",
        compatibility_score: scoreOverride,
      };
    } else {
      state = {
        ...rawState,
        type: "VIBE_MISMATCH",
        compatibility_score: scoreOverride,
        severity: severity!,
        transition_suggestion: rawState.type === "VIBE_MISMATCH" ? rawState.transition_suggestion : null,
        next_event: rawState.type === "VIBE_MISMATCH" ? rawState.next_event : { summary: "", description: "", start_time: "", minutes_until: 0, location: "" },
      };
    }
  }

  const originalScore = rawState.type !== "IDLE" ? rawState.compatibility_score : undefined;
  const nextEvent = rawState.type !== "IDLE" ? rawState.next_event : undefined;

  return { state, nextEvent, connected, scoreOverride, originalScore, applyOverride, clearOverride };
}
