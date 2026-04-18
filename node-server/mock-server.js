const { Server } = require("socket.io");

const PORT = 3002;
const CYCLE_INTERVAL = 30000; // Switch states every 30 seconds

// ---------- Mock States ----------

const IDLE_STATE = {
  type: "IDLE",
  message: "No music currently playing",
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
    audio_features: {
      valence: 0.35,
      energy: 0.3,
      tempo: 85,
      danceability: 0.6,
    },
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
    {
      title: "Re: Stacks",
      artist: "Bon Iver",
      reason: "Gentle acoustic folk perfect for winding down",
    },
  ],
  timestamp: new Date().toISOString(),
};

const MISMATCH_HIGH = {
  type: "VIBE_MISMATCH",
  severity: "HIGH",
  compatibility_score: 22,
  music_mood: "Intense, aggressive death metal with blast beats",
  task_intent: "Meditation and mindfulness session",
  transition_suggestion:
    "Your music is extremely high-energy for a meditation session. Switch to ambient sounds, nature recordings, or soft drone music to align with your mindfulness practice.",
  now_playing: {
    name: "Bleed",
    artist: "Meshuggah",
    album: "obZen",
    album_art_url:
      "https://i.scdn.co/image/ab67616d0000b273a8e5e tried0b2b4b2b4b2b4b2b4",
    artist_genres: ["progressive metal", "djent", "extreme metal"],
    popularity: 71,
    audio_features: {
      valence: 0.15,
      energy: 0.95,
      tempo: 132,
      danceability: 0.25,
    },
  },
  next_event: {
    summary: "Guided Meditation Session",
    description: "Weekly mindfulness practice with campus wellness group",
    start_time: new Date(Date.now() + 10 * 60000).toISOString(),
    minutes_until: 10,
    location: "Wilson Gym Room 102",
  },
  song_recommendations: [
    {
      title: "Weightless",
      artist: "Marconi Union",
      reason: "Scientifically designed to reduce anxiety and aid relaxation",
    },
    {
      title: "An Ending (Ascent)",
      artist: "Brian Eno",
      reason: "Ethereal ambient piece perfect for mindfulness",
    },
    {
      title: "Holocene",
      artist: "Bon Iver",
      reason: "Gentle, reflective folk to ease into a calm headspace",
    },
  ],
  timestamp: new Date().toISOString(),
};

const MISMATCH_MEDIUM = {
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
    audio_features: {
      valence: 0.42,
      energy: 0.62,
      tempo: 150,
      danceability: 0.91,
    },
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
      title: "Gymnopédie No.1",
      artist: "Erik Satie",
      reason: "Gentle classical piano ideal for deep concentration",
    },
    {
      title: "Intro",
      artist: "The xx",
      reason: "Minimal, atmospheric instrumental to ease into study mode",
    },
    {
      title: "Nuvole Bianche",
      artist: "Ludovico Einaudi",
      reason: "Flowing piano that supports sustained focus",
    },
  ],
  timestamp: new Date().toISOString(),
};

const MISMATCH_LOW = {
  type: "VIBE_MISMATCH",
  severity: "LOW",
  compatibility_score: 55,
  music_mood: "Upbeat indie pop with catchy hooks",
  task_intent: "Wrapping up a group project presentation",
  transition_suggestion:
    "Your music is slightly too energetic for focused presentation work. Consider something with a steadier rhythm to keep momentum without distraction.",
  now_playing: {
    name: "Heat Waves",
    artist: "Glass Animals",
    album: "Dreamland",
    album_art_url:
      "https://i.scdn.co/image/ab67616d0000b273712701c5e263efc8726b1464",
    artist_genres: ["indie pop", "psychedelic pop", "shimmer pop"],
    popularity: 90,
    audio_features: {
      valence: 0.55,
      energy: 0.53,
      tempo: 81,
      danceability: 0.76,
    },
  },
  next_event: {
    summary: "Group Project Meeting — Final Slides",
    description: "Finalize slide deck for Thursday's presentation",
    start_time: new Date(Date.now() + 45 * 60000).toISOString(),
    minutes_until: 45,
    location: "Zoom",
  },
  song_recommendations: [
    {
      title: "Tongue Tied",
      artist: "Grouplove",
      reason: "Energetic enough to keep spirits up while staying on task",
    },
    {
      title: "Do I Wanna Know?",
      artist: "Arctic Monkeys",
      reason: "Steady tempo that keeps you in a productive groove",
    },
    {
      title: "Pursuit of Happiness",
      artist: "Kid Cudi",
      reason: "Motivational but chill enough for focused work",
    },
  ],
  timestamp: new Date().toISOString(),
};

const SYNCED_HIGH = {
  type: "SYNCED",
  compatibility_score: 95,
  music_mood: "Focused instrumental piano with ambient textures",
  task_intent: "Writing a research paper",
  now_playing: {
    name: "Experience",
    artist: "Ludovico Einaudi",
    album: "In a Time Lapse",
    album_art_url:
      "https://i.scdn.co/image/ab67616d0000b2731d5cf960945bbc2a8b233f60",
    artist_genres: ["classical", "italian contemporary classical", "neoclassical"],
    popularity: 80,
    audio_features: {
      valence: 0.25,
      energy: 0.4,
      tempo: 70,
      danceability: 0.3,
    },
  },
  song_recommendations: [
    {
      title: "Divenire",
      artist: "Ludovico Einaudi",
      reason: "Same artist, equally good for deep writing sessions",
    },
    {
      title: "On the Nature of Daylight",
      artist: "Max Richter",
      reason: "Hauntingly beautiful strings for reflective work",
    },
    {
      title: "Opus 23",
      artist: "Dustin O'Halloran",
      reason: "Minimalist piano that won't interrupt your flow",
    },
  ],
  timestamp: new Date().toISOString(),
};

// ---------- State Rotation ----------

const STATES = [
  { state: MISMATCH_MEDIUM, label: "VIBE_MISMATCH (MEDIUM)" },
  { state: SYNCED_STATE, label: "SYNCED (85)" },
  { state: MISMATCH_HIGH, label: "VIBE_MISMATCH (HIGH)" },
  { state: MISMATCH_LOW, label: "VIBE_MISMATCH (LOW)" },
  { state: SYNCED_HIGH, label: "SYNCED (95)" },
];

let stateIndex = 0;

// ---------- Server ----------

const io = new Server(PORT, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log(`Dashboard connected: ${socket.id}`);

  // Send first state immediately
  socket.emit("vibe_update", STATES[stateIndex].state);
  console.log(`→ Sent: ${STATES[stateIndex].label}`);

  const interval = setInterval(() => {
    stateIndex = (stateIndex + 1) % STATES.length;
    const { state, label } = STATES[stateIndex];

    // Refresh timestamps so they look current
    if (state.timestamp) state.timestamp = new Date().toISOString();
    if (state.next_event) {
      state.next_event.start_time = new Date(
        Date.now() + state.next_event.minutes_until * 60000
      ).toISOString();
    }

    io.emit("vibe_update", state);
    console.log(`→ Sent: ${label}`);
  }, CYCLE_INTERVAL);

  socket.on("disconnect", () => {
    clearInterval(interval);
    console.log(`Dashboard disconnected: ${socket.id}`);
  });
});

console.log(`\nMock server running on port ${PORT}`);
console.log(`Cycling through ${STATES.length} states every ${CYCLE_INTERVAL / 1000}s:\n`);
STATES.forEach((s, i) => console.log(`  ${i + 1}. ${s.label}`));
console.log(`\nPoint your dashboard at http://localhost:${PORT}\n`);
