import { Router } from "express";
import { lruCacheService } from "../services/lru-cache-service";

const router = Router();

// Performance monitoring with LRU cache stats
router.get("/lru-stats", async (req, res) => {
  try {
    const stats = lruCacheService.getStats();
    const memory = lruCacheService.getMemoryInfo();
    
    res.json({
      cacheType: "hybrid-lru-kv",
      lruStats: stats,
      memoryUsage: memory,
      totalCaches: 4,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("LRU stats error:", error);
    res.status(500).json({ error: "Failed to get LRU cache stats" });
  }
});

// Test LRU cache performance
router.get("/lru-test", async (req, res) => {
  try {
    const testKey = "test-performance";
    const testData = { score: 85, timestamp: Date.now() };
    
    // Test set operation
    const setStart = Date.now();
    await lruCacheService.set("dashboard", testKey, testData);
    const setTime = Date.now() - setStart;
    
    // Test get operation (should be very fast from LRU)
    const getStart = Date.now();
    const result = await lruCacheService.get("dashboard", testKey);
    const getTime = Date.now() - getStart;
    
    res.json({
      success: true,
      operations: {
        set: `${setTime}ms`,
        get: `${getTime}ms`,
        dataRetrieved: !!result
      },
      cacheStats: lruCacheService.getStats(),
      message: `LRU get operation: ${getTime}ms (expected: <1ms for memory access)`
    });
  } catch (error) {
    console.error("LRU test error:", error);
    res.status(500).json({ error: "LRU cache test failed" });
  }
});

export default router;