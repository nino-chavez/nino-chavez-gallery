'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { PLAY_TYPE_ICONS, MOTION } from '@/lib/motion-tokens';
import { Text } from '@/components/ui';
import { PhotoGridSkeleton } from '@/components/common/Skeleton';
import type { Photo } from '@/types/photo';
import type { EmotionType } from '@/components/transitions';

interface PlayTypeMorphGridProps {
  photos: Photo[];
  activePlayType: string | null;
  isLoading?: boolean;
  onPhotoClick?: (photo: Photo) => void;
}

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

export function PlayTypeMorphGrid({
  photos,
  activePlayType,
  isLoading = false,
  onPhotoClick
}: PlayTypeMorphGridProps) {
  const visiblePhotos = useMemo(() => {
    if (!activePlayType) return photos;
    return photos.filter(p => p.metadata?.play_type === activePlayType);
  }, [photos, activePlayType]);

  return (
    <LayoutGroup>
      {/* Task 1.3.2: Skeleton loaders during loading state */}
      {isLoading ? (
        <PhotoGridSkeleton count={12} variant="masonry" />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-8 pb-12"
        >
          <AnimatePresence mode="popLayout">
            {visiblePhotos.map(photo => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  layout: MOTION.spring.responsive,
                  opacity: { duration: MOTION.duration.fast },
                  scale: { duration: MOTION.duration.fast },
                }}
                whileHover={getEmotionHoverConfig(photo.metadata?.emotion)}
                className="card-base hover-lift relative group cursor-pointer"
                onClick={() => onPhotoClick?.(photo)}
              >
                {/* Photo card with overflow-hidden for emotion-driven zoom effect */}
                <div className="relative overflow-hidden rounded-xl aspect-[4/3]">
                  {/* Image with emotion-driven zoom on hover */}
                  <motion.div className="relative w-full h-full">
                    <Image
                      src={photo.image_url}
                      alt={photo.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                      loading="lazy"
                      quality={85}
                    />
                  </motion.div>

                  {/* Play type badge - clean design */}
                  {photo.metadata?.play_type && (
                    <motion.div
                      className="absolute top-3 right-3 bg-white shadow-md px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <span className="text-lg">
                        {PLAY_TYPE_ICONS[photo.metadata.play_type as keyof typeof PLAY_TYPE_ICONS]}
                      </span>
                      <Text variant="label" className="capitalize text-gray-900">{photo.metadata.play_type}</Text>
                    </motion.div>
                  )}

                  {/* Quality indicators - clean badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {photo.metadata?.portfolio_worthy && (
                      <span className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-md">
                        ⭐ Portfolio
                      </span>
                    )}
                    {photo.metadata?.action_intensity === 'peak' && (
                      <span className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-md">
                        ⚡ Peak
                      </span>
                    )}
                  </div>

                  {/* Dark overlay with fade-in transition */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-transparent group-hover:from-black/80 transition-all duration-300 flex items-end justify-center p-6">
                    {/* Metadata with fade-in effect */}
                    <div className="text-white text-center w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Text variant="body" className="text-xl font-bold mb-3 text-white">{photo.title}</Text>
                      {photo.metadata && (
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <Text variant="caption" className="text-gray-600 font-medium">Emotion:</Text>
                            <Text variant="label" className="capitalize text-gray-900">{photo.metadata.emotion}</Text>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <Text variant="caption" className="text-gray-600 font-medium">Quality:</Text>
                            <Text variant="body" className="text-gray-900 font-bold text-lg">
                              {(
                                (photo.metadata.sharpness || 0) +
                                (photo.metadata.exposure_accuracy || 0) +
                                (photo.metadata.composition_score || 0) +
                                (photo.metadata.emotional_impact || 0)
                              ) / 4 | 0}/10
                            </Text>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </LayoutGroup>
  );
}
