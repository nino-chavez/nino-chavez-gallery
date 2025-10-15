# Unified Implementation Plan: AI-Enriched Photo Gallery
## Technical Foundation + Innovative UX Interactions

**Version**: 2.0 (Unified)
**Date**: 2025-10-14
**Status**: Ready for Implementation
**Estimated Effort**: 6-8 weeks (2 senior frontend developers + 1 motion designer)

---

## Executive Summary

This unified plan combines the technical foundation from `ENRICHED_METADATA_IMPLEMENTATION.md` with the innovative UX interactions from `UX_VISION_ENRICHED_GALLERY.md`. We're building an **intelligent photo discovery experience** where AI metadata enables interactions that feel magical, responsive, and deeply personal.

**Core Philosophy**:
> "The best interface is no interface, but when needed, it should feel like an extension of your thoughts."

**Key Features**:
1. Physics-based magnetic filter orbs
2. Emotion timeline scrubber with GSAP
3. 3D photo gravity clustering
4. Quality gradient visualization
5. Contextual cursor with zero-click metadata
6. Momentum scroll with smart snap
7. Play type morph transitions
8. **AI Story-Curation Engine** (NEW)
9. Natural language search
10. Client-facing dashboards
11. Discovery badges and delight moments

**Business Impact**:
- Increase user engagement through delightful interactions
- **Transform from photo library to storytelling platform** (NEW)
- Enable print sales through quality indicators
- Provide value-added services for athletes/coaches
- **Create new revenue stream with AI-generated stories** (NEW)
- Demonstrate AI-powered innovation
- Create memorable brand experiences

---

## 🎯 Design Principles

### 1. **Progressive Disclosure**
Information reveals itself only when relevant. No walls of metadata.

### 2. **Physics-Based Motion**
Every interaction follows real-world physics: spring animations, momentum scrolling, magnetic snapping.

### 3. **Spatial Intelligence**
Use the Z-axis. Photos exist in 3D space, not just a flat grid.

### 4. **Contextual Interactions**
The UI adapts to what you're looking at, not what we think you want.

### 5. **Zero Latency Perception**
Optimistic UI updates. Predict intent before the click.

---

## Phase 1: Foundation + Core Interactions (Week 1-2)

### 1.1 Database Schema Integration

**Objective**: Sync enriched metadata from SQLite to Supabase

**Database Tables to Create**:

```sql
-- Photo metadata table (extends existing photos table)
CREATE TABLE photo_metadata (
  photo_id TEXT PRIMARY KEY,
  image_key TEXT NOT NULL REFERENCES photos(image_key),

  -- Quality scores (0-10)
  sharpness DECIMAL(3,1),
  exposure_accuracy DECIMAL(3,1),
  composition_score DECIMAL(3,1),
  emotional_impact DECIMAL(3,1),

  -- Portfolio flags
  portfolio_worthy BOOLEAN DEFAULT FALSE,
  print_ready BOOLEAN DEFAULT FALSE,
  social_media_optimized BOOLEAN DEFAULT FALSE,

  -- Composition & Emotion
  emotion TEXT, -- triumph, focus, intensity, etc.
  composition TEXT, -- rule-of-thirds, motion-blur, etc.
  time_of_day TEXT, -- golden-hour, evening, etc.

  -- Volleyball-specific
  play_type TEXT, -- attack, block, dig, serve, pass, etc.
  action_intensity TEXT, -- low, medium, high, peak

  -- Use cases (array)
  use_cases TEXT[], -- {social-media, website-hero, athlete-portfolio, print, editorial}

  -- AI metadata
  ai_provider TEXT, -- gemini, claude, openai
  ai_cost DECIMAL(8,6),
  enriched_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_play_type CHECK (
    play_type IN ('attack', 'block', 'dig', 'set', 'serve', 'pass', 'celebration', 'timeout', NULL)
  ),
  CONSTRAINT valid_intensity CHECK (
    action_intensity IN ('low', 'medium', 'high', 'peak')
  )
);

CREATE INDEX idx_portfolio_worthy ON photo_metadata(portfolio_worthy);
CREATE INDEX idx_print_ready ON photo_metadata(print_ready);
CREATE INDEX idx_play_type ON photo_metadata(play_type);
CREATE INDEX idx_action_intensity ON photo_metadata(action_intensity);
CREATE INDEX idx_use_cases ON photo_metadata USING GIN(use_cases);
CREATE INDEX idx_emotion ON photo_metadata(emotion);
```

**Migration Script**: `scripts/sync-metadata-to-supabase.ts`

```typescript
/**
 * Sync enriched metadata from SQLite to Supabase
 *
 * Usage:
 *   pnpm run sync:metadata --db=enrichment-gemini-production.db
 */

import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';

interface EnrichedPhoto {
  image_key: string;
  metadata_json: string;
  cost: number;
  processed_at: string;
}

async function syncMetadata(sqliteDbPath: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const db = new Database(sqliteDbPath);

  // Get all processed photos
  const photos = db.prepare(`
    SELECT image_key, metadata_json, cost, processed_at
    FROM photos
    WHERE status = 'processed'
  `).all() as EnrichedPhoto[];

  console.log(`Syncing ${photos.length} photos...`);

  let synced = 0;
  let errors = 0;

  for (const photo of photos) {
    try {
      const metadata = JSON.parse(photo.metadata_json);

      const { error } = await supabase
        .from('photo_metadata')
        .upsert({
          photo_id: photo.image_key,
          image_key: photo.image_key,

          // Quality scores
          sharpness: metadata.quality?.sharpness,
          exposure_accuracy: metadata.quality?.exposureAccuracy,
          composition_score: metadata.quality?.compositionScore,
          emotional_impact: metadata.quality?.emotionalImpact,

          // Portfolio flags
          portfolio_worthy: metadata.portfolioWorthy || false,
          print_ready: metadata.printReady || false,
          social_media_optimized: metadata.socialMediaOptimized || false,

          // Composition & Emotion
          emotion: metadata.emotion,
          composition: metadata.composition,
          time_of_day: metadata.timeOfDay,

          // Volleyball-specific
          play_type: metadata.playType,
          action_intensity: metadata.actionIntensity,

          // Use cases
          use_cases: metadata.useCases || [],

          // AI metadata
          ai_provider: metadata.provider,
          ai_cost: photo.cost,
          enriched_at: photo.processed_at,
        });

      if (error) throw error;

      synced++;
      if (synced % 100 === 0) {
        console.log(`  Synced ${synced}/${photos.length}...`);
      }
    } catch (error) {
      console.error(`Error syncing ${photo.image_key}:`, error);
      errors++;
    }
  }

  console.log(`\nSync complete: ${synced} synced, ${errors} errors`);
  db.close();
}

// CLI
const dbPath = process.argv.find(arg => arg.startsWith('--db='))?.split('=')[1];
if (!dbPath) {
  console.error('Usage: pnpm run sync:metadata --db=enrichment-gemini-production.db');
  process.exit(1);
}

syncMetadata(dbPath);
```

### 1.2 Motion Token System

**File**: `lib/motion-tokens.ts`

```typescript
/**
 * Unified motion design tokens
 * Used across all animated components for consistency
 */

export const MOTION = {
  spring: {
    gentle: { type: 'spring' as const, stiffness: 120, damping: 14 },
    responsive: { type: 'spring' as const, stiffness: 300, damping: 30 },
    snappy: { type: 'spring' as const, stiffness: 400, damping: 25 },
  },

  duration: {
    instant: 0.1,
    fast: 0.2,
    base: 0.3,
    slow: 0.5,
    slower: 0.8,
  },

  ease: {
    easeOut: [0.16, 1, 0.3, 1] as const,
    easeInOut: [0.87, 0, 0.13, 1] as const,
    anticipate: [0.68, -0.55, 0.27, 1.55] as const,
  },
};

export const EMOTION_PALETTE = {
  triumph: {
    primary: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    glow: '0 0 40px rgba(255, 215, 0, 0.4)',
  },
  focus: {
    primary: '#4169E1',
    gradient: 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
    glow: '0 0 40px rgba(65, 105, 225, 0.4)',
  },
  intensity: {
    primary: '#FF4500',
    gradient: 'linear-gradient(135deg, #FF4500 0%, #DC143C 100%)',
    glow: '0 0 40px rgba(255, 69, 0, 0.4)',
  },
  determination: {
    primary: '#DC143C',
    gradient: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
    glow: '0 0 40px rgba(220, 20, 60, 0.4)',
  },
  excitement: {
    primary: '#FF69B4',
    gradient: 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)',
    glow: '0 0 40px rgba(255, 105, 180, 0.4)',
  },
  serenity: {
    primary: '#87CEEB',
    gradient: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
    glow: '0 0 40px rgba(135, 206, 235, 0.4)',
  },
};

export const EMOTION_ICONS = {
  triumph: '🏆',
  focus: '🎯',
  intensity: '🔥',
  determination: '💪',
  excitement: '⚡',
  serenity: '🧘',
};

export const PLAY_TYPE_ICONS = {
  attack: '⚡',
  block: '🛡️',
  dig: '🤿',
  set: '🎯',
  serve: '🎾',
  pass: '🤲',
  celebration: '🎉',
  timeout: '⏸️',
};
```

