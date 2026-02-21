// AIGateway class that interfaces with the OpenAI API to analyze the compatibility between 
// the user's current music and their upcoming schedule. It constructs a detailed prompt based 
// on the music context, calendar events, and recent listening history, and expects a structured 
// JSON response with mood, intent, compatibility score, transition suggestions, and song recommendations. 
// It also includes error handling to ensure robustness in case of API failures or unexpected responses.

const OpenAI = require("openai");
const logger = require("./logger");

class AIGateway {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.DUKE_AI_GATEWAY_KEY,
      baseURL: process.env.DUKE_AI_GATEWAY_URL,
    });
    this.model = process.env.DUKE_AI_MODEL || "GPT 4.1";
  }

  async analyzeCompatibility(musicContext, calendarContext, recentTracks = []) {
    const prompt = this._buildPrompt(musicContext, calendarContext, recentTracks);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a context-switching assistant that analyzes " +
              "compatibility between a user's current music and their " +
              "upcoming schedule. Respond ONLY in valid JSON format.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });

      let content = response.choices[0].message.content.trim();

      // Strip markdown code fences if present
      if (content.startsWith("```")) {
        content = content.split("\n").slice(1).join("\n");
        content = content.split("```").slice(0, -1).join("```");
      }

      const result = JSON.parse(content);

      // Validate required fields
      const required = ["music_mood", "task_intent", "compatibility_score"];
      for (const key of required) {
        if (!(key in result)) {
          throw new Error(`Missing required field: ${key}`);
        }
      }

      // Ensure score is an integer in 0-100
      result.compatibility_score = Math.max(
        0,
        Math.min(100, Math.round(Number(result.compatibility_score)))
      );

      result.song_recommendations = result.song_recommendations || [];

      return result;
    } catch (e) {
      logger.error(`AI Gateway error: ${e.message}`);
      // Fail-safe: assume synced to avoid false alarms
      return {
        music_mood: "unknown",
        task_intent: "unknown",
        compatibility_score: 100,
        transition_suggestion: null,
        song_recommendations: [],
      };
    }
  }

  _buildPrompt(music, calendar, recentTracks = []) {
    let musicSection = `Track: "${music.name}" by ${music.artist}\n`;
    musicSection += `Album: ${music.album || "Unknown"}\n`;

    if (music.artist_genres && music.artist_genres.length > 0) {
      musicSection += `Artist genres: ${music.artist_genres.join(", ")}\n`;
    }

    if (music.audio_features) {
      const af = music.audio_features;
      musicSection +=
        `Audio features: valence=${af.valence.toFixed(2)}, ` +
        `energy=${af.energy.toFixed(2)}, tempo=${Math.round(af.tempo)} BPM, ` +
        `danceability=${af.danceability.toFixed(2)}\n`;
    } else {
      musicSection +=
        "(No numerical audio features available. " +
        "Please infer mood from the track name, artist, and genres.)\n";
    }

    let calendarSection;
    if (!calendar || calendar.length === 0) {
      calendarSection = "No upcoming events in the next 2 hours.";
    } else {
      const lines = calendar.map((evt) => {
        let line = `- ${evt.summary} (in ${evt.minutes_until} minutes)`;
        if (evt.description) {
          line += `: ${evt.description}`;
        }
        return line;
      });
      calendarSection = lines.join("\n");
    }

    let recentSection = "";
    if (recentTracks && recentTracks.length > 0) {
      const lines = recentTracks.map((t) => {
        let line = `- "${t.name}" by ${t.artist}`;
        if (t.genres && t.genres.length > 0) {
          line += ` [${t.genres.join(", ")}]`;
        }
        return line;
      });
      recentSection = `\n\nRECENT LISTENING HISTORY:\n${lines.join("\n")}`;
    }

    return `CURRENT MUSIC:
${musicSection}

UPCOMING SCHEDULE:
${calendarSection}${recentSection}

TASK:
1. Assess the MOOD of the music (e.g., energizing, calming, melancholic, focus-inducing, party)
2. Assess the INTENT of the next calendar event (e.g., deep-focus, collaborative, creative, administrative, relaxation)
3. Rate compatibility on a scale of 0-100 (100 = perfect match)
4. If score < 60, suggest a specific transition action
5. Recommend 3 songs the user likely hasn't heard that match the upcoming task's intent, based on their taste from the listening history above. Suggest new discoveries, not songs they already listen to.

Respond in this exact JSON format:
{
    "music_mood": "string description",
    "task_intent": "string description",
    "compatibility_score": number_0_to_100,
    "transition_suggestion": "string or null",
    "song_recommendations": [
        { "title": "song name", "artist": "artist name", "reason": "why this fits" }
    ]
}`;
  }
}

module.exports = AIGateway;
