// Node.js server that receives vibe data from the Python client, processes it with an AI gateway, 
// evaluates it against user-defined thresholds, and emits updates to connected frontends via Socket.io. 
// It also caches the latest state for new clients and logs all events for debugging and monitoring purposes.

require("dotenv").config();
const { createServer } = require("http");
const { Server } = require("socket.io");
const AIGateway = require("./aiGateway");
const AlertManager = require("./alertManager");
const logger = require("./logger");

const PORT = process.env.PORT || 3001;
const THRESHOLD = parseInt(process.env.COMPATIBILITY_THRESHOLD || "60", 10);

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const ai = new AIGateway();
const alerts = new AlertManager(THRESHOLD);

// Cache the latest state so new frontends get it immediately
let currentState = { type: "IDLE", message: "System starting..." };

io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Send last known state on connect
  socket.emit("vibe_update", currentState);

  socket.on("vibe_idle", () => {
    logger.info("Received vibe_idle from Python client");
    currentState = {
      type: "IDLE",
      message: "No music currently playing",
    };
    io.emit("vibe_update", currentState);
  });

  socket.on("vibe_context", async (data) => {
    const { track, events, recent_tracks } = data;
    logger.info(`Received vibe_context: ${track.name} by ${track.artist}`);

    try {
      // If no events, nothing to compare — auto-synced
      if (!events || events.length === 0) {
        currentState = {
          type: "SYNCED",
          compatibility_score: 100,
          music_mood: "N/A",
          task_intent: "No upcoming events",
          now_playing: track,
          timestamp: new Date().toISOString(),
        };
        io.emit("vibe_update", currentState);
        return;
      }

      // Analyze with AI
      const aiResponse = await ai.analyzeCompatibility(track, events, recent_tracks);

      // Evaluate alert
      const result = alerts.evaluate(aiResponse, events);

      if (result !== null) {
        result.now_playing = track;
        currentState = result;
        io.emit("vibe_update", currentState);
      }
    } catch (e) {
      logger.error(`Processing error: ${e.message}`);
    }
  });

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  logger.info(`Socket.io server listening on port ${PORT}`);
});
