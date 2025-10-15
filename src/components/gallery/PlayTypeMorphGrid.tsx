'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { PLAY_TYPE_ICONS, MOTION } from '@/lib/motion-tokens';
import { Text } from '@/components/ui';
import { PhotoSkeleton } from '@/components/common/PhotoSkeleton';
import type { Photo } from '@/types/photo';

interface PlayTypeMorphGridProps {
  photos: Photo[];
  activePlayType: string | null;
  isLoading?: boolean;
  onPhotoClick?: (photo: Photo) => void;
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
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-8 pb-12"
      >
        {isLoading ? (
          // Display skeleton placeholders during loading (12 items)
          Array.from({ length: 12 }).map((_, index) => (
            <PhotoSkeleton key={`skeleton-${index}`} />
          ))
        ) : (
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
                className="card-base hover-lift relative group cursor-pointer"
                onClick={() => onPhotoClick?.(photo)}
              >
                {/* Photo card */}
                <div className="relative overflow-hidden rounded-xl aspect-[4/3]">
                  <Image
                    src={photo.image_url}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    quality={85}
                  />

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

                  {/* Hover overlay with metadata - clean design */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center p-6">
                    <div className="text-white text-center w-full">
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
        )}
      </motion.div>
    </LayoutGroup>
  );
}
