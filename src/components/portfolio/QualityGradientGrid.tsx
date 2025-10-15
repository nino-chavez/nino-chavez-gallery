'use client';

import { useEffect } from 'react';
import Image from 'next/image';
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 max-w-7xl mx-auto px-6 pb-12">
      {photos.map((photo, i) => (
        <motion.div
          key={photo.id}
          className="relative group cursor-pointer overflow-hidden bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: i * 0.02 }}
          onClick={() => onPhotoClick?.(photo)}
        >
          {/* Photo - Minimal */}
          <div className="relative aspect-square">
            <Image
              src={photo.image_url}
              alt={photo.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:opacity-90 transition-opacity duration-200"
              loading="lazy"
              quality={90}
            />

            {/* Minimal quality indicator on hover */}
            {photo.metadata?.portfolio_worthy && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}