import { LRUCache } from 'lru-cache';
import { kvCacheService } from './kv-cache-service';
import { appLogger } from '../utils/logger';

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  hitRate: number;
}

class LRUCacheService {
  private founderCache: LRUCache<string, any>;
  private dashboardCache: LRUCache<string, any>;
  private ventureCache: LRUCache<string, any>;
  private leaderboardCache: LRUCache<string, any>;
  
  private stats = {
    founder: { hits: 0, misses: 0, sets: 0, evictions: 0 },
    dashboard: { hits: 0, misses: 0, sets: 0, evictions: 0 },
    venture: { hits: 0, misses: 0, sets: 0, evictions: 0 },
    leaderboard: { hits: 0, misses: 0, sets: 0, evictions: 0 }
  };

  constructor() {
    // Founder cache: 15min TTL, 1000 max entries (rarely changing data)
    this.founderCache = new LRUCache({
      max: 1000,
      ttl: 15 * 60 * 1000, // 15 minutes
      dispose: () => this.stats.founder.evictions++
    });

    // Dashboard cache: 10min TTL, 500 max entries (frequent access data)
    this.dashboardCache = new LRUCache({
      max: 500,
      ttl: 10 * 60 * 1000, // 10 minutes
      dispose: () => this.stats.dashboard.evictions++
    });

    // Venture cache: 10min TTL, 2000 max entries (moderate change data)
    this.ventureCache = new LRUCache({
      max: 2000,
      ttl: 10 * 60 * 1000, // 10 minutes
      dispose: () => this.stats.venture.evictions++
    });

    // Leaderboard cache: 20min TTL, 50 max entries (computed data)
    this.leaderboardCache = new LRUCache({
      max: 50,
      ttl: 20 * 60 * 1000, // 20 minutes
      dispose: () => this.stats.leaderboard.evictions++
    });

    appLogger.system('LRU Cache Service initialized with hybrid caching strategy');
    appLogger.system('Cache configuration:', {
      founder: '1000 entries, 15min TTL',
      dashboard: '500 entries, 10min TTL', 
      venture: '2000 entries, 10min TTL',
      leaderboard: '50 entries, 20min TTL'
    });
  }

  // Hybrid get: LRU → KV → null
  async get(type: 'founder' | 'dashboard' | 'venture' | 'leaderboard', key: string): Promise<any> {
    const cache = this.getCache(type);
    const cacheKey = `${type}_${key}`;
    
    // Try LRU cache first (memory)
    const lruValue = cache.get(cacheKey);
    if (lruValue !== undefined) {
      this.stats[type].hits++;
      appLogger.cache(`LRU Cache HIT: ${cacheKey} (memory)`);
      return lruValue;
    }

    // Fallback to KV store
    const kvValue = await kvCacheService.get(key);
    if (kvValue !== null) {
      // Populate LRU cache with KV data
      cache.set(cacheKey, kvValue);
      this.stats[type].hits++;
      appLogger.cache(`KV Cache HIT: ${cacheKey} (promoted to LRU)`);
      return kvValue;
    }

    this.stats[type].misses++;
    appLogger.cache(`Cache MISS: ${cacheKey} (LRU + KV)`);
    return null;
  }

  // Hybrid set: LRU + KV for persistence
  async set(type: 'founder' | 'dashboard' | 'venture' | 'leaderboard', key: string, value: any): Promise<void> {
    const cache = this.getCache(type);
    const cacheKey = `${type}_${key}`;
    
    // Set in LRU cache (immediate memory access)
    cache.set(cacheKey, value);
    this.stats[type].sets++;
    appLogger.cache(`LRU Cache SET: ${cacheKey} (memory)`);

    // Also persist to KV store for backup/persistence
    await kvCacheService.set(key, value);
    appLogger.cache(`KV Cache SET: ${cacheKey} (persistence)`);
  }

  // Invalidate from both LRU and KV
  async invalidate(type: 'founder' | 'dashboard' | 'venture' | 'leaderboard', key: string): Promise<void> {
    const cache = this.getCache(type);
    const cacheKey = `${type}_${key}`;
    
    cache.delete(cacheKey);
    await kvCacheService.delete(key);
    appLogger.cache(`Cache INVALIDATED: ${cacheKey} (LRU + KV)`);
  }

  // Clear specific cache type
  async clearType(type: 'founder' | 'dashboard' | 'venture' | 'leaderboard'): Promise<void> {
    const cache = this.getCache(type);
    cache.clear();
    appLogger.cache(`Cache CLEARED: ${type} (LRU only)`);
  }

  // Clear all caches
  async clearAll(): Promise<void> {
    this.founderCache.clear();
    this.dashboardCache.clear();
    this.ventureCache.clear();
    this.leaderboardCache.clear();
    appLogger.cache('All caches CLEARED (LRU)');
  }

  // Get cache statistics
  getStats(): Record<string, CacheStats> {
    const result: Record<string, CacheStats> = {};
    
    for (const [type, stats] of Object.entries(this.stats)) {
      const total = stats.hits + stats.misses;
      result[type] = {
        ...stats,
        hitRate: total > 0 ? Number((stats.hits / total * 100).toFixed(1)) : 0
      };
    }
    
    return result;
  }

  // Get memory usage info
  getMemoryInfo() {
    return {
      founder: {
        size: this.founderCache.size,
        max: this.founderCache.max,
        usage: `${this.founderCache.size}/${this.founderCache.max}`
      },
      dashboard: {
        size: this.dashboardCache.size,
        max: this.dashboardCache.max,
        usage: `${this.dashboardCache.size}/${this.dashboardCache.max}`
      },
      venture: {
        size: this.ventureCache.size,
        max: this.ventureCache.max,
        usage: `${this.ventureCache.size}/${this.ventureCache.max}`
      },
      leaderboard: {
        size: this.leaderboardCache.size,
        max: this.leaderboardCache.max,
        usage: `${this.leaderboardCache.size}/${this.leaderboardCache.max}`
      }
    };
  }

  private getCache(type: 'founder' | 'dashboard' | 'venture' | 'leaderboard'): LRUCache<string, any> {
    switch (type) {
      case 'founder': return this.founderCache;
      case 'dashboard': return this.dashboardCache;
      case 'venture': return this.ventureCache;
      case 'leaderboard': return this.leaderboardCache;
      default: throw new Error(`Unknown cache type: ${type}`);
    }
  }

  // Periodic cleanup and stats logging
  schedulePeriodicTasks() {
    // Log cache stats every 5 minutes
    setInterval(() => {
      const stats = this.getStats();
      const memory = this.getMemoryInfo();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📊 LRU Cache Performance Report:');
        for (const [type, stat] of Object.entries(stats)) {
          const memoryInfo = memory[type as keyof typeof memory];
          console.log(`  ${type}: ${stat.hits}H/${stat.misses}M (${stat.hitRate}% hit rate) - ${memoryInfo.usage} entries`);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    appLogger.system('LRU Cache periodic tasks scheduled');
  }


}

export const lruCacheService = new LRUCacheService();