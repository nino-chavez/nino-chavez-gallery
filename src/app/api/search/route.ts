import { NextResponse } from 'next/server';

// Type definitions for gallery context
interface Photo {
  imageKey: string;
  fileName: string;
  title: string;
  caption: string;
  keywords: string[];
  uploadDate: string;
  imageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

interface Album {
  albumKey: string;
  name: string;
  description: string;
  urlName: string;
  photoCount: number;
  createdDate: string;
  lastUpdated: string;
  keywords?: string;
  photos: Photo[];
}

interface GalleryContext {
  username: string;
  generatedAt: string;
  totalAlbums: number;
  totalPhotos: number;
  enrichedPhotos: number;
  albums: Album[];
}

const galleryContext = require('@/../../gallery-context.json') as GalleryContext;

export const dynamic = 'force-dynamic';

/**
 * Search API - Returns individual photos for granular search using pre-built gallery context
 *
 * Query params:
 * - limit: Max albums to search (default: 10, max: 50)
 * - includePhotos: Whether to include photo details (default: true)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const includePhotos = searchParams.get('includePhotos') !== 'false';

    // Use pre-built gallery context (instant, no API calls)
    const albums = galleryContext.albums.slice(0, limit);

    if (!includePhotos) {
      // Return just album-level data
      return NextResponse.json({
        albums: albums.map(album => ({
          albumKey: album.albumKey,
          albumName: album.name,
          description: album.description || '',
          keywords: album.keywords || '',
          photoCount: album.photoCount,
        })),
        totalAlbums: galleryContext.totalAlbums,
        searchedAlbums: albums.length,
      });
    }

    // Use photos from context (already loaded)
    const albumsWithPhotos = albums.map(album => ({
      albumKey: album.albumKey,
      albumName: album.name,
      albumDescription: album.description || '',
      albumKeywords: album.keywords || '',
      photos: album.photos.map(img => ({
        imageKey: img.imageKey,
        fileName: img.fileName,
        title: img.title || '',
        caption: img.caption || '',
        keywords: img.keywords || [],
        thumbnailUrl: img.thumbnailUrl,
        imageUrl: img.imageUrl,
        albumKey: album.albumKey,
        albumName: album.name,
      })),
    }));

    // Flatten photos from all albums
    const allPhotos = albumsWithPhotos.flatMap(album => album.photos);

    return NextResponse.json({
      photos: allPhotos,
      totalPhotos: allPhotos.length,
      totalAlbums: galleryContext.totalAlbums,
      searchedAlbums: albumsWithPhotos.length,
      albums: albumsWithPhotos.map(({ photos, ...album }) => album),
    });
  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load search data' },
      { status: 500 }
    );
  }
}
