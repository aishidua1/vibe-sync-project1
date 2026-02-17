// Mock environment variables before requiring module
process.env.DUKE_AI_GATEWAY_KEY = "test-key";
process.env.DUKE_AI_GATEWAY_URL = "https://test.example.com/v1";
process.env.DUKE_AI_MODEL = "test-model";

const MOCK_TRACK_INFO = {
  name: "Blinding Lights",
  artist: "The Weeknd",
  album: "After Hours",
  artist_genres: ["canadian pop", "pop"],
  popularity: 92,
};

const MOCK_TRACK_INFO_WITH_FEATURES = {
  ...MOCK_TRACK_INFO,
  audio_features: {
    valence: 0.334,
    energy: 0.73,
    tempo: 171.005,
    danceability: 0.514,
  },
};

const MOCK_CALENDAR_EVENTS = [
  {
    summary: "CS 531 Lecture",
    description: "Deep learning chapter 5",
    start_time: "2026-02-17T14:00:00-05:00",
    minutes_until: 45,
    location: "",
  },
];

const MOCK_RECENT_TRACKS = [
  { name: "Starboy", artist: "The Weeknd", genres: ["canadian pop", "pop"] },
  { name: "Levitating", artist: "Dua Lipa", genres: ["dance pop", "pop"] },
];

const MOCK_AI_RESPONSE_MISMATCH = {
  music_mood: "energizing party music",
  task_intent: "deep-focus academic work",
  compatibility_score: 25,
  transition_suggestion: "Switch to lo-fi or ambient music for better focus",
  song_recommendations: [
    { title: "Weightless", artist: "Marconi Union", reason: "Proven to reduce anxiety and aid focus" },
    { title: "Intro", artist: "The xx", reason: "Minimal, calm instrumental that supports deep work" },
    { title: "Midnight City", artist: "M83", reason: "Atmospheric synths similar to your taste" },
  ],
};

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

const OpenAI = require("openai");
const AIGateway = require("../src/aiGateway");

describe("AIGateway", () => {
  let gateway;
  let mockCreate;

  beforeEach(() => {
    OpenAI.mockClear();
    gateway = new AIGateway();
    mockCreate = gateway.client.chat.completions.create;
  });

  test("analyzeCompatibility returns parsed AI response", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(MOCK_AI_RESPONSE_MISMATCH),
          },
        },
      ],
    });

    const result = await gateway.analyzeCompatibility(
      MOCK_TRACK_INFO,
      MOCK_CALENDAR_EVENTS
    );

    expect(result.compatibility_score).toBe(25);
    expect(result.music_mood).toBe("energizing party music");
    expect(result.transition_suggestion).not.toBeNull();
  });

  test("strips markdown code fences from response", async () => {
    const fenced = `\`\`\`json\n${JSON.stringify(MOCK_AI_RESPONSE_MISMATCH)}\n\`\`\``;
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: fenced } }],
    });

    const result = await gateway.analyzeCompatibility(
      MOCK_TRACK_INFO,
      MOCK_CALENDAR_EVENTS
    );

    expect(result.compatibility_score).toBe(25);
  });

  test("returns song_recommendations in parsed response", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(MOCK_AI_RESPONSE_MISMATCH),
          },
        },
      ],
    });

    const result = await gateway.analyzeCompatibility(
      MOCK_TRACK_INFO,
      MOCK_CALENDAR_EVENTS,
      MOCK_RECENT_TRACKS
    );

    expect(result.song_recommendations).toHaveLength(3);
    expect(result.song_recommendations[0].title).toBe("Weightless");
    expect(result.song_recommendations[0].artist).toBe("Marconi Union");
  });

  test("returns fail-safe on API error", async () => {
    mockCreate.mockRejectedValue(new Error("API Error"));

    const result = await gateway.analyzeCompatibility(
      MOCK_TRACK_INFO,
      MOCK_CALENDAR_EVENTS
    );

    expect(result.compatibility_score).toBe(100);
    expect(result.music_mood).toBe("unknown");
    expect(result.song_recommendations).toEqual([]);
  });

  test("prompt includes audio features when available", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        { message: { content: JSON.stringify(MOCK_AI_RESPONSE_MISMATCH) } },
      ],
    });

    await gateway.analyzeCompatibility(
      MOCK_TRACK_INFO_WITH_FEATURES,
      MOCK_CALENDAR_EVENTS
    );

    const prompt = mockCreate.mock.calls[0][0].messages[1].content;
    expect(prompt).toContain("valence=");
    expect(prompt).toContain("energy=");
  });

  test("prompt includes recent listening history when provided", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        { message: { content: JSON.stringify(MOCK_AI_RESPONSE_MISMATCH) } },
      ],
    });

    await gateway.analyzeCompatibility(
      MOCK_TRACK_INFO,
      MOCK_CALENDAR_EVENTS,
      MOCK_RECENT_TRACKS
    );

    const prompt = mockCreate.mock.calls[0][0].messages[1].content;
    expect(prompt).toContain("RECENT LISTENING HISTORY");
    expect(prompt).toContain("Starboy");
    expect(prompt).toContain("Dua Lipa");
  });

  test("prompt handles missing audio features", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        { message: { content: JSON.stringify(MOCK_AI_RESPONSE_MISMATCH) } },
      ],
    });

    await gateway.analyzeCompatibility(MOCK_TRACK_INFO, MOCK_CALENDAR_EVENTS);

    const prompt = mockCreate.mock.calls[0][0].messages[1].content;
    expect(prompt).toContain("infer mood from the track name");
  });
});
