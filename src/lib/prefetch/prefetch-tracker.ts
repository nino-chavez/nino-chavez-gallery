/**
 * Predictive Prefetch Tracker
 *
 * Tracks user behavior and intelligently prefetches content
 * based on viewing patterns and popularity.
 */

interface ViewRecord {
  albumKey: string;
  timestamp: number;
  duration?: number; // Time spent viewing
}

interface AlbumStats {
  views: number;
  lastViewed: number;
  avgDuration: number;
  totalDuration: number;
}

const STORAGE_KEY = 'gallery_prefetch_data';
const MAX_HISTORY = 100;
const POPULAR_THRESHOLD = 3; // Consider "popular" after 3 views

class PrefetchTracker {
  private history: ViewRecord[] = [];
  private stats: Map<string, AlbumStats> = new Map();
  private initialized = false;

  /**
   * Initialize tracker and load from localStorage
   */
  init() {
    if (this.initialized || typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.history = data.history || [];
        this.stats = new Map(Object.entries(data.stats || {}));
      }
      this.initialized = true;
    } catch (error) {
      console.warn('[Prefetch] Failed to load tracking data:', error);
    }
  }

  /**
   * Track album view
   */
  trackView(albumKey: string) {
    if (typeof window === 'undefined') return;

    const record: ViewRecord = {
      albumKey,
      timestamp: Date.now(),
    };

    // Add to history
    this.history.push(record);
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }

    // Update stats
    const stats = this.stats.get(albumKey) || {
      views: 0,
      lastViewed: 0,
      avgDuration: 0,
      totalDuration: 0,
    };

    stats.views++;
    stats.lastViewed = record.timestamp;
    this.stats.set(albumKey, stats);

    this.save();
  }

  /**
   * Track time spent on album
   */
  trackDuration(albumKey: string, duration: number) {
    if (typeof window === 'undefined') return;

    const stats = this.stats.get(albumKey);
    if (!stats) return;

    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.views;
    this.stats.set(albumKey, stats);

    this.save();
  }

  /**
   * Get most popular albums
   */
  getPopularAlbums(limit: number = 5): string[] {
    const albums = Array.from(this.stats.entries())
      .filter(([_, stats]) => stats.views >= POPULAR_THRESHOLD)
      .sort((a, b) => {
        // Sort by views, then by recency
        if (b[1].views !== a[1].views) {
          return b[1].views - a[1].views;
        }
        return b[1].lastViewed - a[1].lastViewed;
      })
      .map(([key]) => key)
      .slice(0, limit);

    return albums;
  }

  /**
   * Get recently viewed albums
   */
  getRecentAlbums(limit: number = 5): string[] {
    const recent = [...this.history]
      .reverse()
      .map(r => r.albumKey)
      // Remove duplicates while preserving order
      .filter((key, index, self) => self.indexOf(key) === index)
      .slice(0, limit);

    return recent;
  }

  /**
   * Get albums to prefetch based on user behavior
   */
  getPrefetchCandidates(limit: number = 3): string[] {
    const popular = this.getPopularAlbums(2);
    const recent = this.getRecentAlbums(2);

    // Combine and deduplicate
    const candidates = [...new Set([...popular, ...recent])].slice(0, limit);

    return candidates;
  }

  /**
   * Get stats for a specific album
   */
  getAlbumStats(albumKey: string): AlbumStats | null {
    return this.stats.get(albumKey) || null;
  }

  /**
   * Clear all tracking data
   */
  clear() {
    this.history = [];
    this.stats.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Save to localStorage
   */
  private save() {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        history: this.history,
        stats: Object.fromEntries(this.stats),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('[Prefetch] Failed to save tracking data:', error);
    }
  }

  /**
   * Get analytics summary
   */
  getAnalytics() {
    return {
      totalViews: this.history.length,
      uniqueAlbums: this.stats.size,
      popularAlbums: this.getPopularAlbums(10),
      recentAlbums: this.getRecentAlbums(10),
      avgViewsPerAlbum: this.stats.size > 0
        ? this.history.length / this.stats.size
        : 0,
    };
  }
}

// Singleton instance
export const prefetchTracker = new PrefetchTracker();

// Initialize on module load (client-side only)
if (typeof window !== 'undefined') {
  prefetchTracker.init();
}
