'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { EMOTION_PALETTE, EMOTION_ICONS, MOTION } from '@/lib/motion-tokens';
import { useEmotion, type EmotionType } from '@/contexts/EmotionContext';
import { Text } from '@/components/ui';

/**
 * EmotionNavigationCard Component
 * Task 2.1.2: Build EmotionNavigationCard component
 *
 * Features:
 * - 6 cards with EMOTION_PALETTE gradients and glows
 * - Hover effects: scale 1.05, brighten glow
 * - Click navigates to filtered portfolio
 *
 * Acceptance criteria:
 * - Cards use correct emotion colors from palette
 * - Hover animations smooth (spring physics)
 * - Click navigates to filtered portfolio
 */

interface EmotionNavigationCardProps {
  emotion: EmotionType;
  photoCount: number;
}

export function EmotionNavigationCard({ emotion, photoCount }: EmotionNavigationCardProps) {
  const router = useRouter();
  const { setActiveEmotion } = useEmotion();
  const emotionConfig = EMOTION_PALETTE[emotion];
  const emotionIcon = EMOTION_ICONS[emotion];

  const handleClick = () => {
    // Set active emotion in context for persistence
    setActiveEmotion(emotion);
    // Navigate to portfolio with emotion filter
    router.push(`/portfolio?emotion=${emotion}`);
  };

  return (
    <motion.button
      onClick={handleClick}
      className="emotion-navigation-card relative overflow-hidden rounded-2xl p-6 text-left cursor-pointer group"
      style={{
        background: emotionConfig.gradient,
      }}
      // Task 2.1.2: Hover effects with spring physics
      whileHover={{
        scale: 1.05,
        boxShadow: emotionConfig.glow,
      }}
      whileTap={{
        scale: 0.98,
      }}
      transition={MOTION.spring.snappy}
      aria-label={`Browse ${photoCount} ${emotion} photos`}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10">
        {/* Emotion icon */}
        <div className="text-4xl mb-3" aria-hidden="true">
          {emotionIcon}
        </div>

        {/* Emotion name */}
        <Text variant="label" className="text-white font-semibold text-lg mb-2 capitalize">
          {emotion}
        </Text>

        {/* Photo count */}
        <Text variant="caption" className="text-white/90">
          {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
        </Text>
      </div>

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: emotionConfig.glow,
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: MOTION.duration.fast }}
      />
    </motion.button>
  );
}
