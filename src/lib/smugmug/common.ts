/**
 * SmugMug Common Client Logic
 *
 * Fixes audit issue #6: Massive Code Duplication (95%)
 *
 * This module extracts all shared logic from direct (OAuth) and proxy clients,
 * leaving only the transport layer as the difference.
 *
 * Benefits:
 * - Single source of truth for business logic
 * - Eliminates 320 lines of duplication
 * - Type-safe with proper API response types
 * - Easier testing and maintenance
 */

import type { SmugMugGalleryData, SmugMugImage, SmugMugAlbum } from '../../types/smugmug';
import type {
  AlbumsResponse,
  AlbumImagesResponse,
  AlbumImageRaw,
  ImageMetadataResponse,
} from '../../types/smugmug-api';
import { getImageUrls, validateExpansion } from '../../types/smugmug-api';
import { SmugMugCache, CACHE_TTL, type CacheStats } from '../cache/smugmug-cache';

/**
 * Request function interface - implemented by dev OAuth client and production proxy client
 */
export interface SmugMugRequestFn {
  <T>(endpoint: string, options?: RequestOptions): Promise<T>;
}

/**
 * Request options for advanced features
 */
export interface RequestOptions {
  signal?: AbortSignal; // For request cancellation
}

/**
 * Configuration for SmugMug client
 */
export interface SmugMugClientConfig {
  username: string;
  requestFn: SmugMugRequestFn;
  cacheMaxSize?: number;
}

/**
 * Creates a SmugMug client with shared logic
 */
