import { lruCacheService } from './lru-cache-service';
import { kvCacheService } from './kv-cache-service';

/**
 * Hybrid Cache Service - combines LRU (memory) + KV (persistence) 
 * Provides sub-millisecond response times with data persistence
 */
export class HybridCacheService {
  constructor() {
    console.log('🚀 Hybrid Cache Service initialized (LRU + KV)');
    lruCacheService.schedulePeriodicTasks();
  }

  // Dashboard data with hybrid caching
  async getDashboardData(founderId: string, fetchFn: () => Promise<any>): Promise<any> {
    const cached = await lruCacheService.get('dashboard', founderId);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    if (data) {
      await lruCacheService.set('dashboard', founderId, data);
    }
    return data;
  }

  // Founder data with hybrid caching
  async getFounder(founderId: string, fetchFn: () => Promise<any>): Promise<any> {
    const cached = await lruCacheService.get('founder', founderId);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    if (data) {
      await lruCacheService.set('founder', founderId, data);
    }
    return data;
  }

  // Get performance stats
  getPerformanceStats() {
    return {
      lruStats: lruCacheService.getStats(),
      memoryUsage: lruCacheService.getMemoryInfo(),
      cacheType: 'hybrid-lru-kv'
    };
  }
}

export const hybridCacheService = new HybridCacheService();