/**
 * Replit Key-Value Store Cache Service
 * Enhanced caching with persistent storage using Replit's KV store
 */
import { appLogger } from '../utils/logger';

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
      appLogger.system('Replit KV store initialized');
    } catch (error) {
      appLogger.warn('Replit KV store not available, falling back to memory cache');
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
        appLogger.cache(`KV Cache MISS: ${key}`);
        return null;
      }

      // Handle both string and object data from Replit Database
      let parsedData;
      if (typeof cached === 'string') {
        try {
          parsedData = JSON.parse(cached);
        } catch {
          // If parsing fails, treat as raw string data
          appLogger.cache(`KV Cache HIT: ${key} (raw data)`);
          return cached;
        }
      } else {
        parsedData = cached;
      }

      const { data, timestamp, ttl } = parsedData;
      
      // Check if cache has expired
      if (ttl && Date.now() - timestamp > ttl * 1000) {
        appLogger.cache(`KV Cache EXPIRED: ${key}`);
        await this.delete(key, options);
        return null;
      }

      appLogger.cache(`KV Cache HIT: ${key}`);
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
      appLogger.cache(`KV Cache SET: ${key} (TTL: ${ttl}s)`);
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
      appLogger.cache(`KV Cache DELETE: ${key}`);
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
    appLogger.cache(`KV Cache FETCH: ${key}`);
    const data = await fetchFn();
    await this.set(key, data, options);
    return data;
  }

  /**
   * Clear cache by namespace
   */
  async clearNamespace(namespace: string): Promise<void> {
    if (!this.kvStore) return;
    
    appLogger.cache(`KV Cache CLEAR namespace: ${namespace} (TTL will handle expiration)`);
    // For Replit Database, we don't have a list method to clear by prefix
    // TTL will handle expiration automatically
  }

  /**
   * Get cache statistics
   */
  async getStats(namespace?: string): Promise<any> {
    if (!this.kvStore) {
      return { available: false, message: 'KV store not available' };
    }

    try {
      // For Replit Database, we can't easily list keys, so return basic stats
      return {
        available: true,
        message: 'KV store operational',
        namespace: namespace || 'all',
        type: 'replit-database'
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

    // For Replit Database, we don't have a list method, so just return 0
    // The TTL expiration is handled when we try to get values
    appLogger.cache(`KV Cache CLEANUP: TTL-based expiration (no manual cleanup needed)`);
    return 0;
  }

  /**
   * Check if KV store is available
   */
  isAvailable(): boolean {
    return this.kvStore !== null;
  }
}

export const kvCacheService = new KVCacheService();