import { NextRequest, NextResponse } from 'next/server';
import { fetchAlbumImages } from '@/lib/smugmug/client';

/**
 * GET /api/smugmug/albums/[key]
 *
 * Fetches images for a specific album from SmugMug
 * Uses server-side OAuth client with caching
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: 'Album key is required',
        },
        { status: 400 }
      );
    }

    const images = await fetchAlbumImages(key);

    return NextResponse.json({
      success: true,
      data: images,
      meta: {
        albumKey: key,
        totalImages: images.length,
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch album images:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch album images',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
