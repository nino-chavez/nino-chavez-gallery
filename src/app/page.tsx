'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { QualityGradientGrid } from '@/components/portfolio/QualityGradientGrid';
import { PlayTypeMorphGrid } from '@/components/gallery/PlayTypeMorphGrid';
import { EmotionTimeline } from '@/components/interactions/EmotionTimeline';
import { MagneticFilterBar } from '@/components/filters/MagneticFilterBar';
import { ContextualCursor } from '@/components/interactions/ContextualCursor';
import { Heading, Text } from '@/components/ui';
import { usePhotoFilters } from '@/hooks/usePhotoFilters';
import type { PhotoFilterState, Photo } from '@/types/photo';

type ViewMode = 'grid' | 'quality' | 'timeline';

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PortfolioPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('quality');
  const [filters, setFilters] = useState<PhotoFilterState>({});
  const [hoveredPhoto, setHoveredPhoto] = useState<Photo | null>(null);

  // Replace useEffect + fetch with SWR for instant navigation & caching
  const { data, error, isLoading } = useSWR(
    '/api/gallery?portfolioWorthy=true',
    fetcher,
    {
      revalidateOnFocus: false,      // Don't refetch on window focus
      revalidateOnReconnect: false,  // Don't refetch on network reconnect
      dedupingInterval: 60000,       // Dedupe identical requests within 60s
      revalidateIfStale: true,       // Revalidate stale data in background
    }
  );

  const photos = data?.photos || [];
  const filteredPhotos = usePhotoFilters(photos, filters);

  return (
    <div className="portfolio-page min-h-screen">
      {/* Contextual cursor */}
      <ContextualCursor hoveredPhoto={hoveredPhoto} />

      {/* Header - Minimal, Photos First */}
      <header className="mx-auto max-w-7xl px-6 pt-12 pb-8">
        <Heading level={1} className="mb-2">
          Portfolio
        </Heading>
        <Text variant="caption">
          {filteredPhotos.length} photos
        </Text>

        {/* Simple text filters - minimal, top right */}
        <div className="absolute top-12 right-6 flex gap-4 text-xs">
          <button
            className={`transition-colors ${
              viewMode === 'quality'
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
            onClick={() => setViewMode('quality')}
          >
            Quality
          </button>
          <button
            className={`transition-colors ${
              viewMode === 'grid'
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button
            className={`transition-colors ${
              viewMode === 'timeline'
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </button>
        </div>
      </header>

      {/* Loading state with modern spinner */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 animate-fade-in-up">
          <div className="text-center">
            <div className="spinner mx-auto mb-6"></div>
            <Text variant="body" className="text-lg">Loading portfolio...</Text>
          </div>
        </div>
      )}

      {/* Empty state - Vercel style */}
      {!isLoading && filteredPhotos.length === 0 && (
        <div className="relative mx-auto max-w-2xl px-8 py-20 text-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12">
            <svg className="w-16 h-16 mx-auto mb-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <Heading level={2} className="mb-3">No photos found</Heading>
            <Text variant="body" className="mb-6 text-white/50">
              Try adjusting your filters or check back later
            </Text>
            <button
              onClick={() => setFilters({})}
              className="px-6 py-3 text-sm font-medium rounded-xl bg-white text-black hover:bg-white/90 transition-all duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Render based on view mode */}
      {!isLoading && filteredPhotos.length > 0 && (
        <div
          className="relative px-8 pb-12"
          onMouseEnter={() => {}}
          onMouseLeave={() => setHoveredPhoto(null)}
        >
          {viewMode === 'quality' && (
            <QualityGradientGrid
              photos={filteredPhotos}
              onPhotoClick={(photo) => setHoveredPhoto(photo)}
            />
          )}
          {viewMode === 'grid' && (
            <PlayTypeMorphGrid
              photos={filteredPhotos}
              activePlayType={null}
              onPhotoClick={(photo) => setHoveredPhoto(photo)}
            />
          )}
          {viewMode === 'timeline' && (
            <EmotionTimeline
              photos={filteredPhotos}
              onPhotoSetChange={(filtered) => {
                // Timeline filtering handled by EmotionTimeline internally
                console.log('Timeline showing', filtered.length, 'photos');
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
