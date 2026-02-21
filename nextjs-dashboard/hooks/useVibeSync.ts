// Custom React hook that connects to the Node.js server via Socket.io to receive real-time updates on the user's vibe state

"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { VibeState } from "@/lib/types";

const SERVER_URL =
  process.env.NEXT_PUBLIC_NODE_SERVER_URL || "http://localhost:3001";

export function useVibeSync() {
  const [state, setState] = useState<VibeState>({
    type: "IDLE",
    message: "Connecting...",
  });
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
      setState(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { state, connected };
}
