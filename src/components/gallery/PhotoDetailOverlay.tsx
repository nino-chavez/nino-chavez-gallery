'use client';

/**
 * PhotoDetailOverlay - 2D overlay showing photo details over 3D scene
 *
 * Features:
 * - Appears when photo is clicked in 3D galaxy
 * - Shows full photo with metadata
 * - Close button returns camera to previous position
 * - Smooth animations with Framer Motion
 * - Responsive design (mobile-friendly)
 * - Accessible keyboard navigation
 *
 * Layout:
 * - Fixed position overlay covering entire viewport
 * - Semi-transparent backdrop
 * - Photo centered with metadata sidebar
 * - Close button (X) in top-right corner
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { MOTION, EMOTION_PALETTE, EMOTION_ICONS, PLAY_TYPE_ICONS } from '@/lib/motion-tokens';
import { Vector3 } from 'three';

type EmotionType = 'triumph' | 'focus' | 'intensity' | 'determination' | 'excitement' | 'serenity';
type PlayType = 'attack' | 'block' | 'dig' | 'set' | 'serve' | 'pass' | 'celebration' | 'timeout' | null;

export interface PhotoDetailData {
  id: string;
  image_url: string;
  title?: string;
  emotion: EmotionType;
  emotional_impact: number; // 0-10 scale
  play_type?: PlayType;
  sharpness?: number;
  composition_score?: number;
  action_intensity?: 'low' | 'medium' | 'high' | 'peak';
  portfolio_worthy?: boolean;
  position: Vector3; // 3D position for camera return
}

export interface PhotoDetailOverlayProps {
  /** Photo data to display (null = closed) */
  photo: PhotoDetailData | null;
  /** Callback to close overlay */
  onClose: () => void;
}

/**
 * PhotoDetailOverlay Component
 *
 * Displays detailed photo information over the 3D scene.
 * Uses Framer Motion for smooth entry/exit animations.
 */
export function PhotoDetailOverlay({ photo, onClose }: PhotoDetailOverlayProps) {
  /**
   * Escape key to close overlay
   */
  useEffect(() => {
    if (!photo) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [photo, onClose]);

  /**
   * Prevent body scroll when overlay is open
   */
  useEffect(() => {
    if (photo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [photo]);

  if (!photo) return null;

  // Get emotion styling
  const emotionColor = EMOTION_PALETTE[photo.emotion].primary;
  const emotionGradient = EMOTION_PALETTE[photo.emotion].gradient;
  const emotionGlow = EMOTION_PALETTE[photo.emotion].glow;
  const emotionIcon = EMOTION_ICONS[photo.emotion];
  const playTypeIcon = photo.play_type ? PLAY_TYPE_ICONS[photo.play_type] : null;

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION.duration.fast }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content container */}
          <motion.div
            className="relative z-10 max-w-6xl w-full mx-4 md:mx-8 max-h-[90vh] overflow-hidden rounded-2xl bg-gray-900 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={MOTION.spring.snappy}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800/80 hover:bg-gray-700 backdrop-blur-sm transition-colors"
              aria-label="Close photo detail"
            >
              <svg
                className="w-6 h-6 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Content grid */}
            <div className="grid md:grid-cols-[1fr,320px] gap-0 h-full max-h-[90vh]">
              {/* Photo section */}
              <div className="relative bg-black flex items-center justify-center p-8">
                <div className="relative w-full h-full max-h-[70vh]">
                  <Image
                    src={photo.image_url}
                    alt={photo.title || 'Photo detail'}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 60vw"
                    priority
                  />
                </div>
              </div>

              {/* Metadata sidebar */}
              <div className="bg-gray-900 p-6 overflow-y-auto max-h-[90vh]">
                {/* Title */}
                {photo.title && (
                  <h2 className="text-2xl font-bold text-gray-100 mb-4">
                    {photo.title}
                  </h2>
                )}

                {/* Emotion badge */}
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                  style={{
                    background: emotionGradient,
                    boxShadow: emotionGlow,
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, ...MOTION.spring.snappy }}
                >
                  <span className="text-2xl">{emotionIcon}</span>
                  <span className="font-semibold text-white capitalize">
                    {photo.emotion}
                  </span>
                </motion.div>

                {/* Metadata sections */}
                <div className="space-y-6">
                  {/* Quality metrics */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Quality Metrics
                    </h3>
                    <div className="space-y-2">
                      <MetricBar
                        label="Emotional Impact"
                        value={photo.emotional_impact}
                        max={10}
                        color={emotionColor}
                      />
                      {photo.sharpness !== undefined && (
                        <MetricBar
                          label="Sharpness"
                          value={photo.sharpness}
                          max={10}
                          color="#4169E1"
                        />
                      )}
                      {photo.composition_score !== undefined && (
                        <MetricBar
                          label="Composition"
                          value={photo.composition_score}
                          max={10}
                          color="#FFD700"
                        />
                      )}
                    </div>
                  </div>

                  {/* Volleyball metadata */}
                  {(photo.play_type || photo.action_intensity) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Volleyball Details
                      </h3>
                      <div className="space-y-2">
                        {photo.play_type && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <span className="text-xl">{playTypeIcon}</span>
                            <span className="capitalize">
                              {photo.play_type.replace('-', ' ')}
                            </span>
                          </div>
                        )}
                        {photo.action_intensity && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <span className="text-sm font-medium text-gray-400">
                              Intensity:
                            </span>
                            <span className="capitalize">{photo.action_intensity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Portfolio flag */}
                  {photo.portfolio_worthy && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <span className="text-xl">⭐</span>
                      <span className="text-yellow-500 font-medium">
                        Portfolio Worthy
                      </span>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="mt-8 pt-6 border-t border-gray-800">
                  <p className="text-sm text-gray-500">
                    Press <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-400">Esc</kbd> or click outside to close
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * MetricBar - Horizontal progress bar for quality metrics
 */
function MetricBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = (value / max) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300 font-semibold">
          {value.toFixed(1)} / {max}
        </span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default PhotoDetailOverlay;
