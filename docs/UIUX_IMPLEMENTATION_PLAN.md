# UI/UX Audit - Implementation Plan for Autonomous Agents
**Created:** October 15, 2025  
**Target:** Resolution of 43 design system and component-level issues  
**Total Estimated Duration:** 8-12 days  
**Format:** Task-based specifications for autonomous agent execution

---

## Overview

This document defines discrete, autonomous coding tasks to resolve all findings from `docs/VISUAL_UIUX_AUDIT_REPORT.md`. Each task includes:
- **Objective:** Specific outcome
- **Files Modified:** Exact file paths and components
- **Code Changes:** Diff-style specifications or new component signatures
- **Acceptance Criteria:** Verification checklist
- **Priority:** Phase and sequence ordering
- **Complexity:** Estimated effort and risk level

---

## Phase 1: Design System Enforcement (2-3 days)
**Priority:** CRITICAL - Foundation for all subsequent work

### Task 1.1: Create Unified Button Component
**Objective:** Replace all hardcoded button styles with unified `Button` component supporting 4 variants

**Severity:** HIGH | **Priority:** P0 | **Complexity:** Medium

**Files:**
- **New:** `src/components/ui/Button.tsx` (create)
- **Dependencies:** `src/lib/motion-tokens.ts` (reference), Tailwind config

**Specifications:**

```typescript
// src/components/ui/Button.tsx - New Component
type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;           // default: 'primary'
  size?: ButtonSize;                 // default: 'md'
  isLoading?: boolean;
  disabled?: boolean;
  asChild?: boolean;                 // Support Radix UI composition
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    disabled,
    className,
    ...props 
  }, ref) => {
    // Implementation should apply styles based on variant/size combination
    
    const variantStyles = {
      primary: 'bg-accent-primary text-white hover:bg-indigo-600 active:scale-95',
      secondary: 'bg-gray-800 text-white hover:bg-gray-700 active:scale-95',
      tertiary: 'bg-white/10 text-white hover:bg-white/20 active:scale-95',
      icon: 'p-2 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90',
    };
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
    
    const baseStyles = 'rounded-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary disabled:opacity-50 disabled:cursor-not-allowed';
    
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variant !== 'icon' && sizeStyles[size],
          variantStyles[variant],
          isLoading && 'opacity-70 pointer-events-none',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

**Code Changes Required:**

1. **Create** `src/components/ui/Button.tsx` with above specification
2. **Update** the following files to use `<Button>` instead of hardcoded styles:
   - `src/components/portfolio/PortfolioFilters.tsx` - Line 45 (`rounded-full bg-black`)
   - `src/components/story/StoryViewer.tsx` - Line 78 (`bg-white/20` control buttons)
   - `src/components/gallery/PlayTypeMorphGrid.tsx` - Line 52 (`bg-blue-600`)
   - `src/components/filters/MagneticFilterBar.tsx` - All button styles
   - `src/components/filters/PhotoFilters.tsx` - All button styles
   - Search through codebase: `grep -r "bg-blue-600\|bg-black\|bg-white/20" src/components/` and replace

**Example Refactor:**

```typescript
// BEFORE (src/components/story/StoryViewer.tsx:78)
<button className="rounded-lg bg-white/20 hover:bg-white/30 text-white">
  Close
</button>

// AFTER
<Button variant="tertiary">Close</Button>
```

**Acceptance Criteria:**
- [ ] `Button.tsx` created with all 4 variants implemented
- [ ] All button styling in codebase uses `<Button>` component (zero hardcoded `bg-*` on buttons)
- [ ] All 6+ files refactored to use new Button component
- [ ] Button component supports disabled, loading, and size variants
- [ ] Focus ring visible on keyboard interaction (test with Tab key)
- [ ] No console warnings about unused CSS classes
- [ ] Component exports from `src/components/ui/index.ts`

**Testing:**
```bash
# Visual regression: Compare before/after screenshots
# Code audit: grep -r "className.*bg-\(blue-600\|black\|white/20\)" src/components/
# Should return 0 results for button-related matches
```

---

### Task 1.2: Create Semantic Typography Components
**Objective:** Define `Heading` and `Text` components enforcing consistent typography scale

**Severity:** HIGH | **Priority:** P0 | **Complexity:** Medium

**Files:**
- **New:** `src/components/ui/Typography.tsx` (create)
- **Update:** `src/app/globals.css` (add semantic variables)

**Specifications:**

```typescript
// src/components/ui/Typography.tsx - New Component

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type TextVariant = 'body' | 'caption' | 'label' | 'code';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant;
}

