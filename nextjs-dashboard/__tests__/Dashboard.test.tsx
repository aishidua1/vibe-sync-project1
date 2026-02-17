import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Dashboard from "@/components/Dashboard";

// Mock the useVibeSync hook
jest.mock("@/hooks/useVibeSync", () => ({
  useVibeSync: jest.fn(),
}));

const { useVibeSync } = require("@/hooks/useVibeSync");

describe("Dashboard", () => {
  test("renders idle state when no music is playing", () => {
    useVibeSync.mockReturnValue({
      state: { type: "IDLE", message: "No music currently playing" },
      connected: true,
    });

    render(<Dashboard />);

    expect(screen.getByText("VIBE-SYNC")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("No music currently playing")).toBeInTheDocument();
  });

  test("renders disconnected status when not connected", () => {
    useVibeSync.mockReturnValue({
      state: { type: "IDLE", message: "Connecting..." },
      connected: false,
    });

    render(<Dashboard />);

    expect(screen.getByText("Reconnecting...")).toBeInTheDocument();
  });

  test("renders synced state with track info", () => {
    useVibeSync.mockReturnValue({
      state: {
        type: "SYNCED",
        compatibility_score: 85,
        music_mood: "calm, focused instrumental",
        task_intent: "deep-focus academic work",
        now_playing: {
          name: "Blinding Lights",
          artist: "The Weeknd",
          album: "After Hours",
          artist_genres: ["canadian pop", "pop"],
          popularity: 92,
        },
      },
      connected: true,
    });

    render(<Dashboard />);

    expect(screen.getByText("Blinding Lights")).toBeInTheDocument();
    expect(screen.getByText("The Weeknd")).toBeInTheDocument();
    expect(screen.getByText("After Hours")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("SYNCED")).toBeInTheDocument();
  });

  test("renders song recommendations when available", () => {
    useVibeSync.mockReturnValue({
      state: {
        type: "SYNCED",
        compatibility_score: 85,
        music_mood: "calm, focused instrumental",
        task_intent: "deep-focus academic work",
        now_playing: {
          name: "Blinding Lights",
          artist: "The Weeknd",
          album: "After Hours",
          artist_genres: ["canadian pop", "pop"],
          popularity: 92,
        },
        song_recommendations: [
          { title: "Weightless", artist: "Marconi Union", reason: "Proven to reduce anxiety" },
          { title: "Intro", artist: "The xx", reason: "Calm instrumental" },
          { title: "Midnight City", artist: "M83", reason: "Atmospheric synths" },
        ],
      },
      connected: true,
    });

    render(<Dashboard />);

    expect(screen.getByText("RECOMMENDED")).toBeInTheDocument();
    expect(screen.getByText("Weightless")).toBeInTheDocument();
    expect(screen.getByText("Marconi Union")).toBeInTheDocument();
    expect(screen.getByText("Proven to reduce anxiety")).toBeInTheDocument();
    expect(screen.getByText("Intro")).toBeInTheDocument();
    expect(screen.getByText("Midnight City")).toBeInTheDocument();
  });

  test("does not render recommendations when empty", () => {
    useVibeSync.mockReturnValue({
      state: {
        type: "SYNCED",
        compatibility_score: 85,
        music_mood: "calm, focused instrumental",
        task_intent: "deep-focus academic work",
        now_playing: {
          name: "Blinding Lights",
          artist: "The Weeknd",
          album: "After Hours",
          artist_genres: ["canadian pop", "pop"],
          popularity: 92,
        },
        song_recommendations: [],
      },
      connected: true,
    });

    render(<Dashboard />);

    expect(screen.queryByText("RECOMMENDED")).not.toBeInTheDocument();
  });

  test("renders vibe mismatch state with suggestion", () => {
    useVibeSync.mockReturnValue({
      state: {
        type: "VIBE_MISMATCH",
        severity: "HIGH",
        compatibility_score: 25,
        music_mood: "energizing party music",
        task_intent: "deep-focus academic work",
        transition_suggestion:
          "Switch to lo-fi or ambient music for better focus",
        next_event: {
          summary: "CS 531 Lecture",
          description: "Deep learning chapter 5",
          start_time: "2026-02-17T14:00:00-05:00",
          minutes_until: 45,
          location: "",
        },
        now_playing: {
          name: "Blinding Lights",
          artist: "The Weeknd",
          album: "After Hours",
          artist_genres: ["canadian pop", "pop"],
          popularity: 92,
        },
      },
      connected: true,
    });

    render(<Dashboard />);

    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("MISMATCH")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("CS 531 Lecture")).toBeInTheDocument();
    expect(screen.getByText("in 45 minutes")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Switch to lo-fi or ambient music for better focus"
      )
    ).toBeInTheDocument();
  });
});
