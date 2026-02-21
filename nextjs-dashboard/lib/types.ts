// TypeScript interfaces for the vibe sync application, defining the structure of data related 
// to music tracks, calendar events, song recommendations, and the different states of the vibe 
// synchronization process. These types are used throughout the Next.js dashboard to ensure type 
// safety and consistency when handling data received from the Node.js server.

export interface TrackInfo {
  name: string;
  artist: string;
  album: string;
  album_art_url?: string;
  artist_genres: string[];
  popularity: number;
  audio_features?: {
    valence: number;
    energy: number;
    tempo: number;
    danceability: number;
  };
}

export interface CalendarEvent {
  summary: string;
  description: string;
  start_time: string;
  minutes_until: number;
  location: string;
}

export interface SongRecommendation {
  title: string;
  artist: string;
  reason: string;
}

export interface IdleState {
  type: "IDLE";
  message: string;
}

export interface SyncedState {
  type: "SYNCED";
  compatibility_score: number;
  music_mood: string;
  task_intent: string;
  now_playing?: TrackInfo;
  song_recommendations?: SongRecommendation[];
  timestamp?: string;
}

export interface VibeMismatchState {
  type: "VIBE_MISMATCH";
  severity: "HIGH" | "MEDIUM" | "LOW";
  compatibility_score: number;
  music_mood: string;
  task_intent: string;
  transition_suggestion: string | null;
  song_recommendations?: SongRecommendation[];
  next_event: CalendarEvent;
  now_playing?: TrackInfo;
  timestamp?: string;
}

export type VibeState = IdleState | SyncedState | VibeMismatchState;
