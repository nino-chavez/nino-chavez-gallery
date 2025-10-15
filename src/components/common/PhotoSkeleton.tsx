import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * PhotoSkeleton Component
 *
 * Aspect-ratio specific skeleton placeholder for photo grid items.
 * Prevents layout shift (CLS) by maintaining 1:1 aspect ratio during loading.
 *
 * Features:
 * - 1:1 square aspect ratio for consistent grid layout
 * - Shimmer animation with gradient effect for perceived progress
 * - Accepts custom className for grid positioning
 * - Uses forwardRef for ref composition
 *
 * @example
 * ```tsx
 * // Basic usage
 * <PhotoSkeleton />
 *
 * // With custom className
 * <PhotoSkeleton className="col-span-2" />
 * ```
 */

export interface PhotoSkeletonProps {
  /**
   * Additional CSS classes to apply to the skeleton container
   */
  className?: string;
}

export const PhotoSkeleton = forwardRef<HTMLDivElement, PhotoSkeletonProps>(
  ({ className }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="photo-skeleton"
        className={cn(
          'relative overflow-hidden rounded-lg',
          'aspect-square', // 1:1 aspect ratio for square photos
          'bg-gray-700',
          className
        )}
        role="status"
        aria-busy="true"
        aria-label="Loading photo"
      >
        {/* Shimmer gradient animation */}
        <div
          className={cn(
            'absolute inset-0',
            'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700',
            'animate-shimmer'
          )}
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      </div>
    );
  }
);

PhotoSkeleton.displayName = 'PhotoSkeleton';
