'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { MOTION } from '@/lib/motion-tokens';

interface MagneticFilterOrbProps {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  magneticRadius?: number;
}

export function MagneticFilterOrb({
  label,
  icon,
  active,
  onClick,
  magneticRadius = 100,
}: MagneticFilterOrbProps) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  const x = useSpring(cursorX, MOTION.spring.responsive);
  const y = useSpring(cursorY, MOTION.spring.responsive);

  return (
    <motion.button
      className="relative px-6 py-3 rounded-full font-medium transition-colors border-2"
      style={{ x, y }}
      whileHover={{
        scale: 1.2,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        transition: MOTION.spring.snappy,
      }}
      whileTap={{ scale: 0.95 }}
      animate={{
        backgroundColor: active ? '#000' : '#fff',
        color: active ? '#fff' : '#000',
        borderColor: active ? '#000' : '#e5e7eb',
      }}
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
      <span className="text-2xl mr-2">{icon}</span>
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {label}
      </motion.span>
    </motion.button>
  );
}