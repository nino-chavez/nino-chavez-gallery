/**
 * SWR Configuration Presets
 * 
 * Reusable SWR configurations for different data freshness requirements.
 * Optimized for performance and user experience.
 */

import type { SWRConfiguration } from 'swr';

/**
 * Default SWR configuration for most API endpoints
 * 
 * Balanced approach - caches for 1 minute, doesn't refetch on focus
 */
export const defaultSWRConfig: SWRConfiguration = {
  revalidateOnFocus: false,      // Don't refetch when user switches tabs
  revalidateOnReconnect: false,  // Don't refetch on network reconnect
  dedupingInterval: 60000,       // 1 minute - dedupe identical requests
  focusThrottleInterval: 5000,   // 5 seconds between focus revalidations
  errorRetryInterval: 5000,      // 5 seconds between error retries
  errorRetryCount: 3,            // Max 3 retries on error
  revalidateIfStale: true,       // Revalidate stale data in background
  shouldRetryOnError: true,      // Retry on error
};

/**
 * Fast-changing data configuration
 * 
 * For data that changes frequently (e.g., real-time stats, live updates)
 */
export const fastSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  dedupingInterval: 5000,        // 5 seconds
  refreshInterval: 30000,        // Auto-refresh every 30s
  revalidateOnFocus: true,       // Refetch on window focus
  revalidateOnReconnect: true,   // Refetch on network reconnect
};

/**
 * Slow-changing data configuration
 * 
 * For static or rarely-changing data (e.g., albums, EXIF metadata)
 */
export const slowSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  dedupingInterval: 300000,      // 5 minutes
  revalidateIfStale: false,      // Don't auto-revalidate stale data
  revalidateOnMount: false,      // Don't revalidate on component mount
};

/**
 * Infinite scroll configuration
 *
 * For paginated/infinite scroll endpoints (use with useSWRInfinite)
 * Note: revalidateFirstPage and persistSize are useSWRInfinite-specific options
 */
export const infiniteSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  dedupingInterval: 120000,      // 2 minutes for paginated data
};

/**
 * Portfolio page configuration
 * 
 * Optimized for the portfolio page which shows curated photos
 */
export const portfolioSWRConfig: SWRConfiguration = {
  ...slowSWRConfig,
  dedupingInterval: 120000,      // 2 minutes
};

/**
 * Gallery/album page configuration
 * 
 * For viewing specific albums
 */
export const albumSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  dedupingInterval: 60000,       // 1 minute
};

/**
 * Search results configuration
 * 
 * For search/filter results that may change
 */
export const searchSWRConfig: SWRConfiguration = {
  ...fastSWRConfig,
  refreshInterval: undefined,    // Don't auto-refresh searches
};

/**
 * Image metadata configuration
 * 
 * EXIF and other image-specific metadata (rarely changes)
 */
export const metadataSWRConfig: SWRConfiguration = {
  ...slowSWRConfig,
  dedupingInterval: 600000,      // 10 minutes
  revalidateOnMount: false,      // EXIF never changes
};

/**
 * Helper: Create custom SWR config with overrides
 * 
 * @param base Base configuration to extend
 * @param overrides Custom configuration options
 * @returns Merged configuration
 */
export function createSWRConfig(
  base: SWRConfiguration = defaultSWRConfig,
  overrides: Partial<SWRConfiguration> = {}
): SWRConfiguration {
  return {
    ...base,
    ...overrides,
  };
}

/**
 * Helper: Get recommended config for a data type
 * 
 * @param dataType Type of data being fetched
 * @returns Appropriate SWR configuration
 */
export function getSWRConfigForDataType(
  dataType: 'default' | 'fast' | 'slow' | 'infinite' | 'portfolio' | 'album' | 'search' | 'metadata'
): SWRConfiguration {
  switch (dataType) {
    case 'fast':
      return fastSWRConfig;
    case 'slow':
      return slowSWRConfig;
    case 'infinite':
      return infiniteSWRConfig;
    case 'portfolio':
      return portfolioSWRConfig;
    case 'album':
      return albumSWRConfig;
    case 'search':
      return searchSWRConfig;
    case 'metadata':
      return metadataSWRConfig;
    default:
      return defaultSWRConfig;
  }
}

/**
 * Example Usage:
 * 
 * ```typescript
 * import useSWR from 'swr';
 * import { portfolioSWRConfig, getSWRConfigForDataType } from '@/lib/swr-config';
 * 
 * // Using preset config
 * const { data } = useSWR('/api/portfolio', fetcher, portfolioSWRConfig);
 * 
 * // Using data type helper
 * const { data } = useSWR('/api/album/123', fetcher, getSWRConfigForDataType('album'));
 * 
 * // Custom config with overrides
 * const { data } = useSWR(
 *   '/api/search',
 *   fetcher,
 *   createSWRConfig(searchSWRConfig, { refreshInterval: 10000 })
 * );
 * ```
 */