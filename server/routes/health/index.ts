import express from "express";
import { asyncHandler } from "../../utils/error-handler";
import { db } from "../../db";
import { lruCacheService } from "../../services/lru-cache-service";

const router = express.Router();

// System health check endpoint
router.get("/", asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Test database connection
    const dbResult = await db.execute("SELECT 1 as health_check");
    const dbHealthy = dbResult.rows.length > 0;
    
    // Get cache statistics
    const cacheStats = lruCacheService.getStats();
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    
    // System uptime
    const uptime = process.uptime();
    
    const responseTime = Date.now() - startTime;
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.round(uptime)}s`,
      responseTime: `${responseTime}ms`,
      version: process.version,
      platform: process.platform,
      database: {
        status: dbHealthy ? 'connected' : 'disconnected',
        responseTime: `${responseTime}ms`
      },
      cache: {
        hitRate: cacheStats.founder.hitRate,
        totalEntries: Object.values(cacheStats).reduce((sum, cache) => sum + (cache.entries || 0), 0),
        memoryUsage: cacheStats
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      }
    };
    
    res.json(healthData);
    
  } catch (error) {
    console.error("Health check failed:", error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`
    });
  }
}));

// Database-specific health check
router.get("/database", asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Test database with more comprehensive checks
    const queries = [
      db.execute("SELECT 1 as simple_check"),
      db.execute("SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public'")
    ];
    
    const results = await Promise.all(queries);
    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      tableCount: results[1].rows[0]?.table_count || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  }
}));

// Cache health check
router.get("/cache", asyncHandler(async (req, res) => {
  try {
    const cacheStats = lruCacheService.getStats();
    
    res.json({
      status: 'healthy',
      cache: 'operational',
      statistics: cacheStats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      cache: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}));

export default router;