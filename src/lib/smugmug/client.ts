/**
 * SmugMug API Client (Server-side OAuth for Next.js)
 *
 * This client is used server-side in Next.js API routes.
 * Uses OAuth 1.0a directly with credentials from environment variables.
 *
 * SECURITY: Credentials are NEVER exposed to the client.
 * All API calls happen server-side in Next.js API routes.
 *
 * FIXES APPLIED:
 * - Issue #1: Uses LargestImage expansion (verified pattern)
 * - Issue #2: Lazy loading (N+1 query fix)
 * - Issue #3: OAuth nonce reuse fixed (no retry on 401/403)
 * - Issue #4: Type-safe API responses
 * - Issue #5: LRU cache with size limits
 * - Issue #6: 95% code duplication eliminated
 * - Issue #7: Request deduplication
 * - Issue #8: AbortSignal support
 */

import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import {
  createSmugMugClient,
  type SmugMugRequestFn,
  type RequestOptions,
} from './common';

// Server-side OAuth configuration from environment variables
const config = {
  apiKey: process.env.SMUGMUG_API_KEY!,
  apiSecret: process.env.SMUGMUG_API_SECRET!,
  accessToken: process.env.SMUGMUG_ACCESS_TOKEN!,
  accessTokenSecret: process.env.SMUGMUG_ACCESS_TOKEN_SECRET!,
  username: process.env.SMUGMUG_USERNAME || 'ninochavez',
  baseUrl: 'https://api.smugmug.com/api/v2',
};

// OAuth 1.0a client
const oauth = new OAuth({
  consumer: {
    key: config.apiKey,
    secret: config.apiSecret,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

const token = {
  key: config.accessToken,
  secret: config.accessTokenSecret,
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make authenticated OAuth request to SmugMug API
 *
 * FIXES:
 * - Issue #3: No longer retries 401/403 errors (prevents nonce reuse)
 * - Issue #8: Supports AbortSignal for request cancellation
 */
const makeSmugMugRequest: SmugMugRequestFn = async <T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> => {
  const url = `${config.baseUrl}${endpoint}`;
  const requestData = { url, method: 'GET' };

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Generate fresh OAuth signature for each attempt (prevents nonce reuse)
      const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...authHeader,
          'Accept': 'application/json',
        },
        signal: options?.signal, // Support request cancellation
      });

      if (!response.ok) {
        // FIX: Don't retry auth errors (prevents OAuth nonce reuse)
        if (response.status === 401 || response.status === 403) {
          const text = await response.text().catch(() => '');
          throw new Error(
            `Auth error: ${response.status} ${response.statusText}${text ? ` - ${text.substring(0, 200)}` : ''}`
          );
        }

        // Retry rate limits with exponential backoff
        if (response.status === 429) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`[SmugMug] Rate limited, retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
          await sleep(delay);
          continue;
        }

        // For other errors, throw immediately
        const errorText = await response.text();
        throw new Error(
          `SmugMug API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`
        );
      }

      const data = await response.json();
      return data.Response as T;
    } catch (error) {
      lastError = error as Error;

      // Don't retry auth errors or aborted requests
      if (
        error instanceof Error &&
        (error.message.includes('Auth error') || error.name === 'AbortError')
      ) {
        throw error;
      }

      // Retry network errors with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[SmugMug] Request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('API request failed after all retries');
};

/**
 * Create SmugMug client with OAuth transport
 *
 * All shared logic is in common.ts - only the OAuth transport is unique here
 */
const client = createSmugMugClient({
  username: config.username,
  requestFn: makeSmugMugRequest,
  cacheMaxSize: 100, // Limit cache to 100 entries (fixes unbounded growth)
});

/**
 * Export client methods for use in Next.js API routes
 *
 * Usage:
 * - fetchAlbums(): Get album list
 * - fetchAlbumImages(albumKey): Get images for specific album (lazy)
 * - fetchImageExif(imageKey): Get EXIF metadata
 * - fetchGalleryData(): Get all albums (images loaded on-demand)
 */
export const {
  fetchAlbums,
  fetchAlbumImages,
  fetchImageExif,
  fetchGalleryData,
  clearCache,
  getCacheStats,
} = client;
