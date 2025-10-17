'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import type { Photo } from '@/types/photo';
import { Button, Text } from '@/components/ui';
import { PhotoGridSkeleton } from '@/components/common/Skeleton';
import { MOTION, EMOTION_PALETTE } from '@/lib/motion-tokens';
import type { EmotionType } from '@/components/transitions';
import { QualityBadgeGroup } from './QualityBadge';

interface PortfolioGridProps {
  photos: Photo[];
  isLoading?: boolean;
}

/**
 * Task 2.3.3: Sort options type
 * Includes new quality-based sort options
 */
type SortOption = 'quality' | 'emotion' | 'recent' | 'portfolio-first' | 'highest-quality';

// Animation variants for staggered entrance
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 50ms stagger delay between items
      delayChildren: 0.1, // 100ms delay before first item starts
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION.duration.base, // 0.3s fade-in per item
      ease: [0.16, 1, 0.3, 1], // MOTION.ease.easeOut
    },
  },
};

/**
 * Get emotion-specific hover configuration
 * Each emotion has a unique hover behavior for contextual micro-interactions
 */
function getEmotionHoverConfig(emotion?: string) {
  const easeOut = [0.16, 1, 0.3, 1] as const;
  const easeInOut = [0.42, 0, 0.58, 1] as const;

  switch (emotion as EmotionType) {
    case 'serenity':
      // Gentle, minimal zoom for calm photos
      return {
        scale: 1.05,
        transition: { duration: 0.6, ease: easeOut },
      };
    case 'excitement':
      // Fast, energetic zoom for dynamic photos
      return {
        scale: 1.15,
        transition: { duration: 0.2, ease: easeOut },
      };
    case 'intensity':
      // Strong zoom for powerful photos
      return {
        scale: 1.12,
        transition: { duration: 0.3, ease: easeOut },
      };
    case 'triumph':
      // Scale with upward motion bias
      return {
        scale: 1.1,
        y: -8,
        transition: { duration: 0.4, ease: easeOut },
      };
    case 'focus':
      // Steady, controlled zoom
      return {
        scale: 1.08,
        transition: { duration: 0.4, ease: easeInOut },
      };
    case 'determination':
      // Firm, deliberate zoom
      return {
        scale: 1.1,
        transition: { duration: 0.35, ease: easeOut },
      };
    default:
      // Default moderate zoom
      return {
        scale: 1.1,
        transition: { duration: 0.5, ease: easeOut },
      };
  }
}

/**
 * Task 2.1.4: Get emotion halo styles
 * Returns box-shadow style based on emotion and emotional impact
 *
 * Acceptance criteria:
 * - Halos visible with correct emotion color
 * - Intensity correlates to emotional_impact (0-10)
 * - Halos do not affect layout or performance
 */
function getEmotionHalo(emotion?: string, emotionalImpact?: number) {
  if (!emotion || emotionalImpact === undefined) {
    return {};
  }

  const emotionConfig = EMOTION_PALETTE[emotion as EmotionType];
  if (!emotionConfig) {
    return {};
  }

  // Calculate intensity: emotional_impact (0-10) to opacity (0.2-0.6)
  const intensity = Math.max(0.2, Math.min(0.6, emotionalImpact / 10 * 0.6));

  // Extract RGB from primary color (hex to rgb)
  const hex = emotionConfig.primary.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return {
    boxShadow: `0 0 0 2px rgba(${r}, ${g}, ${b}, ${intensity})`,
  };
}

/**
 * Task 2.3.4: Calculate opacity based on composition score
 * Acceptance criteria:
 * - Opacity correlates with quality (0-10 scale)
 * - High-quality photos fully opaque
 * - Effect subtle, doesn't obscure content
 *
 * Maps 0-10 score to 0.7-1.0 opacity range
 */
function calculateOpacity(compositionScore?: number): number {
  if (compositionScore === undefined) {
    return 1.0; // Default to full opacity if no score
  }
  // Map 0-10 score to 0.7-1.0 opacity
  return 0.7 + (compositionScore / 10) * 0.3;
}

