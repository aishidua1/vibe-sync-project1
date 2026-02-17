const AlertManager = require("../src/alertManager");

const MOCK_SONG_RECOMMENDATIONS = [
  { title: "Weightless", artist: "Marconi Union", reason: "Proven to reduce anxiety" },
  { title: "Intro", artist: "The xx", reason: "Calm instrumental" },
  { title: "Midnight City", artist: "M83", reason: "Atmospheric synths" },
];

const MOCK_AI_RESPONSE_MISMATCH = {
  music_mood: "energizing party music",
  task_intent: "deep-focus academic work",
  compatibility_score: 25,
  transition_suggestion: "Switch to lo-fi or ambient music for better focus",
  song_recommendations: MOCK_SONG_RECOMMENDATIONS,
};

const MOCK_AI_RESPONSE_SYNCED = {
  music_mood: "calm, focused instrumental",
  task_intent: "deep-focus academic work",
  compatibility_score: 85,
  transition_suggestion: null,
  song_recommendations: MOCK_SONG_RECOMMENDATIONS,
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

describe("AlertManager", () => {
  describe("calculateSeverity", () => {
    test("returns HIGH for scores below 30", () => {
      expect(AlertManager.calculateSeverity(25)).toBe("HIGH");
      expect(AlertManager.calculateSeverity(0)).toBe("HIGH");
      expect(AlertManager.calculateSeverity(29)).toBe("HIGH");
    });

    test("returns MEDIUM for scores 30-49", () => {
      expect(AlertManager.calculateSeverity(30)).toBe("MEDIUM");
      expect(AlertManager.calculateSeverity(45)).toBe("MEDIUM");
      expect(AlertManager.calculateSeverity(49)).toBe("MEDIUM");
    });

    test("returns LOW for scores 50+", () => {
      expect(AlertManager.calculateSeverity(50)).toBe("LOW");
      expect(AlertManager.calculateSeverity(55)).toBe("LOW");
      expect(AlertManager.calculateSeverity(59)).toBe("LOW");
    });
  });

  describe("evaluate", () => {
    test("returns VIBE_MISMATCH for low scores with events", () => {
      const manager = new AlertManager(60);
      const result = manager.evaluate(
        MOCK_AI_RESPONSE_MISMATCH,
        MOCK_CALENDAR_EVENTS
      );

      expect(result).not.toBeNull();
      expect(result.type).toBe("VIBE_MISMATCH");
      expect(result.severity).toBe("HIGH");
      expect(result.compatibility_score).toBe(25);
      expect(result.transition_suggestion).not.toBeNull();
      expect(result.song_recommendations).toEqual(MOCK_SONG_RECOMMENDATIONS);
    });

    test("returns SYNCED for high scores", () => {
      const manager = new AlertManager(60);
      const result = manager.evaluate(
        MOCK_AI_RESPONSE_SYNCED,
        MOCK_CALENDAR_EVENTS
      );

      expect(result).not.toBeNull();
      expect(result.type).toBe("SYNCED");
      expect(result.compatibility_score).toBe(85);
      expect(result.song_recommendations).toEqual(MOCK_SONG_RECOMMENDATIONS);
    });

    test("deduplicates identical alerts", () => {
      const manager = new AlertManager(60);

      // First alert should go through
      const result1 = manager.evaluate(
        MOCK_AI_RESPONSE_MISMATCH,
        MOCK_CALENDAR_EVENTS
      );
      expect(result1).not.toBeNull();
      expect(result1.type).toBe("VIBE_MISMATCH");

      // Same alert should be suppressed
      const result2 = manager.evaluate(
        MOCK_AI_RESPONSE_MISMATCH,
        MOCK_CALENDAR_EVENTS
      );
      expect(result2).toBeNull();

      // Different score should go through
      const different = { ...MOCK_AI_RESPONSE_MISMATCH, compatibility_score: 40 };
      const result3 = manager.evaluate(different, MOCK_CALENDAR_EVENTS);
      expect(result3).not.toBeNull();
    });

    test("returns SYNCED when no events (low score)", () => {
      const manager = new AlertManager(60);
      const result = manager.evaluate(MOCK_AI_RESPONSE_MISMATCH, []);

      expect(result.type).toBe("SYNCED");
    });
  });
});
