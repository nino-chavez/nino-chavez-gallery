import { NextResponse } from 'next/server';
import { fetchPhotos, testConnection } from '@/lib/supabase/client';
import type { PhotoFilterState } from '@/types/photo';

/**
 * GET /api/gallery
 *
 * Fetches enriched photo data from Supabase
 * Supports filtering by portfolioWorthy, quality, play types, etc.
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);

    // Build filters from query params
    const filters: PhotoFilterState = {};

    if (searchParams.get('portfolioWorthy') === 'true') {
      filters.portfolioWorthy = true;
    }

    if (searchParams.get('printReady') === 'true') {
      filters.printReady = true;
    }

    if (searchParams.get('socialMediaOptimized') === 'true') {
      filters.socialMediaOptimized = true;
    }

    const minQuality = searchParams.get('minQualityScore');
    if (minQuality) {
      filters.minQualityScore = parseFloat(minQuality);
    }

    const playTypes = searchParams.get('playTypes');
    if (playTypes) {
      filters.playTypes = playTypes.split(',');
    }

    const emotions = searchParams.get('emotions');
    if (emotions) {
      filters.emotions = emotions.split(',');
    }

    // Fetch photos from Supabase
    const photos = await fetchPhotos(filters);

    return NextResponse.json(
      {
        success: true,
        photos,
        count: photos.length,
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          // Cache for 5 minutes, serve stale up to 1h while revalidating
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
          'CDN-Cache-Control': 'max-age=300',
        },
      }
    );
  } catch (error) {
    console.error('[API] Error loading gallery:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load gallery',
        message: error instanceof Error ? error.message : 'Unknown error',
        photos: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * Test endpoint to verify database connection
 */
export async function HEAD() {
  try {
    const stats = await testConnection();

    return new Response(null, {
      status: stats.connected ? 200 : 503,
      headers: {
        'X-Total-Photos': stats.totalPhotos.toString(),
        'X-Portfolio-Photos': stats.portfolioPhotos.toString(),
      },
    });
  } catch (error) {
    return new Response(null, { status: 503 });
  }
}
