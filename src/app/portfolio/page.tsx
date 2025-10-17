'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { AnimatePresence, motion } from 'framer-motion';
import { QualityGradientGrid } from '@/components/portfolio/QualityGradientGrid';
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid';
import { PhotoGravity } from '@/components/portfolio/PhotoGravity';
import { MagneticFilterBar } from '@/components/filters/MagneticFilterBar';
import { StoryGenerationModal } from '@/components/story/StoryGenerationModal';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Heading, Text, Button } from '@/components/ui';
import { useEmotion, type EmotionType } from '@/contexts/EmotionContext';
import type { Photo } from '@/types/photo';
import { Sparkles } from 'lucide-react';

/**
 * SWR fetcher function for gallery API
 */
const fetcher = (url: string) => fetch(url).then(r => r.json());

/**
 * View mode type definition
 */
type ViewMode = 'gradient' | 'grid' | '3d';

/**
 * Portfolio Page Component
 *
 * Inner component that uses useSearchParams and must be wrapped in Suspense
 */
function PortfolioPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeEmotion } = useEmotion();

  // View mode state management
  const [viewMode, setViewMode] = useState<ViewMode>('gradient');

  // Task 2.4.3: Story generation modal state
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  // Initialize view mode from URL params (Task 2.2)
  useEffect(() => {
    const mode = searchParams.get('view') as ViewMode;
    if (mode && ['gradient', 'grid', '3d'].includes(mode)) {
      setViewMode(mode);
    }
  }, [searchParams]);

  // Handle browser back/forward navigation (Task 2.2)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('view') as ViewMode;
      if (mode && ['gradient', 'grid', '3d'].includes(mode)) {
        setViewMode(mode);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Build API query based on active emotion filter
  const apiQuery = useMemo(() => {
    const params = new URLSearchParams({
      portfolioWorthy: 'true',
      minQualityScore: '8',
    });

    // Task 2.2.5: Add emotion filter to API query
    if (activeEmotion) {
      params.append('emotions', activeEmotion);
    }

    return `/api/gallery?${params.toString()}`;
  }, [activeEmotion]);

  // SWR data fetching with caching and deduplication
  const { data, error, isLoading, mutate } = useSWR(
    apiQuery,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // Extract photos from API response
  const photos: Photo[] = data?.photos || [];

  // Handle view mode change with URL sync (Task 2.1, 2.2)
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    router.push(`/portfolio?view=${mode}`);
  };

  // Handle photo click navigation (for gradient and 3D views)
  const handlePhotoClick = (photo: Photo) => {
    router.push(`/photo/${photo.id}?returnUrl=/portfolio?view=${viewMode}`);
  };

  // Limit photos for 3D view performance (Task 2.5)
  const photos3D = useMemo(() => {
    if (viewMode === '3d' && photos.length > 100) {
      // Take top 100 by quality score
      return [...photos]
        .sort((a, b) => {
          const scoreA = a.metadata?.composition_score || 0;
          const scoreB = b.metadata?.composition_score || 0;
          return scoreB - scoreA;
        })
        .slice(0, 100);
    }
    return photos;
  }, [photos, viewMode]);

  // Loading state
  if (isLoading) {
    return (
      <div className="portfolio-page min-h-screen">
        {/* Task 1.2.1: Semantic header landmark */}
        <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8">
          {/* Task 1.2.2: Single H1 per page */}
          <Heading level={1} className="mb-6">Portfolio</Heading>
        </header>
        {/* Task 1.2.1: Main content landmark */}
        <main id="main-content">
          <LoadingState message="Loading portfolio..." />
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="portfolio-page min-h-screen">
        <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8">
          <Heading level={1} className="mb-6">Portfolio</Heading>
        </header>
        <main id="main-content">
          <ErrorState
            message="Failed to load portfolio. Please try again."
            onRetry={() => mutate()}
            error={error}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="portfolio-page min-h-screen">
      {/* Task 1.2.1: Semantic header landmark */}
      <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            {/* Task 1.2.2: Single H1 per page */}
            <Heading level={1} className="mb-2">Portfolio</Heading>
            {/* Photo Count Display */}
            <Text variant="caption">
              {photos.length} portfolio photos
            </Text>
          </div>

          {/* Task 2.4.3: "Generate Story" CTA button */}
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsStoryModalOpen(true)}
            disabled={photos.length === 0}
            className="flex items-center gap-2"
            aria-label="Generate story from portfolio photos"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Generate Story</span>
          </Button>
        </div>

        {/* Task 1.2.1: Navigation landmark for view mode toggles */}
        <nav className="flex flex-wrap gap-2 mb-4" aria-label="View mode selection">
          <ViewModeButton
            active={viewMode === 'gradient'}
            onClick={() => handleViewModeChange('gradient')}
            icon="🎨"
            label="Quality Gradient"
          />
          <ViewModeButton
            active={viewMode === 'grid'}
            onClick={() => handleViewModeChange('grid')}
            icon="📐"
            label="Grid"
          />
          <ViewModeButton
            active={viewMode === '3d'}
            onClick={() => handleViewModeChange('3d')}
            icon="🌐"
            label="3D Gravity"
          />
        </nav>
      </header>

      {/* Task 1.2.1: Main content landmark with id for skip-to-content */}
      <main id="main-content" className="pb-8 sm:pb-10 lg:pb-12">
        {/* Task 2.2.5: MagneticFilterBar replaces PhotoFilters */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8" aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="sr-only">Filter Photos by Emotion</h2>
          <MagneticFilterBar />
        </section>

        <AnimatePresence mode="wait">
          {/* Quality Gradient View (Task 2.3) */}
          {viewMode === 'gradient' && photos.length > 0 && (
            <motion.div
              key="gradient-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <section aria-labelledby="gradient-view-heading">
                {/* Task 1.2.2: Visually hidden heading for screen readers */}
                <h2 id="gradient-view-heading" className="sr-only">Quality Gradient View</h2>
                <QualityGradientGrid
                  photos={photos}
                  onPhotoClick={handlePhotoClick}
                />
              </section>
            </motion.div>
          )}

          {/* Grid View (Task 2.4) */}
          {viewMode === 'grid' && photos.length > 0 && (
            <motion.div
              key="grid-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
            >
              <section aria-labelledby="grid-view-heading">
                <h2 id="grid-view-heading" className="sr-only">Grid View</h2>
                <PortfolioGrid photos={photos} />
              </section>
            </motion.div>
          )}

          {/* 3D Gravity View (Task 2.5) */}
          {viewMode === '3d' && (
            <motion.div
              key="3d-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {photos.length <= 100 ? (
                <section aria-labelledby="3d-view-heading">
                  <h2 id="3d-view-heading" className="sr-only">3D Gravity View</h2>
                  <PhotoGravity
                    photos={photos3D}
                    onPhotoClick={handlePhotoClick}
                  />
                </section>
              ) : (
                <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center py-12" aria-labelledby="3d-limit-heading">
                  <h2 id="3d-limit-heading" className="sr-only">3D View Limited</h2>
                  <Text variant="body" className="text-lg mb-4">
                    3D view limited to 100 photos for performance
                  </Text>
                  <Text variant="caption" className="mb-6">
                    Showing top 100 by quality score. Switch to Grid view to see all {photos.length} photos.
                  </Text>
                  <button
                    onClick={() => handleViewModeChange('grid')}
                    className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Switch to Grid View
                  </button>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state - Task 3.1.4: Integrate EmptyState component */}
        {photos.length === 0 && (
          <EmptyState
            type="portfolio"
            action={{
              label: 'Browse All Photos',
              onClick: () => router.push('/browse'),
            }}
          />
        )}
      </main>

      {/* Task 2.4.3: StoryGenerationModal integration */}
      <StoryGenerationModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        context={{
          type: 'portfolio',
          id: 'portfolio',
          name: 'Portfolio',
        }}
      />
    </div>
  );
}

/**
 * View Mode Toggle Button Component (Task 2.1)
 */
interface ViewModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

function ViewModeButton({ active, onClick, icon, label }: ViewModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-black text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      aria-label={`Switch to ${label} view`}
      aria-pressed={active}
    >
      <span className="mr-1 sm:mr-2">{icon}</span>
      {label}
    </button>
  );
}

/**
 * Portfolio Page
 *
 * Showcases curated, portfolio-quality volleyball photos through multiple view modes:
 * - Quality Gradient: GSAP-animated brightness/blur effects based on quality
 * - Grid: Masonry grid with sort controls
 * - 3D Gravity: Three.js 3D clustering view with similarity scoring
 *
 * Features:
 * - Fetches only portfolio-worthy photos (quality 8+) from gallery API
 * - Three view mode toggles with URL persistence
 * - Task 2.2.5: MagneticFilterBar for emotion filtering
 * - Task 2.4.3: "Generate Story" CTA button
 * - Responsive layout for mobile (375px), tablet (768px), desktop (1280px+)
 * - Loading and error states with retry
 * - Photo click navigation to detail page with return URL
 *
 * Wrapped in Suspense to handle useSearchParams() CSR bailout
 */
export default function PortfolioPage() {
  return (
    <Suspense fallback={
      <div className="portfolio-page min-h-screen">
        <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8">
          <Heading level={1} className="mb-6">Portfolio</Heading>
        </header>
        <main id="main-content">
          <LoadingState message="Loading portfolio..." />
        </main>
      </div>
    }>
      <PortfolioPageContent />
    </Suspense>
  );
}
