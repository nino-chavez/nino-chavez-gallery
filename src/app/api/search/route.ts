import { NextResponse } from 'next/server';
import { fetchAlbums, fetchAlbumImages } from '@/lib/smugmug/client';

export const dynamic = 'force-dynamic';

/**
 * Search API - Returns individual photos for granular search
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

    // Fetch albums
    const albums = await fetchAlbums();
    const albumsToSearch = albums.slice(0, limit);

    if (!includePhotos) {
      // Return just album-level data
      return NextResponse.json({
        albums: albumsToSearch.map(album => ({
          albumKey: album.AlbumKey,
          albumName: album.Title,
          description: album.Description || '',
          keywords: album.Keywords || '',
          photoCount: album.TotalImageCount,
        })),
        totalAlbums: albums.length,
        searchedAlbums: albumsToSearch.length,
      });
    }

    // Fetch photos from each album in parallel
    const albumsWithPhotos = await Promise.all(
      albumsToSearch.map(async (album) => {
        try {
          const images = await fetchAlbumImages(album.AlbumKey);

          return {
            albumKey: album.AlbumKey,
            albumName: album.Title,
            albumDescription: album.Description || '',
            albumKeywords: album.Keywords || '',
            photos: images.map(img => ({
              imageKey: img.ImageKey,
              fileName: img.FileName,
              title: img.Title || '',
              caption: img.Caption || '',
              keywords: img.Keywords || '',
              thumbnailUrl: img.ThumbnailUrl,
              imageUrl: img.ArchivedUri || img.ImageDownloadUrl || img.ThumbnailUrl,
              albumKey: album.AlbumKey,
              albumName: album.Title,
            })),
          };
        } catch (error) {
          console.error(`Failed to fetch images for album ${album.AlbumKey}:`, error);
          return {
            albumKey: album.AlbumKey,
            albumName: album.Title,
            albumDescription: album.Description || '',
            albumKeywords: album.Keywords || '',
            photos: [],
          };
        }
      })
    );

    // Flatten photos from all albums
    const allPhotos = albumsWithPhotos.flatMap(album => album.photos);

    return NextResponse.json({
      photos: allPhotos,
      totalPhotos: allPhotos.length,
      totalAlbums: albums.length,
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
