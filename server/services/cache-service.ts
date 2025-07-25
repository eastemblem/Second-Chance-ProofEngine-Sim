import { kvCacheService } from "./kv-cache-service";

/**
 * Cache Service for Performance Optimization
 * Phase 1.3: Replit KV store only caching
 */
export class CacheService {
  constructor() {
    console.log('🔄 CacheService initialized with Replit KV store only');
  }

  /**
   * Founder data caching with KV store only
   */
  async getFounder(founderId: string, fetchFn: () => Promise<any>): Promise<any> {
    const cacheKey = `founder_${founderId}`;
    
    // Try KV store
    if (kvCacheService.isAvailable()) {
      const cached = await kvCacheService.get(cacheKey, { namespace: 'founder', ttl: 900 });
      if (cached) {
        console.log(`🎯 KV Cache HIT: Founder ${founderId}`);
        return cached;
      }
    }

    console.log(`📥 Cache MISS: Fetching founder ${founderId}`);
    const data = await fetchFn();
    
    if (data && kvCacheService.isAvailable()) {
      await kvCacheService.set(cacheKey, data, { namespace: 'founder', ttl: 900 });
      console.log(`💾 KV Cache SET: ${cacheKey} (TTL: 900s)`);
    }
    
    return data;
  }

  /**
   * Dashboard data caching with KV store only
   */
  async getDashboardData(founderId: string, fetchFn: () => Promise<any>): Promise<any> {
    const cacheKey = `dashboard_${founderId}`;
    
    // Try KV store
    if (kvCacheService.isAvailable()) {
      const cached = await kvCacheService.get(cacheKey, { namespace: 'dashboard', ttl: 300 });
      if (cached) {
        console.log(`🎯 KV Cache HIT: Dashboard ${founderId}`);
        return cached;
      }
    }

    console.log(`📥 Cache MISS: Fetching dashboard data ${founderId}`);
    const data = await fetchFn();
    
    if (data && kvCacheService.isAvailable()) {
      await kvCacheService.set(cacheKey, data, { namespace: 'dashboard', ttl: 300 });
      console.log(`💾 KV Cache SET: ${cacheKey} (TTL: 300s)`);
    }
    
    return data;
  }

  /**
   * Venture data caching with KV store only
   */
  async getVenture(ventureId: string, fetchFn: () => Promise<any>): Promise<any> {
    const cacheKey = `venture_${ventureId}`;
    
    // Try KV store
    if (kvCacheService.isAvailable()) {
      const cached = await kvCacheService.get(cacheKey, { namespace: 'venture', ttl: 600 });
      if (cached) {
        console.log(`🎯 KV Cache HIT: Venture ${ventureId}`);
        return cached;
      }
    }

    console.log(`📥 Cache MISS: Fetching venture ${ventureId}`);
    const data = await fetchFn();
    
    if (data && kvCacheService.isAvailable()) {
      await kvCacheService.set(cacheKey, data, { namespace: 'venture', ttl: 600 });
      console.log(`💾 KV Cache SET: ${cacheKey} (TTL: 600s)`);
    }
    
    return data;
  }

  /**
   * Leaderboard data caching with KV store only
   */
  async getLeaderboard(cacheKey: string, fetchFn: () => Promise<any>): Promise<any> {
    // Try KV store
    if (kvCacheService.isAvailable()) {
      const cached = await kvCacheService.get(cacheKey, { namespace: 'leaderboard', ttl: 1200 });
      if (cached) {
        console.log(`🎯 KV Cache HIT: Leaderboard ${cacheKey}`);
        return cached;
      }
    }

    console.log(`📥 Cache MISS: Fetching leaderboard ${cacheKey}`);
    const data = await fetchFn();
    
    if (data && kvCacheService.isAvailable()) {
      await kvCacheService.set(cacheKey, data, { namespace: 'leaderboard', ttl: 1200 });
      console.log(`💾 KV Cache SET: ${cacheKey} (TTL: 1200s)`);
    }
    
    return data;
  }

  /**
   * Cache invalidation methods
   */
  invalidateFounder(founderId: string): void {
    console.log(`🗑️ Invalidating founder cache: ${founderId}`);
    // No memory cache to invalidate, KV store handles TTL
  }

  invalidateDashboard(founderId: string): void {
    console.log(`🗑️ Invalidating dashboard cache: ${founderId}`);
    // No memory cache to invalidate, KV store handles TTL
  }

  invalidateVenture(ventureId: string): void {
    console.log(`🗑️ Invalidating venture cache: ${ventureId}`);
    // No memory cache to invalidate, KV store handles TTL
  }

  invalidateLeaderboard(): void {
    console.log(`🗑️ Invalidating leaderboard cache`);
    // No memory cache to invalidate, KV store handles TTL
  }

  /**
   * Get cache statistics (KV store only)
   */
  getStats() {
    return {
      type: 'kv-only',
      kvStoreAvailable: kvCacheService.isAvailable(),
      message: 'Using Replit KV store only for caching'
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();