import { LRUCache } from "lru-cache";

/**
 * Cache Service for Performance Optimization
 * Phase 1.2: In-memory caching with TTL and LRU eviction
 */
export class CacheService {
  private founderCache: LRUCache<string, any>;
  private ventureCache: LRUCache<string, any>;
  private dashboardCache: LRUCache<string, any>;
  private leaderboardCache: LRUCache<string, any>;

  constructor() {
    // Founder data cache - rarely changes, longer TTL
    this.founderCache = new LRUCache({
      max: 1000,              // Max 1000 founder records
      ttl: 1000 * 60 * 15,    // 15 minutes TTL
      allowStale: true,       // Serve stale data if available
      updateAgeOnGet: true,   // Reset TTL on access
    });

    // Venture data cache - moderate changes
    this.ventureCache = new LRUCache({
      max: 2000,              // Max 2000 venture records
      ttl: 1000 * 60 * 10,    // 10 minutes TTL
      allowStale: true,
      updateAgeOnGet: true,
    });

    // Dashboard data cache - frequent access, shorter TTL
    this.dashboardCache = new LRUCache({
      max: 500,               // Max 500 dashboard data sets
      ttl: 1000 * 60 * 5,     // 5 minutes TTL
      allowStale: false,      // Always fetch fresh data for dashboard
      updateAgeOnGet: true,
    });

    // Leaderboard cache - computed data, medium TTL
    this.leaderboardCache = new LRUCache({
      max: 50,                // Max 50 leaderboard variations
      ttl: 1000 * 60 * 20,    // 20 minutes TTL
      allowStale: true,
      updateAgeOnGet: false,  // Don't reset TTL on access
    });
  }

  /**
   * Founder data caching with automatic invalidation
   */
  async getFounder(founderId: string, fetchFn: () => Promise<any>): Promise<any> {
    const cacheKey = `founder_${founderId}`;
    let cached = this.founderCache.get(cacheKey);
    
    if (cached) {
      console.log(`🎯 Cache HIT: Founder ${founderId}`);
      return cached;
    }

    console.log(`📥 Cache MISS: Fetching founder ${founderId}`);
    const data = await fetchFn();
    
    if (data) {
      this.founderCache.set(cacheKey, data);
    }
    
    return data;
  }

  /**
   * Dashboard data caching with founder-specific keys
   */
  async getDashboardData(founderId: string, fetchFn: () => Promise<any>): Promise<any> {
    const cacheKey = `dashboard_${founderId}`;
    let cached = this.dashboardCache.get(cacheKey);
    
    if (cached) {
      console.log(`🎯 Cache HIT: Dashboard ${founderId}`);
      return cached;
    }

    console.log(`📥 Cache MISS: Fetching dashboard data ${founderId}`);
    const data = await fetchFn();
    
    if (data) {
      this.dashboardCache.set(cacheKey, data);
    }
    
    return data;
  }

  /**
   * Leaderboard caching with automatic refresh
   */
  async getLeaderboard(limit: number, fetchFn: () => Promise<any>): Promise<any> {
    const cacheKey = `leaderboard_${limit}`;
    let cached = this.leaderboardCache.get(cacheKey);
    
    if (cached) {
      console.log(`🎯 Cache HIT: Leaderboard top ${limit}`);
      return cached;
    }

    console.log(`📥 Cache MISS: Fetching leaderboard top ${limit}`);
    const data = await fetchFn();
    
    if (data) {
      this.leaderboardCache.set(cacheKey, data);
    }
    
    return data;
  }

  /**
   * Venture data caching with validation data
   */
  async getVentureWithEvaluation(ventureId: string, fetchFn: () => Promise<any>): Promise<any> {
    const cacheKey = `venture_eval_${ventureId}`;
    let cached = this.ventureCache.get(cacheKey);
    
    if (cached) {
      console.log(`🎯 Cache HIT: Venture ${ventureId}`);
      return cached;
    }

    console.log(`📥 Cache MISS: Fetching venture ${ventureId}`);
    const data = await fetchFn();
    
    if (data) {
      this.ventureCache.set(cacheKey, data);
    }
    
    return data;
  }

  /**
   * Cache invalidation for data updates
   */
  invalidateFounder(founderId: string): void {
    const founderKey = `founder_${founderId}`;
    const dashboardKey = `dashboard_${founderId}`;
    
    this.founderCache.delete(founderKey);
    this.dashboardCache.delete(dashboardKey);
    
    console.log(`🗑️ Invalidated cache for founder ${founderId}`);
  }

  invalidateVenture(ventureId: string, founderId?: string): void {
    const ventureKey = `venture_eval_${ventureId}`;
    this.ventureCache.delete(ventureKey);
    
    if (founderId) {
      this.invalidateFounder(founderId);
    }
    
    // Invalidate leaderboard since venture data changed
    this.leaderboardCache.clear();
    
    console.log(`🗑️ Invalidated cache for venture ${ventureId}`);
  }

  invalidateLeaderboard(): void {
    this.leaderboardCache.clear();
    console.log(`🗑️ Invalidated leaderboard cache`);
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.founderCache.clear();
    this.ventureCache.clear();
    this.dashboardCache.clear();
    this.leaderboardCache.clear();
    
    console.log(`🧹 Cleared all caches`);
  }

  /**
   * Cache statistics for monitoring
   */
  getStats() {
    return {
      founder: {
        size: this.founderCache.size,
        max: this.founderCache.max,
        calculatedSize: this.founderCache.calculatedSize,
        hitRate: this.founderCache.size > 0 ? 'Available' : 'Empty'
      },
      venture: {
        size: this.ventureCache.size,
        max: this.ventureCache.max,
        calculatedSize: this.ventureCache.calculatedSize,
        hitRate: this.ventureCache.size > 0 ? 'Available' : 'Empty'
      },
      dashboard: {
        size: this.dashboardCache.size,
        max: this.dashboardCache.max,
        calculatedSize: this.dashboardCache.calculatedSize,
        hitRate: this.dashboardCache.size > 0 ? 'Available' : 'Empty'
      },
      leaderboard: {
        size: this.leaderboardCache.size,
        max: this.leaderboardCache.max,
        calculatedSize: this.leaderboardCache.calculatedSize,
        hitRate: this.leaderboardCache.size > 0 ? 'Available' : 'Empty'
      }
    };
  }

  /**
   * Preload cache with frequently accessed data
   */
  async preloadCache(founderIds: string[]): Promise<void> {
    console.log(`🚀 Preloading cache for ${founderIds.length} founders`);
    
    // This would be called during startup to warm the cache
    // Implementation depends on having access to database service
  }
}

// Export singleton instance
export const cacheService = new CacheService();