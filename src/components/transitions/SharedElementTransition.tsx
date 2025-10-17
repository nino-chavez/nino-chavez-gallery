'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * SharedElementTransition Component
 * Task 3.1.1: Create shared element transition using Framer Motion layoutId
 *
 * Features:
 * - Smooth morphing between grid thumbnail and detail view
 * - 400ms animation duration (MOTION.duration.base)
 * - Works across Next.js route changes via layoutId
 *
 * Usage:
 * <SharedElementTransition layoutId="photo-123">
 *   <img src="..." alt="..." />
 * </SharedElementTransition>
 */

interface SharedElementTransitionProps {
  /**
   * Unique identifier for shared element matching
   * Must match between source and destination views
   */
  layoutId: string;

  /**
   * Content to animate
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Animation duration in seconds (default: 0.4)
   */
  duration?: number;

  /**
   * Custom transition spring configuration
   */
  transition?: {
    type?: 'spring' | 'tween';
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
}

/**
 * SharedElementTransition Component
 *
 * Wraps content in a Framer Motion layout-animated element
 * enabling smooth morphing transitions between views.
 */
export function SharedElementTransition({
  layoutId,
  children,
  className = '',
  duration = 0.4,
  transition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },
}: SharedElementTransitionProps) {
  return (
    <motion.div
      layoutId={layoutId}
      className={className}
      transition={{
        duration,
        ...transition,
      }}
      style={{
        // Prevent layout shift during animation
        position: 'relative',
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedPresence wrapper for exit animations
 *
 * Use this to wrap components that need exit animations
 * when unmounting (e.g., navigating away from a page)
 */
export function SharedElementPresence({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {children}
    </AnimatePresence>
  );
}