// Heading component
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level, as, className, ...props }, ref) => {
    const Component = as || (`h${level}` as const);
    
    const headingStyles = {
      1: 'text-4xl md:text-5xl font-bold leading-tight',
      2: 'text-3xl md:text-4xl font-semibold leading-tight',
      3: 'text-2xl md:text-3xl font-semibold leading-snug',
      4: 'text-xl md:text-2xl font-semibold leading-snug',
      5: 'text-lg md:text-xl font-medium leading-normal',
      6: 'text-base md:text-lg font-medium leading-normal',
    };
    
    return (
      <Component
        ref={ref}
        className={cn(headingStyles[level], className)}
        {...props}
      />
    );
  }
);

// Text component
export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ variant = 'body', className, ...props }, ref) => {
    const textStyles = {
      body: 'text-base leading-relaxed',
      caption: 'text-sm leading-normal text-gray-600',
      label: 'text-sm font-medium leading-normal',
      code: 'text-sm font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded',
    };
    
    return (
      <p
        ref={ref}
        className={cn(textStyles[variant], className)}
        {...props}
      />
    );
  }
);

Heading.displayName = 'Heading';
Text.displayName = 'Text';
```

**CSS Variables to Add to `src/app/globals.css`:**

```css
:root {
  /* Typography Scale */
  --font-size-h1: 2.25rem;    /* 36px */
  --font-size-h2: 1.875rem;   /* 30px */
  --font-size-h3: 1.5rem;     /* 24px */
  --font-size-h4: 1.25rem;    /* 20px */
  --font-size-body: 1rem;     /* 16px */
  --font-size-caption: 0.875rem; /* 14px */
  
  /* Line Heights */
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* Font Weights */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

**Files to Refactor:** Replace hardcoded typography in 20+ components:

```typescript
// BEFORE
<h1 className="text-3xl font-bold">Page Title</h1>
<h2 className="text-xl sm:text-2xl">Section Header</h2>
<p className="text-sm text-gray-600">Metadata</p>

// AFTER
<Heading level={1}>Page Title</Heading>
<Heading level={2}>Section Header</Heading>
<Text variant="caption">Metadata</Text>
```

**Priority Files for Refactor:**
- `src/app/page.tsx` (home)
- `src/app/portfolio/page.tsx`
- `src/app/browse/page.tsx`
- `src/app/search/page.tsx`
- `src/app/stories/[id]/page.tsx`
- `src/app/album/[key]/page.tsx`
- `src/app/photo/[id]/page.tsx`
- `src/components/portfolio/PortfolioGrid.tsx`
- `src/components/gallery/PlayTypeMorphGrid.tsx`
- `src/components/story/StoryViewer.tsx`

**Acceptance Criteria:**
- [ ] `Typography.tsx` created with `Heading` and `Text` components
- [ ] 6 heading levels (h1-h6) properly mapped to font sizes
- [ ] 4 text variants (body, caption, label, code) implemented
- [ ] All page titles use `<Heading level={1}>`
- [ ] All section headers use `<Heading level={2}>`
- [ ] All body text uses `<Text>` or `<Text variant="body">`
- [ ] No inline `text-*` classes on headings (zero hardcoded sizes)
- [ ] Component exports from `src/components/ui/index.ts`
- [ ] Visual consistency across all pages verified

---

### Task 1.3: Enforce Color Token Usage Across Components
**Objective:** Replace all hardcoded colors with design system tokens

**Severity:** HIGH | **Priority:** P0 | **Complexity:** High (many files)

**Files:**
- **Reference:** `src/app/globals.css` (existing tokens)
- **Reference:** `src/lib/motion-tokens.ts` (emotion palette)
- **Update:** All 25+ component files

**Color Token Mapping:**

```typescript
// Define as Tailwind theme extension in tailwind.config.ts or globals.css
@theme {
  --color-accent-primary: #6366f1;      /* indigo-500 */
  --color-accent-secondary: #8b5cf6;    /* violet-500 */
  
  /* Grayscale (already exists) */
  --color-gray-950: #030712;
  --color-gray-900: #111827;
  --color-gray-800: #1f2937;
  --color-gray-700: #374151;
  --color-gray-600: #4b5563;
  --color-gray-500: #6b7280;
  --color-gray-400: #9ca3af;
  --color-gray-300: #d1d5db;
  --color-gray-200: #e5e7eb;
  --color-gray-100: #f3f4f6;
  --color-gray-50: #f9fafb;
  
  /* Emotion Palette (new) */
  --color-emotion-joy: #fbbf24;         /* amber */
  --color-emotion-curiosity: #60a5fa;   /* blue */
  --color-emotion-confidence: #f87171;  /* red */
  --color-emotion-calm: #34d399;        /* emerald */
  --color-emotion-melancholy: #a78bfa;  /* purple */
  --color-emotion-focus: #6366f1;       /* indigo */
}
```

**Code Changes (Search & Replace Strategy):**

1. **Identify all hardcoded colors:**
```bash
grep -r "bg-blue-600\|bg-black\|bg-white\|text-white\|text-black" src/components/ --include="*.tsx"
```

2. **Replace with tokens:**
   - `bg-blue-600` → `bg-accent-primary`
   - `bg-black` → `bg-gray-950` (or `bg-gray-900` for softer)
   - `bg-white/20` → `bg-white/10` (or custom glass effect)
   - `text-white` → `text-gray-50`
   - `text-black` → `text-gray-950`

3. **Components with color issues:**
   - `src/components/portfolio/PortfolioFilters.tsx` - `bg-blue-600`
   - `src/components/gallery/PlayTypeMorphGrid.tsx` - `bg-blue-600`
   - `src/components/story/StoryViewer.tsx` - `bg-white/20`
   - `src/components/interactions/MagneticFilterOrb.tsx` - Check colors
   - `src/components/filters/MagneticFilterBar.tsx` - Check colors

**Emotion Palette Integration Example:**

```typescript
// For photo quality badges or filter states
const getEmotionColor = (emotion: string) => {
  const emotionMap = {
    joy: 'bg-emotion-joy',
    curiosity: 'bg-emotion-curiosity',
    confidence: 'bg-emotion-confidence',
    calm: 'bg-emotion-calm',
    melancholy: 'bg-emotion-melancholy',
    focus: 'bg-emotion-focus',
  };
  return emotionMap[emotion] || 'bg-emotion-focus';
};

// Usage in component
<div className={getEmotionColor(photo.emotion)}>
  {photo.quality}
</div>
```

**Acceptance Criteria:**
- [ ] All hardcoded colors replaced with design tokens
- [ ] `accent-primary` used for primary interactive elements
- [ ] Grayscale tokens used for backgrounds/text/borders
- [ ] Emotion palette integrated into at least 5 components
- [ ] Zero hardcoded color hex values (`#6366F1`) in component code
- [ ] Dark mode support verified (colors work in dark mode)
- [ ] No visual regression compared to previous state

---

### Task 1.4: Update globals.css with Typography Scale
**Objective:** Define semantic typography scale in design tokens layer

**Severity:** MEDIUM | **Priority:** P0 | **Complexity:** Low

**Files:**
- **Update:** `src/app/globals.css`

**Changes:**

```css
/* Add to src/app/globals.css - Typography Scale Section */

:root {
  /* Typography - Font Sizes (Semantic) */
  --text-h1: clamp(2rem, 5vw, 3.5rem);
  --text-h2: clamp(1.5rem, 4vw, 2.8rem);
  --text-h3: clamp(1.25rem, 3vw, 2.2rem);
  --text-h4: 1.5rem;
  --text-h5: 1.25rem;
  --text-h6: 1.125rem;
  --text-body: 1rem;
  --text-sm: 0.875rem;
  --text-xs: 0.75rem;

  /* Typography - Line Heights */
  --leading-tight: 1.2;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  --leading-loose: 2;

  /* Typography - Letter Spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;

  /* Font Families */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
}

/* Typography Utility Classes */
.text-h1 { font-size: var(--text-h1); line-height: var(--leading-tight); font-weight: 700; }
.text-h2 { font-size: var(--text-h2); line-height: var(--leading-tight); font-weight: 600; }
.text-h3 { font-size: var(--text-h3); line-height: var(--leading-snug); font-weight: 600; }
.text-h4 { font-size: var(--text-h4); line-height: var(--leading-snug); font-weight: 600; }
.text-h5 { font-size: var(--text-h5); line-height: var(--leading-normal); font-weight: 500; }
.text-h6 { font-size: var(--text-h6); line-height: var(--leading-normal); font-weight: 500; }
.text-body { font-size: var(--text-body); line-height: var(--leading-relaxed); font-weight: 400; }
.text-caption { font-size: var(--text-sm); line-height: var(--leading-normal); font-weight: 400; color: var(--color-gray-600); }
.text-label { font-size: var(--text-sm); line-height: var(--leading-normal); font-weight: 500; }
```

**Acceptance Criteria:**
- [ ] All CSS variables defined and accessible
- [ ] Responsive typography scales work (clamp functions)
- [ ] Utility classes applied correctly in components
- [ ] Dark mode CSS variables included (if applicable)

---

## Phase 2: Component Refinement (3-4 days)
**Priority:** HIGH - Fixes critical user-facing issues

### Task 2.1: Fix PortfolioGrid Layout Efficiency
**Objective:** Optimize responsive grid to show maximum photos per viewport

**Severity:** HIGH | **Priority:** P1 | **Complexity:** Medium

**Files:**
- **Update:** `src/components/portfolio/PortfolioGrid.tsx`

**Current Issue:**
```typescript
// Line 28: Suboptimal responsive breakpoints
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
// 1 column on mobile (wasteful)
// 2-3 columns on desktop (should be 4-5)
```

**Specifications:**

```typescript
// UPDATED: src/components/portfolio/PortfolioGrid.tsx - Layout section

<div className="grid gap-3 
  grid-cols-2          // 2 columns on mobile (320px+)
  sm:grid-cols-2       // Confirm 2 columns small mobile
  md:grid-cols-3       // 3 columns on tablet (768px)
  lg:grid-cols-4       // 4 columns on desktop (1024px)
  xl:grid-cols-5       // 5 columns on large desktop (1280px)
  2xl:grid-cols-6      // 6 columns on ultra-wide (1536px)
  ">
  {/* Grid items */}
</div>
```

**Additional Changes:**

```typescript
// Reduce gap for mobile screens (space efficiency)
// Desktop: gap-4 (16px)
// Mobile: gap-2 (8px)
// Tablet: gap-3 (12px)

const gapClasses = 'gap-2 sm:gap-2 md:gap-3 lg:gap-4';

// Update image sizing for better responsiveness
// Current: No explicit width
// Updated: Responsive image size with aspect ratio

<div className="aspect-square overflow-hidden rounded-lg bg-gray-900">
  <Image
    src={photo.url}
    alt={photo.title}
    fill
    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
    quality={90}
    className="object-cover hover:scale-105 transition-transform duration-300"
  />
</div>
```

**Acceptance Criteria:**
- [ ] Mobile (360px): 2-column grid visible
- [ ] Tablet (768px): 3-column grid visible
- [ ] Desktop (1024px): 4-column grid visible
- [ ] Ultra-wide (1536px): 5-6 column grid visible
- [ ] Image aspect ratios preserved (square, 1:1 ratio)
- [ ] Gap spacing optimized for each breakpoint
- [ ] No horizontal scroll at any breakpoint
- [ ] Hover effects work on all grid items

**Testing:**
```bash
# Test at multiple viewport sizes
# 360px (mobile), 640px (tablet), 1024px (desktop), 1920px (ultra-wide)
```

---

### Task 2.2: Repair EmotionTimeline GSAP Integration
**Objective:** Fix DOM selector issue; migrate from DOM selectors to React refs

**Severity:** HIGH | **Priority:** P1 | **Complexity:** Medium

**Files:**
- **Update:** `src/components/interactions/EmotionTimeline.tsx`

**Current Issue:**
```typescript
// Line 45: Broken DOM selector
useEffect(() => {
  Draggable.create('.quality-photo-card', {
    // Target doesn't exist - breaks silently
  });
}, []);
```

**Specifications:**

```typescript
// UPDATED: src/components/interactions/EmotionTimeline.tsx

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

export const EmotionTimeline = ({ photos }: Props) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!timelineRef.current) return;

    // Create Draggable on ref instead of DOM selector
    const draggable = Draggable.create(timelineRef.current, {
      type: 'x',
      bounds: { minX: 0, maxX: 100 }, // Adjust based on content
      onDragStart: () => { isDraggingRef.current = true; },
      onDragEnd: () => { isDraggingRef.current = false; },
      inertia: true,
    });

    return () => {
      draggable.forEach(d => d.kill());
    };
  }, []);

  return (
    <div 
      ref={timelineRef}
      className="timeline-container overflow-x-auto cursor-grab active:cursor-grabbing"
    >
      {/* Timeline content */}
      <div className="flex gap-4">
        {photos.map((photo, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-24 h-24 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
          >
            {/* Photo preview */}
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] EmotionTimeline component mounts without console errors
- [ ] GSAP Draggable initializes successfully on mount
- [ ] Timeline responds to mouse drag events
- [ ] No "GSAP target .quality-photo-card not found" warning
- [ ] Ref-based implementation prevents selector conflicts
- [ ] Cleanup function kills Draggable on unmount (prevents memory leaks)
- [ ] Component keyboard accessible

---

### Task 2.3: Enhance StoryViewer Control Accessibility
**Objective:** Improve contrast, button size, focus indicators, and labels

**Severity:** HIGH | **Priority:** P1 | **Complexity:** Medium

**Files:**
- **Update:** `src/components/story/StoryViewer.tsx`

**Current Issues:**
```typescript
// Line 78: Low contrast control buttons
<button className="rounded-lg bg-white/20 hover:bg-white/30 text-white">
// Contrast ratio ~2.5:1 (fails WCAG AA - needs 4.5:1 minimum)
```

**Specifications:**

```typescript
// UPDATED: src/components/story/StoryViewer.tsx - Control Bar

const StoryControlBar = ({ onClose, onNext, onPrev }: ControlProps) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 
      bg-gradient-to-t from-black/80 via-black/40 to-transparent 
      p-4 flex items-center justify-between">
      
      {/* Previous Button */}
      <button
        onClick={onPrev}
        aria-label="Previous story"
        className="group relative
          w-12 h-12 flex items-center justify-center
          rounded-full bg-black/60 hover:bg-black/80 
          text-white hover:text-accent-primary
          transition-all duration-200
          focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary
          disabled:opacity-50 disabled:cursor-not-allowed"
        title="Previous (Arrow Left)"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Center Info */}
      <div className="text-white text-center">
        <p className="text-sm font-medium">Story {currentIndex + 1} of {total}</p>
      </div>

      {/* Next Button */}
      <button
        onClick={onNext}
        aria-label="Next story"
        className="group relative
          w-12 h-12 flex items-center justify-center
          rounded-full bg-black/60 hover:bg-black/80 
          text-white hover:text-accent-primary
          transition-all duration-200
          focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary
          disabled:opacity-50 disabled:cursor-not-allowed"
        title="Next (Arrow Right)"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Close Button */}
      <button
        onClick={onClose}
        aria-label="Close story viewer"
        className="group relative
          w-12 h-12 flex items-center justify-center
          rounded-full bg-black/60 hover:bg-black/80 
          text-white hover:text-emotion-confidence
          transition-all duration-200
          focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary
          disabled:opacity-50 disabled:cursor-not-allowed"
        title="Close (Escape)"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
};
```

**Key Improvements:**
1. **Size:** 48x48px minimum (from implicit smaller)
2. **Contrast:** `bg-black/60` provides 5.8:1 contrast ratio (WCAG AA pass)
3. **Focus Ring:** `focus:ring-2` visible on keyboard Tab
4. **Labels:** `aria-label` + `title` + icon for clarity
5. **Keyboard Support:** Close with Escape key

**Acceptance Criteria:**
- [ ] All control buttons are 48x48px minimum
- [ ] Contrast ratio ≥ 4.5:1 for text on button (verified with tool)
- [ ] Focus ring visible when tabbing through controls
- [ ] `aria-label` on all icon buttons
- [ ] Keyboard shortcuts work (Escape to close, arrows to navigate)
- [ ] Hover state shows clear feedback
- [ ] No accessibility warnings in console

---

### Task 2.4: Add Skeleton Loading States to Photo Components
**Objective:** Prevent layout shift (CLS); improve perceived performance

**Severity:** MEDIUM | **Priority:** P1 | **Complexity:** Medium

**Files:**
- **New:** `src/components/common/PhotoSkeleton.tsx`
- **Update:** `src/components/gallery/PlayTypeMorphGrid.tsx`
- **Update:** `src/components/portfolio/PortfolioGrid.tsx`

**Specifications:**

```typescript
// NEW: src/components/common/PhotoSkeleton.tsx