### 1.3 Magnetic Filter Orbs

**File**: `components/interactions/MagneticFilterOrb.tsx`

```typescript
'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { MOTION } from '@/lib/motion-tokens';

interface MagneticFilterOrbProps {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  magneticRadius?: number;
}

export function MagneticFilterOrb({
  label,
  icon,
  active,
  onClick,
  magneticRadius = 100,
}: MagneticFilterOrbProps) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  const x = useSpring(cursorX, MOTION.spring.responsive);
  const y = useSpring(cursorY, MOTION.spring.responsive);

  return (
    <motion.button
      className="relative px-6 py-3 rounded-full font-medium transition-colors"
      style={{ x, y }}
      whileHover={{
        scale: 1.2,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        transition: MOTION.spring.snappy,
      }}
      whileTap={{ scale: 0.95 }}
      animate={{
        backgroundColor: active ? '#000' : '#fff',
        color: active ? '#fff' : '#000',
        borderColor: active ? '#000' : '#e5e7eb',
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Magnetic attraction within magneticRadius
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        if (distance < magneticRadius) {
          const strength = (magneticRadius - distance) / magneticRadius;
          cursorX.set((e.clientX - centerX) * strength * 0.3);
          cursorY.set((e.clientY - centerY) * strength * 0.3);
        }
      }}
      onMouseLeave={() => {
        cursorX.set(0);
        cursorY.set(0);
      }}
      onClick={onClick}
    >
      <span className="text-2xl mr-2">{icon}</span>
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
```

**File**: `components/filters/MagneticFilterBar.tsx`

```typescript
'use client';

import { MagneticFilterOrb } from '@/components/interactions/MagneticFilterOrb';
import type { PhotoFilterState } from '@/types/filters';

interface MagneticFilterBarProps {
  filters: PhotoFilterState;
  onChange: (filters: PhotoFilterState) => void;
  photoCount: number;
}

export function MagneticFilterBar({ filters, onChange, photoCount }: MagneticFilterBarProps) {
  return (
    <div className="magnetic-filter-bar">
      {/* Quick filters */}
      <div className="flex gap-4 flex-wrap justify-center mb-6">
        <MagneticFilterOrb
          icon="⭐"
          label="Portfolio Quality"
          active={!!filters.portfolioWorthy}
          onClick={() => onChange({ ...filters, portfolioWorthy: !filters.portfolioWorthy })}
        />

        <MagneticFilterOrb
          icon="🖨️"
          label="Print Ready"
          active={!!filters.printReady}
          onClick={() => onChange({ ...filters, printReady: !filters.printReady })}
        />

        <MagneticFilterOrb
          icon="📱"
          label="Social Media"
          active={!!filters.socialMediaOptimized}
          onClick={() => onChange({ ...filters, socialMediaOptimized: !filters.socialMediaOptimized })}
        />

        <MagneticFilterOrb
          icon="⚡"
          label="Peak Moments"
          active={filters.actionIntensities?.includes('peak') || false}
          onClick={() => onChange({
            ...filters,
            actionIntensities: filters.actionIntensities?.includes('peak')
              ? filters.actionIntensities.filter(i => i !== 'peak')
              : [...(filters.actionIntensities || []), 'peak']
          })}
        />

        <MagneticFilterOrb
          icon="🎨"
          label="Golden Hour"
          active={filters.timeOfDay?.includes('golden-hour') || false}
          onClick={() => onChange({
            ...filters,
            timeOfDay: filters.timeOfDay?.includes('golden-hour')
              ? filters.timeOfDay.filter(t => t !== 'golden-hour')
              : [...(filters.timeOfDay || []), 'golden-hour']
          })}
        />
      </div>

      {/* Result count */}
      <div className="text-center text-sm text-gray-600">
        {photoCount} photos match your filters
      </div>
    </div>
  );
}
```

### 1.4 Virtual Scrolling Setup

**File**: `components/gallery/VirtualizedPhotoGrid.tsx`

```typescript
'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PhotoCard } from './PhotoCard';
import type { Photo } from '@/types/photo';

interface VirtualizedPhotoGridProps {
  photos: Photo[];
  columns?: number;
}

export function VirtualizedPhotoGrid({ photos, columns = 4 }: VirtualizedPhotoGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(photos.length / columns),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowPhotos = photos.slice(
            virtualRow.index * columns,
            (virtualRow.index + 1) * columns
          );

          return (
            <div
              key={virtualRow.index}
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowPhotos.map(photo => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 1.5 Contextual Cursor

**File**: `components/interactions/ContextualCursor.tsx`

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { EMOTION_COLORS, EMOTION_ICONS } from '@/lib/motion-tokens';
import type { Photo } from '@/types/photo';

interface ContextualCursorProps {
  hoveredPhoto: Photo | null;
}

export function ContextualCursor({ hoveredPhoto }: ContextualCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.2,
          ease: 'power2.out',
        });
      }
      setIsVisible(true);
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  if (!isVisible) return null;

  const avgQuality = hoveredPhoto?.metadata
    ? (
        (hoveredPhoto.metadata.sharpness || 0) +
        (hoveredPhoto.metadata.exposure_accuracy || 0) +
        (hoveredPhoto.metadata.composition_score || 0) +
        (hoveredPhoto.metadata.emotional_impact || 0)
      ) / 4
    : 0;

  return (
    <motion.div
      ref={cursorRef}
      className="fixed pointer-events-none z-50 flex items-center justify-center"
      style={{ top: -20, left: -20 }}
      animate={{
        scale: hoveredPhoto ? 2 : 1,
        backgroundColor: hoveredPhoto?.metadata?.emotion
          ? EMOTION_COLORS[hoveredPhoto.metadata.emotion as keyof typeof EMOTION_COLORS]?.primary
          : '#000',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {hoveredPhoto && (
        <motion.div
          className="absolute top-full mt-2 bg-black text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="flex items-center gap-2">
            {hoveredPhoto.metadata?.emotion && (
              <span className="text-lg">
                {EMOTION_ICONS[hoveredPhoto.metadata.emotion as keyof typeof EMOTION_ICONS]}
              </span>
            )}
            <span className="font-medium">
              {avgQuality.toFixed(1)}/10
            </span>
            {hoveredPhoto.metadata?.portfolio_worthy && (
              <span className="text-yellow-400">⭐</span>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
```

### 1.6 Tasks

- [ ] Create Supabase migration for `photo_metadata` table
- [ ] Write sync script with progress tracking
- [ ] Test sync with 100 photos first
- [ ] Run full sync for all enriched photos
- [ ] Install motion dependencies: framer-motion, gsap, @tanstack/react-virtual
- [ ] Create motion token system
- [ ] Implement magnetic filter orbs
- [ ] Set up virtual scrolling
- [ ] Build contextual cursor
- [ ] Test magnetic interactions on desktop

---

## Phase 2: Advanced Motion & Discovery (Week 3-4)

### 2.1 Emotion Timeline Scrubber

**File**: `components/interactions/EmotionTimeline.tsx`

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { EMOTION_ICONS } from '@/lib/motion-tokens';
import type { Photo } from '@/types/photo';

gsap.registerPlugin(Draggable);

interface EmotionTimelineProps {
  photos: Photo[];
  onPhotoSetChange: (photos: Photo[]) => void;
}

export function EmotionTimeline({ photos, onPhotoSetChange }: EmotionTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [emotionClusters, setEmotionClusters] = useState<Array<{
    emotion: string;
    photos: Photo[];
    position: number;
  }>>([]);

  useEffect(() => {
    // Group photos by emotion
    const clusters = groupByEmotion(photos);
    setEmotionClusters(clusters);

    if (!timelineRef.current || !scrubberRef.current) return;

    // Create GSAP timeline
    const tl = gsap.timeline({ paused: true });

    clusters.forEach((cluster, i) => {
      tl.to('.photo-grid', {
        onStart: () => {
          onPhotoSetChange(cluster.photos);
        },
        duration: 1,
      }, i);
    });

    // Make scrubber draggable
    const draggable = Draggable.create(scrubberRef.current, {
      type: 'x',
      bounds: timelineRef.current,
      onDrag: function() {
        const progress = this.x / this.maxX;
        tl.progress(progress);
      },
      snap: {
        x: (value: number) => {
          // Snap to emotion boundaries
          const snapInterval = this.maxX / clusters.length;
          return Math.round(value / snapInterval) * snapInterval;
        }
      }
    });

    return () => {
      tl.kill();
      draggable[0].kill();
    };
  }, [photos, onPhotoSetChange]);

  return (
    <div className="emotion-timeline w-full py-8" ref={timelineRef}>
      <div className="relative h-16 bg-gray-100 rounded-full overflow-hidden">
        {/* Emotion markers */}
        <div className="absolute inset-0 flex items-center justify-between px-4">
          {emotionClusters.map((cluster, i) => (
            <div
              key={i}
              className="flex flex-col items-center"
              style={{ left: `${(i / (emotionClusters.length - 1)) * 100}%` }}
            >
              <span className="text-2xl mb-1">
                {EMOTION_ICONS[cluster.emotion as keyof typeof EMOTION_ICONS] || '📷'}
              </span>
              <span className="text-xs text-gray-600 capitalize">
                {cluster.emotion}
              </span>
            </div>
          ))}
        </div>

        {/* Draggable scrubber */}
        <div
          ref={scrubberRef}
          className="absolute top-0 left-0 h-full w-1 bg-black cursor-grab active:cursor-grabbing"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs">
            ⇄
          </div>
        </div>
      </div>
    </div>
  );
}

