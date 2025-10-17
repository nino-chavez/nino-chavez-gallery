'use client';

import { motion, type Variants } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/**
 * Task 2.3.1: QualityBadge Component
 *
 * Displays quality indicators for photos with visual badges
 * - Gold star badge for portfolio_worthy photos
 * - Print-ready and social-optimized indicators
 * - Positioned in top-right corner
 *
 * Task 2.3.5: Shimmer animation
 * - Subtle gradient sweep on portfolio-worthy photos
 * - Animation triggers on scroll into view
 * - Runs once per session
 */

export type QualityType = 'portfolio_worthy' | 'print_ready' | 'social_media_optimized';

interface QualityBadgeProps {
  type: QualityType;
  /** Enable shimmer animation (only for portfolio_worthy) */
  enableShimmer?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const QUALITY_BADGES = {
  portfolio_worthy: {
    icon: '⭐',
    color: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    label: 'Portfolio',
  },
  print_ready: {
    icon: '🖨️',
    color: 'bg-gradient-to-r from-blue-400 to-indigo-500',
    label: 'Print Ready',
  },
  social_media_optimized: {
    icon: '📱',
    color: 'bg-gradient-to-r from-pink-400 to-rose-500',
    label: 'Social',
  },
};

/**
 * Task 2.3.5: Shimmer animation keyframes
 * Acceptance criteria:
 * - Shimmer effect smooth (2s duration)
 * - Animation runs once per session
 * - Does not affect performance
 */
const shimmerVariants: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 2,
      ease: [0.16, 1, 0.3, 1] as const, // MOTION.ease.easeOut
      repeat: 0, // Runs once
    },
  },
};

export function QualityBadge({ type, enableShimmer = false, className = '' }: QualityBadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const config = QUALITY_BADGES[type];

  /**
   * Task 2.3.5: Intersection Observer for scroll-triggered animation
   * Animation triggers once when badge scrolls into view
   */
  useEffect(() => {
    if (!enableShimmer || type !== 'portfolio_worthy') {
      return;
    }

    // Check if this badge has already animated in this session
    const sessionKey = `badge-animated-${type}`;
    if (sessionStorage.getItem(sessionKey) === 'true') {
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setIsInView(true);
            setHasAnimated(true);
            // Mark as animated in session storage
            sessionStorage.setItem(sessionKey, 'true');
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% visible
        rootMargin: '0px',
      }
    );

    if (badgeRef.current) {
      observer.observe(badgeRef.current);
    }

    return () => {
      if (badgeRef.current) {
        observer.unobserve(badgeRef.current);
      }
    };
  }, [enableShimmer, type, hasAnimated]);

  const shouldAnimate = enableShimmer && type === 'portfolio_worthy' && isInView && !hasAnimated;

  return (
    <motion.div
      ref={badgeRef}
      className={`
        inline-flex items-center gap-1
        px-2 py-1
        rounded-full
        text-xs font-medium text-white
        shadow-md
        ${config.color}
        ${className}
      `}
      initial={shouldAnimate ? 'initial' : undefined}
      animate={shouldAnimate ? 'animate' : undefined}
      variants={shouldAnimate ? shimmerVariants : undefined}
      style={
        shouldAnimate
          ? {
              backgroundSize: '200% 100%',
              backgroundImage: `linear-gradient(
                90deg,
                transparent 0%,
                rgba(255, 255, 255, 0.3) 50%,
                transparent 100%
              ), ${config.color.replace('bg-gradient-to-r', 'linear-gradient(to right,')}`,
            }
          : undefined
      }
      aria-label={config.label}
      role="status"
    >
      <span aria-hidden="true">{config.icon}</span>
      <span className="sr-only">{config.label}</span>
      <span className="hidden sm:inline">{config.label}</span>
    </motion.div>
  );
}

/**
 * QualityBadgeGroup - Displays multiple quality badges
 * Used to show all applicable quality flags for a photo
 */
interface QualityBadgeGroupProps {
  portfolioWorthy?: boolean;
  printReady?: boolean;
  socialMediaOptimized?: boolean;
  enableShimmer?: boolean;
  className?: string;
}

export function QualityBadgeGroup({
  portfolioWorthy,
  printReady,
  socialMediaOptimized,
  enableShimmer = false,
  className = '',
}: QualityBadgeGroupProps) {
  const badges: QualityType[] = [];

  if (portfolioWorthy) badges.push('portfolio_worthy');
  if (printReady) badges.push('print_ready');
  if (socialMediaOptimized) badges.push('social_media_optimized');

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={`flex gap-1 flex-wrap ${className}`} role="group" aria-label="Photo quality indicators">
      {badges.map((badge) => (
        <QualityBadge
          key={badge}
          type={badge}
          enableShimmer={enableShimmer && badge === 'portfolio_worthy'}
        />
      ))}
    </div>
  );
}
