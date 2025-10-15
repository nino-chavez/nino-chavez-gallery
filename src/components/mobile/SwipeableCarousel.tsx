'use client';

import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import type { Photo } from '@/types/photo';

interface SwipeableCarouselProps {
  photos: Photo[];
  onPhotoChange?: (photo: Photo, index: number) => void;
}

export function SwipeableCarousel({ photos, onPhotoChange }: SwipeableCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [[page, direction], setPage] = useState([0, 0]);

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    const newIndex = currentIndex + newDirection;
    if (newIndex >= 0 && newIndex < photos.length) {
      setCurrentIndex(newIndex);
      setPage([page + newDirection, newDirection]);
      onPhotoChange?.(photos[newIndex], newIndex);
    }
  };

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1);
    }
  };

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
      };
    }
  };

  const currentPhoto = photos[currentIndex];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 flex items-center justify-center"
          style={{ touchAction: 'pan-y' }}
        >
          <img
            src={currentPhoto.image_url}
            alt={currentPhoto.title}
            className="max-w-full max-h-full object-contain"
          />

          {/* Photo metadata overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 text-white">
            <h3 className="text-xl font-bold mb-2">{currentPhoto.title}</h3>
            {currentPhoto.metadata && (
              <div className="flex gap-4 text-sm opacity-80">
                <span className="capitalize">{currentPhoto.metadata.emotion}</span>
                <span>•</span>
                <span className="capitalize">{currentPhoto.metadata.play_type}</span>
                {currentPhoto.metadata.portfolio_worthy && (
                  <>
                    <span>•</span>
                    <span>⭐ Portfolio</span>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        onClick={() => paginate(-1)}
        disabled={currentIndex === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed z-10"
        aria-label="Previous photo"
      >
        ←
      </button>
      <button
        onClick={() => paginate(1)}
        disabled={currentIndex === photos.length - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed z-10"
        aria-label="Next photo"
      >
        →
      </button>

      {/* Pagination dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {photos.map((_, i) => (
          <button
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex ? 'bg-white w-8' : 'bg-white/40'
            }`}
            onClick={() => {
              const newDirection = i > currentIndex ? 1 : -1;
              setCurrentIndex(i);
              setPage([i, newDirection]);
              onPhotoChange?.(photos[i], i);
            }}
            aria-label={`Go to photo ${i + 1}`}
          />
        ))}
      </div>

      {/* Counter */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-sm z-10">
        {currentIndex + 1} / {photos.length}
      </div>
    </div>
  );
}