function groupByEmotion(photos: Photo[]) {
  const groups = new Map<string, Photo[]>();

  photos.forEach(photo => {
    const emotion = photo.metadata?.emotion || 'unknown';
    if (!groups.has(emotion)) {
      groups.set(emotion, []);
    }
    groups.get(emotion)!.push(photo);
  });

  return Array.from(groups.entries()).map(([emotion, photos], i, arr) => ({
    emotion,
    photos,
    position: i / (arr.length - 1),
  }));
}
```

### 2.2 Play Type Morph Transitions

**File**: `components/gallery/PlayTypeMorphGrid.tsx`

```typescript
'use client';

import { useMemo } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { PLAY_TYPE_ICONS, MOTION } from '@/lib/motion-tokens';
import { PhotoCard } from './PhotoCard';
import type { Photo } from '@/types/photo';

interface PlayTypeMorphGridProps {
  photos: Photo[];
  activePlayType: string | null;
}

export function PlayTypeMorphGrid({ photos, activePlayType }: PlayTypeMorphGridProps) {
  const visiblePhotos = useMemo(() => {
    if (!activePlayType) return photos;
    return photos.filter(p => p.metadata?.play_type === activePlayType);
  }, [photos, activePlayType]);

  return (
    <LayoutGroup>
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {visiblePhotos.map(photo => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                layout: MOTION.spring.responsive,
                opacity: { duration: MOTION.duration.fast },
                scale: { duration: MOTION.duration.fast },
              }}
            >
              <PhotoCard photo={photo} />

              {/* Play type badge */}
              {photo.metadata?.play_type && (
                <motion.div
                  className="absolute top-2 right-2 bg-black text-white px-2 py-1 rounded-full text-sm"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {PLAY_TYPE_ICONS[photo.metadata.play_type as keyof typeof PLAY_TYPE_ICONS]}
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}
```

### 2.3 Momentum Scroll with Smart Snap

**File**: `components/interactions/MomentumScroll.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import type { Photo } from '@/types/photo';

interface MomentumScrollProps {
  photos: Photo[];
  children: (photo: Photo) => React.ReactNode;
}

export function MomentumScroll({ photos, children }: MomentumScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Calculate snap points for high-quality photos
    const snapPoints = photos
      .map((photo, i) => {
        const avgQuality = photo.metadata
          ? (
              (photo.metadata.sharpness || 0) +
              (photo.metadata.exposure_accuracy || 0) +
              (photo.metadata.composition_score || 0) +
              (photo.metadata.emotional_impact || 0)
            ) / 4
          : 0;

        return {
          index: i,
          quality: avgQuality,
          position: (i / photos.length) * containerRef.current!.scrollHeight,
        };
      })
      .filter(p => p.quality >= 8); // Only snap to 8+ quality

    const unsubscribe = smoothProgress.on('change', (progress) => {
      if (!containerRef.current) return;

      const currentScroll = progress * containerRef.current.scrollHeight;
      const nearestSnap = snapPoints.reduce((prev, curr) =>
        Math.abs(curr.position - currentScroll) < Math.abs(prev.position - currentScroll)
          ? curr
          : prev
      );

      // If close enough to snap point
      if (nearestSnap && Math.abs(nearestSnap.position - currentScroll) < 50) {
        containerRef.current.scrollTo({
          top: nearestSnap.position,
          behavior: 'smooth',
        });
      }
    });

    return () => unsubscribe();
  }, [photos, smoothProgress]);

  return (
    <motion.div
      ref={containerRef}
      className="h-screen overflow-y-scroll"
      style={{
        scrollSnapType: 'y proximity',
      }}
    >
      {photos.map((photo, i) => (
        <motion.div
          key={photo.id}
          style={{
            scrollSnapAlign: photo.metadata?.portfolio_worthy ? 'start' : 'none',
            scrollSnapStop: photo.metadata?.portfolio_worthy ? 'always' : 'normal',
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, margin: '-20% 0px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {children(photo)}

          {/* Quality indicator */}
          {photo.metadata?.portfolio_worthy && (
            <motion.div
              className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl"
              initial={{ x: 20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
            >
              ⭐
            </motion.div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 2.4 Touch Gestures for Mobile

**File**: `components/mobile/SwipeableCarousel.tsx`

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import type { Photo } from '@/types/photo';

interface SwipeableCarouselProps {
  photos: Photo[];
}

export function SwipeableCarousel({ photos }: SwipeableCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const bind = useDrag(
    ({ movement: [mx], direction: [xDir], velocity: [vx], cancel }) => {
      // Swipe threshold
      if (Math.abs(mx) > 50 || Math.abs(vx) > 0.5) {
        const newIndex = currentIndex + (xDir > 0 ? -1 : 1);
        setCurrentIndex(Math.max(0, Math.min(photos.length - 1, newIndex)));
        cancel();
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      rubberband: true,
    }
  );

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <motion.div
        {...bind()}
        className="absolute inset-0"
        style={{ touchAction: 'pan-y' }}
      >
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentIndex}
            src={photos[currentIndex].image_url}
            alt={photos[currentIndex].title}
            className="w-full h-full object-cover"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </AnimatePresence>
      </motion.div>

      {/* Pagination dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {photos.map((_, i) => (
          <button
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIndex ? 'bg-white' : 'bg-white/40'
            }`}
            onClick={() => setCurrentIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 2.5 Filter Query Hook

**File**: `hooks/usePhotoFilters.ts`

```typescript
import { useMemo } from 'react';
import type { Photo } from '@/types/photo';
import type { PhotoFilterState } from '@/types/filters';

export function usePhotoFilters(photos: Photo[], filters: PhotoFilterState): Photo[] {
  return useMemo(() => {
    return photos.filter(photo => {
      // Quality filters
      if (filters.portfolioWorthy && !photo.metadata?.portfolio_worthy) return false;
      if (filters.printReady && !photo.metadata?.print_ready) return false;
      if (filters.socialMediaOptimized && !photo.metadata?.social_media_optimized) return false;

      // Minimum quality score (average across all metrics)
      if (filters.minQualityScore) {
        const avgQuality = (
          (photo.metadata?.sharpness || 0) +
          (photo.metadata?.exposure_accuracy || 0) +
          (photo.metadata?.composition_score || 0) +
          (photo.metadata?.emotional_impact || 0)
        ) / 4;

        if (avgQuality < filters.minQualityScore) return false;
      }

      // Emotion filter
      if (filters.emotions?.length && !filters.emotions.includes(photo.metadata?.emotion)) {
        return false;
      }

      // Composition filter
      if (filters.compositions?.length && !filters.compositions.includes(photo.metadata?.composition)) {
        return false;
      }

      // Play type filter
      if (filters.playTypes?.length && !filters.playTypes.includes(photo.metadata?.play_type)) {
        return false;
      }

      // Action intensity filter
      if (filters.actionIntensities?.length &&
          !filters.actionIntensities.includes(photo.metadata?.action_intensity)) {
        return false;
      }

      // Use cases filter
      if (filters.useCases?.length) {
        const hasMatchingUseCase = filters.useCases.some(uc =>
          photo.metadata?.use_cases?.includes(uc)
        );
        if (!hasMatchingUseCase) return false;
      }

      // Time of day filter
      if (filters.timeOfDay?.length && !filters.timeOfDay.includes(photo.metadata?.time_of_day)) {
        return false;
      }

      return true;
    });
  }, [photos, filters]);
}
```

### 2.6 Tasks

- [ ] Install gsap dependencies: gsap, @use-gesture/react
- [ ] Implement emotion timeline scrubber
- [ ] Build play type morph transitions
- [ ] Create momentum scroll with smart snap
- [ ] Add touch gesture support for mobile
- [ ] Implement filter query hook
- [ ] Test all animations at 60fps
- [ ] Optimize for mobile devices

---

## Phase 3: Portfolio Showcase & 3D (Week 5)

### 3.1 Quality Gradient Visualization

**File**: `components/portfolio/QualityGradientGrid.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { PhotoCard } from '@/components/gallery/PhotoCard';
import type { Photo } from '@/types/photo';

interface QualityGradientGridProps {
  photos: Photo[];
}

function calculateAverageQuality(metadata: any): number {
  if (!metadata) return 0;
  return (
    (metadata.sharpness || 0) +
    (metadata.exposure_accuracy || 0) +
    (metadata.composition_score || 0) +
    (metadata.emotional_impact || 0)
  ) / 4;
}

export function QualityGradientGrid({ photos }: QualityGradientGridProps) {
  useEffect(() => {
    gsap.to('.quality-photo-card', {
      '--quality-brightness': (i: number) => {
        const photo = photos[i];
        const avgQuality = calculateAverageQuality(photo.metadata);
        return 0.5 + (avgQuality / 10) * 0.5; // 50% to 100% brightness
      },
      '--quality-blur': (i: number) => {
        const photo = photos[i];
        const sharpness = photo.metadata?.sharpness || 0;
        return `${(10 - sharpness) * 0.5}px`; // 0-5px blur
      },
      duration: 1.5,
      stagger: 0.02,
      ease: 'power2.out',
    });
  }, [photos]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {photos.map((photo, i) => (
        <div
          key={photo.id}
          className="quality-photo-card relative group"
          style={{
            // @ts-ignore - CSS custom properties
            filter: 'brightness(var(--quality-brightness, 1)) blur(var(--quality-blur, 0px))',
            transition: 'filter 0.3s ease-out',
          }}
        >
          <PhotoCard photo={photo} />

          {/* Quality badge appears on hover */}
          <motion.div
            className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-full"
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full border-4 border-white/20 relative">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                    strokeDasharray={`${calculateAverageQuality(photo.metadata) * 10}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                  {calculateAverageQuality(photo.metadata).toFixed(1)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  );
}
```

### 3.2 3D Photo Gravity

**File**: `components/portfolio/PhotoGravity.tsx`

```typescript
'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Photo } from '@/types/photo';

interface PhotoParticleProps {
  photo: Photo;
  position: [number, number, number];
  targetPosition: [number, number, number];
  onClick: () => void;
}

function PhotoParticle({ photo, position, targetPosition, onClick }: PhotoParticleProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;

    // Lerp toward target position
    meshRef.current.position.lerp(
      new THREE.Vector3(...targetPosition),
      0.1
    );

    // Add slight rotation for visual interest
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <mesh ref={meshRef} position={position} onClick={onClick}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial transparent opacity={0.9}>
        <Html transform>
          <img
            src={photo.image_url}
            alt={photo.title}
            className="w-32 h-32 object-cover rounded-lg shadow-lg cursor-pointer hover:scale-110 transition-transform"
          />
        </Html>
      </meshBasicMaterial>
    </mesh>
  );
}

interface PhotoGalaxyProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

export function PhotoGalaxy({ photos, onPhotoClick }: PhotoGalaxyProps) {
  const [hoveredPhoto, setHoveredPhoto] = useState<Photo | null>(null);

  // Calculate positions based on similarity
  const positions = useMemo(() => {
    if (!hoveredPhoto) {
      // Default: cluster by play type
      return clusterByPlayType(photos);
    } else {
      // Hovering: similar photos move toward center
      return clusterBySimilarity(photos, hoveredPhoto);
    }
  }, [photos, hoveredPhoto]);

  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        {photos.map((photo, i) => (
          <PhotoParticle
            key={photo.id}
            photo={photo}
            position={positions[i].current}
            targetPosition={positions[i].target}
            onClick={() => onPhotoClick(photo)}
          />
        ))}

        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  );
}

function clusterByPlayType(photos: Photo[]) {
  const playTypes = ['attack', 'block', 'dig', 'set', 'serve', 'pass', 'celebration'];
  const angleStep = (Math.PI * 2) / playTypes.length;

  return photos.map((photo, i) => {
    const playTypeIndex = playTypes.indexOf(photo.metadata?.play_type || '');
    const angle = playTypeIndex * angleStep;
    const radius = 5;

    return {
      current: [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        Math.random() * 2 - 1,
      ] as [number, number, number],
      target: [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        Math.random() * 2 - 1,
      ] as [number, number, number],
    };
  });
}

function clusterBySimilarity(photos: Photo[], targetPhoto: Photo) {
  return photos.map((photo) => {
    const similarity = calculateSimilarity(photo, targetPhoto);
    const distance = (1 - similarity) * 10;

    const angle = Math.random() * Math.PI * 2;

    return {
      current: [
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        Math.random() * 2 - 1,
      ] as [number, number, number],
      target: [
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        Math.random() * 2 - 1,
      ] as [number, number, number],
    };
  });
}

function calculateSimilarity(a: Photo, b: Photo): number {
  let score = 0;

  if (a.metadata?.emotion === b.metadata?.emotion) score += 0.3;
  if (a.metadata?.play_type === b.metadata?.play_type) score += 0.25;
  if (a.metadata?.composition === b.metadata?.composition) score += 0.15;
  if (a.metadata?.action_intensity === b.metadata?.action_intensity) score += 0.15;
  if (a.metadata?.time_of_day === b.metadata?.time_of_day) score += 0.1;

  return score;
}
```

### 3.3 Portfolio Route with View Modes

**File**: `app/portfolio/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { QualityGradientGrid } from '@/components/portfolio/QualityGradientGrid';
import { PhotoGalaxy } from '@/components/portfolio/PhotoGravity';
import { PlayTypeMorphGrid } from '@/components/gallery/PlayTypeMorphGrid';
import { EmotionTimeline } from '@/components/interactions/EmotionTimeline';
import { MagneticFilterBar } from '@/components/filters/MagneticFilterBar';
import { usePhotoFilters } from '@/hooks/usePhotoFilters';
import type { PhotoFilterState } from '@/types/filters';

type ViewMode = 'grid' | 'quality' | 'gravity' | 'timeline';

export default function PortfolioPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('quality');
  const [filters, setFilters] = useState<PhotoFilterState>({});
  const [photos, setPhotos] = useState<Photo[]>([]); // Fetch from API

  const filteredPhotos = usePhotoFilters(photos, filters);

  return (
    <div className="portfolio-page min-h-screen bg-white">
      <header className="py-12 px-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Portfolio Showcase</h1>
        <p className="text-gray-600 mb-8">
          Curated collection of top-quality action sports photography
        </p>

        {/* View mode toggle */}
        <div className="flex gap-4 justify-center mb-8">
          <button
            className={`px-4 py-2 rounded-full ${
              viewMode === 'quality' ? 'bg-black text-white' : 'bg-gray-200'
            }`}
            onClick={() => setViewMode('quality')}
          >
            ✨ Quality View
          </button>
          <button
            className={`px-4 py-2 rounded-full ${
              viewMode === 'grid' ? 'bg-black text-white' : 'bg-gray-200'
            }`}
            onClick={() => setViewMode('grid')}
          >
            📐 Grid View
          </button>
          <button
            className={`px-4 py-2 rounded-full ${
              viewMode === 'gravity' ? 'bg-black text-white' : 'bg-gray-200'
            }`}
            onClick={() => setViewMode('gravity')}
          >
            🌌 3D Gravity
          </button>
          <button
            className={`px-4 py-2 rounded-full ${
              viewMode === 'timeline' ? 'bg-black text-white' : 'bg-gray-200'
            }`}
            onClick={() => setViewMode('timeline')}
          >
            ⏱️ Timeline
          </button>
        </div>

        <MagneticFilterBar
          filters={filters}
          onChange={setFilters}
          photoCount={filteredPhotos.length}
        />
      </header>

      {/* Render based on view mode */}
      {viewMode === 'quality' && <QualityGradientGrid photos={filteredPhotos} />}
      {viewMode === 'grid' && <PlayTypeMorphGrid photos={filteredPhotos} activePlayType={null} />}
      {viewMode === 'gravity' && (
        <PhotoGalaxy photos={filteredPhotos} onPhotoClick={(photo) => console.log(photo)} />
      )}
      {viewMode === 'timeline' && (
        <EmotionTimeline photos={filteredPhotos} onPhotoSetChange={setPhotos} />
      )}
    </div>
  );
}
```

### 3.4 Tasks

- [ ] Install Three.js dependencies: three, @react-three/fiber, @react-three/drei
- [ ] Implement quality gradient grid
- [ ] Build 3D photo gravity with Three.js
- [ ] Create portfolio route with view mode toggle
- [ ] Add print shop CTA on print-ready photos
- [ ] Test 3D performance on various devices
- [ ] Optimize texture loading for 3D view

---

## Phase 4: Enhanced Discovery & Search (Week 6)

### 4.1 Recommendations Engine

**File**: `lib/recommendations.ts`

```typescript
import type { Photo } from '@/types/photo';

export function findSimilarPhotos(
  targetPhoto: Photo,
  allPhotos: Photo[],
  limit = 6
): Photo[] {
  return allPhotos
    .filter(p => p.id !== targetPhoto.id)
    .map(photo => ({
      photo,
      score: calculateSimilarityScore(targetPhoto, photo)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.photo);
}

function calculateSimilarityScore(a: Photo, b: Photo): number {
  let score = 0;

  // Emotion match (high weight)
  if (a.metadata?.emotion === b.metadata?.emotion) score += 30;

  // Play type match (high weight)
  if (a.metadata?.play_type === b.metadata?.play_type) score += 25;

  // Composition match (medium weight)
  if (a.metadata?.composition === b.metadata?.composition) score += 15;

  // Action intensity match (medium weight)
  if (a.metadata?.action_intensity === b.metadata?.action_intensity) score += 15;

  // Time of day match (low weight)
  if (a.metadata?.time_of_day === b.metadata?.time_of_day) score += 10;

  // Quality similarity (closer = better)
  const qualityDiff = Math.abs(
    (a.metadata?.composition_score || 0) - (b.metadata?.composition_score || 0)
  );
  score += Math.max(0, 10 - qualityDiff);

  return score;
}

export function getRecommendations(
  viewHistory: Photo[],
  allPhotos: Photo[],
  limit = 10
): Photo[] {
  // Analyze user preferences from view history
  const preferences = analyzePreferences(viewHistory);

  return allPhotos
    .filter(p => !viewHistory.some(h => h.id === p.id))
    .filter(p => p.metadata?.portfolio_worthy) // Only recommend quality photos
    .map(photo => ({
      photo,
      score: calculatePreferenceMatch(photo, preferences)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.photo);
}

interface UserPreferences {
  favoriteEmotions: Map<string, number>;
  favoritePlayTypes: Map<string, number>;
  favoriteCompositions: Map<string, number>;
  avgQualityThreshold: number;
}

function analyzePreferences(viewHistory: Photo[]): UserPreferences {
  const emotions = new Map<string, number>();
  const playTypes = new Map<string, number>();
  const compositions = new Map<string, number>();

  let totalQuality = 0;
  let qualityCount = 0;

  for (const photo of viewHistory) {
    if (photo.metadata?.emotion) {
      emotions.set(photo.metadata.emotion, (emotions.get(photo.metadata.emotion) || 0) + 1);
    }
    if (photo.metadata?.play_type) {
      playTypes.set(photo.metadata.play_type, (playTypes.get(photo.metadata.play_type) || 0) + 1);
    }
    if (photo.metadata?.composition) {
      compositions.set(photo.metadata.composition, (compositions.get(photo.metadata.composition) || 0) + 1);
    }

    if (photo.metadata?.composition_score) {
      totalQuality += photo.metadata.composition_score;
      qualityCount++;
    }
  }

  return {
    favoriteEmotions: emotions,
    favoritePlayTypes: playTypes,
    favoriteCompositions: compositions,
    avgQualityThreshold: qualityCount > 0 ? totalQuality / qualityCount : 7,
  };
}

function calculatePreferenceMatch(photo: Photo, prefs: UserPreferences): number {
  let score = 0;

  // Emotion preference match
  if (photo.metadata?.emotion) {
    score += (prefs.favoriteEmotions.get(photo.metadata.emotion) || 0) * 20;
  }

  // Play type preference match
  if (photo.metadata?.play_type) {
    score += (prefs.favoritePlayTypes.get(photo.metadata.play_type) || 0) * 15;
  }

  // Composition preference match
  if (photo.metadata?.composition) {
    score += (prefs.favoriteCompositions.get(photo.metadata.composition) || 0) * 10;
  }

  // Quality threshold bonus
  if ((photo.metadata?.composition_score || 0) >= prefs.avgQualityThreshold) {
    score += 25;
  }

  return score;
}
```

### 4.2 Natural Language Search

**File**: `lib/search.ts`

```typescript
import type { Photo } from '@/types/photo';

export function enhancedPhotoSearch(
  query: string,
  photos: Photo[]
): Photo[] {
  const lowerQuery = query.toLowerCase();

  // Metadata-based search patterns
  const patterns: Array<{test: RegExp, filter: (p: Photo) => boolean}> = [
    // Quality patterns
    {
      test: /high quality|portfolio|best/i,
      filter: (p) => p.metadata?.portfolio_worthy === true
    },
    {
      test: /print/i,
      filter: (p) => p.metadata?.print_ready === true
    },
    {
      test: /social media/i,
      filter: (p) => p.metadata?.social_media_optimized === true
    },

    // Action patterns
    {
      test: /action|intense|peak/i,
      filter: (p) => p.metadata?.action_intensity === 'high' || p.metadata?.action_intensity === 'peak'
    },
    {
      test: /spike|attack/i,
      filter: (p) => p.metadata?.play_type === 'attack'
    },
    {
      test: /block/i,
      filter: (p) => p.metadata?.play_type === 'block'
    },
    {
      test: /dig|defense/i,
      filter: (p) => p.metadata?.play_type === 'dig'
    },
    {
      test: /serve/i,
      filter: (p) => p.metadata?.play_type === 'serve'
    },

    // Emotion patterns
    {
      test: /celebration|victory|triumph/i,
      filter: (p) => p.metadata?.emotion === 'triumph' || p.metadata?.play_type === 'celebration'
    },
    {
      test: /focus|concentration/i,
      filter: (p) => p.metadata?.emotion === 'focus'
    },

    // Composition patterns
    {
      test: /golden hour|sunset/i,
      filter: (p) => p.metadata?.time_of_day === 'golden-hour'
    },
    {
      test: /motion blur|action shot/i,
      filter: (p) => p.metadata?.composition === 'motion-blur'
    },
  ];

  // Check metadata patterns
  for (const pattern of patterns) {
    if (pattern.test.test(lowerQuery)) {
      return photos.filter(pattern.filter);
    }
  }

  // Fallback to keyword search
  return photos.filter(photo => {
    const searchText = [
      photo.title,
      photo.caption,
      ...(photo.keywords || []),
      photo.metadata?.emotion,
      photo.metadata?.play_type,
      photo.metadata?.composition,
    ].filter(Boolean).join(' ').toLowerCase();

    return searchText.includes(lowerQuery);
  });
}
```

### 4.3 Discovery Badges

**File**: `components/delight/DiscoveryBadges.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { EMOTION_ICONS, PLAY_TYPE_ICONS } from '@/lib/motion-tokens';
import type { Photo } from '@/types/photo';

interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'emotion-explorer',
    icon: '🎭',
    title: 'Emotion Explorer',
    description: 'Discovered all emotion types',
  },
  {
    id: 'volleyball-connoisseur',
    icon: '🏐',
    title: 'Volleyball Connoisseur',
    description: 'Viewed all play types',
  },
  {
    id: 'quality-hunter',
    icon: '⭐',
    title: 'Quality Hunter',
    description: 'Found 10 portfolio-worthy photos',
  },
  {
    id: 'peak-seeker',
    icon: '⚡',
    title: 'Peak Seeker',
    description: 'Discovered 5 peak moment photos',
  },
];

export function DiscoveryTracker({ viewedPhoto }: { viewedPhoto: Photo | null }) {
  const [discoveries, setDiscoveries] = useState({
    emotions: new Set<string>(),
    playTypes: new Set<string>(),
    portfolioCount: 0,
    peakCount: 0,
  });
  const [unlockedBadges, setUnlockedBadges] = useState<Set<string>>(new Set());
  const [showBadge, setShowBadge] = useState<Badge | null>(null);

  useEffect(() => {
    if (!viewedPhoto) return;

    const newDiscoveries = { ...discoveries };
    let newBadge: Badge | null = null;

    // Track emotions
    if (viewedPhoto.metadata?.emotion) {
      newDiscoveries.emotions.add(viewedPhoto.metadata.emotion);

      if (
        newDiscoveries.emotions.size === Object.keys(EMOTION_ICONS).length &&
        !unlockedBadges.has('emotion-explorer')
      ) {
        newBadge = AVAILABLE_BADGES.find(b => b.id === 'emotion-explorer')!;
      }
    }

    // Track play types
    if (viewedPhoto.metadata?.play_type) {
      newDiscoveries.playTypes.add(viewedPhoto.metadata.play_type);

      if (
        newDiscoveries.playTypes.size === Object.keys(PLAY_TYPE_ICONS).length &&
        !unlockedBadges.has('volleyball-connoisseur')
      ) {
        newBadge = AVAILABLE_BADGES.find(b => b.id === 'volleyball-connoisseur')!;
      }
    }

    // Track portfolio photos
    if (viewedPhoto.metadata?.portfolio_worthy) {
      newDiscoveries.portfolioCount++;

      if (newDiscoveries.portfolioCount >= 10 && !unlockedBadges.has('quality-hunter')) {
        newBadge = AVAILABLE_BADGES.find(b => b.id === 'quality-hunter')!;
      }
    }

    // Track peak moments
    if (viewedPhoto.metadata?.action_intensity === 'peak') {
      newDiscoveries.peakCount++;

      if (newDiscoveries.peakCount >= 5 && !unlockedBadges.has('peak-seeker')) {
        newBadge = AVAILABLE_BADGES.find(b => b.id === 'peak-seeker')!;
      }
    }

    setDiscoveries(newDiscoveries);

    if (newBadge) {
      setUnlockedBadges(prev => new Set([...prev, newBadge!.id]));
      setShowBadge(newBadge);

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF69B4'],
      });

      // Auto-hide after 5 seconds
      setTimeout(() => setShowBadge(null), 5000);
    }
  }, [viewedPhoto]);

  return (
    <AnimatePresence>
      {showBadge && (
        <motion.div
          className="fixed bottom-8 right-8 bg-black text-white p-6 rounded-2xl shadow-2xl max-w-sm z-50"
          initial={{ y: 100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center gap-4">
            <div className="text-6xl">{showBadge.icon}</div>
            <div>
              <h3 className="text-xl font-bold mb-1">Badge Unlocked!</h3>
              <p className="text-lg font-medium mb-1">{showBadge.title}</p>
              <p className="text-sm text-gray-300">{showBadge.description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 4.4 Tasks

- [ ] Implement similarity scoring algorithm
- [ ] Create preference analysis system
- [ ] Build natural language search
- [ ] Add discovery badges system
- [ ] Create "Similar Photos" component
- [ ] Build "Recommended for You" section
- [ ] Test search patterns with real queries
- [ ] Add search analytics tracking

---

## Phase 4.5: AI Story-Curation Engine (Week 6)

> **See `docs/AI_STORY_CURATION.md` for complete implementation details**

### Overview

This phase transforms the photo gallery from a **photo library** into a **storytelling platform**. Instead of manual curation, the AI automatically detects narrative arcs and generates ready-to-share highlight reels.

**Value Proposition Shift**:
- **Before**: "We use AI to score your photos"
- **After**: "We automatically create shareable highlight reels from your games"

### 4.5.1 Database Schema Addition

```sql
-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  game_id UUID REFERENCES games(id),
  season_id UUID REFERENCES seasons(id),
  player_id UUID REFERENCES players(id),
  team_id UUID REFERENCES teams(id),
  photo_count INT NOT NULL,
  emotional_curve JSONB,
  status TEXT DEFAULT 'generated',
  visibility TEXT DEFAULT 'private',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Story photos (junction table)
CREATE TABLE story_photos (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  sequence_order INT NOT NULL,
  caption TEXT,
  transition_type TEXT,
  duration_seconds DECIMAL(4,2) DEFAULT 3.0,
  PRIMARY KEY (story_id, photo_id),
  UNIQUE (story_id, sequence_order)
);
```

### 4.5.2 Narrative Arc Types

1. **Game-Winning Rally**: Final 5 minutes with peak intensity + triumph
2. **Player Highlight Reel**: Top 10 portfolio moments per athlete
3. **Season Journey**: One representative photo per game, chronological
4. **The Comeback**: Pattern detection (determination → intensity → triumph)
5. **Technical Excellence**: 8+ photos with sharpness >= 9 + composition >= 9
6. **Emotion Spectrum**: 4+ different emotions in a single game

### 4.5.3 Core Implementation

**File**: `lib/story-curation/narrative-arcs.ts`

```typescript
export interface NarrativeArc {
  type: 'game-winning-rally' | 'player-highlight' | 'season-journey' | 'comeback-story';
  photos: Photo[];
  title: string;
  description: string;
  emotionalCurve: Array<{ timestamp: string; emotion: string; intensity: number }>;
  metadata: { avgQuality: number; peakMoments: number; duration: string };
}

export function detectGameWinningRally(photos: Photo[], gameContext: GameContext): NarrativeArc | null {
  // 1. Find photos from final 5 minutes
  const finalMoments = photos.filter(p => isWithinTimeRange(p.created_at, gameContext.endTime, 5 * 60));

  // 2. Filter for peak intensity + triumph/intensity emotions
  const rallyPhotos = finalMoments.filter(p =>
    p.metadata?.action_intensity === 'peak' &&
    (p.metadata?.emotion === 'triumph' || p.metadata?.emotion === 'intensity')
  );

  // 3. Sequence chronologically
  const sequence = rallyPhotos.sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  if (sequence.length < 3) return null;

  return {
    type: 'game-winning-rally',
    photos: sequence,
    title: `${gameContext.teamName} Game-Winning Rally`,
    description: `The final ${sequence.length} moments that secured victory`,
    emotionalCurve: sequence.map(p => ({
      timestamp: p.created_at,
      emotion: p.metadata?.emotion || 'unknown',
      intensity: calculateIntensityScore(p.metadata)
    })),
    metadata: {
      avgQuality: calculateAvgQuality(sequence),
      peakMoments: sequence.filter(p => p.metadata?.action_intensity === 'peak').length,
      duration: `${Math.round((sequence.length * 3) / 60)} min video`
    }
  };
}

// Additional detection functions: detectPlayerHighlightReel, detectSeasonJourney, etc.
// See AI_STORY_CURATION.md for full implementation
```

### 4.5.4 Story Viewer Component

**File**: `components/story/StoryViewer.tsx`

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export function StoryViewer({ story, autoPlay = false, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Auto-advance every 3 seconds
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => prev < story.photos.length - 1 ? prev + 1 : prev);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying, story.photos.length]);

  return (
    <div className="story-viewer fixed inset-0 z-50 bg-black">
      {/* Photo display with emotional curve overlay */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={story.photos[currentIndex].image_url}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        />
      </AnimatePresence>

      {/* Emotional curve graph with seek functionality */}
      <EmotionalCurveGraph
        curve={story.emotionalCurve}
        currentIndex={currentIndex}
        onSeek={setCurrentIndex}
      />

      {/* Navigation controls */}
      {/* See AI_STORY_CURATION.md for full implementation */}
    </div>
  );
}
```

### 4.5.5 Story Generation API

**File**: `app/api/stories/generate/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { storyType, context } = await request.json();
  const photos = await fetchPhotosForContext(context);

  let story;
  switch (storyType) {
    case 'game-winning-rally':
      story = detectGameWinningRally(photos, context);
      break;
    case 'player-highlight':
      story = detectPlayerHighlightReel(photos, context.playerId, context.playerName);
      break;
    case 'season-journey':
      story = detectSeasonJourney(photos, context.seasonId, context.seasonName);
      break;
    default:
      return NextResponse.json({ error: 'Invalid story type' }, { status: 400 });
  }

  if (!story) {
    return NextResponse.json({ error: 'Not enough photos to generate story' }, { status: 400 });
  }

  const savedStory = await saveStory(supabase, story, context);
  return NextResponse.json({ story: savedStory });
}
```

### 4.5.6 Integration Points

**Athlete Dashboard Enhancement**:

```typescript
<section className="mb-16">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-2xl font-bold mb-2">📖 Your Stories</h2>
      <p className="text-gray-600">AI-generated highlight reels</p>
    </div>
    <button onClick={() => generateStory('player-highlight', { playerId: athlete.id })}>
      Generate Highlight Reel
    </button>
  </div>
  <StoryGallery stories={athleteStories} />
</section>
```

**Coach Dashboard Enhancement**:

```typescript
<section>
  <h2 className="text-2xl font-bold mb-6">🎬 Game Stories</h2>
  {games.map(game => (
    <div key={game.id}>
      <h3>{game.opponent_name}</h3>
      <button onClick={() => generateStory('game-winning-rally', { gameId: game.id })}>
        🏆 Generate Rally Story
      </button>
    </div>
  ))}
</section>
```

### 4.5.7 Export Functionality

**Video Export** (Future Enhancement):
```typescript
export async function exportStoryAsVideo(
  story: NarrativeArc,
  options: { resolution: '720p' | '1080p' | '4k'; fps: 24 | 30 | 60 }
): Promise<Blob> {
  // Use ffmpeg.wasm for client-side or server-side ffmpeg
  // Apply Ken Burns effect, transitions, overlays
}
```

**PDF Export**:
```typescript
export async function exportStoryAsPDF(story: NarrativeArc): Promise<Blob> {
  // Use jsPDF to create full-page photo layouts with metadata
}
```

### 4.5.8 Pricing Strategy

| Tier | Price | Stories/Month | Export |
|------|-------|---------------|--------|
| Free | $0 | 3 stories | View only |
| Pro | $19 | 10 stories | Video (720p), PDF |
| Team | $99 | Unlimited | Video (1080p), PDF, Branding |
| Enterprise | Custom | Unlimited | Video (4K), API access |

### 4.5.9 Tasks

- [ ] Create database migrations for `stories` and `story_photos` tables
- [ ] Implement all 6 narrative arc detection algorithms
- [ ] Build story viewer component with emotional curve
- [ ] Create story generation API endpoint
- [ ] Build story gallery component
- [ ] Integrate into athlete dashboard
- [ ] Integrate into coach dashboard
- [ ] Add PDF export functionality
- [ ] Add "Suggested Stories" based on recent games
- [ ] Test with real enriched photo data
- [ ] Add story sharing (social media, email)
- [ ] Create story analytics tracking

### 4.5.10 Success Metrics

**Engagement**:
- Story generation rate: Target 60% of users generate 1+ story
- Story view rate: Target 80% of generated stories are viewed
- Story share rate: Target 30% of stories are shared externally

**Business**:
- Conversion to Pro: Target 15% of free users upgrade
- Story export rate: Target 40% of Pro users export stories
- Retention: Target 50% month-over-month retention for story users

---

## Phase 5: Client Features (Week 7)

### 5.1 Athlete Dashboard

**File**: `app/athlete/[id]/page.tsx`

```typescript
import { PhotoGrid } from '@/components/gallery/PhotoGrid';
import { PlayBreakdown } from '@/components/stats/PlayBreakdown';

export default async function AthleteDashboard({ params }: { params: { id: string } }) {
  const athlete = await getAthlete(params.id);
  const photos = await getAthletePhotos(params.id);

  // Curate best shots
  const bestShots = photos.filter(p => p.metadata?.portfolio_worthy);
  const socialMediaPack = photos.filter(p => p.metadata?.social_media_optimized);
  const printReady = photos.filter(p => p.metadata?.print_ready);

  return (
    <div className="athlete-dashboard min-h-screen bg-gray-50 py-12 px-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-2">{athlete.name}</h1>
        <p className="text-gray-600">{photos.length} photos available</p>
      </header>

      {/* Best shots section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">⭐ Your Best Shots</h2>
            <p className="text-gray-600">{bestShots.length} portfolio-quality photos</p>
          </div>
          <button className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition">
            Download All ({bestShots.length})
          </button>
        </div>
        <PhotoGrid photos={bestShots} />
      </section>

      {/* Social media pack */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">📱 Social Media Pack</h2>
            <p className="text-gray-600">{socialMediaPack.length} optimized for social sharing</p>
          </div>
          <button className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition">
            Download Pack
          </button>
        </div>
        <PhotoGrid photos={socialMediaPack} aspectRatio="square" />
      </section>

      {/* Print recommendations */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">🖼️ Print Recommendations</h2>
            <p className="text-gray-600">{printReady.length} photos perfect for printing</p>
          </div>
          <button className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition">
            Order Prints
          </button>
        </div>
        <PhotoGrid photos={printReady} />
      </section>

      {/* Play analysis */}
      <section>
        <h2 className="text-2xl font-bold mb-6">📊 Play Analysis</h2>
        <PlayBreakdown photos={photos} />
      </section>
    </div>
  );
}

async function getAthlete(id: string) {
  // Fetch from API
  return { name: 'Athlete Name' };
}

async function getAthletePhotos(id: string) {
  // Fetch from API
  return [];
}
```

### 5.2 Coach Season Highlights

**File**: `components/coach/SeasonHighlights.tsx`

```typescript
import { PhotoGrid } from '@/components/gallery/PhotoGrid';
import { StoryMode } from '@/components/portfolio/StoryMode';
import type { Photo } from '@/types/photo';

interface SeasonHighlightsProps {
  teamId: string;
}

export async function SeasonHighlights({ teamId }: SeasonHighlightsProps) {
  const photos = await getTeamPhotos(teamId);

  const highlights = {
    peakMoments: photos.filter(p => p.metadata?.action_intensity === 'peak'),
    technicalExcellence: photos.filter(p =>
      (p.metadata?.sharpness || 0) >= 9 &&
      (p.metadata?.composition_score || 0) >= 9
    ),
    emotionalJourney: photos.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  };

  return (
    <div className="season-highlights space-y-16">
      <section>
        <h2 className="text-3xl font-bold mb-4">🏆 Peak Moments</h2>
        <p className="text-gray-600 mb-8">Game-deciding plays with maximum intensity</p>
        <PhotoGrid photos={highlights.peakMoments} />
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-4">📸 Technical Excellence</h2>
        <p className="text-gray-600 mb-8">Best-quality shots for program promotion</p>
        <PhotoGrid photos={highlights.technicalExcellence} />
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-4">📖 Emotional Journey</h2>
        <p className="text-gray-600 mb-8">Season narrative through photos</p>
        <StoryMode photos={highlights.emotionalJourney} />
      </section>
    </div>
  );
}

async function getTeamPhotos(teamId: string): Promise<Photo[]> {
  // Fetch from API
  return [];
}
```

### 5.3 Tasks

- [ ] Create athlete dashboard route
- [ ] Implement download pack generation
- [ ] Add play analysis visualizations
- [ ] Build coach season highlights
- [ ] Create print shop integration
- [ ] Test download workflows
- [ ] Add email notification system

---

## Phase 6: Delight & Polish (Week 8)

### 6.1 Sound Design

**File**: `lib/sound-effects.ts`

```typescript
class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.loadSounds();
  }

  private loadSounds() {
    const soundFiles = {
      'quality-high': '/sounds/quality-high.mp3',
      'portfolio': '/sounds/portfolio.mp3',
      'badge-unlock': '/sounds/badge-unlock.mp3',
      'filter-click': '/sounds/filter-click.mp3',
      'photo-hover': '/sounds/photo-hover.mp3',
    };

    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.sounds.set(key, audio);
    });
  }

  play(soundKey: string) {
    if (!this.enabled) return;

    const sound = this.sounds.get(soundKey);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const soundManager = new SoundManager();
```

**Usage in Components**:

```typescript
import { soundManager } from '@/lib/sound-effects';

function PhotoCard({ photo }: { photo: Photo }) {
  const playQualitySound = () => {
    if (photo.metadata?.portfolio_worthy) {
      soundManager.play('portfolio');
    } else if (calculateAverageQuality(photo.metadata) >= 8) {
      soundManager.play('quality-high');
    }
  };

  return (
    <motion.div
      onHoverStart={playQualitySound}
      whileHover={{ scale: 1.05 }}
    >
      {/* Photo content */}
    </motion.div>
  );
}
```

### 6.2 Confetti Celebrations

**File**: `components/delight/ConfettiTrigger.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { EMOTION_PALETTE } from '@/lib/motion-tokens';
import type { Photo } from '@/types/photo';

interface ConfettiTriggerProps {
  photo: Photo;
  trigger: 'click' | 'hover' | 'view';
}

export function ConfettiTrigger({ photo, trigger }: ConfettiTriggerProps) {
  const handleTrigger = () => {
    if (photo.metadata?.action_intensity === 'peak') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: photo.metadata?.emotion
          ? [EMOTION_PALETTE[photo.metadata.emotion as keyof typeof EMOTION_PALETTE]?.primary || '#FFD700']
          : ['#FFD700', '#FFA500'],
      });
    }
  };

  useEffect(() => {
    if (trigger === 'view') {
      handleTrigger();
    }
  }, [trigger]);

  if (trigger === 'click' || trigger === 'hover') {
    return (
      <div
        onClick={trigger === 'click' ? handleTrigger : undefined}
        onMouseEnter={trigger === 'hover' ? handleTrigger : undefined}
      />
    );
  }

  return null;
}
```

### 6.3 Performance Optimization

**Lazy Loading with Intersection Observer**:

```typescript
function LazyImage({ src, alt, quality }: { src: string; alt: string; quality: number }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.src = src;
          img.onload = () => setIsLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Load 200px before entering viewport
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <motion.div
      ref={imgRef}
      className="relative overflow-hidden rounded-lg"
      animate={{
        filter: `brightness(${0.5 + (quality / 10) * 0.5})`,
      }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"
            animate={{
              x: ['0%', '100%'],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: 'linear',
            }}
          />
        </div>
      )}

      <motion.img
        src={isLoaded ? src : undefined}
        alt={alt}
        className="w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
```

### 6.4 Accessibility Audit

**Focus Management**:

```typescript
// Add keyboard navigation to filter orbs
function MagneticFilterOrb({ label, icon, active, onClick }: MagneticFilterOrbProps) {
  return (
    <motion.button
      // ... existing props
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={active}
      aria-label={`Filter by ${label}`}
      role="button"
      tabIndex={0}
    >
      {/* ... content */}
    </motion.button>
  );
}
```

**Screen Reader Announcements**:

```typescript
function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    setAnnouncement(`${photos.length} photos loaded`);
  }, [photos.length]);

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      {/* Grid content */}
    </>
  );
}
```

### 6.5 Tasks

- [ ] Implement sound design system
- [ ] Add confetti celebrations for peak moments
- [ ] Optimize image loading with Intersection Observer
- [ ] Run WCAG AAA accessibility audit
- [ ] Add keyboard navigation for all interactions
- [ ] Implement focus management
- [ ] Add screen reader announcements
- [ ] Test with screen readers (NVDA, VoiceOver)
- [ ] Performance audit with Lighthouse (target: 90+ on all metrics)
- [ ] Bundle size optimization
- [ ] Add loading states for all async operations
- [ ] Add error states with retry logic

---

## Dependencies

### Core

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0"
}
```

### Motion & Animation

```json
{
  "framer-motion": "^11.0.0",
  "gsap": "^3.12.0",
  "@use-gesture/react": "^10.3.0"
}
```

### 3D Graphics

```json
{
  "three": "^0.160.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.95.0"
}
```

### Virtual Scrolling

```json
{
  "@tanstack/react-virtual": "^3.0.0"
}
```

### Database & API

```json
{
  "@supabase/supabase-js": "^2.38.0",
  "better-sqlite3": "^9.2.0"
}
```

### Utilities

```json
{
  "canvas-confetti": "^1.9.0"
}
```

---

## Testing Strategy

### Unit Tests
- [ ] Filter logic with edge cases
- [ ] Similarity scoring algorithm
- [ ] Search enhancement patterns
- [ ] Metadata sync validation
- [ ] Motion token calculations

### Integration Tests
- [ ] End-to-end filter workflow
- [ ] Portfolio showcase rendering
- [ ] Recommendation accuracy
- [ ] Athlete dashboard data loading
- [ ] Search → filter → results flow

### Performance Tests
- [ ] Filter performance with 10K+ photos
- [ ] Virtual scrolling FPS at 60fps
- [ ] Search response time (<200ms)
- [ ] Metadata query optimization
- [ ] 3D rendering performance
- [ ] Animation frame budget

### Accessibility Tests
- [ ] Keyboard navigation (all interactive elements)
- [ ] Screen reader compatibility (NVDA, VoiceOver)
- [ ] Focus management
- [ ] ARIA labels correctness
- [ ] Color contrast (WCAG AAA)
- [ ] Reduced motion preferences

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run metadata sync script
- [ ] Validate all enriched photos in Supabase
- [ ] Test on staging with production data
- [ ] Performance audit with Lighthouse (target: 90+)
- [ ] Accessibility audit (WCAG AAA)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS, Android)
- [ ] Test with slow 3G network
- [ ] Test with reduced motion preferences

### Deployment
- [ ] Deploy database migrations
- [ ] Deploy frontend changes
- [ ] Monitor error rates
- [ ] Validate recommendation quality
- [ ] Check filter performance
- [ ] Verify 3D rendering works on all devices

### Post-Deployment
- [ ] User acceptance testing
- [ ] Analytics tracking setup
- [ ] Feedback collection
- [ ] Performance monitoring
- [ ] Error tracking (Sentry/LogRocket)
- [ ] A/B testing setup for UX variants

---

## Success Metrics

### Engagement Metrics
- **Filter usage**: Track which filters are most popular (target: 60% of users use filters)
- **Portfolio page views**: Measure interest in curated content (target: 40% view portfolio)
- **Recommendation clicks**: Measure recommendation quality (target: 25% CTR)
- **Search success rate**: Track query → result → view conversion (target: 70%)
- **3D view usage**: Track engagement with photo gravity (target: 15% of users)
- **Time on site**: Measure engagement improvement (target: +50% vs. baseline)
- **Return visitor rate**: Track user satisfaction (target: 30% return within 7 days)

### Business Metrics
- **Print order conversion**: Track print-ready flag impact (target: 5% conversion)
- **Download pack usage**: Measure athlete dashboard value (target: 40% of athletes)
- **Badge unlock rate**: Measure discovery engagement (target: 20% unlock 1+ badge)
- **Share rate**: Track social media sharing (target: 10% of views)

### Technical Metrics
- **Page load time**: Target <2s for portfolio page (LCP)
- **Filter response time**: Target <100ms for filter updates (FID)
- **Search latency**: Target <200ms for search results
- **Metadata coverage**: Track % of photos enriched (target: 95%+)
- **60fps animation**: Maintain 60fps for all interactions
- **Lighthouse score**: Target 90+ on all metrics
- **Bundle size**: Target <500KB initial JS bundle

---

## Future Enhancements (Phase 2)

### Post-Launch Ideas
1. **AI-Powered Collections**: Auto-generate themed collections monthly
2. **Smart Cropping**: Suggest crop ratios for different use cases
3. **Color Grading Suggestions**: Recommend presets based on time of day
4. **Video Highlights**: Apply metadata to video clips
5. **Collaborative Filtering**: Learn from user interactions
6. **Print Recommendations**: Suggest print sizes based on quality
7. **Social Media Scheduling**: One-click posting with optimal metadata
8. **Analytics Dashboard**: Show portfolio performance over time
9. **Multi-language Support**: Internationalize UI and metadata
10. **AR Preview**: Preview prints in your space with AR

---

## Team Structure

### Recommended Team (6-8 weeks)

**Frontend Developer 1** (Full-time, 6 weeks)
- Phase 1: Foundation + Core Interactions
- Phase 2: Advanced Motion
- Phase 3: Portfolio Showcase

**Frontend Developer 2** (Full-time, 6 weeks)
- Phase 3: 3D Photo Gravity
- Phase 4: Enhanced Discovery & Search
- Phase 4.5: AI Story-Curation Engine
- Phase 5: Client Features

**Motion Designer** (Part-time, 4 weeks overlap)
- Phase 1-2: Motion token refinement
- Phase 6: Sound design, confetti, polish
- Cross-phase: Animation review and optimization

**Optional: UX Designer** (Consulting, 2 weeks)
- Week 1: Design review and user testing setup
- Week 4: Mid-implementation review
- Week 8: Final polish review

---

## Budget Estimate

**Development**: 6-8 weeks × 2 developers × $150/hr = $96K - $128K
**Motion Design**: 4 weeks × 1 designer × $125/hr = $20K
**UX Consulting**: 2 weeks × 1 designer × $150/hr = $12K
**Infrastructure** (Supabase, hosting): $500/month
**Sound Design Assets**: $500-$1000 (one-time)

**Total**: ~$130K - $160K

---

## Type Definitions

```typescript
// types/photo.ts
export interface PhotoMetadata {
  // Quality scores (0-10)
  sharpness: number;
  exposure_accuracy: number;
  composition_score: number;
  emotional_impact: number;

  // Portfolio flags
  portfolio_worthy: boolean;
  print_ready: boolean;
  social_media_optimized: boolean;

  // Composition & Emotion
  emotion: 'triumph' | 'focus' | 'intensity' | 'determination' | 'excitement' | 'serenity';
  composition: 'rule-of-thirds' | 'leading-lines' | 'symmetry' | 'motion-blur' | 'close-up' | 'wide-angle' | 'dramatic-angle';
  time_of_day: 'morning' | 'afternoon' | 'golden-hour' | 'evening' | 'night' | 'midday';

  // Volleyball-specific
  play_type: 'attack' | 'block' | 'dig' | 'set' | 'serve' | 'pass' | 'celebration' | 'timeout' | null;
  action_intensity: 'low' | 'medium' | 'high' | 'peak';

  // Use cases
  use_cases: Array<'social-media' | 'website-hero' | 'athlete-portfolio' | 'print' | 'editorial'>;

  // AI metadata
  ai_provider: 'gemini' | 'claude' | 'openai';
  ai_cost: number;
  enriched_at: string;
}

export interface Photo {
  id: string;
  image_key: string;
  image_url: string;
  title: string;
  caption: string;
  keywords: string[];
  created_at: string;
  metadata: PhotoMetadata | null;
}

// types/filters.ts
export interface PhotoFilterState {
  // Quality filters
  portfolioWorthy?: boolean;
  minQualityScore?: number;
  printReady?: boolean;
  socialMediaOptimized?: boolean;

  // Composition & Emotion
  emotions?: string[];
  compositions?: string[];
  timeOfDay?: string[];

  // Volleyball-specific
  playTypes?: string[];
  actionIntensities?: string[];

  // Use cases
  useCases?: string[];
}
```

---

## Appendix: Implementation Notes

### Key Differences from Original Plan

1. **Filter UI**: Replaced traditional buttons with magnetic orbs for more engaging interaction
2. **View Modes**: Added 4 distinct visualization modes (grid, quality gradient, 3D gravity, timeline)
3. **Navigation**: Enhanced with momentum scrolling and smart snapping to quality photos
4. **Metadata Display**: Shifted from explicit UI to ambient/contextual cursor
5. **Delight Layer**: Added badges, confetti, and sound design for memorable moments
6. **Motion System**: Unified all animations under motion token system for consistency

### Performance Considerations

- Virtual scrolling handles 10K+ photos without performance degradation
- Lazy loading with Intersection Observer reduces initial bundle size
- GSAP and Framer Motion chosen for 60fps animations
- Three.js optimizations for 3D view (LOD, frustum culling)

### Accessibility Wins

- All interactive elements keyboard-navigable
- Screen reader announcements for dynamic content
- Reduced motion preferences honored
- WCAG AAA color contrast
- Focus management for modal interactions

---

**End of Unified Implementation Plan**

This unified plan represents the complete roadmap for building an AI-enriched photo gallery with innovative UX interactions. Each phase is designed to be implemented incrementally, with clear success criteria and testing strategies.
