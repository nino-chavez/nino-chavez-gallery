# AI Story-Curation Engine
## From Photos to Finished Stories

**Version**: 1.0
**Date**: 2025-10-14
**Status**: Ready for Implementation
**Integration**: Phase 4.5 of Unified Implementation Plan

---

## Executive Summary

The AI Story-Curation Engine transforms the photo gallery from a **photo library** into a **storytelling platform**. Instead of asking users to manually search, filter, and curate photos, the AI automatically detects narrative arcs and generates ready-to-share highlight reels.

### Value Proposition Shift

**Before**: "We use AI to score your photos for quality and emotion"
**After**: "We automatically create shareable highlight reels from your games in seconds"

### Business Impact

- **Reduces cognitive load**: Users get finished stories, not raw photos
- **Increases perceived value**: Stories are more valuable than photos
- **Creates differentiation**: No other photo gallery does this
- **Enables new revenue streams**: Premium tier for AI-generated stories

---

## Core Philosophy

> "Don't make users build their own stories. Give them the story."

The system leverages existing enriched metadata (emotion, action_intensity, play_type, quality scores) to automatically detect narrative patterns and assemble coherent photo sequences.

---

## Narrative Arc Types

### 1. **Game-Winning Rally**
**Description**: The final moments that secured victory
**Trigger**: Last 5 minutes of a game with `action_intensity: peak` + `emotion: triumph`
**Min photos**: 3
**Target audience**: Coaches, athletes, social media

**Example**:
```
📸 Photo 1: Set (focus) → 📸 Photo 2: Attack (intensity) → 📸 Photo 3: Block attempt (determination) → 📸 Photo 4: Dig (intensity) → 📸 Photo 5: Celebration (triumph)
```

### 2. **Player Highlight Reel**
**Description**: Top 10 portfolio moments for an athlete
**Trigger**: Filter by athlete + `portfolio_worthy: true` + sort by `emotional_impact`
**Min photos**: 5
**Target audience**: Athletes, recruiters, parents

**Example**:
```
10 photos showing athlete's best plays across the season, sorted by quality and impact
```

### 3. **Season Journey**
**Description**: Emotional arc of the entire season
**Trigger**: All photos from a season, one representative photo per game
**Min photos**: 10
**Target audience**: Coaches, team administrators

**Example**:
```
Game 1 (determination) → Game 5 (focus) → Championship (triumph)
```

### 4. **The Comeback**
**Description**: From adversity to triumph
**Trigger**: Photos with `emotion: determination` followed by `emotion: triumph`
**Min photos**: 5
**Target audience**: Motivational content, social media

**Example**:
```
Early deficit (intensity) → Mid-game focus (determination) → Final rally (intensity) → Victory (triumph)
```

### 5. **Technical Excellence**
**Description**: Best-quality shots for program promotion
**Trigger**: `sharpness >= 9` + `composition_score >= 9` + `portfolio_worthy: true`
**Min photos**: 8
**Target audience**: Recruiters, program promotion

### 6. **Emotion Spectrum**
**Description**: Full range of emotions in a single game
**Trigger**: Detect 4+ different emotions in a game
**Min photos**: 6
**Target audience**: Parents, social media

---

## Architecture

### Database Schema Addition

