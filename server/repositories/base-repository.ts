import { db } from "../db";
import { cacheService } from "../services/cache-service";
import { appLogger } from "../utils/logger";

/**
 * Base Repository class with caching and error handling
 */
export abstract class BaseRepository {
  protected db = db;
  protected cache = cacheService;

  /**
   * Execute query with automatic caching
   */
  protected async executeWithCache<T>(
    cacheType: 'founder' | 'dashboard' | 'venture' | 'leaderboard',
    key: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    // Use appropriate cache method based on type
    switch (cacheType) {
      case 'founder':
        return await this.cache.getFounder(key, queryFn);
      case 'dashboard':
        return await this.cache.getDashboardData(key, queryFn);
      default:
        return await this.cache.getFounder(key, queryFn);
    }
  }

  /**
   * Execute query without caching
   */
  protected async executeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    try {
      return await queryFn();
    } catch (error) {
      appLogger.database("Database query error:", error);
      throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Invalidate cache for specific type and key
   */
  protected async invalidateCache(
    type: 'founder' | 'dashboard' | 'venture' | 'leaderboard',
    key: string
  ): Promise<void> {
    // Note: Will be implemented when cache service supports it
    appLogger.cache(`Cache invalidation requested: ${type}:${key}`);
  }
}