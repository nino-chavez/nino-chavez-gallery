# Enriched Metadata Frontend Implementation Plan

**Version**: 1.0
**Date**: 2025-10-14
**Status**: Ready for Implementation
**Estimated Effort**: 3-4 weeks (1 developer)

---

## Executive Summary

This document outlines the complete implementation plan for leveraging enriched photo metadata (Phase 3) to enhance user experience in the SmugMug gallery frontend. The enrichment includes quality scoring, portfolio flags, use case tags, and volleyball play classification.

**Key Features**:
1. Smart filtering and discovery
2. Intelligent photo recommendations
3. Portfolio showcase mode
4. Enhanced photo detail views
5. Natural language search
6. Client-facing features

**Business Impact**:
- Increase user engagement through better discovery
- Enable print sales through quality indicators
- Provide value-added services for athletes/coaches
- Demonstrate AI-powered capabilities

---

## Phase 1: Foundation (Week 1)

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

**Tasks**:
- [ ] Create Supabase migration for `photo_metadata` table
- [ ] Write sync script with progress tracking
- [ ] Test sync with 100 photos first
- [ ] Run full sync for all enriched photos
- [ ] Add cron job for incremental syncs

---

## Phase 2: Smart Filtering (Week 1-2)

### 2.1 Filter Component Architecture

**File**: `components/filters/PhotoFilters.tsx`

```typescript
import { useState } from 'react';

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

interface PhotoFiltersProps {
  filters: PhotoFilterState;
  onChange: (filters: PhotoFilterState) => void;
  photoCount: number;
}

export function PhotoFilters({ filters, onChange, photoCount }: PhotoFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="photo-filters">
      {/* Quick filters */}
      <div className="quick-filters">
        <FilterButton
          active={filters.portfolioWorthy}
          onClick={() => onChange({ ...filters, portfolioWorthy: !filters.portfolioWorthy })}
        >
          ⭐ Portfolio Quality
        </FilterButton>

        <FilterButton
          active={filters.printReady}
          onClick={() => onChange({ ...filters, printReady: !filters.printReady })}
        >
          🖨️ Print Ready
        </FilterButton>

        <FilterButton
          active={filters.socialMediaOptimized}
          onClick={() => onChange({ ...filters, socialMediaOptimized: !filters.socialMediaOptimized })}
        >
          📱 Social Media
        </FilterButton>
      </div>

      {/* Advanced filters toggle */}
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Hide' : 'Show'} Advanced Filters
      </button>

      {isExpanded && (
        <div className="advanced-filters">
          {/* Quality slider */}
          <FilterGroup label="Minimum Quality">
            <Slider
              min={0}
              max={10}
              value={filters.minQualityScore || 0}
              onChange={(value) => onChange({ ...filters, minQualityScore: value })}
            />
          </FilterGroup>

          {/* Emotion multi-select */}
          <FilterGroup label="Emotion">
            <MultiSelect
              options={['triumph', 'focus', 'intensity', 'determination', 'excitement']}
              selected={filters.emotions || []}
              onChange={(emotions) => onChange({ ...filters, emotions })}
            />
          </FilterGroup>

          {/* Play type multi-select */}
          <FilterGroup label="Play Type">
            <MultiSelect
              options={['attack', 'block', 'dig', 'set', 'serve', 'pass', 'celebration']}
              selected={filters.playTypes || []}
              onChange={(playTypes) => onChange({ ...filters, playTypes })}
            />
          </FilterGroup>

          {/* Action intensity */}
          <FilterGroup label="Action Intensity">
            <ButtonGroup
              options={['low', 'medium', 'high', 'peak']}
              selected={filters.actionIntensities || []}
              onChange={(actionIntensities) => onChange({ ...filters, actionIntensities })}
            />
          </FilterGroup>
        </div>
      )}

      {/* Result count */}
      <div className="filter-results">
        {photoCount} photos match your filters
      </div>
    </div>
  );
}
```

### 2.2 Filter Query Hook

**File**: `hooks/usePhotoFilters.ts`

```typescript
import { useMemo } from 'react';
import type { Photo } from '@/types/photo';
import type { PhotoFilterState } from '@/components/filters/PhotoFilters';

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

      return true;
    });
  }, [photos, filters]);
}
```