import { forwardRef } from 'react';

interface PhotoSkeletonProps {
  className?: string;
}

export const PhotoSkeleton = forwardRef<HTMLDivElement, PhotoSkeletonProps>(
  ({ className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'aspect-square bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-pulse rounded-lg',
          className
        )}
      >
        {/* Loading shimmer effect */}
        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent 
          animate-shimmer" />
      </div>
    );
  }
);

PhotoSkeleton.displayName = 'PhotoSkeleton';
```

**Update Portfolio Grid with Skeleton:**

```typescript
// src/components/portfolio/PortfolioGrid.tsx

import { PhotoSkeleton } from '@/components/common/PhotoSkeleton';

export const PortfolioGrid = ({ photos, isLoading }: PortfolioGridProps) => {
  const displayPhotos = isLoading ? Array(12).fill(null) : photos;

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {displayPhotos.map((photo, idx) => (
        <div key={photo?.id || `skeleton-${idx}`} className="aspect-square">
          {isLoading ? (
            <PhotoSkeleton />
          ) : (
            <Image
              src={photo.url}
              alt={photo.title}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              quality={90}
              className="object-cover rounded-lg hover:scale-105 transition-transform"
            />
          )}
        </div>
      ))}
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] Skeleton placeholder visible during data fetch
- [ ] No layout shift (CLS) when photos load (aspect ratio preserved)
- [ ] Shimmer animation gives perceived progress
- [ ] Grid structure maintained during skeleton state
- [ ] Smooth transition from skeleton to loaded image

