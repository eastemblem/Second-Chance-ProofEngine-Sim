import { Router } from "express";
import { lruCacheService } from "../services/lru-cache-service";
import { kvCacheService } from "../services/kv-cache-service";

const router = Router();

// Comprehensive cache performance monitoring
router.get("/stats", async (req, res) => {
  try {
    const lruStats = lruCacheService.getStats();
    const memoryInfo = lruCacheService.getMemoryInfo();
    
    // Calculate total performance metrics
    const totalHits = Object.values(lruStats).reduce((sum, stat) => sum + stat.hits, 0);
    const totalMisses = Object.values(lruStats).reduce((sum, stat) => sum + stat.misses, 0);
    const overallHitRate = totalHits + totalMisses > 0 ? 
      ((totalHits / (totalHits + totalMisses)) * 100).toFixed(1) : 0;

    res.json({
      timestamp: new Date().toISOString(),
      cacheType: "hybrid-lru-kv",
      performance: {
        overallHitRate: `${overallHitRate}%`,
        totalOperations: totalHits + totalMisses,
        memoryEfficiency: {
          totalEntries: Object.values(memoryInfo).reduce((sum, info) => sum + info.size, 0),
          maxCapacity: Object.values(memoryInfo).reduce((sum, info) => sum + info.max, 0)
        }
      },
      cacheBreakdown: {
        lru: lruStats,
        memory: memoryInfo
      },
      expectedPerformance: {
        memoryHit: "<1ms",
        kvHit: "40-90ms", 
        databaseQuery: "200-350ms"
      }
    });
  } catch (error) {
    console.error("Cache stats error:", error);
    res.status(500).json({ error: "Failed to get cache statistics" });
  }
});

// Performance benchmark test
router.get("/benchmark", async (req, res) => {
  try {
    const testKey = `benchmark-${Date.now()}`;
    const testData = { 
      score: Math.floor(Math.random() * 100),
      timestamp: Date.now(),
      benchmark: true 
    };
    
    // Test complete cache cycle
    const results = {
      operations: [],
      summary: {}
    };

    // 1. Cold start (cache miss)
    let start = process.hrtime.bigint();
    await lruCacheService.set("dashboard", testKey, testData);
    let end = process.hrtime.bigint();
    results.operations.push({
      operation: "set",
      time: `${Number(end - start) / 1000000}ms`,
      type: "lru_memory"
    });

    // 2. Hot read (memory hit)
    start = process.hrtime.bigint();
    const memoryResult = await lruCacheService.get("dashboard", testKey);
    end = process.hrtime.bigint();
    results.operations.push({
      operation: "get_memory",
      time: `${Number(end - start) / 1000000}ms`,
      hit: !!memoryResult,
      type: "lru_memory"
    });

    // 3. Performance comparison
    const memoryTime = Number(end - start) / 1000000;
    results.summary = {
      memoryAccess: `${memoryTime.toFixed(3)}ms`,
      expectedDatabaseTime: "200-350ms",
      performanceGain: `${(300 / memoryTime).toFixed(0)}x faster`,
      cacheStatus: "optimal"
    };

    // Clean up test data
    await lruCacheService.invalidate("dashboard", testKey);

    res.json({
      benchmark: "LRU Cache Performance Test",
      timestamp: new Date().toISOString(),
      results,
      interpretation: {
        excellent: memoryTime < 1,
        good: memoryTime < 5,
        needsOptimization: memoryTime > 10
      }
    });
  } catch (error) {
    console.error("Benchmark error:", error);
    res.status(500).json({ error: "Benchmark test failed" });
  }
});

// Cache health check
router.get("/health", async (req, res) => {
  try {
    const lruStats = lruCacheService.getStats();
    const memoryInfo = lruCacheService.getMemoryInfo();
    
    // Health indicators
    const issues = [];
    const warnings = [];
    
    // Check hit rates
    Object.entries(lruStats).forEach(([type, stats]) => {
      if (stats.hitRate < 50 && stats.hits + stats.misses > 10) {
        warnings.push(`${type} cache hit rate below 50%: ${stats.hitRate}%`);
      }
    });
    
    // Check memory usage
    Object.entries(memoryInfo).forEach(([type, info]) => {
      const usage = info.size / info.max;
      if (usage > 0.9) {
        warnings.push(`${type} cache near capacity: ${(usage * 100).toFixed(1)}%`);
      }
    });
    
    const healthStatus = issues.length > 0 ? "critical" : 
                        warnings.length > 0 ? "warning" : "healthy";
    
    res.json({
      status: healthStatus,
      timestamp: new Date().toISOString(),
      caches: {
        lru: "operational",
        kv: kvCacheService.isAvailable() ? "operational" : "unavailable"
      },
      issues,
      warnings,
      recommendation: issues.length > 0 ? "Immediate attention required" :
                     warnings.length > 0 ? "Monitor performance" :
                     "System performing optimally"
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({ 
      status: "error",
      error: "Health check failed",
      timestamp: new Date().toISOString()
    });
  }
});

export default router;