**Tasks**:
- [ ] Create filter component with Tailwind styling
- [ ] Implement filter hook with memoization
- [ ] Add URL param persistence for filters
- [ ] Test filter combinations
- [ ] Add "Clear filters" button

---

## Phase 3: Portfolio Showcase (Week 2)

### 3.1 Portfolio Route

**File**: `app/portfolio/page.tsx`

```typescript
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid';
import { PortfolioFilters } from '@/components/portfolio/PortfolioFilters';

export default async function PortfolioPage() {
  const portfolioPhotos = await getPortfolioPhotos();

  return (
    <div className="portfolio-page">
      <header>
        <h1>Portfolio Showcase</h1>
        <p>Curated collection of top-quality action sports photography</p>
      </header>

      <PortfolioFilters />

      <PortfolioGrid photos={portfolioPhotos} />
    </div>
  );
}

// Server action
async function getPortfolioPhotos() {
  const { data } = await supabase
    .from('photos')
    .select(`
      *,
      metadata:photo_metadata(*)
    `)
    .eq('metadata.portfolio_worthy', true)
    .gte('metadata.composition_score', 8)
    .order('metadata.emotional_impact', { ascending: false })
    .limit(100);

  return data || [];
}
```

### 3.2 Portfolio Grid Component

**File**: `components/portfolio/PortfolioGrid.tsx`

```typescript
import { useState } from 'react';
import { PhotoCard } from '@/components/gallery/PhotoCard';
import type { Photo } from '@/types/photo';

interface PortfolioGridProps {
  photos: Photo[];
}

export function PortfolioGrid({ photos }: PortfolioGridProps) {
  const [sortBy, setSortBy] = useState<'quality' | 'emotion' | 'recent'>('quality');

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      switch (sortBy) {
        case 'quality':
          return (b.metadata.composition_score || 0) - (a.metadata.composition_score || 0);
        case 'emotion':
          return (b.metadata.emotional_impact || 0) - (a.metadata.emotional_impact || 0);
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [photos, sortBy]);

  return (
    <div className="portfolio-grid">
      {/* Sort controls */}
      <div className="portfolio-controls">
        <SortButton active={sortBy === 'quality'} onClick={() => setSortBy('quality')}>
          Quality
        </SortButton>
        <SortButton active={sortBy === 'emotion'} onClick={() => setSortBy('emotion')}>
          Impact
        </SortButton>
        <SortButton active={sortBy === 'recent'} onClick={() => setSortBy('recent')}>
          Recent
        </SortButton>
      </div>

      {/* Masonry grid */}
      <div className="masonry-grid">
        {sortedPhotos.map(photo => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            showQualityBadges
            showMetadata
          />
        ))}
      </div>
    </div>
  );
}
```

**Tasks**:
- [ ] Create portfolio route and layout
- [ ] Implement masonry grid with react-virtuoso
- [ ] Add sorting and view mode toggles
- [ ] Create "Story Mode" navigation
- [ ] Add print shop CTA on print-ready photos

---

## Phase 4: Enhanced Photo Details (Week 2-3)

### 4.1 Photo Detail Component

**File**: `components/photo/PhotoDetail.tsx`

```typescript
import { QualityBadges } from './QualityBadges';
import { QualityMetrics } from './QualityMetrics';
import { MetadataTags } from './MetadataTags';
import { UseCaseSuggestions } from './UseCaseSuggestions';
import { SimilarPhotos } from './SimilarPhotos';

interface PhotoDetailProps {
  photo: Photo;
}

export function PhotoDetail({ photo }: PhotoDetailProps) {
  return (
    <div className="photo-detail">
      {/* Hero image */}
      <div className="photo-hero">
        <img src={photo.image_url} alt={photo.title} />

        {/* Quality badges overlay */}
        <QualityBadges photo={photo} />
      </div>

      {/* Metadata sidebar */}
      <aside className="photo-metadata">
        <h2>{photo.title}</h2>
        <p>{photo.caption}</p>

        {/* Quality scores */}
        <QualityMetrics photo={photo} />

        {/* Metadata tags */}
        <MetadataTags photo={photo} />

        {/* Use case suggestions */}
        <UseCaseSuggestions photo={photo} />

        {/* Actions */}
        <div className="photo-actions">
          <button>Download</button>
          {photo.metadata?.print_ready && <button>Order Print</button>}
          <button>Share</button>
        </div>
      </aside>

      {/* Similar photos */}
      <section className="similar-photos">
        <h3>Similar Photos</h3>
        <SimilarPhotos photo={photo} />
      </section>
    </div>
  );
}
```

