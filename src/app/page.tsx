import { fetchGalleryData, fetchAlbumImages } from '@/lib/smugmug/client';
import { HomePageClient } from '@/components/HomePageClient';

interface Album {
  albumKey: string;
  name: string;
  description: string;
  photoCount: number;
  keywords: string;
  thumbnailUrl?: string;
}

interface GalleryContext {
  username: string;
  generatedAt: string;
  totalAlbums: number;
  totalPhotos: number;
  albums: Album[];
  initialPage: number;
  totalPages: number;
}

/**
 * Get initial gallery context for SSR
 *
 * Performance optimizations:
 * - Only loads first 12 albums on initial page load
 * - Fetches thumbnails in parallel with limit
 * - Reduces API calls from 21+ to 13 (1 albums + 12 thumbnails)
 * - Client can lazy-load more albums via API
 */
async function getGalleryContext(): Promise<GalleryContext> {
  const galleryData = await fetchGalleryData();

  const ALBUMS_PER_PAGE = 12;
  const totalPages = Math.ceil(galleryData.albums.length / ALBUMS_PER_PAGE);

  // Only load first page of albums with thumbnails
  const firstPageAlbums = galleryData.albums.slice(0, ALBUMS_PER_PAGE);

  const albumsWithThumbnails = await Promise.all(
    firstPageAlbums.map(async (album) => {
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
  );

  return {
    username: process.env.SMUGMUG_USERNAME || 'ninochavez',
    generatedAt: new Date().toISOString(),
    totalAlbums: galleryData.albums.length,
    totalPhotos: galleryData.totalImages,
    albums: albumsWithThumbnails,
    initialPage: 1,
    totalPages,
  };
}

export default async function HomePage() {
  const context = await getGalleryContext();

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
                Action Sports Photography
              </h1>
              <p className="text-lg text-zinc-400 max-w-2xl">
                Professional skateboarding, BMX, and extreme sports photography by {context.username}
              </p>
            </div>
            <a
              href="/search"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Search Photos
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <span className="text-zinc-400">
              <span className="text-white font-semibold">{context.totalAlbums}</span> albums
            </span>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-400">
              <span className="text-white font-semibold">{context.totalPhotos.toLocaleString()}</span> photos
            </span>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-500">Updated {new Date(context.generatedAt).toLocaleDateString()}</span>
          </div>
        </header>

        {/* Albums Grid with Pagination */}
        <HomePageClient
          initialAlbums={context.albums}
          totalAlbums={context.totalAlbums}
          totalPages={context.totalPages}
        />
      </div>
    </main>
  );
}