```sql
-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_type TEXT NOT NULL, -- game-winning-rally, player-highlight, etc.
  title TEXT NOT NULL,
  description TEXT,

  -- Context
  game_id UUID REFERENCES games(id),
  season_id UUID REFERENCES seasons(id),
  player_id UUID REFERENCES players(id),
  team_id UUID REFERENCES teams(id),

  -- Metadata
  photo_count INT NOT NULL,
  duration_seconds INT, -- For video exports
  emotional_curve JSONB, -- Array of {timestamp, emotion, intensity}

  -- Status
  status TEXT DEFAULT 'generated', -- generated, published, archived
  visibility TEXT DEFAULT 'private', -- private, team, public

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Story photos (junction table)
CREATE TABLE story_photos (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  sequence_order INT NOT NULL, -- Order in the story
  caption TEXT, -- Optional per-photo caption
  transition_type TEXT, -- fade, slide, zoom (for video export)
  duration_seconds DECIMAL(4,2) DEFAULT 3.0,

  PRIMARY KEY (story_id, photo_id),
  UNIQUE (story_id, sequence_order)
);

CREATE INDEX idx_stories_type ON stories(story_type);
CREATE INDEX idx_stories_game ON stories(game_id);
CREATE INDEX idx_stories_player ON stories(player_id);
CREATE INDEX idx_stories_status ON stories(status);
```

---

## Implementation

### 1. Narrative Arc Detection

**File**: `lib/story-curation/narrative-arcs.ts`

```typescript
import type { Photo } from '@/types/photo';

export interface NarrativeArc {
  type: 'game-winning-rally' | 'player-highlight' | 'season-journey' | 'comeback-story' | 'technical-excellence' | 'emotion-spectrum';
  photos: Photo[];
  title: string;
  description: string;
  emotionalCurve: Array<{
    timestamp: string;
    emotion: string;
    intensity: number;
  }>;
  metadata: {
    avgQuality: number;
    peakMoments: number;
    duration: string;
  };
}

export interface GameContext {
  gameId: string;
  teamName: string;
  opponentName: string;
  startTime: string;
  endTime: string;
  finalScore?: string;
}

/**
 * Detect game-winning rally from final moments
 */
export function detectGameWinningRally(
  photos: Photo[],
  gameContext: GameContext
): NarrativeArc | null {
  // 1. Find photos from final 5 minutes
  const gameEndTime = new Date(gameContext.endTime).getTime();
  const fiveMinutesBefore = gameEndTime - (5 * 60 * 1000);

  const finalMoments = photos.filter(p => {
    const photoTime = new Date(p.created_at).getTime();
    return photoTime >= fiveMinutesBefore && photoTime <= gameEndTime;
  });

  // 2. Filter for peak intensity + triumph/intensity emotions
  const rallyPhotos = finalMoments.filter(p =>
    p.metadata?.action_intensity === 'peak' &&
    (p.metadata?.emotion === 'triumph' || p.metadata?.emotion === 'intensity')
  );

  // 3. Sequence chronologically
  const sequence = rallyPhotos.sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Need at least 3 photos for a story
  if (sequence.length < 3) return null;

  // 4. Calculate emotional curve
  const emotionalCurve = sequence.map(p => ({
    timestamp: p.created_at,
    emotion: p.metadata?.emotion || 'unknown',
    intensity: calculateIntensityScore(p.metadata),
  }));

  // 5. Calculate metadata
  const avgQuality = sequence.reduce((sum, p) => sum + calculateAverageQuality(p.metadata), 0) / sequence.length;
  const peakMoments = sequence.filter(p => p.metadata?.action_intensity === 'peak').length;

  return {
    type: 'game-winning-rally',
    photos: sequence,
    title: `${gameContext.teamName} Game-Winning Rally`,
    description: `The final ${sequence.length} moments that secured victory${gameContext.finalScore ? ` (${gameContext.finalScore})` : ''}`,
    emotionalCurve,
    metadata: {
      avgQuality: Math.round(avgQuality * 10) / 10,
      peakMoments,
      duration: `${Math.round((sequence.length * 3) / 60)} min video`,
    },
  };
}

/**
 * Generate player highlight reel
 */
export function detectPlayerHighlightReel(
  photos: Photo[],
  playerId: string,
  playerName: string,
  limit = 10
): NarrativeArc {
  // 1. Filter photos featuring this player
  const playerPhotos = photos.filter(p =>
    p.athletes?.includes(playerId)
  );

  // 2. Sort by portfolio_worthy + emotional_impact + composition_score
  const highlights = playerPhotos
    .filter(p => p.metadata?.portfolio_worthy)
    .sort((a, b) => {
      const scoreA =
        (a.metadata?.emotional_impact || 0) * 2 +
        (a.metadata?.composition_score || 0) * 1.5 +
        (a.metadata?.sharpness || 0);
      const scoreB =
        (b.metadata?.emotional_impact || 0) * 2 +
        (b.metadata?.composition_score || 0) * 1.5 +
        (b.metadata?.sharpness || 0);
      return scoreB - scoreA;
    })
    .slice(0, limit);

  const emotionalCurve = highlights.map(p => ({
    timestamp: p.created_at,
    emotion: p.metadata?.emotion || 'unknown',
    intensity: calculateIntensityScore(p.metadata),
  }));

  const avgQuality = highlights.reduce((sum, p) => sum + calculateAverageQuality(p.metadata), 0) / highlights.length;
  const peakMoments = highlights.filter(p => p.metadata?.action_intensity === 'peak').length;

  return {
    type: 'player-highlight',
    photos: highlights,
    title: `${playerName}: Top ${limit} Highlights`,
    description: `Portfolio-quality moments showcasing ${playerName}'s best performances`,
    emotionalCurve,
    metadata: {
      avgQuality: Math.round(avgQuality * 10) / 10,
      peakMoments,
      duration: `${Math.round((highlights.length * 4) / 60)} min video`,
    },
  };
}

