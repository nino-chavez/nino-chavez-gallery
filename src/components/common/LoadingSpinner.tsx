'use client';

/**
 * LoadingSpinner Component
 *
 * Accessible loading spinner for async operations with configurable size and context.
 * Includes ARIA live regions for screen reader announcements.
 *
 * Features:
 * - Multiple sizes (sm, md, lg)
 * - ARIA live regions for accessibility
 * - Smooth CSS animation
 * - Optional loading message
 * - Prevents multiple simultaneous operations with disabled states
 *
 * Usage:
 * - Story generation loading
 * - Filter application progress
 * - General async operation indicators
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui';

export interface LoadingSpinnerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Optional loading message to display below spinner
   */
  message?: string;

  /**
   * ARIA label for screen readers
   * @default 'Loading'
   */
  label?: string;

  /**
   * Whether to show as inline (no centering)
   * @default false
   */
  inline?: boolean;
}

/**
 * LoadingSpinner Component
 *
 * Displays an animated spinner for async operations with accessibility support.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingSpinner />
 *
 * // With message
 * <LoadingSpinner message="Generating story..." />
 *
 * // Custom size and label
 * <LoadingSpinner
 *   size="lg"
 *   label="Processing photos"
 *   message="Analyzing 150 photos..."
 * />
 *
 * // Inline (no centering)
 * <LoadingSpinner size="sm" inline />
 * ```
 */
export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  (
    {
      size = 'md',
      message,
      label = 'Loading',
      inline = false,
      className,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'w-4 h-4 border-2',
      md: 'w-8 h-8 border-[3px]',
      lg: 'w-12 h-12 border-4',
    };

    return (
      <div
        ref={ref}
        data-testid="loading-spinner"
        className={cn(
          'loading-spinner-container',
          {
            // Centered layout (default)
            'flex flex-col items-center justify-center gap-3 py-8': !inline,
            // Inline layout (no centering)
            'inline-flex items-center gap-2': inline,
          },
          className
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
        {...props}
      >
        {/* Spinner circle */}
        <div
          className={cn(
            'loading-spinner',
            'rounded-full border-gray-700',
            'border-t-accent border-r-accent',
            'animate-spin',
            sizeClasses[size]
          )}
          aria-hidden="true"
        />

        {/* Optional loading message */}
        {message && (
          <Text
            variant="body"
            className={cn(
              'text-gray-400',
              {
                'text-center max-w-xs': !inline,
                'text-sm': inline,
              }
            )}
          >
            {message}
          </Text>
        )}

        {/* Screen reader only announcement */}
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

// ============================================================================
// LoadingButton (Bonus Component)
// ============================================================================

export interface LoadingButtonProps extends HTMLAttributes<HTMLButtonElement> {
  /**
   * Whether the button is in loading state
   */
  isLoading: boolean;

  /**
   * Button text when not loading
   */
  children: React.ReactNode;

  /**
   * Optional loading text to display during loading state
   */
  loadingText?: string;

  /**
   * Button variant (matches UI system)
   */
  variant?: 'primary' | 'secondary' | 'outline';

  /**
   * Disabled state (independent of loading)
   */
  disabled?: boolean;
}

/**
 * LoadingButton Component
 *
 * Button component with built-in loading state and spinner.
 * Prevents multiple simultaneous operations by disabling during loading.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingButton
 *   isLoading={isGenerating}
 *   onClick={handleGenerate}
 * >
 *   Generate Story
 * </LoadingButton>
 *
 * // With custom loading text
 * <LoadingButton
 *   isLoading={isGenerating}
 *   loadingText="Generating..."
 *   onClick={handleGenerate}
 * >
 *   Generate Story
 * </LoadingButton>
 * ```
 */
export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      isLoading,
      children,
      loadingText,
      variant = 'primary',
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'relative inline-flex items-center justify-center gap-2',
      'px-6 py-3 rounded-lg',
      'font-medium text-sm',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      {
        // Primary variant
        'bg-accent text-white hover:bg-accent-hover active:scale-95':
          variant === 'primary' && !isLoading && !disabled,
        // Secondary variant
        'bg-gray-700 text-white hover:bg-gray-600 active:scale-95':
          variant === 'secondary' && !isLoading && !disabled,
        // Outline variant
        'border-2 border-accent text-accent hover:bg-accent/10 active:scale-95':
          variant === 'outline' && !isLoading && !disabled,
        // Loading state
        'cursor-wait': isLoading,
      }
    );

    return (
      <button
        ref={ref}
        className={cn(baseClasses, className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-live="polite"
        {...props}
      >
        {/* Show spinner when loading */}
        {isLoading && (
          <div
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
        )}

        {/* Button text */}
        <span>{isLoading && loadingText ? loadingText : children}</span>
      </button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
