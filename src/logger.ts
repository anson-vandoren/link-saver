import winston from 'winston';

const logger = winston.createLogger({
  level: 'info', // Set the minimum log level (e.g., error, warn, info, verbose, debug, silly)
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(), // Use JSON format
  ),
  transports: [
    new winston.transports.Console({
      level: 'debug', // Set the minimum log level for console transport
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

export default logger;
