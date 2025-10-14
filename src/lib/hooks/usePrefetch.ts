import { useEffect, useCallback } from 'react';
import { prefetchTracker } from '../prefetch/prefetch-tracker';

/**
 * Hook to track album views and duration
 */
export function useTrackAlbumView(albumKey: string) {
  useEffect(() => {
    // Track view on mount
    prefetchTracker.trackView(albumKey);

    // Track duration on unmount
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      if (duration > 1000) { // Only track if viewed for >1 second
        prefetchTracker.trackDuration(albumKey, duration);
      }
    };
  }, [albumKey]);
}

/**
 * Hook to get albums to prefetch based on user behavior
 */
export function usePrefetchCandidates(limit: number = 3): string[] {
  useEffect(() => {
    // Ensure tracker is initialized
    prefetchTracker.init();
  }, []);

  return prefetchTracker.getPrefetchCandidates(limit);
}

/**
 * Hook to prefetch album data in the background
 */
export function usePrefetchAlbums(albumKeys: string[]) {
  useEffect(() => {
    if (albumKeys.length === 0) return;

    // Prefetch album data after a short delay
    const timeout = setTimeout(() => {
      albumKeys.forEach(async (albumKey) => {
        try {
          // Prefetch album images
          const response = await fetch(`/api/album/${albumKey}/images`);
          if (response.ok) {
            await response.json(); // Force fetch and cache
            console.debug(`[Prefetch] Prefetched album ${albumKey}`);
          }
        } catch (error) {
          console.debug(`[Prefetch] Failed to prefetch album ${albumKey}:`, error);
        }
      });
    }, 1000); // Wait 1 second before prefetching

    return () => clearTimeout(timeout);
  }, [albumKeys]);
}

/**
 * Combined hook for tracking and prefetching
 * Use this on album pages to track views and prefetch related content
 */
export function useAlbumTracking(currentAlbumKey: string) {
  // Track current album view
  useTrackAlbumView(currentAlbumKey);

  // Get prefetch candidates
  const candidates = usePrefetchCandidates(3);

  // Filter out current album from candidates
  const prefetchTargets = candidates.filter(key => key !== currentAlbumKey);

  // Prefetch candidate albums
  usePrefetchAlbums(prefetchTargets);

  return {
    prefetchTargets,
    tracker: prefetchTracker,
  };
}

/**
 * Hook to get analytics data
 */
export function useGalleryAnalytics() {
  useEffect(() => {
    prefetchTracker.init();
  }, []);

  const getAnalytics = useCallback(() => {
    return prefetchTracker.getAnalytics();
  }, []);

  return { getAnalytics };
}
