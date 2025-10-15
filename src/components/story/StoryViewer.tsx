'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { EMOTION_ICONS } from '@/lib/motion-tokens';
import type { NarrativeArc } from '@/lib/story-curation/narrative-arcs';

interface StoryViewerProps {
  story: NarrativeArc;
  autoPlay?: boolean;
  onClose?: () => void;
}

export function StoryViewer({ story, autoPlay = false, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Auto-advance every 3 seconds
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev < story.photos.length - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false); // Stop at end
          return prev;
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, story.photos.length]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => Math.min(story.photos.length - 1, prev + 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [story.photos.length, onClose]);

  const currentPhoto = story.photos[currentIndex];
  const currentEmotion = story.emotionalCurve[currentIndex];

  return (
    <div className="story-viewer fixed inset-0 z-50 bg-black" data-testid="story-viewer">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white/80 hover:text-white text-4xl leading-none transition-colors"
          aria-label="Close story viewer"
        >
          ×
        </button>
      )}

      {/* Photo display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={currentPhoto.image_url}
            alt={currentPhoto.title}
            className="max-w-full max-h-full object-contain"
          />
        </motion.div>
      </AnimatePresence>

      {/* Story header */}
      <div className="absolute top-8 left-8 text-white z-40 max-w-2xl">
        <h2 className="text-3xl font-bold mb-2">{story.title}</h2>
        <p className="text-sm opacity-80">{story.description}</p>
        <div className="flex gap-4 mt-4 text-sm opacity-60">
          <span>⭐ Quality: {story.metadata.avgQuality}/10</span>
          <span>⚡ {story.metadata.peakMoments} peak moments</span>
          <span>🎬 {story.metadata.duration}</span>
        </div>
      </div>

      {/* Emotional curve */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-3/4">
        <EmotionalCurveGraph
          curve={story.emotionalCurve}
          currentIndex={currentIndex}
          onSeek={setCurrentIndex}
        />
      </div>

      {/* Navigation controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="bg-white/20 backdrop-blur px-6 py-3 rounded-full hover:bg-white/30 transition disabled:opacity-30 disabled:cursor-not-allowed text-white"
          aria-label="Previous photo"
        >
          ← Prev
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-white/20 backdrop-blur px-6 py-3 rounded-full hover:bg-white/30 transition text-white"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        <button
          onClick={() => setCurrentIndex(Math.min(story.photos.length - 1, currentIndex + 1))}
          disabled={currentIndex === story.photos.length - 1}
          className="bg-white/20 backdrop-blur px-6 py-3 rounded-full hover:bg-white/30 transition disabled:opacity-30 disabled:cursor-not-allowed text-white"
          aria-label="Next photo"
        >
          Next →
        </button>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-64 left-1/2 -translate-x-1/2 flex gap-2">
        {story.photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === currentIndex ? 'bg-white w-8' : 'bg-white/40 w-2'
            }`}
            aria-label={`Go to photo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function EmotionalCurveGraph({
  curve,
  currentIndex,
  onSeek,
}: {
  curve: Array<{ emotion: string; intensity: number }>;
  currentIndex: number;
  onSeek: (index: number) => void;
}) {
  return (
    <div className="relative h-24 bg-white/10 backdrop-blur rounded-lg overflow-hidden">
      <svg className="w-full h-full cursor-pointer" viewBox={`0 0 ${curve.length * 10} 100`}>
        {/* Area under curve */}
        <polygon
          points={`0,100 ${curve.map((point, i) =>
            `${i * 10},${100 - point.intensity * 10}`
          ).join(' ')} ${(curve.length - 1) * 10},100`}
          fill="rgba(255,255,255,0.1)"
        />

        {/* Line graph */}
        <polyline
          points={curve.map((point, i) =>
            `${i * 10},${100 - point.intensity * 10}`
          ).join(' ')}
          fill="none"
          stroke="white"
          strokeWidth="3"
        />

        {/* Current position indicator */}
        <circle
          cx={currentIndex * 10}
          cy={100 - curve[currentIndex].intensity * 10}
          r="6"
          fill="#FFD700"
          className="drop-shadow-lg"
        />

        {/* Clickable overlay for seeking */}
        <rect
          x="0"
          y="0"
          width={curve.length * 10}
          height="100"
          fill="transparent"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const index = Math.floor((x / rect.width) * curve.length);
            onSeek(Math.max(0, Math.min(curve.length - 1, index)));
          }}
        />
      </svg>

      {/* Emotion label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-sm flex items-center gap-2">
        <span className="text-2xl">
          {EMOTION_ICONS[curve[currentIndex].emotion as keyof typeof EMOTION_ICONS]}
        </span>
        <span className="capitalize">{curve[currentIndex].emotion}</span>
        <span className="opacity-60">•</span>
        <span>Intensity: {curve[currentIndex].intensity}/10</span>
      </div>
    </div>
  );
}