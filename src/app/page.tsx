import { fetchGalleryData } from '@/lib/smugmug/client';

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
  }>;
}

async function getGalleryContext(): Promise<GalleryContext> {
  const galleryData = await fetchGalleryData();

  return {
    username: process.env.SMUGMUG_USERNAME || 'ninochavez',
    generatedAt: new Date().toISOString(),
    totalAlbums: galleryData.albums.length,
    totalPhotos: galleryData.totalImages,
    albums: galleryData.albums.map(album => ({
      albumKey: album.AlbumKey,
      name: album.Title,
      description: album.Description || '',
      photoCount: album.TotalImageCount,
      keywords: album.Keywords || '',
    })),
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

        {/* Albums Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {context.albums.map((album) => (
            <a
              key={album.albumKey}
              href={`/album/${album.albumKey}`}
              className="group block bg-zinc-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all duration-200"
            >
              {/* Placeholder for album thumbnail */}
              <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {/* Photo count badge */}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black/80 backdrop-blur-sm text-white">
                    {album.photoCount}
                  </span>
                </div>
              </div>

              {/* Album Info */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-white mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {album.name}
                </h2>
                {album.description && (
                  <p className="text-sm text-zinc-500 line-clamp-2 mb-3">{album.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}</span>
                  {album.keywords && (
                    <>
                      <span className="text-zinc-800">•</span>
                      <span className="text-zinc-600">{album.keywords.split(';')[0]?.trim()}</span>
                    </>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
