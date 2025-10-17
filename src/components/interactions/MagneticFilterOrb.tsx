'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { MOTION, EMOTION_PALETTE } from '@/lib/motion-tokens';

export type EmotionFilterType = 'triumph' | 'focus' | 'intensity' | 'determination' | 'excitement' | 'serenity';

interface MagneticFilterOrbProps {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  magneticRadius?: number;
  /**
   * Optional emotion type for emotion-specific styling with glow effects
   */
  emotionType?: EmotionFilterType;
}

export function MagneticFilterOrb({
  label,
  icon,
  active,
  onClick,
  magneticRadius = 100,
  emotionType,
}: MagneticFilterOrbProps) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  const x = useSpring(cursorX, MOTION.spring.responsive);
  const y = useSpring(cursorY, MOTION.spring.responsive);

  // Get emotion-specific color and glow if emotionType is provided
  const emotionColor = emotionType ? EMOTION_PALETTE[emotionType]?.primary : null;
  const emotionGlow = emotionType ? EMOTION_PALETTE[emotionType]?.glow : null;

  return (
    <motion.button
      className={`btn-magnetic ${active ? 'btn-secondary active' : 'btn-secondary'} flex items-center gap-2 transition-all duration-300 ease-out active:scale-95`}
      style={{
        x,
        y,
        ...(emotionType && active
          ? {
              borderColor: emotionColor,
              boxShadow: active ? emotionGlow : undefined,
              color: emotionColor,
            }
          : {}),
      }}
      whileHover={{
        scale: 1.05,
        transition: MOTION.spring.snappy,
      }}
      whileTap={{ scale: 0.95 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Magnetic attraction within magneticRadius
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        if (distance < magneticRadius) {
          const strength = (magneticRadius - distance) / magneticRadius;
          cursorX.set((e.clientX - centerX) * strength * 0.3);
          cursorY.set((e.clientY - centerY) * strength * 0.3);
        }
      }}
      onMouseLeave={() => {
        cursorX.set(0);
        cursorY.set(0);
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={active}
      aria-label={`Filter by ${label}`}
      role="button"
      tabIndex={0}
    >
      <span className="text-xl">{icon}</span>
      <motion.span
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-medium"
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
