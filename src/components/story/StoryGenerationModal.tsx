'use client';

/**
 * StoryGenerationModal Component
 * Task 2.4.2: Build StoryGenerationModal component
 * Task 2.4.4: Implement story generation flow
 *
 * Modal with 6 story type options, preview of photos that would be included,
 * and story generation flow with API integration.
 *
 * Features:
 * - Modal opens with smooth animation
 * - Story types displayed in grid using StoryTypeCard
 * - Close modal with Escape key
 * - API call to /api/stories/generate with selected type
 * - Loading state during generation
 * - Navigate to story viewer on success
 *
 * Acceptance Criteria (2.4.2):
 * - Modal opens with smooth animation
 * - Story types displayed in grid
 * - Close modal with Escape key
 *
 * Acceptance Criteria (2.4.4):
 * - API call succeeds and creates story
 * - Loading spinner visible during generation
 * - Redirect to /stories/[id] on success
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryTypeCard } from './StoryTypeCard';
import { LoadingState } from '@/components/common/LoadingState';
import { InlineError } from '@/components/common/ErrorState';
import { Heading, Text } from '@/components/ui';
import { MOTION } from '@/lib/motion-tokens';

export type StoryType = 'game-winning-rally' | 'player-highlight' | 'season-journey' | 'comeback-story' | 'technical-excellence' | 'emotion-spectrum';

export interface StoryGenerationModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback to close the modal
   */
  onClose: () => void;

  /**
   * Context for story generation
   */
  context: {
    type: 'browse' | 'portfolio' | 'album';
    id: string;
    name: string;
  };

  /**
   * Optional photo count estimates per story type
   */
  photoCounts?: Partial<Record<StoryType, number>>;
}

/**
 * Story type configuration
 */
const STORY_TYPES: Array<{
  id: StoryType;
  icon: string;
  label: string;
  description: string;
  gradient: string;
}> = [
  {
    id: 'game-winning-rally',
    icon: '🏆',
    label: 'Game-Winning Rally',
    description: 'Final 5 minutes with peak intensity moments',
    gradient: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'player-highlight',
    icon: '⭐',
    label: 'Player Highlight Reel',
    description: 'Top portfolio-worthy shots per player',
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'season-journey',
    icon: '📅',
    label: 'Season Journey',
    description: 'Representative photos from each week',
    gradient: 'from-green-400 to-emerald-500',
  },
  {
    id: 'comeback-story',
    icon: '💪',
    label: 'Comeback Story',
    description: 'Emotional arc: determination → intensity → triumph',
    gradient: 'from-red-400 to-rose-500',
  },
  {
    id: 'technical-excellence',
    icon: '🎯',
    label: 'Technical Excellence',
    description: 'Highest quality shots (sharpness/composition ≥9)',
    gradient: 'from-purple-400 to-violet-500',
  },
  {
    id: 'emotion-spectrum',
    icon: '🌈',
    label: 'Emotion Spectrum',
    description: 'Best photo for each emotion in a game',
    gradient: 'from-pink-400 to-fuchsia-500',
  },
];

/**
 * Modal entrance/exit animation variants
 */
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION.duration.base,
      ease: MOTION.ease.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: MOTION.duration.fast,
    },
  },
};

/**
 * StoryGenerationModal Component
 *
 * @example
 * ```tsx
 * <StoryGenerationModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   context={{
 *     type: 'portfolio',
 *     id: 'portfolio-1',
 *     name: 'My Portfolio'
 *   }}
 *   photoCounts={{
 *     'game-winning-rally': 24,
 *     'player-highlight': 18,
 *   }}
 * />
 * ```
 */
export function StoryGenerationModal({
  isOpen,
  onClose,
  context,
  photoCounts = {},
}: StoryGenerationModalProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<StoryType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Task 2.4.2: Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isGenerating) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isGenerating, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null);
      setError(null);
    }
  }, [isOpen]);

  // Task 2.4.4: Implement story generation flow
  const handleGenerate = async () => {
    if (!selectedType) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          context: {
            type: context.type,
            id: context.id,
            name: context.name,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate story');
      }

      const { id } = await response.json();

      // Task 2.4.4: Navigate to story viewer on success
      router.push(`/stories/${id}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate story');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!isGenerating ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            variants={modalVariants}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <Heading level={2} id="modal-title" className="text-2xl">
                  Generate Story
                </Heading>
                <Text variant="caption" className="text-gray-600 mt-1">
                  {context.name}
                </Text>
              </div>
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Error message */}
              {error && (
                <div className="mb-6">
                  <InlineError message={error} onDismiss={() => setError(null)} />
                </div>
              )}

              {/* Task 2.4.4: Loading state during generation */}
              {isGenerating ? (
                <LoadingState message="Generating your story..." />
              ) : (
                <>
                  <Text variant="body" className="text-gray-600 mb-6">
                    Choose a story type to automatically generate a curated collection
                    of photos with a narrative arc.
                  </Text>

                  {/* Task 2.4.2: Story types displayed in grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {STORY_TYPES.map((storyType) => (
                      <StoryTypeCard
                        key={storyType.id}
                        type={storyType.id}
                        icon={storyType.icon}
                        label={storyType.label}
                        description={storyType.description}
                        gradient={storyType.gradient}
                        photoCount={photoCounts[storyType.id]}
                        selected={selectedType === storyType.id}
                        onClick={() => setSelectedType(storyType.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer with action buttons */}
            {!isGenerating && (
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                  aria-label="Cancel story generation"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!selectedType}
                  className="px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                  aria-label="Generate selected story"
                >
                  Generate Story
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
