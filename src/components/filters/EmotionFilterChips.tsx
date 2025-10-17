'use client';

import { motion } from 'framer-motion';
import { EMOTION_PALETTE, EMOTION_ICONS, MOTION } from '@/lib/motion-tokens';
import { type EmotionType } from '@/contexts/EmotionContext';

/**
 * EmotionFilterChips Component
 * Task 2.1.5: Implement emotion filter chips
 *
 * Features:
 * - Replace current filter UI with emotion chips
 * - Active chips show emotion-colored background
 *
 * Acceptance criteria:
 * - Chips styled with EMOTION_PALETTE
 * - Multiple emotions can be selected
 * - Filter results update immediately
 */

interface EmotionFilterChipsProps {
  selectedEmotions: EmotionType[];
  onEmotionToggle: (emotion: EmotionType) => void;
  onClear?: () => void;
  disabled?: boolean;
}

const EMOTIONS: EmotionType[] = [
  'triumph',
  'focus',
  'intensity',
  'determination',
  'excitement',
  'serenity',
];

export function EmotionFilterChips({
  selectedEmotions,
  onEmotionToggle,
  onClear,
  disabled = false,
}: EmotionFilterChipsProps) {
  const hasSelection = selectedEmotions.length > 0;

  return (
    <div className="emotion-filter-chips" role="group" aria-label="Emotion filters">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700">
          Filter by Emotion
        </label>
        {hasSelection && onClear && (
          <button
            onClick={onClear}
            disabled={disabled}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Clear emotion filters"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Emotion chips grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {EMOTIONS.map((emotion) => {
          const isSelected = selectedEmotions.includes(emotion);
          const emotionConfig = EMOTION_PALETTE[emotion];
          const emotionIcon = EMOTION_ICONS[emotion];

          return (
            <motion.button
              key={emotion}
              onClick={() => onEmotionToggle(emotion)}
              disabled={disabled}
              className="emotion-chip relative overflow-hidden rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isSelected ? emotionConfig.gradient : 'rgb(249, 250, 251)',
                color: isSelected ? 'white' : 'rgb(75, 85, 99)',
                border: isSelected
                  ? `2px solid ${emotionConfig.primary}`
                  : '2px solid rgb(229, 231, 235)',
              }}
              whileHover={
                !disabled
                  ? {
                      scale: 1.05,
                      boxShadow: isSelected ? emotionConfig.glow : '0 4px 12px rgba(0,0,0,0.1)',
                    }
                  : undefined
              }
              whileTap={!disabled ? { scale: 0.95 } : undefined}
              transition={MOTION.spring.snappy}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Remove' : 'Add'} ${emotion} filter`}
            >
              {/* Icon and label */}
              <div className="flex items-center justify-center gap-1">
                <span className="text-base" aria-hidden="true">
                  {emotionIcon}
                </span>
                <span className="capitalize">{emotion}</span>
              </div>

              {/* Glow effect for selected chips */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{
                    boxShadow: emotionConfig.glow,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ duration: MOTION.duration.fast }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected count indicator */}
      {hasSelection && (
        <div className="mt-2 text-xs text-gray-600" aria-live="polite">
          {selectedEmotions.length} {selectedEmotions.length === 1 ? 'emotion' : 'emotions'}{' '}
          selected
        </div>
      )}
    </div>
  );
}