---

## Phase 3: Polish & Micro-Interactions (2-3 days)
**Priority:** MEDIUM - Enhances premium feel

### Task 3.1: Create Contextual Empty States
**Objective:** Design helpful, branded empty state screens for all routes

**Severity:** MEDIUM | **Priority:** P2 | **Complexity:** Medium

**Files:**
- **Update:** `src/components/common/ErrorState.tsx`
- **New:** `src/components/common/EmptyState.tsx`

**Specifications:**

```typescript
// NEW: src/components/common/EmptyState.tsx

type EmptyStateType = 'portfolio' | 'search' | 'browse' | 'stories' | 'album';

interface EmptyStateProps {
  type: EmptyStateType;
  searchQuery?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ type, searchQuery, action }: EmptyStateProps) => {
  const states: Record<EmptyStateType, { icon: React.ReactNode; title: string; description: string }> = {
    portfolio: {
      icon: <FrameIcon className="w-16 h-16 text-emotion-calm" />,
      title: 'Portfolio Ready',
      description: 'Your portfolio is set up and ready to showcase your best work. Add photos to get started.',
    },
    search: {
      icon: <SearchIcon className="w-16 h-16 text-emotion-curiosity" />,
      title: 'No Photos Found',
      description: searchQuery 
        ? `No photos match "${searchQuery}". Try adjusting your filters or search terms.`
        : 'Try searching for photos by title, tag, or date.',
    },
    browse: {
      icon: <GridIcon className="w-16 h-16 text-emotion-focus" />,
      title: 'Browse Gallery',
      description: 'Explore all available photos organized by albums and categories.',
    },
    stories: {
      icon: <BookOpenIcon className="w-16 h-16 text-emotion-joy" />,
      title: 'No Stories Yet',
      description: 'Stories haven\'t been created yet. Check back soon for curated photo narratives.',
    },
    album: {
      icon: <FolderIcon className="w-16 h-16 text-emotion-confidence" />,
      title: 'Album Empty',
      description: 'This album doesn\'t contain any photos yet.',
    },
  };

  const state = states[type];

  return (
    <div className="flex flex-col items-center justify-center min-h-96 text-center px-4">
      <div className="mb-6">{state.icon}</div>
      <Heading level={3} className="mb-2">{state.title}</Heading>
      <Text variant="caption" className="max-w-md mb-6">{state.description}</Text>
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
};
```

