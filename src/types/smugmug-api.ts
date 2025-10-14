/**
 * SmugMug API v2 Response Types
 *
 * Based on official API documentation and reference app verification.
 * These types represent the actual API response structures.
 */

/**
 * Standard SmugMug API response wrapper
 */
export interface SmugMugApiResponse<T> {
  Response: T;
  Code: number;
  Message: string;
}

/**
 * Pagination metadata (when applicable)
 */
export interface PageInfo {
  Total?: number;
  Start?: number;
  Count?: number;
  NextPage?: string;
  PrevPage?: string;
}

/**
 * Album list response from /user/{username}!albums
 */
export interface AlbumsResponse {
  Album: AlbumRaw[];
  Pages?: PageInfo;
}

/**
 * Raw album data from SmugMug API
 */
export interface AlbumRaw {
  AlbumKey: string;
  Name: string;
  Description?: string;
  Keywords?: string;
  KeywordArray?: string[];
  UrlName: string;
  ImageCount: number;
  Date: string;
  Uri: string;
  Uris: {
    AlbumImages: { Uri: string };
    HighlightImage?: { Uri: string };
  };
}

/**
 * Album images response from /album/{albumKey}!images
 *
 * NOTE: Using _expand=LargestImage (verified from reference app)
 * NOT using _expand=ImageSizeDetails (unverified structure)
 */
export interface AlbumImagesResponse {
  AlbumImage: AlbumImageRaw[];
  Image?: AlbumImageRaw[]; // Alternative response key
  Pages?: PageInfo;
}

/**
 * Raw image data from SmugMug API
 *
 * Structure verified against reference app (smugmugService.ts:234-249)
 */
export interface AlbumImageRaw {
  ImageKey: string;
  Title?: string;
  Caption?: string;
  Keywords?: string;
  KeywordArray?: string[];
  FileName: string;
  Format: string;
  Width: number;
  Height: number;
  ArchivedUri: string;
  UploadKey: string;
  Date: string;
  Uri: string;
  Uris: {
    ImageMetadata?: { Uri: string };
    ImageSizes?: { Uri: string };
    /**
     * Expanded when using _expand=LargestImage
     * Reference: smugmugService.ts line 234
     */
    LargestImage?: {
      Uri: string;
    };
    /**
     * Alternative expansion structure (future use)
     */
    ImageSizeDetails?: {
      Uri: string;
      ImageSizeDetails?: ImageSizeDetails;
    };
  };
}

/**
 * Image size details (if expanded via _expand=ImageSizeDetails)
 *
 * NOTE: Current implementation uses LargestImage instead.
 * This is kept for future enhancement.
 */
export interface ImageSizeDetails {
  TinyImageUrl?: string;
  ThumbImageUrl?: string;
  SmallImageUrl?: string;
  MediumImageUrl?: string;
  LargeImageUrl?: string;
  XLargeImageUrl?: string;
  X2LargeImageUrl?: string;
  X3LargeImageUrl?: string;
  OriginalImageUrl?: string;
}

/**
 * Image metadata/EXIF response from /image/{imageKey}!metadata
 */
export interface ImageMetadataResponse {
  ImageMetadata: {
    ISO?: number;
    Aperture?: string;
    FocalLength?: string;
    ExposureTime?: string;
    Make?: string;
    Model?: string;
    Lens?: string;
    DateTime?: string;
    GPSLatitude?: number;
    GPSLongitude?: number;
  };
}

/**
 * Type guard to check if LargestImage expansion is present
 */
export function hasLargestImage(img: AlbumImageRaw): img is AlbumImageRaw & {
  Uris: { LargestImage: { Uri: string } };
} {
  return !!img.Uris?.LargestImage?.Uri;
}

/**
 * Type guard to check if ImageSizeDetails expansion is present
 */
export function hasImageSizeDetails(img: AlbumImageRaw): img is AlbumImageRaw & {
  Uris: { ImageSizeDetails: { ImageSizeDetails: ImageSizeDetails } };
} {
  return !!img.Uris?.ImageSizeDetails?.ImageSizeDetails;
}

/**
 * Safe accessor for image URLs with proper fallback chain
 */
export function getImageUrls(img: AlbumImageRaw): {
  thumbnail: string;
  large: string;
  original: string;
} {
  // Primary: Use LargestImage expansion (verified pattern from reference app)
  if (hasLargestImage(img)) {
    return {
      thumbnail: img.ArchivedUri, // SmugMug auto-generates thumbnails
      large: img.Uris.LargestImage.Uri,
      original: img.ArchivedUri,
    };
  }

  // Secondary: Use ImageSizeDetails if expanded
  if (hasImageSizeDetails(img)) {
    const details = img.Uris.ImageSizeDetails.ImageSizeDetails;
    return {
      thumbnail: details.ThumbImageUrl || details.TinyImageUrl || img.ArchivedUri,
      large: details.LargeImageUrl || details.XLargeImageUrl || img.ArchivedUri,
      original: details.OriginalImageUrl || img.ArchivedUri,
    };
  }

  // Fallback: Use ArchivedUri for all sizes
  return {
    thumbnail: img.ArchivedUri,
    large: img.ArchivedUri,
    original: img.ArchivedUri,
  };
}

/**
 * Validate expansion presence and log warnings
 */
export function validateExpansion(img: AlbumImageRaw, expectedExpansion: 'LargestImage' | 'ImageSizeDetails'): boolean {
  if (expectedExpansion === 'LargestImage' && !hasLargestImage(img)) {
    console.warn(`[SmugMug API] LargestImage expansion missing for image ${img.ImageKey}. Using fallback URLs.`);
    return false;
  }

  if (expectedExpansion === 'ImageSizeDetails' && !hasImageSizeDetails(img)) {
    console.warn(`[SmugMug API] ImageSizeDetails expansion missing for image ${img.ImageKey}. Using fallback URLs.`);
    return false;
  }

  return true;
}
