import { redisClient as redis } from './cache.js';
import { logger } from './logger.js';

export type CacheTTL = 'short' | 'medium' | 'long' | number;

const TTL_MAP: Record<string, number> = {
  short: 300, // 5 min
  medium: 1800, // 30 min
  long: 3600, // 1 hour
};

interface CacheOptions {
  ttl?: CacheTTL;
  tags?: string[];
}

/**
 * Advanced Redis Cache Service with TTL, tagging, and batch operations
 */
export class CacheService {
  /**
   * Get value from cache
   */
  static async get(key: string): Promise<any> {
    try {
      if (!redis) return null;
      const value = await redis.get(key);
      if (value) {
        logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for ${key}:`, error);
      return null; // Graceful fallback
    }
  }

  /**
   * Set value in cache with TTL
   */
  static async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    try {
      if (!redis) return false;
      const ttl = this.resolveTTL(options?.ttl || 'medium');
      const serialized = JSON.stringify(value);

      await redis.setEx(key, ttl, serialized);

      // Store tags for bulk invalidation
      if (options?.tags && options.tags.length > 0) {
        await this.tagKey(key, options.tags, ttl);
      }

      logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(`Cache set error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set (compute if not exists)
   */
  static async getOrSet(
    key: string,
    compute: () => Promise<any>,
    options?: CacheOptions
  ): Promise<any> {
    try {
      // Try cache first
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Compute
      logger.debug(`Cache COMPUTE: ${key}`);
      const value = await compute();

      // Store in cache
      await this.set(key, value, options);

      return value;
    } catch (error) {
      logger.error(`Cache getOrSet error for ${key}:`, error);
      // Return computed value anyway
      return await compute();
    }
  }

  /**
   * Delete single key
   */
  static async delete(key: string): Promise<boolean> {
    try {
      if (!redis) return false;
      await redis.del(key);
      logger.debug(`Cache DELETE: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  static async deletePattern(pattern: string): Promise<number> {
    try {
      if (!redis) return 0;
      const keys = await redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const deleted = await redis.del(keys);
      logger.info(`Cache DELETE PATTERN: ${pattern} - Deleted ${deleted} keys`);
      return deleted;
    } catch (error) {
      logger.error(`Cache deletePattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate by tags
   */
  static async invalidateByTags(tags: string[]): Promise<number> {
    try {
      if (!redis) return 0;
      let totalDeleted = 0;

      for (const tag of tags) {
        const pattern = `cache:tag:${tag}:*`;
        const keys = await redis.keys(pattern);

        if (keys.length > 0) {
          // Get actual keys from tag entries
          const actualKeys: string[] = [];
          for (const tagKey of keys) {
            const members = await redis.sMembers(tagKey);
            actualKeys.push(...members);
          }

          if (actualKeys.length > 0) {
            const deleted = await redis.del(actualKeys);
            totalDeleted += deleted;

            // Delete tag entries
            await redis.del(keys);
          }
        }
      }

      logger.info(`Cache INVALIDATE TAGS: ${tags.join(',')} - Deleted ${totalDeleted} keys`);
      return totalDeleted;
    } catch (error) {
      logger.error(`Cache invalidateByTags error:`, error);
      return 0;
    }
  }

  /**
   * Batch get operations
   */
  static async mget(keys: string[]): Promise<Map<string, any>> {
    try {
      if (!redis) return new Map();
      const values = await redis.mGet(keys);
      const result = new Map<string, any>();

      values.forEach((value: string | null, index: number) => {
        if (value) {
          result.set(keys[index], JSON.parse(value));
        }
      });

      logger.debug(`Cache MGET: ${keys.length} keys, ${result.size} hits`);
      return result;
    } catch (error) {
      logger.error(`Cache mget error:`, error);
      return new Map();
    }
  }

  /**
   * Batch set operations
   */
  static async mset(data: Map<string, any>, options?: CacheOptions): Promise<boolean> {
    try {
      if (!redis) return false;
      const ttl = this.resolveTTL(options?.ttl || 'medium');
      const multi = redis.multi();

      for (const [key, value] of data) {
        multi.setEx(key, ttl, JSON.stringify(value));
      }

      await multi.exec();
      logger.debug(`Cache MSET: ${data.size} keys`);
      return true;
    } catch (error) {
      logger.error(`Cache mset error:`, error);
      return false;
    }
  }

  /**
   * Clear all cache (use with caution!)
   */
  static async clear(): Promise<boolean> {
    try {
      if (!redis) return false;
      await redis.flushDb();
      logger.warn('Cache FLUSHED - All cache cleared');
      return true;
    } catch (error) {
      logger.error(`Cache flush error:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    hitRate: number;
    memoryUsage: string;
    keyCount: number;
  }> {
    try {
      if (!redis) return { hitRate: 0, memoryUsage: '0B', keyCount: 0 };
      const info = await redis.info('stats');
      const memory = await redis.info('memory');
      const keys = await redis.dbSize();

      const hits = this.parseRedisInfo(info, 'keyspace_hits');
      const misses = this.parseRedisInfo(info, 'keyspace_misses');
      const hitRate = hits / (hits + misses) || 0;

      return {
        hitRate: Math.round(hitRate * 100),
        memoryUsage: String(this.parseRedisInfo(memory, 'used_memory_human')),
        keyCount: keys,
      };
    } catch (error) {
      logger.error('Cache getStats error:', error);
      return { hitRate: 0, memoryUsage: '0B', keyCount: 0 };
    }
  }

  // ========== Private Helpers ==========

  private static resolveTTL(ttl: CacheTTL): number {
    if (typeof ttl === 'number') {
      return ttl;
    }
    return TTL_MAP[ttl] || TTL_MAP.medium;
  }

  private static async tagKey(key: string, tags: string[], ttl: number) {
    try {
      if (!redis) return;
      for (const tag of tags) {
        const tagKey = `cache:tag:${tag}:keys`;
        await redis.sAdd(tagKey, key);
        await redis.expire(tagKey, ttl);
      }
    } catch (error) {
      logger.error(`Error tagging cache key ${key}:`, error);
    }
  }

  private static parseRedisInfo(info: string, field: string): number {
    const match = info.match(new RegExp(`${field}:(\\d+)`));
    return match ? parseInt(match[1], 10) : 0;
  }
}

/**
 * Decorator for caching function results
 * Usage: @Cacheable('user:{id}:profile', { ttl: 'long' })
 */
export function Cacheable(keyPattern: string, options?: CacheOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Build cache key by replacing {arg0}, {arg1}, etc.
      let cacheKey = keyPattern;
      args.forEach((arg, index) => {
        if (typeof arg === 'object') {
          arg = arg.id || arg;
        }
        cacheKey = cacheKey.replace(`{${index}}`, arg);
      });

      // Try cache
      const cached = await CacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache result
      await CacheService.set(cacheKey, result, options);

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator for cache invalidation
 * Usage: @InvalidateCache(['user:{id}:profile', 'admin:stats'])
 */
export function InvalidateCache(patterns: string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Execute original method first
      const result = await originalMethod.apply(this, args);

      // Invalidate cache patterns
      for (const pattern of patterns) {
        let finalPattern = pattern;
        args.forEach((arg, index) => {
          if (typeof arg === 'object') {
            arg = arg.id || arg;
          }
          finalPattern = finalPattern.replace(`{${index}}`, arg);
        });

        await CacheService.deletePattern(finalPattern);
      }

      return result;
    };

    return descriptor;
  };
}
