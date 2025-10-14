/**
 * SmugMug Cache with LRU Eviction
 *
 * Fixes audit issue #5: Memory Leak (Unbounded Cache Growth)
 *
 * Features:
 * - Size-limited cache (max 100 entries)
 * - LRU (Least Recently Used) eviction
 * - Periodic cleanup of expired entries
 * - Access tracking for analytics
 * - Cache statistics monitoring
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  keys: string[];
  oldestEntry: number;
  newestEntry: number;
}

export class SmugMugCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly MAX_ENTRIES: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private hits = 0;
  private misses = 0;

  constructor(maxEntries = 100) {
    this.MAX_ENTRIES = maxEntries;
    this.startPeriodicCleanup();
  }

  /**
   * Get data from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check expiration
    const isExpired = entry.ttl !== Infinity && Date.now() - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hits++;

    return entry.data as T;
  }

  /**
   * Store data in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number): void {
    // Enforce size limit via LRU eviction
    if (this.cache.size >= this.MAX_ENTRIES && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): CacheStats {
    const entries: CacheEntry<any>[] = [];
    this.cache.forEach(entry => entries.push(entry));
    const timestamps = entries.map(e => e.timestamp);

    const keys: string[] = [];
    this.cache.forEach((_, key) => keys.push(key));

    return {
      size: this.cache.size,
      maxSize: this.MAX_ENTRIES,
      hitRate: this.hits + this.misses > 0
        ? this.hits / (this.hits + this.misses)
        : 0,
      keys,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };
  }

  /**
   * Evict expired entries (called periodically)
   */
  private evictExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.ttl !== Infinity && now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[SmugMug Cache] Evicted ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let oldestAccessTime = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestAccessTime) {
        oldestAccessTime = entry.lastAccessed;
        lruKey = key;
      }
    });

    if (lruKey) {
      this.cache.delete(lruKey);
      console.log(`[SmugMug Cache] Evicted LRU entry: ${lruKey}`);
    }
  }

  /**
   * Start periodic cleanup every 5 minutes
   */
  private startPeriodicCleanup(): void {
    // Only run cleanup in browser environment
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.evictExpired();
      }, 5 * 60 * 1000); // 5 minutes
    }
  }

  /**
   * Stop periodic cleanup and clear cache
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

/**
 * Cache TTL configurations aligned with design strategy
 */
export const CACHE_TTL = {
  albums: 24 * 60 * 60 * 1000, // 24 hours (design strategy line 592)
  images: 60 * 60 * 1000,      // 1 hour (design strategy line 593)
  exif: 7 * 24 * 60 * 60 * 1000, // 7 days (design strategy line 593)
  searchIndex: 24 * 60 * 60 * 1000, // 24 hours (for AI search)
};