**Integration Points:**

```typescript
// src/app/portfolio/page.tsx
{photos.length === 0 ? (
  <EmptyState 
    type="portfolio"
    action={{
      label: 'Browse All Photos',
      onClick: () => router.push('/browse'),
    }}
  />
) : (
  <PortfolioGrid photos={photos} />
)}

// src/app/search/page.tsx
{results.length === 0 ? (
  <EmptyState 
    type="search"
    searchQuery={query}
    action={{
      label: 'Clear Filters',
      onClick: () => clearFilters(),
    }}
  />
) : (
  <PhotoGrid photos={results} />
)}
```

**Acceptance Criteria:**
- [ ] EmptyState component created with 5 state types
- [ ] Emotion palette colors used in icons
- [ ] Contextual messaging for each empty state
- [ ] Optional action button with callback
- [ ] Responsive layout (centered, readable)
- [ ] Integrated in all applicable routes

---

### Task 3.2: Add Button Click & Filter Micro-Interactions
**Objective:** Add visual feedback to interactive elements

**Severity:** MEDIUM | **Priority:** P2 | **Complexity:** Low

**Files:**
- **Update:** Button component animation
- **Update:** Filter components with transition feedback

**Specifications:**

```typescript
// Enhanced Button component with click animation

<button
  className="px-4 py-2 rounded-lg bg-accent-primary text-white
    active:scale-95 transition-transform duration-200
    active:shadow-lg active:shadow-accent-primary/50"
>
  Click Me
</button>

// Filter application animation
<button
  onClick={applyFilters}
  className="rounded-lg px-4 py-2
    transition-all duration-300 ease-out
    active:scale-95
    hover:shadow-lg hover:shadow-accent-primary/20"
>
  Apply Filters
</button>
```

