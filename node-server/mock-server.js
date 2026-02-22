const { Server } = require("socket.io");

const io = new Server(3002, { cors: { origin: "*" } });

const MISMATCH_STATE = {
  type: "VIBE_MISMATCH",
  severity: "MEDIUM",
  compatibility_score: 38,
  music_mood: "High-energy, aggressive hip-hop with heavy bass",
  task_intent: "Deep focus study session requiring concentration",
  transition_suggestion:
    "Try switching to lo-fi or ambient music to match your upcoming study session. Instrumental tracks can help maintain focus without lyrical distraction.",
  now_playing: {
    name: "HUMBLE.",
    artist: "Kendrick Lamar",
    album: "DAMN.",
    album_art_url:
      "https://i.scdn.co/image/ab67616d0000b2738b52c6b9bc4e43d873869699",
    artist_genres: ["conscious hip hop", "hip hop", "rap", "west coast rap"],
    popularity: 88,
  },
  next_event: {
    summary: "CS 531 Final Exam Study Group",
    description: "Review algorithms and data structures for the final",
    start_time: new Date(Date.now() + 25 * 60000).toISOString(),
    minutes_until: 25,
    location: "Perkins Library Room 217",
  },
  song_recommendations: [
    {
      title: "Weightless",
      artist: "Marconi Union",
      reason: "Scientifically designed to reduce anxiety and aid focus",
    },
    {
      title: "Gymnopédie No.1",
      artist: "Erik Satie",
      reason: "Gentle classical piano ideal for deep concentration",
    },
    {
      title: "Intro",
      artist: "The xx",
      reason: "Minimal, atmospheric instrumental to ease into study mode",
    },
  ],
  timestamp: new Date().toISOString(),
};

const SYNCED_STATE = {
  type: "SYNCED",
  compatibility_score: 85,
  music_mood: "Calm, atmospheric lo-fi with mellow beats",
  task_intent: "Light reading and note review",
  now_playing: {
    name: "Snowman",
    artist: "WYS",
    album: "Snowman",
    album_art_url:
      "https://i.scdn.co/image/ab67616d0000b273b36949bee43217a4b6c5627c",
    artist_genres: ["lo-fi beats", "chillhop"],
    popularity: 62,
  },
  song_recommendations: [
    {
      title: "Coffee",
      artist: "beabadoobee",
      reason: "Relaxed indie vibes that complement light study",
    },
    {
      title: "Electric Feel",
      artist: "MGMT",
      reason: "Upbeat but not distracting, great background energy",
    },
  ],
  timestamp: new Date().toISOString(),
};

// Alternate between states every 10 seconds so you can see both
let useMismatch = true;

io.on("connection", (socket) => {
  console.log("Dashboard connected:", socket.id);

  // Send mismatch state immediately
  socket.emit("vibe_update", MISMATCH_STATE);

  // Toggle between states every 10s
  const interval = setInterval(() => {
    useMismatch = !useMismatch;
    const state = useMismatch ? MISMATCH_STATE : SYNCED_STATE;
    console.log(`Sending ${state.type} state`);
    socket.emit("vibe_update", state);
  }, 60000);

  socket.on("disconnect", () => {
    clearInterval(interval);
    console.log("Dashboard disconnected:", socket.id);
  });
});

console.log("Mock server running on port 3002");
console.log("Alternates between VIBE_MISMATCH and SYNCED every 10s");