/**
 * Generate season journey
 */
export function detectSeasonJourney(
  photos: Photo[],
  seasonId: string,
  seasonName: string
): NarrativeArc {
  // 1. Group photos by game/event
  const photosByEvent = groupBy(photos, 'event_id');

  // 2. Select representative photo from each event (highest emotional impact)
  const keyMoments = Object.entries(photosByEvent)
    .map(([eventId, eventPhotos]) => {
      return eventPhotos.reduce((best, current) =>
        (current.metadata?.emotional_impact || 0) > (best.metadata?.emotional_impact || 0)
          ? current
          : best
      );
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const emotionalCurve = keyMoments.map(p => ({
    timestamp: p.created_at,
    emotion: p.metadata?.emotion || 'unknown',
    intensity: calculateIntensityScore(p.metadata),
  }));

  const avgQuality = keyMoments.reduce((sum, p) => sum + calculateAverageQuality(p.metadata), 0) / keyMoments.length;
  const peakMoments = keyMoments.filter(p => p.metadata?.action_intensity === 'peak').length;

  return {
    type: 'season-journey',
    photos: keyMoments,
    title: `${seasonName}: The Journey`,
    description: `${keyMoments.length} pivotal moments that defined the season`,
    emotionalCurve,
    metadata: {
      avgQuality: Math.round(avgQuality * 10) / 10,
      peakMoments,
      duration: `${Math.round((keyMoments.length * 4) / 60)} min video`,
    },
  };
}

/**
 * Detect comeback story
 */
export function detectComebackStory(
  photos: Photo[],
  gameContext: GameContext
): NarrativeArc | null {
  // 1. Sort photos chronologically
  const chronological = [...photos].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // 2. Detect pattern: determination → intensity → triumph
  const pattern = detectEmotionalPattern(chronological, [
    'determination',
    'intensity',
    'triumph',
  ]);

  if (!pattern || pattern.length < 5) return null;

  const emotionalCurve = pattern.map(p => ({
    timestamp: p.created_at,
    emotion: p.metadata?.emotion || 'unknown',
    intensity: calculateIntensityScore(p.metadata),
  }));

  const avgQuality = pattern.reduce((sum, p) => sum + calculateAverageQuality(p.metadata), 0) / pattern.length;
  const peakMoments = pattern.filter(p => p.metadata?.action_intensity === 'peak').length;

  return {
    type: 'comeback-story',
    photos: pattern,
    title: `${gameContext.teamName}: The Comeback`,
    description: `From adversity to victory in ${pattern.length} defining moments`,
    emotionalCurve,
    metadata: {
      avgQuality: Math.round(avgQuality * 10) / 10,
      peakMoments,
      duration: `${Math.round((pattern.length * 3.5) / 60)} min video`,
    },
  };
}

/**
 * Detect technical excellence collection
 */
export function detectTechnicalExcellence(
  photos: Photo[],
  context: { teamName: string; eventName: string }
): NarrativeArc | null {
  const excellence = photos.filter(p =>
    (p.metadata?.sharpness || 0) >= 9 &&
    (p.metadata?.composition_score || 0) >= 9 &&
    p.metadata?.portfolio_worthy === true
  );

  if (excellence.length < 8) return null;

  // Sort by overall quality
  const sorted = excellence
    .sort((a, b) => calculateAverageQuality(b.metadata) - calculateAverageQuality(a.metadata))
    .slice(0, 12);

  const emotionalCurve = sorted.map(p => ({
    timestamp: p.created_at,
    emotion: p.metadata?.emotion || 'unknown',
    intensity: calculateIntensityScore(p.metadata),
  }));

  const avgQuality = sorted.reduce((sum, p) => sum + calculateAverageQuality(p.metadata), 0) / sorted.length;

  return {
    type: 'technical-excellence',
    photos: sorted,
    title: `${context.teamName}: Technical Excellence`,
    description: `${sorted.length} portfolio-quality shots from ${context.eventName}`,
    emotionalCurve,
    metadata: {
      avgQuality: Math.round(avgQuality * 10) / 10,
      peakMoments: sorted.filter(p => p.metadata?.action_intensity === 'peak').length,
      duration: `${Math.round((sorted.length * 4) / 60)} min video`,
    },
  };
}

/**
 * Detect emotion spectrum in a single game
 */
export function detectEmotionSpectrum(
  photos: Photo[],
  gameContext: GameContext
): NarrativeArc | null {
  // 1. Group by emotion
  const byEmotion = groupBy(photos, p => p.metadata?.emotion || 'unknown');

  // Need at least 4 different emotions
  if (Object.keys(byEmotion).length < 4) return null;

  // 2. Select best photo for each emotion
  const spectrum = Object.entries(byEmotion)
    .map(([emotion, emotionPhotos]) => {
      return emotionPhotos.reduce((best, current) =>
        calculateAverageQuality(current.metadata) > calculateAverageQuality(best.metadata)
          ? current
          : best
      );
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const emotionalCurve = spectrum.map(p => ({
    timestamp: p.created_at,
    emotion: p.metadata?.emotion || 'unknown',
    intensity: calculateIntensityScore(p.metadata),
  }));

  const avgQuality = spectrum.reduce((sum, p) => sum + calculateAverageQuality(p.metadata), 0) / spectrum.length;

  return {
    type: 'emotion-spectrum',
    photos: spectrum,
    title: `${gameContext.teamName}: Full Spectrum`,
    description: `The emotional journey of the game in ${spectrum.length} moments`,
    emotionalCurve,
    metadata: {
      avgQuality: Math.round(avgQuality * 10) / 10,
      peakMoments: spectrum.filter(p => p.metadata?.action_intensity === 'peak').length,
      duration: `${Math.round((spectrum.length * 3) / 60)} min video`,
    },
  };
}

// Utility functions

function calculateIntensityScore(metadata: any): number {
  if (!metadata) return 0;
  const intensityMap = { low: 2.5, medium: 5, high: 7.5, peak: 10 };
  return intensityMap[metadata.action_intensity] || 0;
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

function groupBy<T>(array: T[], key: string | ((item: T) => string)): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : (item as any)[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

function detectEmotionalPattern(photos: Photo[], pattern: string[]): Photo[] {
  const result: Photo[] = [];
  let patternIndex = 0;

  for (const photo of photos) {
    if (photo.metadata?.emotion === pattern[patternIndex]) {
      result.push(photo);
      patternIndex++;
      if (patternIndex === pattern.length) {
        patternIndex = pattern.length - 1; // Stay on last pattern element
      }
    }
  }

  return result;
}
```

### 2. Story Viewer Component

**File**: `components/story/StoryViewer.tsx`

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { EMOTION_ICONS } from '@/lib/motion-tokens';
import type { NarrativeArc } from '@/lib/story-curation/narrative-arcs';

interface StoryViewerProps {
  story: NarrativeArc;
  autoPlay?: boolean;
  onClose?: () => void;
}

export function StoryViewer({ story, autoPlay = false, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Auto-advance every 3 seconds
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev < story.photos.length - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false); // Stop at end
          return prev;
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, story.photos.length]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => Math.min(story.photos.length - 1, prev + 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [story.photos.length, onClose]);

  const currentPhoto = story.photos[currentIndex];
  const currentEmotion = story.emotionalCurve[currentIndex];

  return (
    <div className="story-viewer fixed inset-0 z-50 bg-black">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white/80 hover:text-white text-4xl leading-none"
          aria-label="Close story viewer"
        >
          ×
        </button>
      )}

      {/* Photo display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={currentPhoto.image_url}
            alt={currentPhoto.title}
            className="max-w-full max-h-full object-contain"
          />
        </motion.div>
      </AnimatePresence>

      {/* Story header */}
      <div className="absolute top-8 left-8 text-white z-40">
        <h2 className="text-3xl font-bold mb-2">{story.title}</h2>
        <p className="text-sm opacity-80">{story.description}</p>
        <div className="flex gap-4 mt-4 text-sm opacity-60">
          <span>⭐ Quality: {story.metadata.avgQuality}/10</span>
          <span>⚡ {story.metadata.peakMoments} peak moments</span>
          <span>🎬 {story.metadata.duration}</span>
        </div>
      </div>

      {/* Emotional curve */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-3/4">
        <EmotionalCurveGraph
          curve={story.emotionalCurve}
          currentIndex={currentIndex}
          onSeek={setCurrentIndex}
        />
      </div>

      {/* Navigation controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="bg-white/20 backdrop-blur px-6 py-3 rounded-full hover:bg-white/30 transition disabled:opacity-30 disabled:cursor-not-allowed text-white"
          aria-label="Previous photo"
        >
          ← Prev
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-white/20 backdrop-blur px-6 py-3 rounded-full hover:bg-white/30 transition text-white"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        <button
          onClick={() => setCurrentIndex(Math.min(story.photos.length - 1, currentIndex + 1))}
          disabled={currentIndex === story.photos.length - 1}
          className="bg-white/20 backdrop-blur px-6 py-3 rounded-full hover:bg-white/30 transition disabled:opacity-30 disabled:cursor-not-allowed text-white"
          aria-label="Next photo"
        >
          Next →
        </button>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-64 left-1/2 -translate-x-1/2 flex gap-2">
        {story.photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === currentIndex ? 'bg-white w-8' : 'bg-white/40 w-2'
            }`}
            aria-label={`Go to photo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function EmotionalCurveGraph({
  curve,
  currentIndex,
  onSeek,
}: {
  curve: Array<{ emotion: string; intensity: number }>;
  currentIndex: number;
  onSeek: (index: number) => void;
}) {
  return (
    <div className="relative h-24 bg-white/10 backdrop-blur rounded-lg overflow-hidden">
      <svg className="w-full h-full cursor-pointer" viewBox={`0 0 ${curve.length * 10} 100`}>
        {/* Area under curve */}
        <polygon
          points={`0,100 ${curve.map((point, i) =>
            `${i * 10},${100 - point.intensity * 10}`
          ).join(' ')} ${(curve.length - 1) * 10},100`}
          fill="rgba(255,255,255,0.1)"
        />

        {/* Line graph */}
        <polyline
          points={curve.map((point, i) =>
            `${i * 10},${100 - point.intensity * 10}`
          ).join(' ')}
          fill="none"
          stroke="white"
          strokeWidth="3"
        />

        {/* Current position indicator */}
        <circle
          cx={currentIndex * 10}
          cy={100 - curve[currentIndex].intensity * 10}
          r="6"
          fill="#FFD700"
          className="drop-shadow-lg"
        />

        {/* Clickable overlay for seeking */}
        <rect
          x="0"
          y="0"
          width={curve.length * 10}
          height="100"
          fill="transparent"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const index = Math.floor((x / rect.width) * curve.length);
            onSeek(Math.max(0, Math.min(curve.length - 1, index)));
          }}
        />
      </svg>

      {/* Emotion label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-sm flex items-center gap-2">
        <span className="text-2xl">
          {EMOTION_ICONS[curve[currentIndex].emotion as keyof typeof EMOTION_ICONS]}
        </span>
        <span className="capitalize">{curve[currentIndex].emotion}</span>
        <span className="opacity-60">•</span>
        <span>Intensity: {curve[currentIndex].intensity}/10</span>
      </div>
    </div>
  );
}
```

### 3. Story Generation API

**File**: `app/api/stories/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  detectGameWinningRally,
  detectPlayerHighlightReel,
  detectSeasonJourney,
  detectComebackStory,
  detectTechnicalExcellence,
  detectEmotionSpectrum,
} from '@/lib/story-curation/narrative-arcs';
import type { NarrativeArc } from '@/lib/story-curation/narrative-arcs';

export async function POST(request: NextRequest) {
  const supabase = createClient();

  try {
    const body = await request.json();
    const { storyType, context } = body;

    // Fetch photos based on context
    let photos;
    if (context.gameId) {
      photos = await fetchGamePhotos(supabase, context.gameId);
    } else if (context.playerId) {
      photos = await fetchPlayerPhotos(supabase, context.playerId);
    } else if (context.seasonId) {
      photos = await fetchSeasonPhotos(supabase, context.seasonId);
    } else {
      return NextResponse.json(
        { error: 'Missing context (gameId, playerId, or seasonId required)' },
        { status: 400 }
      );
    }

    // Generate story based on type
    let story: NarrativeArc | null = null;

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
      case 'comeback-story':
        story = detectComebackStory(photos, context);
        break;
      case 'technical-excellence':
        story = detectTechnicalExcellence(photos, context);
        break;
      case 'emotion-spectrum':
        story = detectEmotionSpectrum(photos, context);
        break;
      default:
        return NextResponse.json(
          { error: `Invalid story type: ${storyType}` },
          { status: 400 }
        );
    }

    if (!story) {
      return NextResponse.json(
        { error: 'Not enough photos to generate this story type' },
        { status: 400 }
      );
    }

    // Save story to database
    const savedStory = await saveStory(supabase, story, context);

    return NextResponse.json({ story: savedStory });
  } catch (error) {
    console.error('Error generating story:', error);
    return NextResponse.json(
      { error: 'Failed to generate story' },
      { status: 500 }
    );
  }
}

async function fetchGamePhotos(supabase: any, gameId: string) {
  const { data, error } = await supabase
    .from('photos')
    .select('*, metadata:photo_metadata(*)')
    .eq('game_id', gameId)
    .order('created_at');

  if (error) throw error;
  return data;
}

async function fetchPlayerPhotos(supabase: any, playerId: string) {
  const { data, error } = await supabase
    .from('photos')
    .select('*, metadata:photo_metadata(*)')
    .contains('athletes', [playerId])
    .order('created_at');

  if (error) throw error;
  return data;
}

async function fetchSeasonPhotos(supabase: any, seasonId: string) {
  const { data, error } = await supabase
    .from('photos')
    .select('*, metadata:photo_metadata(*)')
    .eq('season_id', seasonId)
    .order('created_at');

  if (error) throw error;
  return data;
}

async function saveStory(supabase: any, story: NarrativeArc, context: any) {
  // Insert story
  const { data: savedStory, error: storyError } = await supabase
    .from('stories')
    .insert({
      story_type: story.type,
      title: story.title,
      description: story.description,
      game_id: context.gameId || null,
      season_id: context.seasonId || null,
      player_id: context.playerId || null,
      team_id: context.teamId || null,
      photo_count: story.photos.length,
      emotional_curve: story.emotionalCurve,
    })
    .select()
    .single();

  if (storyError) throw storyError;

  // Insert story_photos
  const storyPhotos = story.photos.map((photo, index) => ({
    story_id: savedStory.id,
    photo_id: photo.id,
    sequence_order: index,
  }));

  const { error: photosError } = await supabase
    .from('story_photos')
    .insert(storyPhotos);

  if (photosError) throw photosError;

  return savedStory;
}
```

### 4. Story Gallery Component

**File**: `components/story/StoryGallery.tsx`

```typescript
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { StoryViewer } from './StoryViewer';
import type { NarrativeArc } from '@/lib/story-curation/narrative-arcs';

interface Story {
  id: string;
  type: string;
  title: string;
  description: string;
  photo_count: number;
  thumbnail_url: string;
  created_at: string;
}

interface StoryGalleryProps {
  stories: Story[];
  onGenerateNew?: () => void;
}

export function StoryGallery({ stories, onGenerateNew }: StoryGalleryProps) {
  const [selectedStory, setSelectedStory] = useState<NarrativeArc | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const loadStory = async (storyId: string) => {
    setIsLoading(storyId);
    try {
      const response = await fetch(`/api/stories/${storyId}`);
      const { story } = await response.json();
      setSelectedStory(story);
    } catch (error) {
      console.error('Error loading story:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <>
      <div className="story-gallery">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Stories</h2>
            <p className="text-gray-600">
              {stories.length} auto-generated highlight reels
            </p>
          </div>
          {onGenerateNew && (
            <button
              onClick={onGenerateNew}
              className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition"
            >
              + Generate New Story
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <motion.button
              key={story.id}
              className="story-card group relative overflow-hidden rounded-2xl bg-gray-100 aspect-video cursor-pointer"
              onClick={() => loadStory(story.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Thumbnail */}
              <img
                src={story.thumbnail_url}
                alt={story.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-2">{story.title}</h3>
                <p className="text-sm opacity-80 mb-3">{story.description}</p>
                <div className="flex gap-4 text-xs opacity-60">
                  <span>📸 {story.photo_count} photos</span>
                  <span>🕒 {new Date(story.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  {isLoading === story.id ? (
                    <div className="animate-spin text-4xl">⏳</div>
                  ) : (
                    <span className="text-4xl">▶️</span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Story viewer modal */}
      {selectedStory && (
        <StoryViewer
          story={selectedStory}
          autoPlay
          onClose={() => setSelectedStory(null)}
        />
      )}
    </>
  );
}
```

---

## Integration Points

### Athlete Dashboard

Add "Your Auto-Generated Stories" section:

```typescript
// app/athlete/[id]/page.tsx

<section className="mb-16">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-2xl font-bold mb-2">📖 Your Stories</h2>
      <p className="text-gray-600">AI-generated highlight reels</p>
    </div>
    <button
      onClick={() => generateStory('player-highlight', { playerId: athlete.id })}
      className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition"
    >
      Generate Highlight Reel
    </button>
  </div>
  <StoryGallery stories={athleteStories} />
</section>
```

### Coach Dashboard

Add "Game Stories" section:

```typescript
// app/coach/[teamId]/page.tsx

<section className="mb-16">
  <h2 className="text-2xl font-bold mb-6">🎬 Game Stories</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {games.map(game => (
      <div key={game.id} className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold mb-2">{game.opponent_name}</h3>
        <p className="text-sm text-gray-600 mb-4">{game.final_score}</p>
        <div className="flex gap-2">
          <button onClick={() => generateStory('game-winning-rally', { gameId: game.id })}>
            🏆 Game-Winning Rally
          </button>
          <button onClick={() => generateStory('emotion-spectrum', { gameId: game.id })}>
            🎭 Emotion Spectrum
          </button>
        </div>
      </div>
    ))}
  </div>
</section>
```

---

## Export Functionality

### Video Export

```typescript
// lib/story-curation/video-export.ts

export async function exportStoryAsVideo(
  story: NarrativeArc,
  options: {
    resolution: '720p' | '1080p' | '4k';
    fps: 24 | 30 | 60;
    musicTrack?: string;
  }
): Promise<Blob> {
  // Use ffmpeg.wasm or server-side ffmpeg
  // For each photo:
  // 1. Fetch image
  // 2. Apply Ken Burns effect (slow zoom/pan)
  // 3. Add transition (fade, slide, zoom)
  // 4. Overlay emotion label
  // 5. Add background music

  // Return video blob
}
```

### PDF Export

```typescript
// lib/story-curation/pdf-export.ts

export async function exportStoryAsPDF(story: NarrativeArc): Promise<Blob> {
  // Use jsPDF or similar
  // For each photo:
  // 1. Add full-page image
  // 2. Overlay title, emotion, quality score
  // 3. Add page break

  // Return PDF blob
}
```

---

## Pricing Strategy

### Free Tier
- Browse all photos
- Use basic filters
- View 3 auto-generated stories per month

### Pro Tier ($19/month)
- 10 AI-generated stories per month
- Download stories as video (720p)
- Download stories as PDF
- Priority story generation (faster processing)

### Team Tier ($99/month)
- Unlimited stories
- HD video export (1080p)
- Custom story templates
- Team branding on exports
- Shared story library

### Enterprise
- White-label story generation
- API access for custom integrations
- 4K video export
- Custom music tracks
- Dedicated support

---

## Marketing Copy

### Landing Page

**Headline**: "Stop Searching. Start Sharing."

**Subheadline**: "AI automatically creates highlight reels from your games in seconds. No editing required."

**CTA**: "Generate Your First Story Free"

### Feature Highlights

- ✨ **Auto-Generated Stories**: AI finds your best moments and creates ready-to-share highlight reels
- 🎬 **6 Story Types**: Game-winning rallies, player highlights, season journeys, and more
- 📱 **One-Click Sharing**: Export to video, PDF, or share directly to social media
- ⚡ **Instant Results**: Stories generated in under 30 seconds

---

## Success Metrics

### Engagement
- **Story generation rate**: Target 60% of users generate 1+ story
- **Story view rate**: Target 80% of generated stories are viewed
- **Story share rate**: Target 30% of stories are shared externally

### Business
- **Conversion to Pro**: Target 15% of free users upgrade for more stories
- **Story export rate**: Target 40% of Pro users export to video/PDF
- **Retention**: Target 50% month-over-month retention for story-generating users

---

## Implementation Timeline

**Week 1-2**: Database schema + Narrative arc detection
**Week 3**: Story viewer component + API
**Week 4**: Integration with athlete/coach dashboards
**Week 5**: Export functionality (video + PDF)
**Week 6**: Polish + testing

**Total**: 6 weeks (parallel with Phase 4 of main implementation)

---

## Next Steps

1. ✅ Create database migration for `stories` and `story_photos` tables
2. ✅ Implement narrative arc detection algorithms
3. ✅ Build story viewer component
4. ✅ Create story generation API
5. ✅ Integrate into athlete/coach dashboards
6. ⏳ Add video export functionality
7. ⏳ Add PDF export functionality
8. ⏳ Test with real data from enriched photos

---

**This document is ready for Phase 4.5 implementation in the Unified Plan.**
