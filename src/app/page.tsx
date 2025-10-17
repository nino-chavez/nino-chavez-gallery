'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { QualityGradientGrid } from '@/components/portfolio/QualityGradientGrid';
import { PlayTypeMorphGrid } from '@/components/gallery/PlayTypeMorphGrid';
import { EmotionTimeline } from '@/components/interactions/EmotionTimeline';
import { MagneticFilterBar } from '@/components/filters/MagneticFilterBar';
import { ContextualCursor } from '@/components/interactions/ContextualCursor';
import { EmotionNavigationCard } from '@/components/emotion/EmotionNavigationCard';
import { RecentStoriesCarousel } from '@/components/story/RecentStoriesCarousel';
import { Heading, Text } from '@/components/ui';
import { usePhotoFilters } from '@/hooks/usePhotoFilters';
import type { PhotoFilterState, Photo } from '@/types/photo';
import type { EmotionType } from '@/contexts/EmotionContext';

type ViewMode = 'grid' | 'quality' | 'timeline';

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then(r => r.json());

/**
 * Homepage Component
 * Task 2.1.3: Integrate emotion cards on homepage
 * Task 2.4.5: Create RecentStoriesCarousel for homepage
 *
 * Features:
 * - Grid of 6 emotion navigation cards
 * - Display photo count per emotion
 * - Responsive grid (2 cols mobile, 3 cols desktop)
 * - Recent stories carousel
 *
 * Acceptance criteria:
 * - Cards render in correct grid layout
 * - Photo counts accurate from database
 * - Responsive on all breakpoints
 * - Recent stories carousel displays 3-5 stories
 */
export default function HomePage() {
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

  // Task 2.1.3: Calculate photo counts per emotion
  const emotionCounts = useMemo(() => {
    const counts: Record<EmotionType, number> = {
      triumph: 0,
      focus: 0,
      intensity: 0,
      determination: 0,
      excitement: 0,
      serenity: 0,
    };

    photos.forEach((photo: Photo) => {
      const emotion = photo.metadata?.emotion;
      if (emotion && emotion in counts) {
        counts[emotion as EmotionType]++;
      }
    });

    return counts;
  }, [photos]);

  return (
    <div className="home-page min-h-screen">
      {/* Contextual cursor */}
      <ContextualCursor hoveredPhoto={hoveredPhoto} />

      {/* Task 1.2.1: Semantic header landmark */}
      <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-8">
        {/* Task 1.2.2: Single H1 for homepage */}
        <Heading level={1} className="mb-2">
          Nino Chavez Photography
        </Heading>
        <Text variant="caption">
          {filteredPhotos.length} photos
        </Text>

        {/* Task 1.2.1: Navigation landmark for view mode filters */}
        <nav className="absolute top-8 sm:top-12 right-4 sm:right-6" aria-label="View mode selection">
          <div className="flex gap-3 sm:gap-4 text-xs">
            <button
              className={`transition-colors ${
                viewMode === 'quality'
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
              onClick={() => setViewMode('quality')}
              aria-pressed={viewMode === 'quality'}
              aria-label="Quality view mode"
            >
              Quality
            </button>
            <button
              className={`transition-colors ${
                viewMode === 'grid'
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label="Grid view mode"
            >
              Grid
            </button>
            <button
              className={`transition-colors ${
                viewMode === 'timeline'
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
              onClick={() => setViewMode('timeline')}
              aria-pressed={viewMode === 'timeline'}
              aria-label="Timeline view mode"
            >
              Timeline
            </button>
          </div>
        </nav>
      </header>

      {/* Task 1.2.1: Main content landmark with id for skip-to-content */}
      <main id="main-content" className="mx-auto max-w-7xl">
        {/* Task 2.4.5: Recent Stories Carousel Section */}
        <section
          className="px-4 sm:px-6 lg:px-8 mb-12"
        >
          <RecentStoriesCarousel />
        </section>

        {/* Task 2.1.3: Emotion Navigation Cards Section */}
        <section
          className="px-4 sm:px-6 lg:px-8 mb-12"
          aria-labelledby="emotion-navigation-heading"
        >
          <Heading level={2} id="emotion-navigation-heading" className="mb-6 text-2xl">
            Browse by Emotion
          </Heading>

          {/* Task 2.1.3: Responsive grid - 2 cols mobile, 3 cols desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {(['triumph', 'focus', 'intensity', 'determination', 'excitement', 'serenity'] as EmotionType[]).map(
              (emotion) => (
                <EmotionNavigationCard
                  key={emotion}
                  emotion={emotion}
                  photoCount={emotionCounts[emotion]}
                />
              )
            )}
          </div>
        </section>

        {/* Loading state with modern spinner */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 animate-fade-in-up">
            <div className="text-center">
              <div className="spinner mx-auto mb-6" role="status" aria-label="Loading"></div>
              <Text variant="body" className="text-lg">Loading portfolio...</Text>
            </div>
          </div>
        )}

        {/* Empty state - Vercel style */}
        {!isLoading && filteredPhotos.length === 0 && (
          <section className="relative mx-auto max-w-2xl px-8 py-20 text-center" aria-labelledby="empty-state-heading">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12">
              <svg className="w-16 h-16 mx-auto mb-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {/* Task 1.2.2: Proper heading hierarchy H1 → H2 */}
              <Heading level={2} id="empty-state-heading" className="mb-3">No photos found</Heading>
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
          </section>
        )}

        {/* Photo gallery section */}
        {!isLoading && filteredPhotos.length > 0 && (
          <section
            className="relative px-4 sm:px-6 lg:px-8 pb-12"
            aria-labelledby="gallery-heading"
            onMouseEnter={() => {}}
            onMouseLeave={() => setHoveredPhoto(null)}
          >
            {/* Task 1.2.2: Visually hidden heading for screen readers */}
            <h2 id="gallery-heading" className="sr-only">Photo Gallery</h2>

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
          </section>
        )}
      </main>
    </div>
  );
}
