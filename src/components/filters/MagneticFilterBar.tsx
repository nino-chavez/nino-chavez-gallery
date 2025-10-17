'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagneticFilterOrb, type EmotionFilterType } from '@/components/interactions/MagneticFilterOrb';
import { useEmotion, type EmotionType } from '@/contexts/EmotionContext';
import { EMOTION_ICONS, MOTION } from '@/lib/motion-tokens';

/**
 * MagneticFilterBar Component
 * Task Group 2.2: MagneticFilterOrb Activation
 *
 * Features:
 * - 6 emotion orbs in orbital formation (2.2.1)
 * - Magnetic physics integration (2.2.2)
 * - Active state interactions with glow effects (2.2.3)
 * - First-time user tooltips (2.2.4)
 * - Replaces PhotoFilters on portfolio page (2.2.5)
 *
 * Acceptance Criteria:
 * - Orbs render in circular/orbital layout
 * - Each orb uses correct EMOTION_PALETTE gradient
 * - Orbs respond to cursor within 100px radius
 * - Active state visually distinct with glow effect
 * - Tooltip appears on first visit and dismisses after interaction
 */

const TOOLTIP_STORAGE_KEY = 'magneticFilterBar:tooltipDismissed';

interface MagneticFilterBarProps {
  /** Callback when emotion filter changes */
  onEmotionChange?: (emotion: EmotionType | null) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Orbital formation positions for 6 orbs
 * Positioned in a circle with 120 pixel radius
 * Each orb is 80px diameter, spaced evenly
 */
const ORBITAL_POSITIONS = [
  { x: 0, y: -120, label: 'top' },           // top
  { x: 104, y: -60, label: 'top-right' },    // top-right
  { x: 104, y: 60, label: 'bottom-right' },  // bottom-right
  { x: 0, y: 120, label: 'bottom' },         // bottom
  { x: -104, y: 60, label: 'bottom-left' },  // bottom-left
  { x: -104, y: -60, label: 'top-left' },    // top-left
];

const EMOTIONS: EmotionType[] = ['triumph', 'focus', 'intensity', 'determination', 'excitement', 'serenity'];

export function MagneticFilterBar({ onEmotionChange, className = '' }: MagneticFilterBarProps) {
  const { activeEmotion, setActiveEmotion } = useEmotion();
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Task 2.2.4: Check if tooltip should be shown on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(TOOLTIP_STORAGE_KEY);
      if (!dismissed) {
        // Show tooltip after a brief delay for better UX
        const timer = setTimeout(() => {
          setShowTooltip(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Task 2.2.4: Dismiss tooltip after first interaction
  const handleFirstInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      setShowTooltip(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOOLTIP_STORAGE_KEY, 'true');
      }
    }
  };

  // Task 2.2.3: Handle orb click with active state
  const handleOrbClick = (emotion: EmotionType) => {
    handleFirstInteraction();

    // Toggle emotion: if already active, clear it; otherwise, set it
    const newEmotion = activeEmotion === emotion ? null : emotion;
    setActiveEmotion(newEmotion);

    // Notify parent component
    if (onEmotionChange) {
      onEmotionChange(newEmotion);
    }
  };

  // Task 2.2.3: Clear all filters
  const handleClearFilters = () => {
    setActiveEmotion(null);
    if (onEmotionChange) {
      onEmotionChange(null);
    }
  };

  return (
    <div className={`magnetic-filter-bar ${className}`}>
      {/* Task 2.2.4: Instructional tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-4 bg-black text-white px-4 py-3 rounded-lg shadow-lg text-sm flex items-center justify-between"
            role="tooltip"
            aria-live="polite"
          >
            <span>
              <span className="font-semibold">Try it:</span> Hover near the orbs to see the magnetic effect, then click to filter photos by emotion!
            </span>
            <button
              onClick={() => {
                setShowTooltip(false);
                handleFirstInteraction();
              }}
              className="ml-3 text-white/70 hover:text-white transition-colors"
              aria-label="Dismiss tooltip"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task 2.2.1 & 2.2.2: Orbital formation with magnetic orbs */}
      <div
        ref={containerRef}
        className="relative w-full min-h-[400px] flex items-center justify-center"
        onMouseMove={handleFirstInteraction}
        role="group"
        aria-label="Emotion filter orbs"
      >
        {/* Central container for orbital positioning */}
        <div className="relative w-[280px] h-[280px]">
          {EMOTIONS.map((emotion, index) => {
            const position = ORBITAL_POSITIONS[index];
            const icon = EMOTION_ICONS[emotion];
            const isActive = activeEmotion === emotion;

            return (
              <motion.div
                key={emotion}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.1,
                  ...MOTION.spring.gentle,
                }}
              >
                {/* Task 2.2.2 & 2.2.3: Magnetic orb with active state */}
                <MagneticFilterOrb
                  label={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                  icon={icon}
                  active={isActive}
                  onClick={() => handleOrbClick(emotion)}
                  magneticRadius={100}
                  emotionType={emotion as EmotionFilterType}
                />
              </motion.div>
            );
          })}

          {/* Center indicator showing active filter */}
          <AnimatePresence>
            {activeEmotion && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={MOTION.spring.snappy}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
              >
                <div className="text-4xl mb-2" aria-hidden="true">
                  {EMOTION_ICONS[activeEmotion]}
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {activeEmotion}
                </div>
                <button
                  onClick={handleClearFilters}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
                  aria-label="Clear emotion filter"
                >
                  Clear filter
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Active filter summary */}
      <div
        className="text-center text-sm text-gray-600 mt-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {activeEmotion ? (
          <span>
            Filtering by <strong className="text-gray-900">{activeEmotion}</strong> emotion
          </span>
        ) : (
          <span>Select an emotion orb to filter photos</span>
        )}
      </div>
    </div>
  );
}
