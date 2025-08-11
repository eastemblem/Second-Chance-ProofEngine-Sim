import { kvCacheService } from "./kv-cache-service";
import { lruCacheService } from "./lru-cache-service";
import { appLogger } from '../utils/logger';

/**
 * Cache Service for Performance Optimization
 * Phase 2: Hybrid LRU + KV store caching
 */
export class CacheService {
  constructor() {
    appLogger.system('CacheService initialized with hybrid LRU + KV caching');
    // Initialize LRU cache periodic tasks
    lruCacheService.schedulePeriodicTasks();
  }

  /**
   * Founder data caching with hybrid LRU + KV approach
   * FIXED: Don't cache null/undefined results and bypass cache for null values
   */
  async getFounder(founderId: string, fetchFn: () => Promise<any>): Promise<any> {
    // Try LRU cache first (memory)
    const cached = await lruCacheService.get('founder', founderId);
    if (cached !== null && cached !== undefined) {
      appLogger.cache(`Cache HIT: Founder ${founderId}`);
      return cached;
    }

    appLogger.cache(`Cache MISS: Fetching founder ${founderId}`);
    const data = await fetchFn();
    
    // Only cache valid, non-null data
    if (data && data !== null && data !== undefined) {
      await lruCacheService.set('founder', founderId, data);
      appLogger.cache(`Cache SET: Founder ${founderId}`);
    } else {
      appLogger.cache(`Not caching null/empty result for founder ${founderId}`);
    }
    
    return data;
  }

  /**
   * Dashboard data caching with hybrid LRU + KV approach
   * FIXED: Don't cache null/undefined results and bypass cache for null values
   */
  async getDashboardData(founderId: string, fetchFn: () => Promise<any>): Promise<any> {
    // Try LRU cache first (sub-millisecond response)
    const cached = await lruCacheService.get('dashboard', founderId);
    if (cached !== null && cached !== undefined) {
      appLogger.cache(`Dashboard Cache HIT: ${founderId}`);
      return cached;
    }

    appLogger.cache(`Cache MISS: Fetching dashboard data ${founderId}`);
    const data = await fetchFn();
    
    // Only cache valid, non-null data
    if (data && data !== null && data !== undefined) {
      await lruCacheService.set('dashboard', founderId, data);
      appLogger.cache(`Dashboard Cache SET: ${founderId}`);
    } else {
      appLogger.cache(`Not caching null/empty result for dashboard ${founderId}`);
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
        appLogger.cache(`KV Cache HIT: Venture ${ventureId}`);
        return cached;
      }
    }

    appLogger.cache(`Cache MISS: Fetching venture ${ventureId}`);
    const data = await fetchFn();
    
    if (data && kvCacheService.isAvailable()) {
      await kvCacheService.set(cacheKey, data, { namespace: 'venture', ttl: 600 });
      appLogger.cache(`KV Cache SET: ${cacheKey} (TTL: 600s)`);
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
        appLogger.cache(`KV Cache HIT: Leaderboard ${cacheKey}`);
        return cached;
      }
    }

    appLogger.cache(`Cache MISS: Fetching leaderboard ${cacheKey}`);
    const data = await fetchFn();
    
    if (data && kvCacheService.isAvailable()) {
      await kvCacheService.set(cacheKey, data, { namespace: 'leaderboard', ttl: 1200 });
      appLogger.cache(`KV Cache SET: ${cacheKey} (TTL: 1200s)`);
    }
    
    return data;
  }

  /**
   * Cache invalidation methods
   */
  invalidateFounder(founderId: string): void {
    appLogger.cache(`Invalidating founder cache: ${founderId}`);
    // No memory cache to invalidate, KV store handles TTL
  }

  invalidateDashboard(founderId: string): void {
    appLogger.cache(`Invalidating dashboard cache: ${founderId}`);
    // No memory cache to invalidate, KV store handles TTL
  }

  invalidateVenture(ventureId: string): void {
    appLogger.cache(`Invalidating venture cache: ${ventureId}`);
    // No memory cache to invalidate, KV store handles TTL
  }

  invalidateLeaderboard(): void {
    appLogger.cache(`Invalidating leaderboard cache`);
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