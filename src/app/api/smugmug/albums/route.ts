import { NextResponse } from 'next/server';
import { fetchAlbums } from '@/lib/smugmug/client';

/**
 * GET /api/smugmug/albums
 *
 * Fetches all albums from SmugMug
 * Uses server-side OAuth client with caching
 */
export async function GET() {
  try {
    const albums = await fetchAlbums();

    return NextResponse.json({
      success: true,
      data: albums,
      meta: {
        totalAlbums: albums.length,
        totalPhotos: albums.reduce((sum, album) => sum + album.TotalImageCount, 0),
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch albums:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch albums',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
