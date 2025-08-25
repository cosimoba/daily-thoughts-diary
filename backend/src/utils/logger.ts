import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about the colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Define file format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.uncolorize(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
  })
);

// Define transports
const transports = [];

// Console transport
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format,
    })
  );
}

// File transports with rotation
const logDir = process.env.LOG_DIR || 'logs';

// Error log file
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true,
  })
);

// Combined log file
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
});

// Create HTTP logger middleware
export const httpLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    })
  ],
});

// Custom logging functions
export const logError = (error: Error, context?: any) => {
  logger.error(error.message, {
    stack: error.stack,
    context,
  });
};

export const logWarning = (message: string, context?: any) => {
  logger.warn(message, context);
};

export const logInfo = (message: string, context?: any) => {
  logger.info(message, context);
};

export const logDebug = (message: string, context?: any) => {
  logger.debug(message, context);
};

export const logHttp = (message: string, context?: any) => {
  httpLogger.http(message, context);
};

// Performance logging
export class PerformanceLogger {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
    logDebug(`Starting operation: ${operation}`);
  }

  end(metadata?: any) {
    const duration = Date.now() - this.startTime;
    logInfo(`Operation completed: ${this.operation}`, {
      duration: `${duration}ms`,
      ...metadata
    });
  }
}

// Database query logging
export const logQuery = (query: string, params?: any, duration?: number) => {
  if (process.env.LOG_QUERIES === 'true') {
    logDebug('Database query executed', {
      query,
      params,
      duration: duration ? `${duration}ms` : undefined
    });
  }
};

// API request/response logging
export const logApiRequest = (req: any) => {
  logHttp('API Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });
};

export const logApiResponse = (req: any, res: any, duration: number) => {
  logHttp('API Response', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userId: req.user?.id
  });
};

// Security event logging
export const logSecurityEvent = (event: string, details: any) => {
  logger.warn(`SECURITY: ${event}`, details);
};

// Audit logging
export const logAuditEvent = (action: string, userId: string, details: any) => {
  logger.info(`AUDIT: ${action}`, {
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

export default logger;