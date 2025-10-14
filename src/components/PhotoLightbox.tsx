'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { formatMetadata, getDisplayTags } from '@/lib/metadata-formatter';

interface Photo {
  imageKey: string;
  imageUrl: string;
  thumbnailUrl: string;
  title?: string;
  caption?: string;
  keywords?: string;
  fileName: string;
}

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoLightbox({ photos, initialIndex, isOpen, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);

  const currentPhoto = photos[currentIndex];

  // Update index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowMetadata(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const goToPrevious = () => {
    setIsLoading(true);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const goToNext = () => {
    setIsLoading(true);
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  if (!isOpen || !currentPhoto) return null;

  const formatted = formatMetadata({
    title: currentPhoto.title,
    caption: currentPhoto.caption,
    keywords: currentPhoto.keywords,
  });

  const displayTags = getDisplayTags({
    title: currentPhoto.title,
    caption: currentPhoto.caption,
    keywords: currentPhoto.keywords,
  }, 6);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors"
        aria-label="Close lightbox"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation buttons */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors"
            aria-label="Previous photo"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors"
            aria-label="Next photo"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Photo counter */}
      {photos.length > 1 && (
        <div className="absolute top-4 left-4 z-50 px-3 py-2 rounded-lg bg-zinc-900/80 text-white text-sm font-medium">
          {currentIndex + 1} / {photos.length}
        </div>
      )}

      {/* Metadata toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMetadata(prev => !prev);
        }}
        className="absolute bottom-4 right-4 z-50 p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors"
        aria-label={showMetadata ? 'Hide info' : 'Show info'}
        title="Toggle info (I)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Image container */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full max-w-7xl max-h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <Image
            src={currentPhoto.imageUrl}
            alt={formatted.displayTitle}
            fill
            className="object-contain"
            sizes="100vw"
            priority
            onLoadingComplete={() => setIsLoading(false)}
            quality={95}
          />
        </div>
      </div>

      {/* Metadata panel */}
      {showMetadata && (
        <div
          className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {formatted.displayTitle}
            </h2>

            {formatted.displayCaption && (
              <p className="text-sm sm:text-base text-zinc-300 mb-3">
                {formatted.displayCaption}
              </p>
            )}

            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {displayTags.map((tag, i) => (
                  <span
                    key={i}
                    className={`text-xs sm:text-sm px-3 py-1 rounded-full ${
                      tag.category === 'sport'
                        ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                        : tag.category === 'action'
                        ? 'bg-orange-900/50 text-orange-300 border border-orange-700'
                        : 'bg-zinc-800/80 text-zinc-300'
                    }`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            )}

            {/* Keyboard shortcuts hint */}
            <div className="mt-4 text-xs text-zinc-500 space-x-4">
              <span>← → Navigate</span>
              <span>I Toggle info</span>
              <span>ESC Close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