### 4.2 Quality Metrics Component

**File**: `components/photo/QualityMetrics.tsx`

```typescript
interface QualityMetricsProps {
  photo: Photo;
}

export function QualityMetrics({ photo }: QualityMetricsProps) {
  const { metadata } = photo;
  if (!metadata) return null;

  return (
    <div className="quality-metrics">
      <h3>Quality Scores</h3>

      <MetricBar
        label="Sharpness"
        value={metadata.sharpness}
        max={10}
        icon="🎯"
      />

      <MetricBar
        label="Exposure"
        value={metadata.exposure_accuracy}
        max={10}
        icon="💡"
      />

      <MetricBar
        label="Composition"
        value={metadata.composition_score}
        max={10}
        icon="📐"
      />

      <MetricBar
        label="Emotional Impact"
        value={metadata.emotional_impact}
        max={10}
        icon="⚡"
      />

      {/* Overall quality */}
      <div className="overall-quality">
        <span>Overall</span>
        <span className="quality-score">
          {calculateOverallQuality(metadata)}/10
        </span>
      </div>
    </div>
  );
}

function MetricBar({ label, value, max, icon }: {
  label: string;
  value: number;
  max: number;
  icon: string;
}) {
  const percentage = (value / max) * 100;
  const color = value >= 8 ? 'green' : value >= 6 ? 'yellow' : 'orange';

  return (
    <div className="metric-bar">
      <div className="metric-label">
        <span>{icon} {label}</span>
        <span className="metric-value">{value}/{max}</span>
      </div>
      <div className="metric-track">
        <div
          className={`metric-fill ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

**Tasks**:
- [ ] Create photo detail modal/page
- [ ] Implement quality metrics visualization
- [ ] Add metadata tag display
- [ ] Create use case suggestions component
- [ ] Build similar photos carousel

---

## Phase 5: Recommendations Engine (Week 3)

### 5.1 Similarity Algorithm

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

**Tasks**:
- [ ] Implement similarity scoring algorithm
- [ ] Create preference analysis system
- [ ] Build recommendations API endpoint
- [ ] Add "Similar Photos" to detail pages
- [ ] Create "Recommended for You" section

---

## Phase 6: Natural Language Search (Week 3-4)

### 6.1 Search Enhancement

**File**: `lib/search.ts`

