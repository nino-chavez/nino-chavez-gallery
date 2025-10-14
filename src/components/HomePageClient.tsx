'use client';

import { useState, useEffect } from 'react';
import { usePrefetchAlbums, usePrefetchCandidates } from '@/lib/hooks/usePrefetch';
import { useBrowseData } from '@/lib/hooks/useBrowseData';
import { LayoutSwitcher } from './LayoutSwitcher';
import { SportFirstLayout } from './layouts/SportFirstLayout';
import { TimelineLayout } from './layouts/TimelineLayout';
import { ActionTypeLayout } from './layouts/ActionTypeLayout';
import { CollectionsLayout } from './layouts/CollectionsLayout';
import Image from 'next/image';
import Link from 'next/link';
import type { BrowseLayout } from '@/types/layout';
import { LAYOUT_STORAGE_KEY, DEFAULT_LAYOUT } from '@/types/layout';

interface Album {
  albumKey: string;
  name: string;
  description: string;
  photoCount: number;
  keywords: string;
  thumbnailUrl?: string;
}

interface HomePageClientProps {
  initialAlbums: Album[];
  totalAlbums: number;
  totalPages: number;
}

/**
 * Client-side home page component with multiple browse layouts
 */
export function HomePageClient({ initialAlbums, totalAlbums, totalPages }: HomePageClientProps) {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<BrowseLayout>(DEFAULT_LAYOUT);

  // Extract browse data for all layouts
  const browseData = useBrowseData(albums);

  // Get prefetch candidates based on user behavior
  const prefetchCandidates = usePrefetchCandidates(3);

  // Prefetch popular/recent albums
  usePrefetchAlbums(prefetchCandidates);

  // Load saved layout preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY) as BrowseLayout | null;
      if (saved) {
        setCurrentLayout(saved);
      }
    }
  }, []);

  const loadPage = async (page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/albums?page=${page}&limit=12&thumbnails=true`);
      if (!response.ok) throw new Error('Failed to fetch albums');

      const data = await response.json();
      setAlbums(data.albums);
      setCurrentPage(page);

      // Scroll to top of albums grid
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to load page:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render layout selector
  const renderLayout = () => {
    switch (currentLayout) {
      case 'sport-first':
        return <SportFirstLayout sports={browseData.sports} />;
      case 'timeline':
        return <TimelineLayout timeline={browseData.timeline} />;
      case 'action-type':
        return <ActionTypeLayout actionTypes={browseData.actionTypes} />;
      case 'collections':
        return <CollectionsLayout collections={browseData.collections} />;
      case 'grid':
      default:
        return renderGridLayout();
    }
  };

  // Grid layout with pagination
  const renderGridLayout = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {albums.map((album) => (
          <Link
            key={album.albumKey}
            href={`/album/${album.albumKey}`}
            prefetch={prefetchCandidates.includes(album.albumKey)}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => loadPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => loadPage(pageNum)}
                  disabled={isLoading}
                  className={`min-w-[40px] px-3 py-2 rounded-lg transition-colors duration-200 ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => loadPage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg p-6 flex items-center gap-4">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-white font-medium">Loading albums...</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Layout Switcher */}
      <div className="mb-8 flex justify-end">
        <LayoutSwitcher
          currentLayout={currentLayout}
          onLayoutChange={setCurrentLayout}
        />
      </div>

      {/* Render Active Layout */}
      {renderLayout()}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg p-6 flex items-center gap-4">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-white font-medium">Loading albums...</span>
          </div>
        </div>
      )}
    </>
  );
}
