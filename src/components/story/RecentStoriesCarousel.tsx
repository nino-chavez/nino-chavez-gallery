'use client';

/**
 * RecentStoriesCarousel Component
 * Task 2.4.5: Create RecentStoriesCarousel for homepage
 *
 * Horizontal scroll of auto-generated story cards showing story type,
 * photo count, and emotional curve preview.
 *
 * Features:
 * - Horizontal scroll with snap points
 * - Shows 3-5 recent stories
 * - Smooth scroll behavior
 * - Click card navigates to story viewer
 * - Touch-friendly on mobile
 * - Keyboard navigation support
 *
 * Acceptance Criteria:
 * - Carousel shows 3-5 recent stories
 * - Smooth horizontal scroll
 * - Click card navigates to story viewer
 */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import useSWR from 'swr';
import { Heading, Text } from '@/components/ui';
import { MOTION } from '@/lib/motion-tokens';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Story type to gradient mapping
 */
const STORY_GRADIENTS: Record<string, string> = {
  'game-winning-rally': 'from-yellow-400 to-amber-500',
  'player-highlight': 'from-blue-400 to-indigo-500',
  'season-journey': 'from-green-400 to-emerald-500',
  'comeback-story': 'from-red-400 to-rose-500',
  'technical-excellence': 'from-purple-400 to-violet-500',
  'emotion-spectrum': 'from-pink-400 to-fuchsia-500',
};

/**
 * Story type to icon mapping
 */
const STORY_ICONS: Record<string, string> = {
  'game-winning-rally': '🏆',
  'player-highlight': '⭐',
  'season-journey': '📅',
  'comeback-story': '💪',
  'technical-excellence': '🎯',
  'emotion-spectrum': '🌈',
};

interface Story {
  id: string;
  type: string;
  title: string;
  photoCount: number;
  emotionalCurve?: number[];
  createdAt: string;
}

interface RecentStoriesCarouselProps {
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * SWR fetcher function
 */
const fetcher = (url: string) => fetch(url).then(r => r.json());

/**
 * Emotional curve mini visualization
 */
function EmotionalCurveMini({ curve }: { curve?: number[] }) {
  if (!curve || curve.length === 0) return null;

  const maxValue = Math.max(...curve);
  const normalizedCurve = curve.map(v => (v / maxValue) * 100);

  return (
    <div className="flex items-end gap-0.5 h-8" aria-label="Emotional intensity curve">
      {normalizedCurve.map((value, index) => (
        <div
          key={index}
          className="flex-1 bg-white/30 rounded-t-sm"
          style={{ height: `${value}%` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * Story Card Component
 */
function StoryCard({ story }: { story: Story }) {
  const router = useRouter();
  const gradient = STORY_GRADIENTS[story.type] || 'from-gray-400 to-gray-500';
  const icon = STORY_ICONS[story.type] || '📖';

  return (
    <motion.button
      className={`story-card flex-shrink-0 w-72 sm:w-80 rounded-xl p-6 text-left bg-gradient-to-br ${gradient} text-white shadow-lg hover:shadow-xl transition-shadow scroll-snap-align-start focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
      onClick={() => router.push(`/stories/${story.id}`)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={MOTION.spring.responsive}
      aria-label={`View ${story.title} story`}
    >
      {/* Icon */}
      <div className="text-4xl mb-3" aria-hidden="true">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold mb-2 line-clamp-2">
        {story.title}
      </h3>

      {/* Photo count */}
      <Text variant="caption" className="text-white/80 mb-4">
        {story.photoCount} photos
      </Text>

      {/* Emotional curve */}
      <EmotionalCurveMini curve={story.emotionalCurve} />
    </motion.button>
  );
}

/**
 * RecentStoriesCarousel Component
 *
 * Displays a horizontal scrolling carousel of recent stories
 *
 * @example
 * ```tsx
 * <RecentStoriesCarousel />
 * ```
 */
export function RecentStoriesCarousel({ className = '' }: RecentStoriesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Fetch recent stories
  const { data, error, isLoading } = useSWR('/api/stories/recent', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const stories: Story[] = data?.stories || [];

  // Update scroll button visibility
  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollButtons();
  }, [stories]);

  // Scroll handlers
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
    const targetScroll = direction === 'left'
      ? scrollContainerRef.current.scrollLeft - scrollAmount
      : scrollContainerRef.current.scrollLeft + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      scroll('left');
    } else if (e.key === 'ArrowRight') {
      scroll('right');
    }
  };

  // Don't render if no stories or loading
  if (isLoading || error || stories.length === 0) {
    return null;
  }

  return (
    <section
      className={`recent-stories-carousel ${className}`}
      aria-labelledby="recent-stories-heading"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Heading level={2} id="recent-stories-heading" className="text-2xl">
          Recent Stories
        </Heading>

        {/* Scroll buttons - desktop only */}
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel container with horizontal scroll */}
      <div
        ref={scrollContainerRef}
        className="carousel-container flex gap-4 overflow-x-auto pb-4 scroll-smooth"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
        onScroll={updateScrollButtons}
        onKeyDown={handleKeyDown}
        role="list"
        tabIndex={0}
        aria-label="Recent stories carousel"
      >
        {stories.map((story) => (
          <div key={story.id} role="listitem">
            <StoryCard story={story} />
          </div>
        ))}
      </div>

      {/* Scroll indicator for mobile */}
      <div className="sm:hidden text-center mt-2">
        <Text variant="caption" className="text-gray-500">
          Swipe to see more stories
        </Text>
      </div>
    </section>
  );
}