```typescript
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

**Tasks**:
- [ ] Implement metadata-aware search
- [ ] Add search suggestions based on metadata
- [ ] Create search analytics to improve patterns
- [ ] Add voice search (future)

---

## Phase 7: Client Features (Week 4)

### 7.1 Athlete Dashboard

**File**: `app/athlete/[id]/page.tsx`

```typescript
export default async function AthleteDashboard({ params }: { params: { id: string } }) {
  const athlete = await getAthlete(params.id);
  const photos = await getAthletePhotos(params.id);

  // Curate best shots
  const bestShots = photos.filter(p => p.metadata?.portfolio_worthy);
  const socialMediaPack = photos.filter(p => p.metadata?.social_media_optimized);
  const printReady = photos.filter(p => p.metadata?.print_ready);

  return (
    <div className="athlete-dashboard">
      <header>
        <h1>{athlete.name}</h1>
        <p>{photos.length} photos available</p>
      </header>

      {/* Best shots section */}
      <section>
        <h2>⭐ Your Best Shots</h2>
        <p>{bestShots.length} portfolio-quality photos</p>
        <PhotoGrid photos={bestShots} />
        <button>Download All ({bestShots.length})</button>
      </section>

      {/* Social media pack */}
      <section>
        <h2>📱 Social Media Pack</h2>
        <p>{socialMediaPack.length} optimized for social sharing</p>
        <PhotoGrid photos={socialMediaPack} aspectRatio="square" />
        <button>Download Pack</button>
      </section>

      {/* Print recommendations */}
      <section>
        <h2>🖼️ Print Recommendations</h2>
        <p>{printReady.length} photos perfect for printing</p>
        <PhotoGrid photos={printReady} />
        <button>Order Prints</button>
      </section>

      {/* Play analysis */}
      <section>
        <h2>📊 Play Analysis</h2>
        <PlayBreakdown photos={photos} />
      </section>
    </div>
  );
}
```

### 7.2 Coach Features

**File**: `components/coach/SeasonHighlights.tsx`

```typescript
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
    <div className="season-highlights">
      <section>
        <h2>🏆 Peak Moments</h2>
        <p>Game-deciding plays with maximum intensity</p>
        <PhotoGrid photos={highlights.peakMoments} />
      </section>

      <section>
        <h2>📸 Technical Excellence</h2>
        <p>Best-quality shots for program promotion</p>
        <PhotoGrid photos={highlights.technicalExcellence} />
      </section>

      <section>
        <h2>📖 Emotional Journey</h2>
        <p>Season narrative through photos</p>
        <StoryMode photos={highlights.emotionalJourney} />
      </section>
    </div>
  );
}
```

**Tasks**:
- [ ] Create athlete dashboard
- [ ] Implement download pack generation
- [ ] Add play analysis visualizations
- [ ] Build coach season highlights
- [ ] Create print shop integration

---

## Testing Strategy

### Unit Tests
- [ ] Filter logic with edge cases
- [ ] Similarity scoring algorithm
- [ ] Search enhancement patterns
- [ ] Metadata sync validation

### Integration Tests
- [ ] End-to-end filter workflow
- [ ] Portfolio showcase rendering
- [ ] Recommendation accuracy
- [ ] Athlete dashboard data loading

### Performance Tests
- [ ] Filter performance with 10K+ photos
- [ ] Masonry grid scroll performance
- [ ] Search response time
- [ ] Metadata query optimization

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run metadata sync script
- [ ] Validate all enriched photos in Supabase
- [ ] Test on staging with production data
- [ ] Performance audit with Lighthouse
- [ ] Accessibility audit (WCAG AA)

### Deployment
- [ ] Deploy database migrations
- [ ] Deploy frontend changes
- [ ] Monitor error rates
- [ ] Validate recommendation quality
- [ ] Check filter performance

### Post-Deployment
- [ ] User acceptance testing
- [ ] Analytics tracking setup
- [ ] Feedback collection
- [ ] Performance monitoring

---

## Success Metrics

### Engagement Metrics
- **Filter usage**: Track which filters are most popular
- **Portfolio page views**: Measure interest in curated content
- **Recommendation clicks**: Measure recommendation quality
- **Search success rate**: Track query → result → view conversion

### Business Metrics
- **Print order conversion**: Track print-ready flag impact
- **Download pack usage**: Measure athlete dashboard value
- **Time on site**: Measure engagement improvement
- **Return visitor rate**: Track user satisfaction

### Technical Metrics
- **Page load time**: Target <2s for portfolio page
- **Filter response time**: Target <100ms for filter updates
- **Search latency**: Target <200ms for search results
- **Metadata coverage**: Track % of photos enriched

---

## Future Enhancements

### Phase 2 Ideas
1. **AI-Powered Collections**: Auto-generate themed collections monthly
2. **Smart Cropping**: Suggest crop ratios for different use cases
3. **Color Grading Suggestions**: Recommend presets based on time of day
4. **Video Highlights**: Apply metadata to video clips
5. **Collaborative Filtering**: Learn from user interactions
6. **Print Recommendations**: Suggest print sizes based on quality
7. **Social Media Scheduling**: One-click posting with optimal metadata
8. **Analytics Dashboard**: Show portfolio performance over time

---

## Questions for Product Owner

1. **Priority**: Which phase should we implement first?
2. **Design**: Do we have design mockups for these features?
3. **Analytics**: What analytics tracking is already in place?
4. **Print Shop**: Is print integration a priority?
5. **Mobile**: What's the mobile experience priority?
6. **Access Control**: Should coaches/athletes have separate views?

---

## Appendix: Type Definitions

```typescript
// Type definitions for enriched metadata
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
```

---

**End of Implementation Plan**

This document should provide everything needed for another developer to implement these features. Each phase is independent and can be tackled in parallel by multiple developers if needed.
