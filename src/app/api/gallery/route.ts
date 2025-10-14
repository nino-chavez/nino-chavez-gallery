import { NextResponse } from 'next/server';
import { fetchGalleryData } from '@/lib/smugmug/client';

/**
 * GET /api/gallery
 *
 * Fetches complete gallery data from SmugMug (lazy loading)
 * Albums are loaded with metadata, images loaded on-demand
 */
export async function GET() {
  try {
    const galleryData = await fetchGalleryData();

    return NextResponse.json({
      success: true,
      username: process.env.SMUGMUG_USERNAME || 'ninochavez',
      generatedAt: new Date().toISOString(),
      totalAlbums: galleryData.albums.length,
      totalPhotos: galleryData.totalImages,
      albums: galleryData.albums.map(album => ({
        albumKey: album.AlbumKey,
        name: album.Title,
        description: album.Description,
        photoCount: album.TotalImageCount,
        keywords: album.Keywords,
      })),
    });
  } catch (error) {
    console.error('[API] Error loading gallery:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load gallery context',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
