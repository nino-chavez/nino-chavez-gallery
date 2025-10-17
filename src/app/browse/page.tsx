'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { PhotoFilters } from '@/components/filters/PhotoFilters';
import { PlayTypeMorphGrid } from '@/components/gallery/PlayTypeMorphGrid';
import { StoryGenerationModal } from '@/components/story/StoryGenerationModal';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
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
 * interactive filters and photo grid with smooth morphing animations.
 *
 * Features:
 * - Fetches all photos from gallery API with SWR
 * - Comprehensive filter controls via PhotoFilters
 * - Responsive photo grid with layout animations
 * - Story generation button with modal integration
 * - Loading and error states with retry
 * - Responsive layout for mobile (375px), tablet (768px), desktop (1280px+)
 */
export default function BrowsePage() {
  const router = useRouter();

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
        {/* Task 1.2.1: Semantic header landmark */}
        <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8">
          {/* Task 1.2.2: Single H1 per page */}
          <Heading level={1} className="mb-2">Browse Gallery</Heading>
        </header>
        {/* Task 1.2.1: Main content landmark */}
        <main id="main-content">
          <LoadingState message="Loading gallery..." />
        </main>
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
        <main id="main-content">
          <ErrorState
            message="Failed to load gallery. Please try again."
            onRetry={() => mutate()}
            error={error}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="browse-page min-h-screen">
      {/* Task 1.2.1: Semantic header landmark */}
      <header className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8">
        {/* Task 1.2.2: Single H1 per page */}
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

      {/* Task 1.2.1: Main content landmark with id for skip-to-content */}
      <main id="main-content">
        {/* Task 1.2.1: Section for filters with navigation landmark */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8 sm:mb-10 lg:mb-12">
          <nav aria-label="Photo filters">
            {/* Task 1.2.2: Visually hidden heading for screen readers */}
            <h2 className="sr-only">Filter Options</h2>
            <PhotoFilters
              filters={filters}
              onChange={setFilters}
              photoCount={filteredPhotos.length}
            />
          </nav>
        </div>

        {/* Photo Grid Section - Responsive padding */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 lg:pb-12" aria-labelledby="photo-grid-heading">
          {/* Task 1.2.2: Visually hidden heading for screen readers */}
          <h2 id="photo-grid-heading" className="sr-only">Photo Grid</h2>

          {filteredPhotos.length === 0 ? (
            // Task 3.1.4: Integrate EmptyState component for browse page
            <EmptyState
              type="browse"
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
                // Navigate to photo detail page
                router.push(`/photo/${photo.id}`);
              }}
            />
          )}
        </section>
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
