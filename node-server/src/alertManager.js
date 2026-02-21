// AlertManager class that evaluates the AI response against a user-defined threshold and 
// calendar context to determine if an alert should be emitted. It also includes deduplication 
// logic to prevent spamming alerts for the same underlying issue, and categorizes alerts by 
// severity based on the compatibility score.

class AlertManager {
  constructor(threshold = 60) {
    this.threshold = threshold;
    this.lastAlert = null;
  }

  evaluate(aiResponse, calendarContext) {
    const score = aiResponse.compatibility_score;

    if (score < this.threshold && calendarContext && calendarContext.length > 0) {
      const alert = {
        type: "VIBE_MISMATCH",
        severity: AlertManager.calculateSeverity(score),
        compatibility_score: score,
        music_mood: aiResponse.music_mood || "unknown",
        task_intent: aiResponse.task_intent || "unknown",
        transition_suggestion: aiResponse.transition_suggestion || null,
        song_recommendations: aiResponse.song_recommendations || [],
        next_event: calendarContext[0],
        timestamp: new Date().toISOString(),
      };

      // Deduplicate: only send if different from last alert
      const alertKey = `${score}:${alert.next_event.summary || ""}`;
      if (alertKey !== this.lastAlert) {
        this.lastAlert = alertKey;
        return alert;
      } else {
        return null; // Duplicate, suppress
      }
    } else {
      this.lastAlert = null;
      return {
        type: "SYNCED",
        compatibility_score: score,
        music_mood: aiResponse.music_mood || "unknown",
        task_intent: aiResponse.task_intent || "unknown",
        song_recommendations: aiResponse.song_recommendations || [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  static calculateSeverity(score) {
    if (score < 30) return "HIGH";
    if (score < 50) return "MEDIUM";
    return "LOW";
  }
}

module.exports = AlertManager;
