'use client';

import { usePrefetchAlbums, usePrefetchCandidates } from '@/lib/hooks/usePrefetch';
import Image from 'next/image';
import Link from 'next/link';

interface Album {
  albumKey: string;
  name: string;
  description: string;
  photoCount: number;
  keywords: string;
  thumbnailUrl?: string;
}

interface HomePageClientProps {
  albums: Album[];
}

/**
 * Client-side home page component with intelligent prefetching
 */
export function HomePageClient({ albums }: HomePageClientProps) {
  // Get prefetch candidates based on user behavior
  const prefetchCandidates = usePrefetchCandidates(3);

  // Prefetch popular/recent albums
  usePrefetchAlbums(prefetchCandidates);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {albums.map((album) => (
        <Link
          key={album.albumKey}
          href={`/album/${album.albumKey}`}
          prefetch={prefetchCandidates.includes(album.albumKey)} // Next.js prefetch for top candidates
          className="group block bg-zinc-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all duration-200"
        >
          {/* Album thumbnail */}
          <div className="aspect-square bg-zinc-800 relative overflow-hidden">
            {album.thumbnailUrl ? (
              <Image
                src={album.thumbnailUrl}
                alt={album.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-16 h-16 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
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
        </Link>
      ))}
    </div>
  );
}
