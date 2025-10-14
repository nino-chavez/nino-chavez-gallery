import { NextRequest, NextResponse } from 'next/server';
import { fetchGalleryData, fetchAlbumImages } from '@/lib/smugmug/client';

/**
 * GET /api/albums
 *
 * Paginated albums API with optional thumbnail loading
 *
 * Query params:
 * - page: Page number (1-indexed, default: 1)
 * - limit: Albums per page (default: 12, max: 50)
 * - thumbnails: Load thumbnails (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const loadThumbnails = searchParams.get('thumbnails') !== 'false';

    // Fetch all albums (cached)
    const galleryData = await fetchGalleryData();

    // Calculate pagination
    const totalAlbums = galleryData.albums.length;
    const totalPages = Math.ceil(totalAlbums / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalAlbums);

    // Get page slice
    const albumsSlice = galleryData.albums.slice(startIndex, endIndex);

    // Optionally load thumbnails (first image from each album)
    const albums = loadThumbnails
      ? await Promise.all(
          albumsSlice.map(async (album) => {
            try {
              const images = await fetchAlbumImages(album.AlbumKey);
              const firstImage = images[0];

              return {
                albumKey: album.AlbumKey,
                name: album.Title,
                description: album.Description || '',
                photoCount: album.TotalImageCount,
                keywords: album.Keywords || '',
                thumbnailUrl: firstImage?.ThumbnailUrl || undefined,
              };
            } catch (error) {
              console.error(`Failed to fetch thumbnail for album ${album.AlbumKey}:`, error);
              return {
                albumKey: album.AlbumKey,
                name: album.Title,
                description: album.Description || '',
                photoCount: album.TotalImageCount,
                keywords: album.Keywords || '',
              };
            }
          })
        )
      : albumsSlice.map((album) => ({
          albumKey: album.AlbumKey,
          name: album.Title,
          description: album.Description || '',
          photoCount: album.TotalImageCount,
          keywords: album.Keywords || '',
        }));

    return NextResponse.json({
      albums,
      pagination: {
        page,
        limit,
        totalAlbums,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      metadata: {
        username: process.env.SMUGMUG_USERNAME || 'ninochavez',
        totalPhotos: galleryData.totalImages,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[API /albums] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    );
  }
}
