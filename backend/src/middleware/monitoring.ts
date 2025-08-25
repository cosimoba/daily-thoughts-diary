import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import os from 'os';
import { logInfo, logWarning, logError } from '../utils/logger';

const prisma = new PrismaClient();

interface SystemMetrics {
  cpu: {
    usage: number;
    count: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  uptime: number;
  loadAverage: number[];
}

interface ApplicationMetrics {
  requests: {
    total: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
    averageResponseTime: number;
  };
  errors: {
    total: number;
    by4xx: number;
    by5xx: number;
  };
  database: {
    connectionPoolSize?: number;
    activeQueries?: number;
  };
  cache?: {
    hits: number;
    misses: number;
    size: number;
  };
}

// Store for request metrics
class MetricsStore {
  private requests: Map<string, any> = new Map();
  private responseTimes: number[] = [];
  private maxResponseTimes = 1000; // Keep last 1000 response times

  constructor() {
    // Reset daily metrics
    setInterval(() => {
      this.resetDailyMetrics();
    }, 24 * 60 * 60 * 1000);
  }

  recordRequest(method: string, path: string, statusCode: number, responseTime: number) {
    const key = `${method}:${statusCode}`;
    const current = this.requests.get(key) || 0;
    this.requests.set(key, current + 1);

    // Record response time
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes.shift();
    }

    // Log slow requests
    if (responseTime > 1000) {
      logWarning('Slow request detected', {
        method,
        path,
        statusCode,
        responseTime: `${responseTime}ms`
      });
    }
  }

  getMetrics(): ApplicationMetrics {
    const requests: any = {
      total: 0,
      byMethod: {},
      byStatus: {},
      averageResponseTime: 0
    };

    const errors = {
      total: 0,
      by4xx: 0,
      by5xx: 0
    };

    // Process request data
    this.requests.forEach((count, key) => {
      const [method, status] = key.split(':');
      
      requests.total += count;
      
      // By method
      if (!requests.byMethod[method]) {
        requests.byMethod[method] = 0;
      }
      requests.byMethod[method] += count;

      // By status
      const statusGroup = `${status[0]}xx`;
      if (!requests.byStatus[statusGroup]) {
        requests.byStatus[statusGroup] = 0;
      }
      requests.byStatus[statusGroup] += count;

      // Count errors
      if (status.startsWith('4')) {
        errors.by4xx += count;
        errors.total += count;
      } else if (status.startsWith('5')) {
        errors.by5xx += count;
        errors.total += count;
      }
    });

    // Calculate average response time
    if (this.responseTimes.length > 0) {
      const sum = this.responseTimes.reduce((a, b) => a + b, 0);
      requests.averageResponseTime = Math.round(sum / this.responseTimes.length);
    }

    return {
      requests,
      errors,
      database: {
        // These would be populated from actual database metrics
        connectionPoolSize: undefined,
        activeQueries: undefined
      }
    };
  }

  resetDailyMetrics() {
    logInfo('Resetting daily metrics');
    this.requests.clear();
    this.responseTimes = [];
  }
}

const metricsStore = new MetricsStore();

// Middleware to track metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Track response
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    metricsStore.recordRequest(
      req.method,
      req.path,
      res.statusCode,
      responseTime
    );
  });

  next();
};

// Get system metrics
export const getSystemMetrics = (): SystemMetrics => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    cpu: {
      usage: os.loadavg()[0] * 100 / os.cpus().length,
      count: os.cpus().length
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      percentage: (usedMem / totalMem) * 100
    },
    uptime: os.uptime(),
    loadAverage: os.loadavg()
  };
};

// Get application metrics
export const getApplicationMetrics = (): ApplicationMetrics => {
  return metricsStore.getMetrics();
};

// Health check with detailed metrics
export const detailedHealthCheck = async (req: Request, res: Response) => {
  try {
    // Check database
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStartTime;

    // Get metrics
    const systemMetrics = getSystemMetrics();
    const appMetrics = getApplicationMetrics();

    // Determine health status
    let status = 'healthy';
    const warnings: string[] = [];

    // Check system resources
    if (systemMetrics.memory.percentage > 90) {
      warnings.push('High memory usage');
      status = 'degraded';
    }

    if (systemMetrics.cpu.usage > 80) {
      warnings.push('High CPU usage');
      status = 'degraded';
    }

    if (dbResponseTime > 100) {
      warnings.push('Slow database response');
      status = 'degraded';
    }

    // Check error rate
    const errorRate = appMetrics.requests.total > 0
      ? (appMetrics.errors.total / appMetrics.requests.total) * 100
      : 0;

    if (errorRate > 5) {
      warnings.push(`High error rate: ${errorRate.toFixed(2)}%`);
      status = 'degraded';
    }

    res.status(status === 'healthy' ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      warnings,
      metrics: {
        system: systemMetrics,
        application: appMetrics,
        database: {
          responseTime: `${dbResponseTime}ms`,
          status: 'connected'
        }
      },
      environment: {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    logError(error as Error, { context: 'health-check' });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: process.env.NODE_ENV === 'development' 
        ? (error as Error).message 
        : undefined
    });
  }
};

// Performance monitoring endpoint
export const performanceMetrics = async (req: Request, res: Response) => {
  try {
    // Get database statistics
    const [tableStats, indexStats] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `,
      prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as scans,
          idx_tup_read as tuples_read
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
        LIMIT 10
      `
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      system: getSystemMetrics(),
      application: getApplicationMetrics(),
      database: {
        tables: tableStats,
        indexes: indexStats
      }
    });
  } catch (error) {
    logError(error as Error, { context: 'performance-metrics' });
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
};

// Request logging middleware with detailed info
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // Add request ID to request object
  (req as any).requestId = requestId;

  // Log request
  logInfo('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as any).user?.id
    };

    if (res.statusCode >= 400) {
      logWarning('Request failed', logData);
    } else {
      logInfo('Request completed', logData);
    }
  });

  next();
};

// Alert on critical metrics
export const alertOnCriticalMetrics = () => {
  setInterval(() => {
    const metrics = getSystemMetrics();
    
    if (metrics.memory.percentage > 95) {
      logError(new Error('Critical: Memory usage above 95%'), {
        memory: metrics.memory
      });
    }

    if (metrics.cpu.usage > 90) {
      logError(new Error('Critical: CPU usage above 90%'), {
        cpu: metrics.cpu
      });
    }
  }, 60000); // Check every minute
};

export default {
  metricsMiddleware,
  requestLogger,
  detailedHealthCheck,
  performanceMetrics,
  getSystemMetrics,
  getApplicationMetrics,
  alertOnCriticalMetrics
};