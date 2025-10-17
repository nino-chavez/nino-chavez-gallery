'use client';

/**
 * Skeleton Components
 *
 * Configurable skeleton loader components for various content types.
 * Provides smooth loading states with pulse animations to improve perceived performance.
 *
 * Features:
 * - Pulse animation (opacity 0.5 → 1.0 → 0.5)
 * - Configurable counts and aspect ratios
 * - Grid-aware layouts that match actual content
 * - ARIA labels for screen readers
 * - Prevents layout shift (CLS)
 *
 * Usage:
 * - PhotoGridSkeleton: Photo gallery grids (masonry/standard)
 * - StoryCardSkeleton: Story card lists and carousels
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// PhotoGridSkeleton
// ============================================================================

export interface PhotoGridSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Number of skeleton items to display
   * @default 12
   */
  count?: number;

  /**
   * Grid layout variant
   * @default 'standard'
   */
  variant?: 'standard' | 'masonry' | 'portfolio';
}

/**
 * PhotoGridSkeleton Component
 *
 * Displays skeleton placeholders for photo grids with configurable count and layout.
 * Matches the actual grid layout to prevent layout shift when content loads.
 *
 * @example
 * ```tsx
 * // Basic usage (12 items)
 * <PhotoGridSkeleton />
 *
 * // Custom count (24 items)
 * <PhotoGridSkeleton count={24} />
 *
 * // Portfolio variant (larger items)
 * <PhotoGridSkeleton variant="portfolio" count={8} />
 * ```
 */
export const PhotoGridSkeleton = forwardRef<HTMLDivElement, PhotoGridSkeletonProps>(
  ({ count = 12, variant = 'standard', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="photo-grid-skeleton"
        className={cn(
          'photo-grid-skeleton',
          {
            // Standard grid: 2-6 columns
            'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-2 md:gap-3 lg:gap-4':
              variant === 'standard',
            // Masonry grid: 1-4 columns with variable heights
            'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6':
              variant === 'masonry',
            // Portfolio grid: larger, 2-4 columns
            'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6':
              variant === 'portfolio',
          },
          className
        )}
        role="status"
        aria-busy="true"
        aria-label="Loading photos..."
        {...props}
      >
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCard
            key={`skeleton-${index}`}
            variant={variant}
          />
        ))}
      </div>
    );
  }
);

PhotoGridSkeleton.displayName = 'PhotoGridSkeleton';

// ============================================================================
// StoryCardSkeleton
// ============================================================================

export interface StoryCardSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Number of skeleton items to display
   * @default 3
   */
  count?: number;

  /**
   * Display layout (grid or horizontal carousel)
   * @default 'grid'
   */
  layout?: 'grid' | 'carousel';
}

/**
 * StoryCardSkeleton Component
 *
 * Displays skeleton placeholders for story cards with configurable count and layout.
 * Matches the aspect ratio and layout of actual story cards.
 *
 * @example
 * ```tsx
 * // Grid layout
 * <StoryCardSkeleton count={6} layout="grid" />
 *
 * // Horizontal carousel
 * <StoryCardSkeleton count={3} layout="carousel" />
 * ```
 */
export const StoryCardSkeleton = forwardRef<HTMLDivElement, StoryCardSkeletonProps>(
  ({ count = 3, layout = 'grid', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="story-card-skeleton"
        className={cn(
          'story-card-skeleton',
          {
            // Grid layout: 1-3 columns
            'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6': layout === 'grid',
            // Horizontal carousel: flex with gap
            'flex gap-4 overflow-x-auto pb-4': layout === 'carousel',
          },
          className
        )}
        role="status"
        aria-busy="true"
        aria-label="Loading stories..."
        {...props}
      >
        {Array.from({ length: count }).map((_, index) => (
          <StoryCard key={`story-skeleton-${index}`} layout={layout} />
        ))}
      </div>
    );
  }
);

StoryCardSkeleton.displayName = 'StoryCardSkeleton';

// ============================================================================
// Internal Components
// ============================================================================

interface SkeletonCardProps {
  variant: 'standard' | 'masonry' | 'portfolio';
}

/**
 * Individual skeleton card for photo grids
 */
function SkeletonCard({ variant }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-gray-800',
        {
          // Standard and Portfolio: square aspect ratio
          'aspect-square': variant === 'standard' || variant === 'portfolio',
          // Masonry: 4:3 aspect ratio
          'aspect-[4/3]': variant === 'masonry',
        }
      )}
    >
      {/* Pulse animation background */}
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800',
          'animate-pulse-skeleton'
        )}
        style={{
          backgroundSize: '200% 100%',
        }}
      />

      {/* Simulated badge overlay (top-left) */}
      <div className="absolute top-3 left-3 w-16 h-6 bg-gray-700 rounded-full animate-pulse-skeleton" />

      {/* Simulated metadata overlay (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
        <div className="w-3/4 h-4 bg-gray-700 rounded animate-pulse-skeleton" />
        <div className="w-1/2 h-3 bg-gray-700 rounded animate-pulse-skeleton" />
      </div>
    </div>
  );
}

interface StoryCardProps {
  layout: 'grid' | 'carousel';
}

/**
 * Individual skeleton card for story lists
 */
function StoryCard({ layout }: StoryCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-gray-800',
        {
          // Grid: full width with 16:9 aspect
          'w-full aspect-video': layout === 'grid',
          // Carousel: fixed width with 16:9 aspect
          'w-80 flex-shrink-0 aspect-video': layout === 'carousel',
        }
      )}
    >
      {/* Pulse animation background */}
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800',
          'animate-pulse-skeleton'
        )}
        style={{
          backgroundSize: '200% 100%',
        }}
      />

      {/* Simulated story type badge */}
      <div className="absolute top-4 left-4 w-24 h-8 bg-gray-700 rounded-full animate-pulse-skeleton" />

      {/* Simulated title and description */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
        <div className="w-2/3 h-6 bg-gray-700 rounded animate-pulse-skeleton" />
        <div className="w-full h-4 bg-gray-700 rounded animate-pulse-skeleton" />
        <div className="w-4/5 h-4 bg-gray-700 rounded animate-pulse-skeleton" />

        {/* Simulated emotion timeline */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 h-2 bg-gray-700 rounded-full animate-pulse-skeleton" />
          <div className="flex-1 h-2 bg-gray-700 rounded-full animate-pulse-skeleton" />
          <div className="flex-1 h-2 bg-gray-700 rounded-full animate-pulse-skeleton" />
        </div>
      </div>
    </div>
  );
}
