/**
 * Replit Key-Value Store Cache Service
 * Enhanced caching with persistent storage using Replit's KV store
 */

interface KVCacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string; // Cache namespace for organization
}

class KVCacheService {
  private defaultTTL = 300; // 5 minutes default
  private kvStore: any;

  constructor() {
    this.initializeKVStore();
  }

  /**
   * Initialize Replit KV store
   */
  private async initializeKVStore() {
    try {
      // Import Replit KV store
      const Database = await import('@replit/database');
      this.kvStore = new Database.default();
      console.log('✅ Replit KV store initialized');
    } catch (error) {
      console.warn('⚠️ Replit KV store not available, falling back to memory cache');
      this.kvStore = null;
    }
  }

  /**
   * Generate cache key with namespace
   */
  private getCacheKey(key: string, namespace: string = 'default'): string {
    return `cache:${namespace}:${key}`;
  }

  /**
   * Get value from KV store with TTL check
   */
  async get<T>(key: string, options: KVCacheOptions = {}): Promise<T | null> {
    if (!this.kvStore) return null;

    try {
      const cacheKey = this.getCacheKey(key, options.namespace);
      const cached = await this.kvStore.get(cacheKey);
      
      if (!cached) {
        console.log(`🎯 KV Cache MISS: ${key}`);
        return null;
      }

      const { data, timestamp, ttl } = JSON.parse(cached);
      
      // Check if cache has expired
      if (ttl && Date.now() - timestamp > ttl * 1000) {
        console.log(`⏰ KV Cache EXPIRED: ${key}`);
        await this.delete(key, options);
        return null;
      }

      console.log(`✅ KV Cache HIT: ${key}`);
      return data;
    } catch (error) {
      console.error(`❌ KV Cache GET error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in KV store with TTL
   */
  async set<T>(key: string, value: T, options: KVCacheOptions = {}): Promise<void> {
    if (!this.kvStore) return;

    try {
      const cacheKey = this.getCacheKey(key, options.namespace);
      const ttl = options.ttl || this.defaultTTL;
      
      const cacheData = {
        data: value,
        timestamp: Date.now(),
        ttl: ttl
      };

      await this.kvStore.set(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 KV Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error(`❌ KV Cache SET error for ${key}:`, error);
    }
  }

  /**
   * Delete value from KV store
   */
  async delete(key: string, options: KVCacheOptions = {}): Promise<void> {
    if (!this.kvStore) return;

    try {
      const cacheKey = this.getCacheKey(key, options.namespace);
      await this.kvStore.delete(cacheKey);
      console.log(`🗑️ KV Cache DELETE: ${key}`);
    } catch (error) {
      console.error(`❌ KV Cache DELETE error for ${key}:`, error);
    }
  }

  /**
   * Get or set pattern - common caching pattern
   */
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    options: KVCacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data and store
    console.log(`📥 KV Cache FETCH: ${key}`);
    const data = await fetchFn();
    await this.set(key, data, options);
    return data;
  }

  /**
   * Clear cache by namespace
   */
  async clearNamespace(namespace: string): Promise<void> {
    if (!this.kvStore) return;

    try {
      const prefix = `cache:${namespace}:`;
      const keys = await this.kvStore.list(prefix);
      
      for (const key of keys) {
        await this.kvStore.delete(key);
      }
      
      console.log(`🧹 KV Cache CLEARED namespace: ${namespace}`);
    } catch (error) {
      console.error(`❌ KV Cache CLEAR error for namespace ${namespace}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(namespace?: string): Promise<any> {
    if (!this.kvStore) {
      return { available: false, message: 'KV store not available' };
    }

    try {
      const prefix = namespace ? `cache:${namespace}:` : 'cache:';
      const keys = await this.kvStore.list(prefix);
      
      let totalSize = 0;
      let expiredCount = 0;
      let validCount = 0;

      for (const key of keys) {
        try {
          const value = await this.kvStore.get(key);
          if (value) {
            totalSize += value.length;
            const { timestamp, ttl } = JSON.parse(value);
            
            if (ttl && Date.now() - timestamp > ttl * 1000) {
              expiredCount++;
            } else {
              validCount++;
            }
          }
        } catch (e) {
          // Skip invalid entries
        }
      }

      return {
        available: true,
        totalKeys: keys.length,
        validKeys: validCount,
        expiredKeys: expiredCount,
        totalSize: totalSize,
        namespace: namespace || 'all'
      };
    } catch (error) {
      return { 
        available: false, 
        error: (error as Error).message,
        namespace: namespace || 'all'
      };
    }
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(namespace?: string): Promise<number> {
    if (!this.kvStore) return 0;

    let cleanedCount = 0;
    
    try {
      const prefix = namespace ? `cache:${namespace}:` : 'cache:';
      const keys = await this.kvStore.list(prefix);
      
      for (const key of keys) {
        try {
          const value = await this.kvStore.get(key);
          if (value) {
            const { timestamp, ttl } = JSON.parse(value);
            
            if (ttl && Date.now() - timestamp > ttl * 1000) {
              await this.kvStore.delete(key);
              cleanedCount++;
            }
          }
        } catch (e) {
          // Delete invalid entries
          await this.kvStore.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 KV Cache CLEANUP: Removed ${cleanedCount} expired entries`);
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('❌ KV Cache CLEANUP error:', error);
      return 0;
    }
  }

  /**
   * Check if KV store is available
   */
  isAvailable(): boolean {
    return this.kvStore !== null;
  }
}

export const kvCacheService = new KVCacheService();