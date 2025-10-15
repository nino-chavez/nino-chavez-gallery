'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingState } from '@/components/common/LoadingState';
import { InlineError } from '@/components/common/ErrorState';
import { useFocusTrap } from '@/components/common/Accessibility';

interface StoryGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: {
    type: 'athlete' | 'game' | 'season' | 'browse';
    id: string;
    name: string;
  };
}

const STORY_TYPES = [
  {
    id: 'player-highlight',
    icon: '⭐',
    title: 'Player Highlight Reel',
    description: 'Top 10 portfolio moments',
    contexts: ['athlete', 'browse'],
  },
  {
    id: 'game-winning-rally',
    icon: '🏆',
    title: 'Game-Winning Rally',
    description: 'Final 5 minutes of victory',
    contexts: ['game', 'browse'],
  },
  {
    id: 'season-journey',
    icon: '📖',
    title: 'Season Journey',
    description: 'One photo per game',
    contexts: ['season', 'athlete', 'browse'],
  },
  {
    id: 'comeback-story',
    icon: '💪',
    title: 'The Comeback',
    description: 'From adversity to triumph',
    contexts: ['game', 'browse'],
  },
  {
    id: 'technical-excellence',
    icon: '📸',
    title: 'Technical Excellence',
    description: 'Best quality shots',
    contexts: ['game', 'season', 'athlete', 'browse'],
  },
  {
    id: 'emotion-spectrum',
    icon: '🎭',
    title: 'Emotion Spectrum',
    description: 'Full range of emotions',
    contexts: ['game', 'browse'],
  },
];

export function StoryGenerationModal({ isOpen, onClose, context }: StoryGenerationModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusTrap(isOpen);

  const availableTypes = STORY_TYPES.filter(type =>
    type.contexts.includes(context.type)
  );

  const handleGenerate = async () => {
    if (!selectedType) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyType: selectedType,
          context: {
            [`${context.type}Id`]: context.id,
            [`${context.type}Name`]: context.name,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate story');
      }

      const { story } = await response.json();

      // Success - close modal and refresh page
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate story');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Generate Story</h2>
              <p className="text-sm text-gray-600">{context.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4">
                <InlineError message={error} onDismiss={() => setError(null)} />
              </div>
            )}

            {isGenerating ? (
              <LoadingState message="Generating your story..." />
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  Choose a story type to automatically generate a highlight reel
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {availableTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedType === type.id
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{type.icon}</span>
                        <div>
                          <h3 className="font-bold mb-1">{type.title}</h3>
                          <p className={`text-sm ${
                            selectedType === type.id ? 'text-white/80' : 'text-gray-600'
                          }`}>
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={!selectedType}
                    className="flex-1 bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate Story
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-full border border-gray-300 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
