/**
 * Server-side performance tracking utilities
 * Phase 1.2: Backend performance monitoring and optimization
 */
import { appLogger } from './logger';

interface RequestTiming {
  path: string;
  method: string;
  duration: number;
  timestamp: Date;
  cached?: boolean;
}

class PerformanceTracker {
  private requestTimings: RequestTiming[] = [];
  private maxTimings = 1000; // Keep last 1000 requests

  /**
   * Track request performance
   */
  trackRequest(path: string, method: string, duration: number, cached: boolean = false): void {
    const timing: RequestTiming = {
      path,
      method,
      duration,
      timestamp: new Date(),
      cached
    };

    this.requestTimings.push(timing);

    // Keep only recent timings
    if (this.requestTimings.length > this.maxTimings) {
      this.requestTimings = this.requestTimings.slice(-this.maxTimings);
    }

    // Log slow requests
    if (duration > 1000 && !cached) {
      appLogger.performance(`Slow request: ${method} ${path} took ${duration}ms`);
    } else if (duration < 50 && cached) {
      appLogger.performance(`Fast cached request: ${method} ${path} took ${duration}ms`);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): object {
    const recentTimings = this.requestTimings.filter(
      t => t.timestamp > new Date(Date.now() - 60000) // Last 1 minute
    );

    const cachedRequests = recentTimings.filter(t => t.cached);
    const nonCachedRequests = recentTimings.filter(t => !t.cached);

    return {
      total: recentTimings.length,
      cached: cachedRequests.length,
      nonCached: nonCachedRequests.length,
      cacheHitRate: recentTimings.length > 0 ? (cachedRequests.length / recentTimings.length * 100).toFixed(1) + '%' : '0%',
      averageResponseTime: recentTimings.length > 0 ? 
        Math.round(recentTimings.reduce((sum, t) => sum + t.duration, 0) / recentTimings.length) : 0,
      slowRequests: recentTimings.filter(t => t.duration > 500).length,
      fastRequests: recentTimings.filter(t => t.duration < 100).length
    };
  }

  /**
   * Get slowest endpoints
   */
  getSlowestEndpoints(limit: number = 10): Array<{path: string, averageDuration: number, callCount: number}> {
    const pathStats = new Map<string, {totalDuration: number, count: number}>();

    this.requestTimings.forEach(timing => {
      const key = `${timing.method} ${timing.path}`;
      const existing = pathStats.get(key) || { totalDuration: 0, count: 0 };
      pathStats.set(key, {
        totalDuration: existing.totalDuration + timing.duration,
        count: existing.count + 1
      });
    });

    return Array.from(pathStats.entries())
      .map(([path, stats]) => ({
        path,
        averageDuration: Math.round(stats.totalDuration / stats.count),
        callCount: stats.count
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, limit);
  }

  /**
   * Clear old timings
   */
  cleanup(): void {
    const cutoff = new Date(Date.now() - 3600000); // Keep last hour
    this.requestTimings = this.requestTimings.filter(t => t.timestamp > cutoff);
  }
}

export const performanceTracker = new PerformanceTracker();

/**
 * Express middleware for automatic performance tracking
 */
export function performanceMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const cached = res.get('X-Cache-Status') === 'HIT';
    performanceTracker.trackRequest(req.path, req.method, duration, cached);
  });
  
  next();
}