**Acceptance Criteria:**
- [ ] Button clicks show scale feedback (0.98 → 1.0)
- [ ] Filter changes animate smoothly (0.3s transition)
- [ ] Hover states have shadow/color shifts
- [ ] No jarring transitions (use cubic-bezier)
- [ ] Performance: no jank (60fps animations)

---

### Task 3.3: Implement Photo Hover State Animations
**Objective:** Add sophisticated hover effects to grid photos

**Severity:** LOW | **Priority:** P3 | **Complexity:** Low

**Files:**
- **Update:** `src/components/portfolio/PortfolioGrid.tsx`
- **Update:** `src/components/gallery/PlayTypeMorphGrid.tsx`

**Specifications:**

```typescript
// Photo grid item with hover animation

<div className="relative aspect-square overflow-hidden rounded-lg group">
  <Image
    src={photo.url}
    alt={photo.title}
    fill
    className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
  />
  
  {/* Hover overlay */}
  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 
    transition-colors duration-300 flex items-center justify-center opacity-0 
    group-hover:opacity-100 transition-opacity">
    <div className="text-white text-center">
      <Icon className="w-8 h-8 mb-2" />
      <p className="text-sm font-medium">View Details</p>
    </div>
  </div>
</div>
```

**Acceptance Criteria:**
- [ ] Image zoom on hover (1 → 1.1x scale)
- [ ] Dark overlay appears smoothly
- [ ] Text/icon fades in on hover
- [ ] Transition timing 300-500ms (smooth, not instant)
- [ ] Works on touch devices (no hover, show default state)

---

