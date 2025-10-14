import { notFound } from 'next/navigation';
import Image from 'next/image';
import { fetchAlbums, fetchAlbumImages } from '@/lib/smugmug/client';
import { formatMetadata, getDisplayTags } from '@/lib/metadata-formatter';
import type { SmugMugAlbum, SmugMugImage } from '@/types/smugmug';

interface AlbumWithImages extends SmugMugAlbum {
  Images: SmugMugImage[];
}

async function getAlbum(albumKey: string): Promise<AlbumWithImages | null> {
  try {
    // Fetch album list to get metadata
    const albums = await fetchAlbums();
    const album = albums.find(a => a.AlbumKey === albumKey);

    if (!album) {
      return null;
    }

    // Fetch images for this album
    const images = await fetchAlbumImages(albumKey);

    return {
      ...album,
      Images: images,
    };
  } catch (error) {
    console.error(`Failed to fetch album ${albumKey}:`, error);
    return null;
  }
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const album = await getAlbum(key);

  if (!album) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Albums
          </a>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            {album.Title}
          </h1>
          {album.Description && (
            <p className="text-lg text-zinc-400 mb-6 max-w-3xl">{album.Description}</p>
          )}
          <div className="flex items-center gap-6 text-sm">
            <span className="text-zinc-400">
              <span className="text-white font-semibold">{album.Images.length}</span> {album.Images.length === 1 ? 'photo' : 'photos'}
            </span>
            {album.Keywords && (
              <>
                <span className="text-zinc-700">•</span>
                <span className="text-zinc-500">{album.Keywords.split(';').slice(0, 3).map(k => k.trim()).join(', ')}</span>
              </>
            )}
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {album.Images.map((photo) => (
            <div
              key={photo.ImageKey}
              className="group bg-zinc-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all duration-200"
            >
              <div className="relative aspect-square bg-zinc-800">
                <Image
                  src={photo.ThumbnailUrl}
                  alt={photo.Title || photo.FileName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
              {(() => {
                const formatted = formatMetadata({
                  title: photo.Title,
                  caption: photo.Caption,
                  keywords: photo.Keywords,
                });
                const displayTags = getDisplayTags({
                  title: photo.Title,
                  caption: photo.Caption,
                  keywords: photo.Keywords,
                }, 3);

                return (
                  <div className="p-4">
                    <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">
                      {formatted.displayTitle}
                    </h3>
                    {formatted.displayCaption && (
                      <p className="text-xs text-zinc-500 line-clamp-2 mb-2">
                        {formatted.displayCaption}
                      </p>
                    )}
                    {displayTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {displayTags.map((tag, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-1 rounded ${
                              tag.category === 'sport'
                                ? 'bg-blue-900/30 text-blue-400 border border-blue-800'
                                : tag.category === 'action'
                                ? 'bg-orange-900/30 text-orange-400 border border-orange-800'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export async function generateStaticParams() {
  try {
    const albums = await fetchAlbums();

    return albums.map((album) => ({
      key: album.AlbumKey,
    }));
  } catch (error) {
    console.error('Failed to generate static params:', error);
    return [];
  }
}
