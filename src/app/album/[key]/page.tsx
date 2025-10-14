import { notFound } from 'next/navigation';
import { fetchAlbums, fetchAlbumImages } from '@/lib/smugmug/client';
import { AlbumPageClient } from '@/components/AlbumPageClient';
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

        {/* Photo Gallery with Lightbox and Prefetch Tracking */}
        <AlbumPageClient albumKey={key} images={album.Images} />
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
