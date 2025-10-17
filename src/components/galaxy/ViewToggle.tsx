'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';

export type ViewMode = '2d' | '2.5d' | '3d';

export interface ViewToggleProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  className?: string;
}

/**
 * ViewToggle component for switching between 2D grid, 2.5D isometric, and 3D space views
 *
 * Features:
 * - Three toggle buttons for each view mode
 * - Active mode highlighted with emotion-themed styling
 * - Keyboard shortcut: D key cycles through modes
 * - Smooth animations with Framer Motion
 * - Accessible with ARIA labels
 *
 * @example
 * ```tsx
 * <ViewToggle
 *   currentMode={viewMode}
 *   onModeChange={setViewMode}
 * />
 * ```
 */
export function ViewToggle({ currentMode, onModeChange, className = '' }: ViewToggleProps) {
  // Keyboard shortcut: D key cycles through modes
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        // Don't trigger if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        // Cycle through modes: 2d → 2.5d → 3d → 2d
        const modes: ViewMode[] = ['2d', '2.5d', '3d'];
        const currentIndex = modes.indexOf(currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        onModeChange(modes[nextIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentMode, onModeChange]);

  const modes: Array<{ value: ViewMode; label: string; icon: string; description: string }> = [
    { value: '2d', label: '2D Grid', icon: '⊞', description: 'Traditional grid layout' },
    { value: '2.5d', label: '2.5D', icon: '◧', description: 'Isometric perspective' },
    { value: '3d', label: '3D Space', icon: '◉', description: 'Full 3D galaxy' },
  ];

  return (
    <div
      className={`flex items-center gap-2 bg-gray-900/80 backdrop-blur-sm rounded-lg p-2 ${className}`}
      role="group"
      aria-label="View mode toggle"
    >
      {modes.map((mode) => {
        const isActive = currentMode === mode.value;

        return (
          <button
            key={mode.value}
            onClick={() => onModeChange(mode.value)}
            className={`
              relative px-4 py-2 rounded-md font-medium text-sm
              transition-all duration-200
              ${isActive
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
            `}
            aria-label={`${mode.label}: ${mode.description}`}
            aria-pressed={isActive}
            title={mode.description}
          >
            {/* Active background */}
            {isActive && (
              <motion.div
                layoutId="activeViewMode"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md"
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              />
            )}

            {/* Content */}
            <span className="relative flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">{mode.icon}</span>
              <span>{mode.label}</span>
            </span>
          </button>
        );
      })}

      {/* Keyboard hint */}
      <div className="ml-2 px-3 py-1 text-xs text-gray-500 border border-gray-700 rounded">
        Press <kbd className="font-mono font-bold text-gray-400">D</kbd>
      </div>
    </div>
  );
}
