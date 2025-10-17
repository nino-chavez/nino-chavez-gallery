'use client';

/**
 * StoryTypeCard Component
 * Task 2.4.1: Create StoryTypeCard component
 *
 * Cards for 6 story types with icons and descriptions.
 * Hover effect shows example photo count.
 *
 * Features:
 * - Unique icon for each story type
 * - Description explains story detection algorithm
 * - Hover shows estimated photo count
 * - Gradient backgrounds based on story type
 * - Smooth animation transitions
 *
 * Acceptance Criteria:
 * - Each story type has unique icon
 * - Description explains story detection algorithm
 * - Hover shows estimated photo count
 */

import { motion } from 'framer-motion';
import { MOTION } from '@/lib/motion-tokens';
import { cn } from '@/lib/utils';

export interface StoryTypeCardProps {
  /**
   * Story type identifier
   */
  type: 'game-winning-rally' | 'player-highlight' | 'season-journey' | 'comeback-story' | 'technical-excellence' | 'emotion-spectrum';

  /**
   * Display icon for the story type
   */
  icon: string;

  /**
   * Display label for the story type
   */
  label: string;

  /**
   * Description of the story detection algorithm
   */
  description: string;

  /**
   * Gradient color classes for the card
   */
  gradient: string;

  /**
   * Estimated photo count for this story type
   */
  photoCount?: number;

  /**
   * Whether the card is currently selected
   */
  selected?: boolean;

  /**
   * Click handler for the card
   */
  onClick?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * StoryTypeCard Component
 *
 * A card representing a story type option with hover effects
 * and photo count display
 *
 * @example
 * ```tsx
 * <StoryTypeCard
 *   type="game-winning-rally"
 *   icon="🏆"
 *   label="Game-Winning Rally"
 *   description="Final 5 minutes with peak intensity moments"
 *   gradient="from-yellow-400 to-amber-500"
 *   photoCount={24}
 *   selected={false}
 *   onClick={() => handleSelect('game-winning-rally')}
 * />
 * ```
 */
export function StoryTypeCard({
  type,
  icon,
  label,
  description,
  gradient,
  photoCount,
  selected = false,
  onClick,
  className,
}: StoryTypeCardProps) {
  return (
    <motion.button
      className={cn(
        'relative p-6 rounded-xl text-left transition-all duration-300',
        'border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black',
        selected
          ? 'border-black bg-black text-white shadow-lg'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md',
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={MOTION.spring.responsive}
      aria-pressed={selected}
      aria-label={`${label} story type${photoCount !== undefined ? `, ${photoCount} photos estimated` : ''}`}
      data-testid={`story-type-card-${type}`}
    >
      {/* Gradient background overlay on hover - only visible when not selected */}
      {!selected && (
        <motion.div
          className={cn(
            'absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 transition-opacity duration-300',
            gradient
          )}
          whileHover={{ opacity: 0.05 }}
        />
      )}

      {/* Content container */}
      <div className="relative z-10">
        {/* Icon and photo count row */}
        <div className="flex items-start justify-between mb-3">
          <motion.span
            className="text-4xl"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={MOTION.spring.snappy}
            aria-hidden="true"
          >
            {icon}
          </motion.span>

          {/* Photo count badge - shows on hover or when selected */}
          {photoCount !== undefined && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
              animate={selected ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={MOTION.spring.responsive}
              className={cn(
                'px-2 py-1 rounded-full text-xs font-semibold',
                selected
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-700'
              )}
              aria-label={`${photoCount} photos`}
            >
              {photoCount} photos
            </motion.div>
          )}
        </div>

        {/* Label */}
        <h3
          className={cn(
            'text-lg font-bold mb-2',
            selected ? 'text-white' : 'text-gray-900'
          )}
        >
          {label}
        </h3>

        {/* Description */}
        <p
          className={cn(
            'text-sm leading-relaxed',
            selected ? 'text-white/80' : 'text-gray-600'
          )}
        >
          {description}
        </p>
      </div>

      {/* Selected indicator */}
      {selected && (
        <motion.div
          className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={MOTION.spring.snappy}
        >
          <svg
            className="w-4 h-4 text-black"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}
