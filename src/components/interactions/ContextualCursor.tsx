'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { EMOTION_PALETTE, EMOTION_ICONS } from '@/lib/motion-tokens';
import type { Photo } from '@/types/photo';

interface ContextualCursorProps {
  hoveredPhoto: Photo | null;
}

export function ContextualCursor({ hoveredPhoto }: ContextualCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.2,
          ease: 'power2.out',
        });
      }
      setIsVisible(true);
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  if (!isVisible) return null;

  const avgQuality = hoveredPhoto?.metadata
    ? (
        (hoveredPhoto.metadata.sharpness || 0) +
        (hoveredPhoto.metadata.exposure_accuracy || 0) +
        (hoveredPhoto.metadata.composition_score || 0) +
        (hoveredPhoto.metadata.emotional_impact || 0)
      ) / 4
    : 0;

  const emotionColor = hoveredPhoto?.metadata?.emotion
    ? EMOTION_PALETTE[hoveredPhoto.metadata.emotion as keyof typeof EMOTION_PALETTE]?.primary
    : '#000';

  return (
    <motion.div
      ref={cursorRef}
      className="fixed pointer-events-none z-50 flex items-center justify-center"
      style={{ top: -20, left: -20 }}
      animate={{
        scale: hoveredPhoto ? 2 : 1,
        backgroundColor: emotionColor,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="w-5 h-5 rounded-full" />
      
      {hoveredPhoto && (
        <motion.div
          className="absolute top-full mt-2 bg-black text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="flex items-center gap-2">
            {hoveredPhoto.metadata?.emotion && (
              <span className="text-lg">
                {EMOTION_ICONS[hoveredPhoto.metadata.emotion as keyof typeof EMOTION_ICONS]}
              </span>
            )}
            <span className="font-medium">
              {avgQuality.toFixed(1)}/10
            </span>
            {hoveredPhoto.metadata?.portfolio_worthy && (
              <span className="text-yellow-400">⭐</span>
            )}
            {hoveredPhoto.metadata?.print_ready && (
              <span className="text-green-400">🖨️</span>
            )}
          </div>
          {hoveredPhoto.metadata?.play_type && (
            <div className="text-xs text-gray-300 mt-1 capitalize">
              {hoveredPhoto.metadata.play_type}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}