### Task 3.4: Refine PlayTypeMorphGrid Spring Physics
**Objective:** Adjust GSAP spring configuration for natural motion

**Severity:** LOW | **Priority:** P3 | **Complexity:** Low

**Files:**
- **Update:** `src/components/gallery/PlayTypeMorphGrid.tsx`
- **Update:** `src/lib/motion-tokens.ts`

**Specifications:**

```typescript
// UPDATED: src/lib/motion-tokens.ts - Spring configurations

export const SPRING_PHYSICS = {
  // For smooth, natural layout transitions
  gentle: {
    damping: 20,
    stiffness: 150,
    mass: 1,
  },
  // For responsive, but not bouncy transitions
  responsive: {
    damping: 18,
    stiffness: 200,
    mass: 0.8,
  },
  // For snappy, quick transitions (reduced bounce)
  snappy: {
    damping: 20,
    stiffness: 280,
    mass: 0.7,
  },
};

// PlayTypeMorphGrid usage
useAnimationFrame(() => {
  layoutGroup.current?.animate({
    layoutDeps: [filterState],
    config: SPRING_PHYSICS.responsive,
  });
});
```

**Acceptance Criteria:**
- [ ] Layout transitions feel smooth (not bouncy)
- [ ] Animation completes in 300-400ms
- [ ] No overshoot or oscillation
- [ ] Performance: 60fps maintained

---

## Phase 4: Accessibility & Responsiveness (2 days)
**Priority:** MEDIUM - Compliance and experience quality

### Task 4.1: Audit and Fix Contrast Issues
**Objective:** Ensure WCAG AA compliance (4.5:1 contrast minimum)

**Severity:** MEDIUM | **Priority:** P2 | **Complexity:** Medium

**Files:**
- Multiple component files (TBD after audit)

**Process:**

```bash
# 1. Use WebAIM contrast checker or axe DevTools
# 2. Test all text on backgrounds
# 3. For images with text overlays:

# Before: White text on light photo
<div className="absolute inset-0">
  <p className="text-white">{text}</p>
</div>

# After: Add scrim for guaranteed contrast
<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
  <p className="text-white">{text}</p>
</div>
```

**Acceptance Criteria:**
- [ ] All text passes WCAG AA contrast (4.5:1 minimum)
- [ ] All large text passes WCAG AAA if possible (7:1)
- [ ] Image-based text has scrim/background
- [ ] Tested with axe DevTools or similar
- [ ] No console accessibility warnings

---

### Task 4.2: Optimize Mobile Responsiveness
**Objective:** Verify optimal experience at all breakpoints

**Severity:** MEDIUM | **Priority:** P2 | **Complexity:** Medium

**Testing Checklist:**

```markdown
## Mobile (360px - 480px)
- [ ] No horizontal scrolling
- [ ] Text readable (16px minimum font size)
- [ ] Touch targets 44x44px minimum
- [ ] 2-column grid portfolio (not 1)
- [ ] Navigation accessible

## Tablet (768px - 1024px)
- [ ] 3-column grid portfolio
- [ ] Larger text for better readability
- [ ] Touch targets sufficient
- [ ] Landscape mode works

## Desktop (1024px+)
- [ ] 4+ column grid portfolio
- [ ] Optimal spacing and typography
- [ ] Hover states visible
- [ ] No wasted whitespace

## Ultra-wide (1536px+)
- [ ] 5-6 column grid
- [ ] Max content width if needed (1600px)
- [ ] Centered layout
```

**Acceptance Criteria:**
- [ ] Responsive breakpoints tested at 360px, 480px, 768px, 1024px, 1536px
- [ ] No horizontal scrolling at any breakpoint
- [ ] Touch targets all 44x44px minimum
- [ ] Typography scales appropriately
- [ ] Images maintain aspect ratios

---

### Task 4.3: Add Focus Indicators to All Interactive Elements
**Objective:** Ensure keyboard navigation is visible and accessible

**Severity:** MEDIUM | **Priority:** P2 | **Complexity:** Low

**Global CSS:**

```css
/* src/app/globals.css - Add focus ring styles */

/* Remove default browser focus outline */
*:focus-visible {
  outline: none;
  @apply ring-2 ring-offset-2 ring-accent-primary;
}

/* Specific focus styles for buttons */
button:focus-visible {
  @apply ring-2 ring-offset-2 ring-accent-primary;
}

/* Links */
a:focus-visible {
  @apply ring-2 ring-offset-2 ring-accent-primary rounded px-1;
}

/* Inputs */
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  @apply ring-2 ring-offset-2 ring-accent-primary;
}
```

**Acceptance Criteria:**
- [ ] All buttons show focus ring on Tab
- [ ] All links show focus ring on Tab
- [ ] All form inputs show focus ring on Tab
- [ ] Focus ring color consistent (accent-primary)
- [ ] Focus order logical (top-to-bottom, left-to-right)
- [ ] No focus traps (can always move forward/backward)

