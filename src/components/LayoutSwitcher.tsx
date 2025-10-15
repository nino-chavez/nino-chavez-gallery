'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  LayoutGrid,
  Star,
  Trophy,
  Zap,
  ChevronDown,
} from 'lucide-react';
import type { BrowseLayout } from '@/types/layout';
import { BROWSE_LAYOUTS, LAYOUT_STORAGE_KEY, DEFAULT_LAYOUT } from '@/types/layout';

interface LayoutSwitcherProps {
  currentLayout: BrowseLayout;
  onLayoutChange: (layout: BrowseLayout) => void;
}

const ICONS = {
  LayoutGrid,
  Trophy,
  Calendar,
  Zap,
  Star,
};

/**
 * Layout Switcher Component
 *
 * Similar to portfolio site's canvas/traditional toggle,
 * but with dropdown for 5 layout options
 */
export function LayoutSwitcher({ currentLayout, onLayoutChange }: LayoutSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentConfig = BROWSE_LAYOUTS.find((l) => l.id === currentLayout)!;
  const CurrentIcon = ICONS[currentConfig.icon as keyof typeof ICONS];

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-layout-switcher]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const handleLayoutChange = (layout: BrowseLayout) => {
    onLayoutChange(layout);
    setIsOpen(false);

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
    }
  };

  return (
    <div className="relative" data-layout-switcher>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-50 rounded-lg transition-colors duration-200"
        aria-label="Change browse layout"
        aria-expanded={isOpen}
      >
        <CurrentIcon className="w-5 h-5" />
        <span className="font-medium">{currentConfig.name}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-2">
            {BROWSE_LAYOUTS.map((layout) => {
              const Icon = ICONS[layout.icon as keyof typeof ICONS];
              const isActive = layout.id === currentLayout;

              return (
                <button
                  key={layout.id}
                  onClick={() => handleLayoutChange(layout.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-accent-primary text-gray-50'
                      : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{layout.name}</span>
                      {layout.badge && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-accent-hover text-indigo-100'
                              : 'bg-zinc-700 text-zinc-400'
                          }`}
                        >
                          {layout.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-0.5 opacity-80">
                      {layout.description}
                    </p>
                  </div>
                  {isActive && (
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Hint */}
          <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
            <p className="text-xs text-zinc-500 text-center">
              Your preference is saved automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
