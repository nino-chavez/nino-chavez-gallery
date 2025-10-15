'use client';

/**
 * Typography Components
 * Semantic typography components for consistent design system
 *
 * Features:
 * - Heading component with 6 levels (h1-h6)
 * - Text component with 4 variants (body, caption, label, code)
 * - Responsive font scaling
 * - Semantic HTML mapping
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Heading Component
// ============================================================================

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingAs = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /**
   * Semantic heading level (determines visual size)
   * @required
   */
  level: HeadingLevel;

  /**
   * HTML element to render (for semantic override)
   * If not provided, uses the level as the element
   * @example level={1} as="h2" - Renders h2 with h1 styling
   */
  as?: HeadingAs;

  /**
   * Content to display
   */
  children: React.ReactNode;
}

/**
 * Semantic heading component with responsive sizing
 *
 * @example
 * ```tsx
 * <Heading level={1}>Page Title</Heading>
 * <Heading level={2}>Section Header</Heading>
 * <Heading level={1} as="h2">Styled as h1, semantic h2</Heading>
 * ```
 */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level, as, className, children, ...props }, ref) => {
    // Determine which element to render
    const Element = (as || `h${level}`) as HeadingAs;

    // Responsive size mapping for each level
    const levelStyles = {
      1: 'text-4xl md:text-5xl font-bold tracking-tight',
      2: 'text-3xl md:text-4xl font-bold tracking-tight',
      3: 'text-2xl md:text-3xl font-semibold tracking-tight',
      4: 'text-xl md:text-2xl font-semibold',
      5: 'text-lg md:text-xl font-semibold',
      6: 'text-base md:text-lg font-semibold',
    };

    // Base styles for all headings
    const baseStyles = 'text-gray-50 leading-tight font-sans';

    return (
      <Element
        ref={ref}
        className={cn(baseStyles, levelStyles[level], className)}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

Heading.displayName = 'Heading';

// ============================================================================
// Text Component
// ============================================================================

export type TextVariant = 'body' | 'caption' | 'label' | 'code';

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  /**
   * Visual style variant
   * @default 'body'
   */
  variant?: TextVariant;

  /**
   * Content to display
   */
  children: React.ReactNode;
}

/**
 * Semantic text component with multiple variants
 *
 * @example
 * ```tsx
 * <Text variant="body">
 *   This is body text with optimal readability.
 * </Text>
 *
 * <Text variant="caption">
 *   Small caption or metadata text
 * </Text>
 *
 * <Text variant="label">
 *   Form label or UI text
 * </Text>
 *
 * <Text variant="code">
 *   Monospace code text
 * </Text>
 * ```
 */
export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ variant = 'body', className, children, ...props }, ref) => {
    // Variant-specific styles
    const variantStyles = {
      body: 'text-base leading-relaxed text-gray-200',
      caption: 'text-sm leading-normal text-gray-400',
      label: 'text-sm leading-normal font-medium text-gray-300',
      code: 'text-sm leading-normal font-mono text-gray-300 bg-gray-900/50 px-1.5 py-0.5 rounded',
    };

    // Use <code> element for code variant, <p> for others
    const Element = variant === 'code' ? 'code' : 'p';

    return (
      <Element
        ref={ref as any}
        className={cn(variantStyles[variant], className)}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

Text.displayName = 'Text';
