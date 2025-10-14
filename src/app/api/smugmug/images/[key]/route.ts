import { NextRequest, NextResponse } from 'next/server';
import { fetchImageExif } from '@/lib/smugmug/client';

/**
 * GET /api/smugmug/images/[key]
 *
 * Fetches EXIF metadata for a specific image from SmugMug
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
          error: 'Image key is required',
        },
        { status: 400 }
      );
    }

    const exif = await fetchImageExif(key);

    if (!exif) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch EXIF data',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: exif,
      meta: {
        imageKey: key,
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch image EXIF:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch image EXIF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
