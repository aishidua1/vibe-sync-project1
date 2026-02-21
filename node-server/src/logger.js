// Logger setup using Winston to log events with timestamps and levels, 
// outputting to both console and a file named vibe_sync.log.
// same idea as utils.py (logging output to the console)

const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ level, message, timestamp }) =>
        `[${level.toUpperCase()}] ${timestamp} - ${message}`
    )
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "vibe_sync.log" }),
  ],
});

module.exports = logger;
