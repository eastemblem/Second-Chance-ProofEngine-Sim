import { Request, Response, NextFunction } from "express";

// Performance tracking middleware
export function performanceTracker(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Add performance data to request
  (req as any).performance = {
    startTime,
    startMemory
  };

  // Track response time
  res.on('finish', () => {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const responseTime = endTime - startTime;
    
    // Log performance metrics
    console.log(`📊 Performance [${req.method} ${req.path}]:`, {
      responseTime: `${responseTime}ms`,
      statusCode: res.statusCode,
      memoryDelta: {
        rss: `${Math.round((endMemory.rss - startMemory.rss) / 1024 / 1024 * 100) / 100}MB`,
        heapUsed: `${Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024 * 100) / 100}MB`
      },
      timestamp: new Date().toISOString()
    });

    // Warn on slow requests
    if (responseTime > 1000) {
      console.warn(`⚠️ Slow request detected: ${req.method} ${req.path} took ${responseTime}ms`);
    }

    // Add performance headers (only if headers haven't been sent)
    if (!res.headersSent) {
      res.set('X-Response-Time', `${responseTime}ms`);
      res.set('X-Memory-Usage', `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`);
    }
  });

  next();
}

// Database query performance tracker
export function queryPerformanceTracker() {
  const queryTimes = new Map<string, number>();
  
  return {
    startQuery: (queryId: string) => {
      queryTimes.set(queryId, Date.now());
    },
    
    endQuery: (queryId: string, queryType: string) => {
      const startTime = queryTimes.get(queryId);
      if (startTime) {
        const duration = Date.now() - startTime;
        console.log(`🗄️ Query Performance [${queryType}]: ${duration}ms`);
        
        if (duration > 500) {
          console.warn(`⚠️ Slow query detected: ${queryType} took ${duration}ms`);
        }
        
        queryTimes.delete(queryId);
        return duration;
      }
      return 0;
    }
  };
}

// Request size limiter
export function requestSizeLimiter(maxSizeBytes = 1024 * 1024) { // 1MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        error: 'Request too large',
        statusCode: 413,
        maxSize: `${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
        receivedSize: `${Math.round(contentLength / 1024 / 1024)}MB`
      });
    }
    
    next();
  };
}

// Health check middleware
export function healthCheck(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/health' || req.path === '/api/health') {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.round(uptime)}s`,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
      },
      nodeVersion: process.version,
      platform: process.platform
    });
  }
  
  next();
}