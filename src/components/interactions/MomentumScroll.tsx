'use client';

import { useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import type { Photo } from '@/types/photo';

interface MomentumScrollProps {
  photos: Photo[];
  children: (photo: Photo) => React.ReactNode;
}

export function MomentumScroll({ photos, children }: MomentumScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Calculate snap points for high-quality photos
    const snapPoints = photos
      .map((photo, i) => {
        const avgQuality = photo.metadata
          ? (
              (photo.metadata.sharpness || 0) +
              (photo.metadata.exposure_accuracy || 0) +
              (photo.metadata.composition_score || 0) +
              (photo.metadata.emotional_impact || 0)
            ) / 4
          : 0;

        return {
          index: i,
          quality: avgQuality,
          position: (i / photos.length) * (containerRef.current?.scrollHeight || 0),
        };
      })
      .filter(p => p.quality >= 8); // Only snap to 8+ quality

    const unsubscribe = smoothProgress.on('change', (progress) => {
      if (!containerRef.current) return;

      const currentScroll = progress * containerRef.current.scrollHeight;
      const nearestSnap = snapPoints.reduce((prev, curr) =>
        Math.abs(curr.position - currentScroll) < Math.abs(prev.position - currentScroll)
          ? curr
          : prev
      );

      // If close enough to snap point (within 50px)
      if (nearestSnap && Math.abs(nearestSnap.position - currentScroll) < 50) {
        containerRef.current.scrollTo({
          top: nearestSnap.position,
          behavior: 'smooth',
        });
      }
    });

    return () => unsubscribe();
  }, [photos, smoothProgress]);

  return (
    <motion.div
      ref={containerRef}
      className="h-screen overflow-y-scroll"
      style={{
        scrollSnapType: 'y proximity',
      }}
    >
      {photos.map((photo, i) => {
        const avgQuality = photo.metadata
          ? (
              (photo.metadata.sharpness || 0) +
              (photo.metadata.exposure_accuracy || 0) +
              (photo.metadata.composition_score || 0) +
              (photo.metadata.emotional_impact || 0)
            ) / 4
          : 0;

        return (
          <motion.div
            key={photo.id}
            style={{
              scrollSnapAlign: photo.metadata?.portfolio_worthy ? 'start' : 'none',
              scrollSnapStop: photo.metadata?.portfolio_worthy ? 'always' : 'normal',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, margin: '-20% 0px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative"
          >
            {children(photo)}

            {/* Quality indicator for portfolio photos */}
            {photo.metadata?.portfolio_worthy && (
              <motion.div
                className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl"
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
              >
                ⭐
              </motion.div>
            )}

            {/* Quality score overlay */}
            {avgQuality >= 8 && (
              <motion.div
                className="absolute left-4 top-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm"
                initial={{ y: -10, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
              >
                {avgQuality.toFixed(1)}/10
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}