export function PortfolioGrid({ photos, isLoading = false }: PortfolioGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>('portfolio-first');
  const router = useRouter();

  /**
   * Task 2.3.3: Enhanced sorting with quality-based options
   * Acceptance criteria:
   * - Sort dropdown includes new options
   * - Portfolio photos appear first when sorted
   * - Quality scores determine order
   */
  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      switch (sortBy) {
        case 'portfolio-first':
          // Portfolio photos first, then by composition score
          const aPortfolio = a.metadata?.portfolio_worthy ? 1 : 0;
          const bPortfolio = b.metadata?.portfolio_worthy ? 1 : 0;
          if (aPortfolio !== bPortfolio) {
            return bPortfolio - aPortfolio;
          }
          return (b.metadata?.composition_score || 0) - (a.metadata?.composition_score || 0);

        case 'highest-quality':
          // Sort by average of all quality scores
          const aAvg = a.metadata
            ? (a.metadata.sharpness +
               a.metadata.exposure_accuracy +
               a.metadata.composition_score +
               a.metadata.emotional_impact) / 4
            : 0;
          const bAvg = b.metadata
            ? (b.metadata.sharpness +
               b.metadata.exposure_accuracy +
               b.metadata.composition_score +
               b.metadata.emotional_impact) / 4
            : 0;
          return bAvg - aAvg;

        case 'quality':
          return (b.metadata?.composition_score || 0) - (a.metadata?.composition_score || 0);

        case 'emotion':
          return (b.metadata?.emotional_impact || 0) - (a.metadata?.emotional_impact || 0);

        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

        default:
          return 0;
      }
    });
  }, [photos, sortBy]);

  const handlePhotoClick = (photo: Photo) => {
    router.push(`/photo/${photo.id}`);
  };

  if (!isLoading && photos.length === 0) {
    return (
      <div className="text-center py-12">
        <Text variant="body" className="mb-2">No portfolio photos found</Text>
        <Text variant="caption">Photos need to be enriched with metadata first</Text>
      </div>
    );
  }

  return (
    <div className="portfolio-grid">
      {/* Task 2.3.3: Enhanced sort controls with quality-based options */}
      <div className="portfolio-controls mb-6">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={sortBy === 'portfolio-first' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('portfolio-first')}
            aria-label="Sort by portfolio photos first"
          >
            Portfolio First
          </Button>
          <Button
            variant={sortBy === 'highest-quality' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('highest-quality')}
            aria-label="Sort by highest quality photos"
          >
            Highest Quality
          </Button>
          <Button
            variant={sortBy === 'quality' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('quality')}
            aria-label="Sort by composition score"
          >
            Quality Score
          </Button>
          <Button
            variant={sortBy === 'emotion' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('emotion')}
            aria-label="Sort by emotional impact"
          >
            Emotional Impact
          </Button>
          <Button
            variant={sortBy === 'recent' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('recent')}
            aria-label="Sort by most recent photos"
          >
            Most Recent
          </Button>
        </div>
      </div>

      {/* Task 1.3.2: Skeleton loaders during loading state */}
      {isLoading ? (
        <PhotoGridSkeleton count={12} variant="standard" />
      ) : (
        /**
         * Task 2.3.2: Responsive grid with 2x sizing for portfolio photos
         * Acceptance criteria:
         * - Portfolio photos are 2x larger in grid
         * - Layout remains balanced and responsive
         * - No broken grid at narrow viewports
         */
        <motion.div
          className="portfolio-grid-container grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-2 sm:gap-2 md:gap-3 lg:gap-4 auto-rows-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={sortBy} // Re-trigger animation when sort changes
        >
          {/* Display actual photos when loaded with staggered fade-in */}
          {sortedPhotos.map(photo => {
            const isPortfolio = photo.metadata?.portfolio_worthy;
            const opacity = calculateOpacity(photo.metadata?.composition_score);

            return (
              <motion.div
                key={photo.id}
                /**
                 * Task 2.3.2: 2x grid sizing for portfolio_worthy photos
                 * Portfolio photos span 2 columns and 2 rows on medium+ screens
                 * On mobile (< md), all photos are single cell to prevent layout issues
                 */
                className={`
                  cursor-pointer group relative overflow-hidden rounded-lg
                  ${isPortfolio ? 'md:col-span-2 md:row-span-2' : ''}
                `}
                onClick={() => handlePhotoClick(photo)}
                variants={itemVariants}
                whileHover={getEmotionHoverConfig(photo.metadata?.emotion)}
                // Task 2.1.4: Apply emotion halo styles
                style={{
                  ...getEmotionHalo(photo.metadata?.emotion, photo.metadata?.emotional_impact),
                  // Task 2.3.4: Apply graduated opacity
                  opacity,
                }}
              >
                {/* Aspect ratio container with overflow-hidden for zoom effect */}
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  {/* Image with emotion-driven zoom on hover */}
                  <motion.div className="relative w-full h-full">
                    <Image
                      src={photo.image_url}
                      alt={photo.title}
                      fill
                      sizes={
                        isPortfolio
                          ? '(max-width: 768px) 50vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 33vw'
                          : '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16.66vw, 16.66vw'
                      }
                      quality={90}
                      className="object-cover"
                    />
                  </motion.div>

                  {/* Task 2.3.1: Quality badges overlay using QualityBadgeGroup */}
                  <div className="absolute top-2 right-2 z-10">
                    <QualityBadgeGroup
                      portfolioWorthy={photo.metadata?.portfolio_worthy}
                      printReady={photo.metadata?.print_ready}
                      socialMediaOptimized={photo.metadata?.social_media_optimized}
                      enableShimmer={true}
                    />
                  </div>

                  {/* Dark overlay with fade-in transition */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                    {/* Metadata with fade-in effect */}
                    <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Text variant="label" className="text-white">{photo.title}</Text>
                      {photo.metadata && (
                        <div className="mt-1 space-y-1">
                          <Text variant="caption" className="text-white/90">Quality: {photo.metadata.composition_score}/10</Text>
                          <Text variant="caption" className="text-white/90">Emotion: {photo.metadata.emotion}</Text>
                          <Text variant="caption" className="text-white/90">Play: {photo.metadata.play_type}</Text>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
