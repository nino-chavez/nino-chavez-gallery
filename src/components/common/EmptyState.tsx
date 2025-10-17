'use client';

/**
 * EmptyState Component
 *
 * Contextual empty state component for all routes with 5 state types.
 * Uses emotion palette colors for icons to create visual consistency and
 * emotional resonance with the gallery's core design system.
 *
 * Features:
 * - 5 state types: portfolio, search, browse, stories, album
 * - Emotion palette colors applied to icons
 * - Contextual messaging for each state
 * - Optional action button with callback
 * - Responsive, centered layout
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Heading, Text, Button } from '@/components/ui';
import { Frame, Search, Grid, BookOpen, Folder } from 'lucide-react';

export type EmptyStateType = 'portfolio' | 'search' | 'browse' | 'stories' | 'album';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The type of empty state to display
   * @required
   */
  type: EmptyStateType;

  /**
   * Optional search query to display in search empty state
   */
  searchQuery?: string;

  /**
   * Optional action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * State configuration mapping
 * Maps each state type to its icon, title, description, and emotion color
 */
const STATE_CONFIG = {
  portfolio: {
    icon: Frame,
    title: 'Portfolio Ready',
    description: 'Your portfolio is set up and ready to showcase your best work.',
    // Joy emotion: amber color (#FFD700) for optimistic, ready state
    colorClass: 'text-[#FFD700]',
    testId: 'empty-state-portfolio',
  },
  search: {
    icon: Search,
    title: 'No Photos Found',
    // Description will be dynamic based on searchQuery
    description: 'No photos match your search. Try adjusting your filters.',
    // Curiosity emotion: blue color (#4169E1) for exploration
    colorClass: 'text-[#4169E1]',
    testId: 'empty-state-search',
  },
  browse: {
    icon: Grid,
    title: 'Browse Gallery',
    description: 'Explore all available photos organized by albums.',
    // Focus emotion: indigo color (#4169E1) for browsing exploration
    colorClass: 'text-[#6366F1]',
    testId: 'empty-state-browse',
  },
  stories: {
    icon: BookOpen,
    title: 'No Stories Yet',
    description: "Stories haven't been created yet. Check back soon.",
    // Serenity emotion: sky blue color (#87CEEB) for calm, patient state
    colorClass: 'text-[#87CEEB]',
    testId: 'empty-state-stories',
  },
  album: {
    icon: Folder,
    title: 'Album Empty',
    description: "This album doesn't contain any photos yet.",
    // Determination emotion: crimson color (#DC143C) for expectant state
    colorClass: 'text-[#DC143C]',
    testId: 'empty-state-album',
  },
} as const;

/**
 * EmptyState Component
 *
 * Displays contextual empty states with emotion-themed icons and messaging
 *
 * @example
 * ```tsx
 * // Portfolio empty state
 * <EmptyState type="portfolio" />
 *
 * // Search empty state with query
 * <EmptyState
 *   type="search"
 *   searchQuery="volleyball spike"
 *   action={{
 *     label: "Clear Search",
 *     onClick: () => setQuery("")
 *   }}
 * />
 *
 * // Album empty state with action
 * <EmptyState
 *   type="album"
 *   action={{
 *     label: "Browse All Photos",
 *     onClick: () => router.push("/browse")
 *   }}
 * />
 * ```
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ type, searchQuery, action, className, ...props }, ref) => {
    const config = STATE_CONFIG[type];
    const Icon = config.icon;

    // Dynamic description for search state with query
    const description =
      type === 'search' && searchQuery
        ? `No photos match "${searchQuery}". Try adjusting your filters.`
        : config.description;

    return (
      <div
        ref={ref}
        data-testid={config.testId}
        className={cn(
          'flex flex-col items-center justify-center',
          'text-center',
          'py-12 sm:py-16 lg:py-24',
          'px-4 sm:px-6 lg:px-8',
          'max-w-2xl mx-auto',
          className
        )}
        {...props}
      >
        {/* Icon with emotion palette color */}
        <div className="mb-6">
          <Icon
            className={cn(
              'w-16 h-16 sm:w-20 sm:h-20',
              config.colorClass,
              'opacity-90'
            )}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        {/* Title */}
        <Heading
          level={2}
          className="mb-3 text-2xl sm:text-3xl"
        >
          {config.title}
        </Heading>

        {/* Description */}
        <Text
          variant="body"
          className="text-gray-400 mb-8 max-w-md leading-relaxed"
        >
          {description}
        </Text>

        {/* Optional Action Button */}
        {action && (
          <Button
            variant="secondary"
            size="md"
            onClick={action.onClick}
            className="min-w-[160px]"
          >
            {action.label}
          </Button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