---

### Task 4.4: Implement Adaptive Text Contrast Over Images
**Objective:** Ensure text readable on any background image

**Severity:** LOW | **Priority:** P3 | **Complexity:** Medium

**Files:**
- **Update:** Photo detail views, story viewer, hero sections

**Specifications:**

```typescript
// Component for text over images with guaranteed contrast

interface TextOverImageProps {
  text: string;
  imageUrl?: string;
  position?: 'top' | 'center' | 'bottom';
}

export const TextOverImage = ({ text, imageUrl, position = 'bottom' }: TextOverImageProps) => {
  const gradientClasses = {
    top: 'from-black/80 via-black/30 to-transparent',
    center: 'from-black/80 via-black/60 to-black/80',
    bottom: 'from-transparent via-black/30 to-black/80',
  };

  return (
    <div className="relative h-full">
      <Image src={imageUrl} alt={text} fill className="object-cover" />
      
      {/* Scrim for contrast */}
      <div className={`absolute inset-0 bg-gradient-to-${position === 'top' ? 'b' : position === 'bottom' ? 't' : 'b'} ${gradientClasses[position]}`} />
      
      {/* Text with guaranteed contrast */}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-white text-center font-semibold">{text}</p>
      </div>
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] Text visible on light and dark images
- [ ] Contrast ratio ≥ 4.5:1 guaranteed
- [ ] No need for manual background adjustments

---

## Execution Guide for Autonomous Agents

### Prerequisites
- [ ] Node.js 18+
- [ ] pnpm installed
- [ ] Repository cloned and dependencies installed

### Verification Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Component testing (if available)
npm run test

# Build verification
npm run build

# Visual regression (if screenshots available)
npm run test:visual
```

### Execution Order

**Critical:** Execute phases **sequentially**. Phase 2 depends on Phase 1 completion.

1. **Phase 1 (Days 1-3):** Design System Enforcement
   - Task 1.1 → 1.2 → 1.3 → 1.4 (in order)
   - All 4 tasks must complete before Phase 2

2. **Phase 2 (Days 4-6):** Component Refinement  
   - Task 2.1 → 2.2 → 2.3 → 2.4 (in order)
   - Builds upon Phase 1 design tokens

3. **Phase 3 (Days 7-8):** Polish & Interactions
   - Task 3.1 → 3.2 → 3.3 → 3.4 (can run in parallel after 3.1)
   - Low-risk polish tasks

4. **Phase 4 (Days 9-10):** Accessibility
   - All tasks can run in parallel
   - Final verification step

### Quality Gates

**After Each Phase:**

```bash
# Compile check
npm run build

# Type errors
npm run type-check

# Linting errors
npm run lint

# No console errors on localhost:3000
# No console warnings (warnings → errors in strict mode)
```

**Before Marking Complete:**

```bash
# All 43 issues resolved
# Visual consistency verified at multiple breakpoints
# Accessibility audit passes (no warnings)
# Performance metrics maintained (LCP < 2.5s)
# No new console errors introduced
```

---

## Success Metrics

### Design System Adoption
- ✅ 100% of buttons use `<Button>` component (0 hardcoded button styles)
- ✅ 95%+ of headings use `<Heading>` component
- ✅ 90%+ of text uses `<Text>` component
- ✅ All colors sourced from design tokens (0 hardcoded hex/rgb)

### Visual Polish
- ✅ All empty states are contextual and helpful
- ✅ Skeleton loading visible during data fetch
- ✅ Micro-interactions on all interactive elements
- ✅ Smooth page transitions (no jarring jumps)

### Accessibility
- ✅ WCAG AA compliance (4.5:1 contrast minimum)
- ✅ Keyboard navigation works on all pages
- ✅ Focus indicators visible (ring on Tab)
- ✅ Screen reader support verified
- ✅ No accessibility console warnings

### Performance
- ✅ LCP < 2.5s (Largest Contentful Paint)
- ✅ CLS < 0.1 (Cumulative Layout Shift - prevented by skeleton states)
- ✅ Grid shows maximum photos per viewport
- ✅ Animations maintain 60fps

### Code Quality
- ✅ No TypeScript errors
- ✅ No ESLint violations
- ✅ All components documented
- ✅ Proper error boundaries in place

---

## Notes for Agents

1. **Test Locally:** Always test changes in browser after code updates
2. **Incremental Commits:** Commit each task completion separately
3. **Backward Compatibility:** Ensure no breaking changes to existing components
4. **Asset Management:** Ensure icon libraries (lucide-react, etc.) are available
5. **Dark Mode:** If dark mode is used, test all changes in both light and dark modes
6. **Git Strategy:** Create feature branch for each phase if possible

---

**End of Implementation Plan**

Report generated: October 15, 2025
Next update: After Phase 1 completion
Status: Ready for autonomous execution