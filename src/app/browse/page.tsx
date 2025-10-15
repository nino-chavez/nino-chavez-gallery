'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { MagneticFilterBar } from '@/components/filters/MagneticFilterBar';
import { PlayTypeMorphGrid } from '@/components/gallery/PlayTypeMorphGrid';
import { StoryGenerationModal } from '@/components/story/StoryGenerationModal';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState, EmptyState } from '@/components/common/ErrorState';
import { Heading, Text } from '@/components/ui';
import { usePhotoFilters } from '@/hooks/usePhotoFilters';
import type { PhotoFilterState, Photo } from '@/types/photo';

/**
 * SWR fetcher function for gallery API
 */
const fetcher = (url: string) => fetch(url).then(r => r.json());

/**
 * Browse Page
 *
 * Main browsing interface for discovering volleyball photos through
 * interactive magnetic filter orbs and photo grid with smooth morphing animations.
 *
 * Features:
 * - Fetches all photos from gallery API with SWR
 * - Interactive magnetic filter orbs for filtering
 * - Responsive photo grid with layout animations
 * - Story generation button with modal integration
 * - Loading and error states with retry
 * - Responsive layout for mobile (375px), tablet (768px), desktop (1280px+)
 */
export default function BrowsePage() {
  // Filter state management
  const [filters, setFilters] = useState<PhotoFilterState>({});

  // Story generation modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // SWR data fetching with caching and deduplication
  const { data, error, isLoading, mutate } = useSWR(
    '/api/gallery',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // Extract photos from API response
  const photos = data?.photos || [];

  // Apply client-side filtering
  const filteredPhotos = usePhotoFilters(photos, filters);

  // Loading state
  if (isLoading) {
    return (
      <div className="browse-page min-h-screen">
        <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8">
          <Heading level={1} className="mb-2">Browse Gallery</Heading>
        </header>
        <LoadingState message="Loading gallery..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="browse-page min-h-screen">
        <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8">
          <Heading level={1} className="mb-2">Browse Gallery</Heading>
        </header>
        <ErrorState
          message="Failed to load gallery. Please try again."
          onRetry={() => mutate()}
          error={error}
        />
      </div>
    );
  }

  return (
    <div className="browse-page min-h-screen">
      {/* Page Header - Responsive padding and typography */}
      <header className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8">
        <Heading level={1} className="mb-2">Browse Gallery</Heading>
        <Text variant="caption">
          Discover volleyball photos through interactive filters
        </Text>

        {/* Generate Story Button - Top Right */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute top-8 sm:top-10 lg:top-12 right-4 sm:right-6 lg:right-8 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-sm font-medium"
          aria-label="Generate story from filtered photos"
        >
          Generate Story
        </button>
      </header>

      {/* Magnetic Filter Bar - Responsive spacing */}
      <div className="mb-8 sm:mb-10 lg:mb-12">
        <MagneticFilterBar
          filters={filters}
          onChange={setFilters}
          photoCount={filteredPhotos.length}
        />
      </div>

      {/* Photo Grid - Responsive padding */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 lg:pb-12">
        {filteredPhotos.length === 0 ? (
          <EmptyState
            icon="📸"
            title="No photos found"
            description="Try adjusting your filters to see more photos"
            action={{
              label: 'Clear Filters',
              onClick: () => setFilters({}),
            }}
          />
        ) : (
          <PlayTypeMorphGrid
            photos={filteredPhotos}
            activePlayType={null}
            onPhotoClick={(photo) => {
              // Photo click handler - can be extended later
              console.log('Photo clicked:', photo.id);
            }}
          />
        )}
      </main>

      {/* Story Generation Modal */}
      <StoryGenerationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        context={{
          type: 'browse',
          id: 'all-photos',
          name: 'Browse Gallery',
        }}
      />
    </div>
  );
}
