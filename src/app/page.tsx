import { fetchGalleryData, fetchAlbumImages } from '@/lib/smugmug/client';
import { HomePageClient } from '@/components/HomePageClient';

interface GalleryContext {
  username: string;
  generatedAt: string;
  totalAlbums: number;
  totalPhotos: number;
  albums: Array<{
    albumKey: string;
    name: string;
    description: string;
    photoCount: number;
    keywords: string;
    thumbnailUrl?: string;
  }>;
}

async function getGalleryContext(): Promise<GalleryContext> {
  const galleryData = await fetchGalleryData();

  // Fetch first image from each album for thumbnails (in parallel with limit)
  const albumsWithThumbnails = await Promise.all(
    galleryData.albums.slice(0, 20).map(async (album) => {
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

  // Add remaining albums without thumbnails
  const remainingAlbums = galleryData.albums.slice(20).map(album => ({
    albumKey: album.AlbumKey,
    name: album.Title,
    description: album.Description || '',
    photoCount: album.TotalImageCount,
    keywords: album.Keywords || '',
  }));

  return {
    username: process.env.SMUGMUG_USERNAME || 'ninochavez',
    generatedAt: new Date().toISOString(),
    totalAlbums: galleryData.albums.length,
    totalPhotos: galleryData.totalImages,
    albums: [...albumsWithThumbnails, ...remainingAlbums],
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

        {/* Albums Grid with Intelligent Prefetching */}
        <HomePageClient albums={context.albums} />
      </div>
    </main>
  );
}
