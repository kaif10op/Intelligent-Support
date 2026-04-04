/**
 * Frontend Cache Service
 * Provides lightweight caching for API responses with TTL support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache with TTL
   */
  set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  /**
   * Clear specific cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or fetch data
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = 5 * 60 * 1000
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    if (cached) {
      console.log(`[Cache] HIT: ${key}`);
      return cached;
    }

    // Fetch fresh data
    console.log(`[Cache] MISS: ${key}, fetching...`);
    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }
}

export const cacheService = new CacheService();

/**
 * Cache keys for common endpoints
 */
export const CACHE_KEYS = {
  USER_PROFILE: 'user:profile',
  ADMIN_STATS: 'admin:stats',
  ADMIN_USERS: 'admin:users',
  ADMIN_ANALYTICS: 'admin:analytics',
  CHAT_LIST: 'chat:list',
  CHAT_RECENT: 'chat:recent',
  KB_LIST: 'kb:list',
  TICKETS_LIST: 'tickets:list',
  SEARCH_RESULTS: (query: string) => `search:${query}`,
} as const;

/**
 * Default TTL values (in milliseconds)
 */
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;
