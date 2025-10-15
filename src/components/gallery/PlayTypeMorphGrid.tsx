'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { PLAY_TYPE_ICONS, MOTION } from '@/lib/motion-tokens';
import type { Photo } from '@/types/photo';

interface PlayTypeMorphGridProps {
  photos: Photo[];
  activePlayType: string | null;
  onPhotoClick?: (photo: Photo) => void;
}

export function PlayTypeMorphGrid({ photos, activePlayType, onPhotoClick }: PlayTypeMorphGridProps) {
  const visiblePhotos = useMemo(() => {
    if (!activePlayType) return photos;
    return photos.filter(p => p.metadata?.play_type === activePlayType);
  }, [photos, activePlayType]);

  return (
    <LayoutGroup>
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
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
              className="relative group cursor-pointer"
              onClick={() => onPhotoClick?.(photo)}
            >
              {/* Photo card */}
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[4/3]">
                <Image
                  src={photo.image_url}
                  alt={photo.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  quality={85}
                />

                {/* Play type badge */}
                {photo.metadata?.play_type && (
                  <motion.div
                    className="absolute top-2 right-2 bg-black text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="text-base">
                      {PLAY_TYPE_ICONS[photo.metadata.play_type as keyof typeof PLAY_TYPE_ICONS]}
                    </span>
                    <span className="capitalize">{photo.metadata.play_type}</span>
                  </motion.div>
                )}

                {/* Quality indicators */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {photo.metadata?.portfolio_worthy && (
                    <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">⭐</span>
                  )}
                  {photo.metadata?.action_intensity === 'peak' && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">⚡</span>
                  )}
                </div>

                {/* Hover overlay with metadata */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center p-4">
                    <div className="text-lg font-bold mb-2">{photo.title}</div>
                    {photo.metadata && (
                      <div className="text-sm space-y-1">
                        <div className="capitalize">{photo.metadata.emotion}</div>
                        <div>Quality: {(
                          (photo.metadata.sharpness || 0) +
                          (photo.metadata.exposure_accuracy || 0) +
                          (photo.metadata.composition_score || 0) +
                          (photo.metadata.emotional_impact || 0)
                        ) / 4 | 0}/10</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}