export function createSmugMugClient(config: SmugMugClientConfig) {
  const cache = new SmugMugCache(config.cacheMaxSize || 100);
  const pendingRequests = new Map<string, Promise<any>>(); // Request deduplication

  /**
   * Parse raw album data to application format
   */
  function parseAlbum(raw: any): SmugMugAlbum {
    return {
      AlbumKey: raw.AlbumKey,
      Title: raw.Name,
      Description: raw.Description || '',
      Keywords: raw.Keywords || '',
      ImagesUri: raw.Uris.AlbumImages.Uri,
      Images: [],
      TotalImageCount: raw.ImageCount || 0,
    };
  }

  /**
   * Parse raw image data to application format
   *
   * Uses verified LargestImage expansion pattern from reference app
   * (smugmugService.ts line 234-249)
   */
  function parseImage(raw: AlbumImageRaw): SmugMugImage {
    // Validate expansion (logs warning if missing)
    validateExpansion(raw, 'LargestImage');

    // Get URLs with safe fallback chain
    const urls = getImageUrls(raw);

    return {
      ImageKey: raw.ImageKey,
      Title: raw.Title || raw.FileName,
      Caption: raw.Caption || '',
      Keywords: raw.Keywords || '',
      FileName: raw.FileName,
      Format: raw.Format,
      Width: raw.Width,
      Height: raw.Height,
      ArchivedUri: raw.ArchivedUri,
      ThumbnailUrl: urls.thumbnail,
      LargeImageUrl: urls.large,
      OriginalImageUrl: urls.original,
      UploadKey: raw.UploadKey,
      Date: raw.Date,
    };
  }

  /**
   * Request deduplication wrapper
   *
   * Fixes audit issue #7: No Request Deduplication
   *
   * Prevents multiple identical requests from firing simultaneously
   */
  async function deduplicatedRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Return existing promise if request is in-flight
    if (pendingRequests.has(key)) {
      console.log(`[SmugMug] Deduplicating request: ${key}`);
      return pendingRequests.get(key)!;
    }

    // Start new request
    const promise = requestFn();
    pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up after request completes
      pendingRequests.delete(key);
    }
  }

  /**
   * Fetch all albums for the configured user with pagination
   */
  async function fetchAlbums(options?: RequestOptions): Promise<SmugMugAlbum[]> {
    const cacheKey = `albums:${config.username}`;

    // Check cache first
    const cached = cache.get<SmugMugAlbum[]>(cacheKey);
    if (cached) {
      console.log('[SmugMug] Using cached albums');
      return cached;
    }

    console.log(`[SmugMug] Fetching all albums for user: ${config.username}`);

    // Deduplicate requests
    return deduplicatedRequest(cacheKey, async () => {
      let allAlbums: any[] = [];
      let start = 1;
      const count = 100; // Max per page

      // Pagination loop - fetch all pages
      while (true) {
        console.log(`[SmugMug] Fetching albums page (start=${start}, count=${count})`);

        const response = await config.requestFn<AlbumsResponse>(
          `/user/${config.username}!albums?count=${count}&start=${start}`,
          options
        );

        const pageAlbums = response.Album || [];
        allAlbums.push(...pageAlbums);

        console.log(`[SmugMug] Fetched ${pageAlbums.length} albums (total so far: ${allAlbums.length})`);

        // Check if we've fetched all albums
        // SmugMug returns fewer than requested when on last page
        if (pageAlbums.length < count || !response.Pages?.NextPage) {
          break;
        }

        start += count;
      }

      const albums = allAlbums.map(parseAlbum);
      cache.set(cacheKey, albums, CACHE_TTL.albums);

      console.log(`[SmugMug] Successfully loaded ${albums.length} total albums`);
      return albums;
    });
  }

  /**
   * Fetch images from a specific album
   *
   * Uses _expand=LargestImage (verified from reference app)
   */
  async function fetchAlbumImages(
    albumKey: string,
    options?: RequestOptions
  ): Promise<SmugMugImage[]> {
    const cacheKey = `images:${albumKey}`;

    // Check cache first
    const cached = cache.get<SmugMugImage[]>(cacheKey);
    if (cached) {
      console.log(`[SmugMug] Using cached images for album: ${albumKey}`);
      return cached;
    }

    console.log(`[SmugMug] Fetching images for album: ${albumKey}`);

    // Deduplicate requests
    return deduplicatedRequest(cacheKey, async () => {
      const response = await config.requestFn<AlbumImagesResponse>(
        `/album/${albumKey}!images?_expand=LargestImage&_sort=DateUploaded&_sortdirection=Descending`,
        options
      );

      // Handle both response formats (AlbumImage or Image)
      const rawImages = response.AlbumImage || response.Image || [];
      const images = rawImages.map(parseImage);

      cache.set(cacheKey, images, CACHE_TTL.images);

      console.log(`[SmugMug] Loaded ${images.length} images from album: ${albumKey}`);
      return images;
    });
  }

  /**
   * Fetch EXIF metadata for a specific image
   */
  async function fetchImageExif(
    imageKey: string,
    options?: RequestOptions
  ): Promise<Partial<SmugMugImage> | null> {
    const cacheKey = `exif:${imageKey}`;

    // Check cache first (EXIF never expires)
    const cached = cache.get<Partial<SmugMugImage>>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await config.requestFn<ImageMetadataResponse>(
        `/image/${imageKey}!metadata`,
        options
      );

      const exif = {
        ISO: response.ImageMetadata.ISO,
        Aperture: response.ImageMetadata.Aperture,
        FocalLength: response.ImageMetadata.FocalLength,
        ExposureTime: response.ImageMetadata.ExposureTime,
        Make: response.ImageMetadata.Make,
        Model: response.ImageMetadata.Model,
      };

      cache.set(cacheKey, exif, CACHE_TTL.exif);
      return exif;
    } catch (error) {
      console.warn(`[SmugMug] Failed to fetch EXIF for image ${imageKey}:`, error);
      return null;
    }
  }

  /**
   * Fetch gallery data with lazy loading
   *
   * Fixes audit issue #2: N+1 Query Anti-Pattern
   *
   * NEW BEHAVIOR:
   * - Only fetches album metadata initially
   * - Images are loaded on-demand when user opens an album
   * - Reduces initial API calls from 21 (1 + 20) to 1
   *
   * Aligned with design strategy: "AI-First Discovery" (line 25-30)
   * Users rarely browse all albums, so don't fetch all images upfront.
   */
  async function fetchGalleryData(options?: RequestOptions): Promise<SmugMugGalleryData> {
    console.log('[SmugMug] Loading gallery data (lazy mode)...');

    const albums = await fetchAlbums(options);

    // Return albums WITHOUT images (lazy loading)
    const totalImages = albums.reduce((sum, album) => sum + album.TotalImageCount, 0);

    console.log(`[SmugMug] Loaded ${albums.length} albums with ${totalImages} total images (lazy)`);

    return {
      albums,
      totalImages,
    };
  }

  /**
   * DEPRECATED: Fetch all gallery data eagerly (N+1 anti-pattern)
   *
   * This is the old behavior that causes performance issues.
   * Kept for backward compatibility but should not be used.
   *
   * @deprecated Use fetchGalleryData() with lazy loading instead
   */
  async function fetchGalleryDataEager(options?: RequestOptions): Promise<SmugMugGalleryData> {
    console.warn('[SmugMug] Using DEPRECATED eager loading. Switch to lazy loading for better performance.');

    const albums = await fetchAlbums(options);

    // Fetch all images for all albums (N+1 anti-pattern)
    const albumsWithImages = await Promise.all(
      albums.map(async (album) => {
        const images = await fetchAlbumImages(album.AlbumKey, options);
        return { ...album, Images: images };
      })
    );

    const totalImages = albumsWithImages.reduce(
      (sum, album) => sum + album.Images.length,
      0
    );

    console.log(`[SmugMug] Loaded ${albumsWithImages.length} albums with ${totalImages} total images (eager)`);

    return {
      albums: albumsWithImages,
      totalImages,
    };
  }

  /**
   * Clear all cached data
   */
  function clearCache(): void {
    cache.clear();
    console.log('[SmugMug] Cache cleared');
  }

  /**
   * Get cache statistics for monitoring
   */
  function getCacheStats(): CacheStats {
    return cache.getStats();
  }

  /**
   * Destroy cache and cleanup resources
   */
  function destroy(): void {
    cache.destroy();
  }

  // Return public API
  return {
    fetchAlbums,
    fetchAlbumImages,
    fetchImageExif,
    fetchGalleryData, // Lazy loading (default)
    fetchGalleryDataEager, // Eager loading (deprecated)
    clearCache,
    getCacheStats,
    destroy,
  };
}

/**
 * Export type for the client
 */
export type SmugMugClient = ReturnType<typeof createSmugMugClient>;
