'use client';

/**
 * EmotionAmbience Component
 *
 * Wrapper component that applies subtle ambient background effects based on photo emotion.
 * Creates emotional immersion by using low-opacity radial gradients from the emotion palette.
 *
 * Features:
 * - Emotion-specific ambient backgrounds using EMOTION_PALETTE colors
 * - Slow-moving, low-opacity radial gradients for subtle atmosphere
 * - Smooth transitions between emotion changes (1 second fade)
 * - Non-intrusive design that enhances without overwhelming
 * - Optional intensity control for different contexts
 *
 * Usage:
 * Wrap photo detail pages or emotion-driven sections:
 *
 * @example
 * ```tsx
 * import { EmotionAmbience } from '@/components/transitions';
 *
 * export default function PhotoPage({ photo }) {
 *   return (
 *     <EmotionAmbience emotion={photo.metadata?.emotion}>
 *       <div>Your photo content</div>
 *     </EmotionAmbience>
 *   );
 * }
 * ```
 */

import { type ReactNode, useMemo } from 'react';
import { motion } from 'framer-motion';
import { EMOTION_PALETTE } from '@/lib/motion-tokens';

export type EmotionType = 'triumph' | 'focus' | 'intensity' | 'determination' | 'excitement' | 'serenity';

export interface EmotionAmbienceProps {
  /**
   * The emotion to use for ambient background
   */
  emotion?: EmotionType;

  /**
   * Intensity of the ambient effect (0-1)
   * @default 0.15
   */
  intensity?: number;

  /**
   * The content to render with ambient background
   */
  children: ReactNode;

  /**
   * Optional className for the wrapper
   */
  className?: string;
}

/**
 * EmotionAmbience Component
 *
 * Applies emotion-themed ambient background effects
 */
export function EmotionAmbience({
  emotion,
  intensity = 0.15,
  children,
  className = '',
}: EmotionAmbienceProps) {
  // Generate ambient background style based on emotion
  const ambienceStyle = useMemo(() => {
    if (!emotion) {
      return {
        background: 'transparent',
      };
    }

    const emotionColor = EMOTION_PALETTE[emotion];
    if (!emotionColor) {
      return {
        background: 'transparent',
      };
    }

    // Extract primary color from emotion palette
    const primaryColor = emotionColor.primary;

    // Create radial gradient with low opacity for subtle ambience
    // Multiple gradients create depth and movement
    return {
      background: `
        radial-gradient(circle at 30% 20%, ${primaryColor}${Math.round(intensity * 100).toString(16).padStart(2, '0')} 0%, transparent 50%),
        radial-gradient(circle at 70% 80%, ${primaryColor}${Math.round(intensity * 80).toString(16).padStart(2, '0')} 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, ${primaryColor}${Math.round(intensity * 50).toString(16).padStart(2, '0')} 0%, transparent 70%)
      `.replace(/\s+/g, ' '),
    };
  }, [emotion, intensity]);

  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Ambient background layer */}
      <motion.div
        className="fixed inset-0 pointer-events-none -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        style={ambienceStyle}
        key={emotion} // Re-animate when emotion changes
      />

      {/* Content */}
      {children}
    </div>
  );
}

EmotionAmbience.displayName = 'EmotionAmbience';
