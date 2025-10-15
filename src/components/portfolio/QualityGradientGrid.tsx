'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import type { Photo } from '@/types/photo';

interface QualityGradientGridProps {
  photos: Photo[];
  onPhotoClick?: (photo: Photo) => void;
}

function calculateAverageQuality(metadata: any): number {
  if (!metadata) return 0;
  return (
    (metadata.sharpness || 0) +
    (metadata.exposure_accuracy || 0) +
    (metadata.composition_score || 0) +
    (metadata.emotional_impact || 0)
  ) / 4;
}

export function QualityGradientGrid({ photos, onPhotoClick }: QualityGradientGridProps) {
  useEffect(() => {
    gsap.to('.quality-photo-card', {
      '--quality-brightness': (i: number) => {
        const photo = photos[i];
        const avgQuality = calculateAverageQuality(photo.metadata);
        return 0.5 + (avgQuality / 10) * 0.5; // 50% to 100% brightness
      },
      '--quality-blur': (i: number) => {
        const photo = photos[i];
        const sharpness = photo.metadata?.sharpness || 0;
        return `${(10 - sharpness) * 0.5}px`; // 0-5px blur
      },
      duration: 1.5,
      stagger: 0.02,
      ease: 'power2.out',
    });
  }, [photos]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {photos.map((photo, i) => (
        <div
          key={photo.id}
          className="quality-photo-card relative group cursor-pointer"
          style={{
            // @ts-ignore - CSS custom properties
            filter: 'brightness(var(--quality-brightness, 1)) blur(var(--quality-blur, 0px))',
            transition: 'filter 0.3s ease-out',
          }}
          onClick={() => onPhotoClick?.(photo)}
        >
          {/* Photo */}
          <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[4/3]">
            <img
              src={photo.image_url}
              alt={photo.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />

            {/* Quality badge appears on hover */}
            <motion.div
              className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full border-4 border-white/20 relative">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="white"
                      strokeWidth="4"
                      strokeDasharray={`${calculateAverageQuality(photo.metadata) * 10}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                    {calculateAverageQuality(photo.metadata).toFixed(1)}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quality breakdown on hover */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-white text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Sharpness</span>
                  <span>{photo.metadata?.sharpness || 0}/10</span>
                </div>
                <div className="flex justify-between">
                  <span>Exposure</span>
                  <span>{photo.metadata?.exposure_accuracy || 0}/10</span>
                </div>
                <div className="flex justify-between">
                  <span>Composition</span>
                  <span>{photo.metadata?.composition_score || 0}/10</span>
                </div>
                <div className="flex justify-between">
                  <span>Emotion</span>
                  <span>{photo.metadata?.emotional_impact || 0}/10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}