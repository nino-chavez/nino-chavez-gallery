'use client';

import { motion } from 'framer-motion';
import { EMOTION_PALETTE, EMOTION_ICONS, MOTION } from '@/lib/motion-tokens';
import { type EmotionType } from '@/contexts/EmotionContext';
import { Text } from '@/components/ui';

/**
 * EmotionIndicator Component
 * Task 2.1.6: Add emotion indicator to photo detail view
 *
 * Features:
 * - Show dominant emotion with icon and color
 * - Theme shift: page adopts emotion gradient
 *
 * Acceptance criteria:
 * - Emotion displayed with correct icon and color
 * - Page theme transitions smoothly (300ms)
 * - Theme persists while viewing photo
 */

interface EmotionIndicatorProps {
  emotion: EmotionType;
  emotionalImpact?: number;
  className?: string;
}

export function EmotionIndicator({ emotion, emotionalImpact, className = '' }: EmotionIndicatorProps) {
  const emotionConfig = EMOTION_PALETTE[emotion];
  const emotionIcon = EMOTION_ICONS[emotion];

  return (
    <motion.div
      className={`emotion-indicator inline-flex items-center gap-3 px-4 py-3 rounded-xl ${className}`}
      style={{
        background: emotionConfig.gradient,
        boxShadow: emotionConfig.glow,
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.base,
        ease: MOTION.ease.easeOut,
      }}
    >
      {/* Emotion icon */}
      <div className="text-2xl" aria-hidden="true">
        {emotionIcon}
      </div>

      {/* Emotion details */}
      <div className="flex flex-col">
        <Text variant="label" className="text-white font-semibold capitalize">
          {emotion}
        </Text>
        {emotionalImpact !== undefined && (
          <Text variant="caption" className="text-white/90">
            Impact: {emotionalImpact.toFixed(1)}/10
          </Text>
        )}
      </div>

      {/* Glow pulse animation */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: emotionConfig.glow,
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}
