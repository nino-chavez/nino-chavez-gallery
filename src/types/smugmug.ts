/**
 * SmugMug API Types
 *
 * These types represent the SmugMug API structure for
 * fetching and displaying photos from the SmugMug service.
 */

export interface SmugMugImage {
  ImageKey: string;
  Title: string;
  Caption?: string;
  Keywords?: string;
  FileName: string;
  Format: string;
  Width: number;
  Height: number;
  ArchivedUri: string;
  ThumbnailUrl: string;
  LargeImageUrl: string;
  OriginalImageUrl: string;
  UploadKey: string;
  Date: string;
  DateUploaded?: string;
  Altitude?: number;
  Latitude?: number;
  Longitude?: number;
  // EXIF data
  ISO?: number;
  Aperture?: string;
  FocalLength?: string;
  ExposureTime?: string;
  Make?: string;
  Model?: string;
  LensModel?: string;
  Flash?: string;
  WhiteBalance?: string;
  // File info
  OriginalHeight?: number;
  OriginalWidth?: number;
  OriginalSize?: number;
}

export interface SmugMugAlbum {
  AlbumKey: string;
  Title: string;
  Description?: string;
  Keywords?: string;
  ImagesUri: string;
  Images: SmugMugImage[];
  TotalImageCount: number;
  // Privacy settings
  Privacy?: 'Public' | 'Unlisted' | 'Private';
  WorldSearchable?: boolean;
  SmugSearchable?: string;
}

export interface SmugMugGalleryData {
  albums: SmugMugAlbum[];
  totalImages: number;
}
