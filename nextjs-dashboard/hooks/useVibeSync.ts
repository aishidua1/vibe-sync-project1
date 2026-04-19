// Custom React hook that connects to the Node.js server via Socket.io to receive real-time updates on the user's vibe state

"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { VibeState } from "@/lib/types";

export type DataSource = "live" | "mock";

// Default to the host that served the dashboard so the Pi (kiosk browser)
// reaches back to the laptop running the servers. Env vars override for deployments.
function defaultUrl(port: number): string {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }
  return `http://localhost:${port}`;
}

const LIVE_URL =
  process.env.NEXT_PUBLIC_NODE_SERVER_URL || defaultUrl(3001);
const MOCK_URL =
  process.env.NEXT_PUBLIC_MOCK_SERVER_URL || defaultUrl(3002);
const SOURCE_STORAGE_KEY = "vibeSyncDataSource";

export function useVibeSync() {
  const [rawState, setRawState] = useState<VibeState>({
    type: "IDLE",
    message: "Connecting...",
  });
  const [scoreOverride, setScoreOverride] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [source, setSource] = useState<DataSource>("live");

  // Load saved source preference on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(SOURCE_STORAGE_KEY);
    if (saved === "live" || saved === "mock") {
      setSource(saved);
    }
  }, []);

  // Connect socket whenever source changes
  useEffect(() => {
    const url = source === "mock" ? MOCK_URL : LIVE_URL;
    const socket: Socket = io(url);

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
  }, [source]);

  const toggleSource = useCallback(() => {
    setSource((prev) => {
      const next = prev === "live" ? "mock" : "live";
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SOURCE_STORAGE_KEY, next);
      }
      setRawState({ type: "IDLE", message: "Switching source..." });
      setConnected(false);
      return next;
    });
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

  return { state, nextEvent, connected, scoreOverride, originalScore, applyOverride, clearOverride, source, toggleSource };
}
