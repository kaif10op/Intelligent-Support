import { createClient, type RedisClientType } from 'redis';
import { logger } from './logger.js';

let redisClient: RedisClientType | null = null;
let connected = false;

/**
 * Initialize Redis client
 */
export const initRedis = async () => {
  try {
    if (!process.env.REDIS_URL) {
      logger.warn('REDIS_URL not set, caching disabled');
      return null;
    }

    redisClient = createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected');
      connected = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Redis initialization error:', error);
    return null;
  }
};

/**
 * Get value from cache
 */
export const getCached = async <T>(key: string): Promise<T | null> => {
  if (!redisClient || !connected) return null;

  try {
    const value = await redisClient.get(key);
    if (value) {
      return JSON.parse(value) as T;
    }
    return null;
  } catch (error) {
    logger.warn(`Cache get error for ${key}:`, error);
    return null;
  }
};

/**
 * Set value in cache with TTL
 */
export const setCached = async <T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<boolean> => {
  if (!redisClient || !connected) return false;

  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.warn(`Cache set error for ${key}:`, error);
    return false;
  }
};

/**
 * Delete key from cache
 */
export const deleteCached = async (key: string): Promise<boolean> => {
  if (!redisClient || !connected) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.warn(`Cache delete error for ${key}:`, error);
    return false;
  }
};

/**
 * Clear all cache (use with caution)
 */
export const clearCache = async (): Promise<boolean> => {
  if (!redisClient || !connected) return false;

  try {
    await redisClient.flushDb();
    logger.info('Cache cleared');
    return true;
  } catch (error) {
    logger.warn('Cache clear error:', error);
    return false;
  }
};

/**
 * Pattern-based deletion (e.g., "chat:*" to delete all chat cache)
 */
export const deletePatternCache = async (pattern: string): Promise<number> => {
  if (!redisClient || !connected) return 0;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return keys.length;
  } catch (error) {
    logger.warn(`Cache pattern delete error for ${pattern}:`, error);
    return 0;
  }
};

/**
 * Middleware to invalidate cache on data mutations
 */
export const invalidateCacheMiddleware = (patterns: string[]) => {
  return async (req: any, res: any, next: any) => {
    // Store original send
    const originalSend = res.send;

    res.send = async function (data: any) {
      // Only invalidate on successful mutations (POST, PUT, DELETE)
      if (['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode < 400) {
        for (const pattern of patterns) {
          await deletePatternCache(pattern);
        }
      }

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Generate cache key with namespace
 */
export const makeCacheKey = (namespace: string, ...parts: (string | number)[]): string => {
  return [namespace, ...parts].join(':');
};

export { redisClient };
