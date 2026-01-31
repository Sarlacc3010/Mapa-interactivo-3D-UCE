const winston = require('winston');
const Transport = require('winston-transport');
const pool = require('../config/db');

/**
 * Custom Winston Transport to save logs into PostgreSQL
 */
class PostgresTransport extends Transport {
  constructor(opts) {
    super(opts);
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Extract data from the logger object
    const { level, message, ...meta } = info;
    
    // Map Winston metadata to database columns
    // We expect 'action' to be the main message
    const action = message;
    const details = meta.details ? JSON.stringify(meta.details) : null;
    const email = meta.user_email || null;
    const ip = meta.ip_address || null;
    const severity = level.toUpperCase(); // info -> INFO

    const query = `
      INSERT INTO system_logs (level, action, details, user_email, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `;

    // Execute insertion without blocking the main thread
    pool.query(query, [severity, action, details, email, ip])
      .then(() => callback())
      .catch((err) => {
        console.error('Error saving log to database:', err);
        callback();
      });
  }
}

/**
 * Logger Configuration
 * - Console: For development (colored)
 * - PostgresTransport: For database persistence
 */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'uce-map-backend' },
  transports: [
    // 1. Output to Console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // 2. Output to Database
    new PostgresTransport()
  ]
});

module.exports = { logger };