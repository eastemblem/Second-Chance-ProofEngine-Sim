import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const stackStr = stack ? `\n${stack}` : '';
  return `${timestamp} [${level}]: ${message}${metaStr}${stackStr}`;
});

// Custom format for file output (no colors)
const fileFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const stackStr = stack ? `\n${stack}` : '';
  return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}${stackStr}`;
});

// Log levels configuration
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Configure winston logger
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'second-chance-api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      ),
    }),
    
    // Daily rotating file for errors
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        fileFormat
      ),
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    
    // Daily rotating file for all logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        fileFormat
      ),
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
  ],
});

// Enhanced logger interface with structured logging methods
export class Logger {
  private winston: winston.Logger;

  constructor() {
    this.winston = logger;
  }

  // System startup and initialization
  system(message: string, meta?: any) {
    this.winston.info(`🚀 ${message}`, { category: 'system', ...meta });
  }

  // Database operations
  database(message: string, meta?: any) {
    this.winston.info(`🗄️ ${message}`, { category: 'database', ...meta });
  }

  // API requests and responses
  api(message: string, meta?: any) {
    this.winston.http(`📡 ${message}`, { category: 'api', ...meta });
  }

  // Authentication and security
  auth(message: string, meta?: any) {
    this.winston.info(`🔐 ${message}`, { category: 'auth', ...meta });
  }

  // Performance monitoring
  performance(message: string, meta?: any) {
    this.winston.info(`📊 ${message}`, { category: 'performance', ...meta });
  }

  // Cache operations
  cache(message: string, meta?: any) {
    this.winston.debug(`🔄 ${message}`, { category: 'cache', ...meta });
  }

  // Business logic operations
  business(message: string, meta?: any) {
    this.winston.info(`💼 ${message}`, { category: 'business', ...meta });
  }

  // File operations
  file(message: string, meta?: any) {
    this.winston.info(`📁 ${message}`, { category: 'file', ...meta });
  }

  // Email operations
  email(message: string, meta?: any) {
    this.winston.info(`📧 ${message}`, { category: 'email', ...meta });
  }

  // External API calls
  external(message: string, meta?: any) {
    this.winston.info(`🌐 ${message}`, { category: 'external', ...meta });
  }

  // Standard log levels
  error(message: string, error?: Error | any, meta?: any) {
    const errorMeta = error instanceof Error ? { 
      stack: error.stack, 
      name: error.name,
      message: error.message,
      ...meta 
    } : { error, ...meta };
    
    this.winston.error(`❌ ${message}`, errorMeta);
  }

  warn(message: string, meta?: any) {
    this.winston.warn(`⚠️ ${message}`, meta);
  }

  info(message: string, meta?: any) {
    this.winston.info(`ℹ️ ${message}`, meta);
  }

  debug(message: string, meta?: any) {
    this.winston.debug(`🔍 ${message}`, meta);
  }

  // HTTP request logging
  http(message: string, meta?: any) {
    this.winston.http(`🌐 ${message}`, meta);
  }
}

// Export singleton instance
export const appLogger = new Logger();

// Export winston instance for compatibility
export default logger;