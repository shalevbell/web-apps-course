const winston = require('winston');
const path = require('path');

// Create logs directory path
const logsDir = path.join(__dirname, '../../logs');

// Define log format
const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
});

// Create logger instance
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // All logs
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'info'
    }),

    // Error logs only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error'
    })
  ]
});

module.exports = logger;
