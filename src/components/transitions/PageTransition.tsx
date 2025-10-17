'use client';

/**
 * PageTransition Component
 *
 * Wrapper component that provides smooth fade transitions between route changes.
 * Uses Framer Motion's AnimatePresence to orchestrate exit and entrance animations.
 *
 * Features:
 * - 200ms fade-in/fade-out transitions between routes
 * - Zero jarring cuts during navigation
 * - Maintains layout stability during transitions
 * - Uses motion tokens for consistent timing
 *
 * Usage:
 * Wrap page content in layout.tsx or individual pages:
 *
 * @example
 * ```tsx
 * import { PageTransition } from '@/components/transitions';
 *
 * export default function Page() {
 *   return (
 *     <PageTransition>
 *       <div>Your page content</div>
 *     </PageTransition>
 *   );
 * }
 * ```
 */

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { MOTION } from '@/lib/motion-tokens';

export interface PageTransitionProps {
  /**
   * The content to animate during page transitions
   */
  children: ReactNode;

  /**
   * Optional className for the wrapper div
   */
  className?: string;
}

/**
 * PageTransition Component
 *
 * Provides smooth fade transitions between page navigations
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: MOTION.duration.fast, // 0.2s
          ease: 'easeInOut',
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

PageTransition.displayName = 'PageTransition';
