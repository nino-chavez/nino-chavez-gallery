# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-enriched photo gallery platform for sports photography (volleyball), built with Next.js 15. The platform transforms raw photo collections from SmugMug into intelligent, story-driven experiences using AI-powered metadata enrichment.

**Core Value Proposition:** Automatic story curation from sports photos with zero manual work - AI analyzes photos and creates highlight reels, player showcases, and emotional journeys.

## Key Technologies

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript 5.8, Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL), SmugMug API, SQLite (local cache)
- **AI/ML:** Gemini Vision API (primary), Claude/OpenAI (fallback)
- **Animation:** Framer Motion, GSAP, Three.js (@react-three/fiber)
- **Testing:** Playwright (visual regression + user journeys)
- **Package Manager:** pnpm (required)

## Development Commands

### Core Development
```bash
pnpm dev              # Start dev server at localhost:3000
pnpm build            # Smart build (checks for SmugMug updates first)
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript type checking (tsc --noEmit)
```

### Build Variants
```bash
pnpm build:force-context        # Force rebuild gallery-context.json
pnpm build:check-updates        # Check if SmugMug has new content
pnpm build:incremental          # Incremental update only
```

### Testing
```bash
pnpm test                       # Run all Playwright tests
pnpm test:visual                # Visual regression tests only
pnpm test:visual:update         # Update visual snapshots
pnpm test:visual:ui             # Open Playwright UI for visual tests
pnpm test:journey               # User journey E2E tests only
pnpm test:all                   # Run visual + journey sequentially
```

### Metadata Operations
```bash
pnpm enrich                     # Enrich local photos with AI metadata
pnpm enrich:smugmug             # Enrich SmugMug photos with AI metadata
pnpm sync:metadata              # Sync enriched metadata to Supabase
```

## Architecture Patterns

### Data Flow

1. **Photo Source → Local Cache → AI Enrichment → Supabase → App**
   - SmugMug API provides raw photos
   - SQLite cache (`scripts/enriched-metadata.db`) stores intermediate data
   - AI vision APIs (Gemini/Claude/OpenAI) analyze photos for metadata
   - Supabase stores enriched metadata for production queries
   - Next.js app queries Supabase for photo data

2. **Build-Time Context Generation**
   - `scripts/build-wrapper.js` runs before every build
   - Checks for SmugMug updates (compares timestamps)
   - Generates `gallery-context.json` with album/photo metadata
   - Smart caching: only regenerates if SmugMug has new content
   - Incremental mode: processes only new/changed albums

### AI Metadata Enrichment

**Core Metadata Structure** (`src/types/photo.ts`):
```typescript
interface PhotoMetadata {
  // Quality scores (0-10)
  sharpness: number;
  exposure_accuracy: number;
  composition_score: number;
  emotional_impact: number;

  // Portfolio flags
  portfolio_worthy: boolean;
  print_ready: boolean;
  social_media_optimized: boolean;

  // Volleyball-specific
  play_type: 'attack' | 'block' | 'dig' | 'set' | 'serve' | 'pass' | 'celebration' | 'timeout' | null;
  action_intensity: 'low' | 'medium' | 'high' | 'peak';
  emotion: 'triumph' | 'focus' | 'intensity' | 'determination' | 'excitement' | 'serenity';

  // AI provider tracking
  ai_provider: 'gemini' | 'claude' | 'openai';
  ai_cost: number;
  enriched_at: string;
}
```

**Cost Optimization:**
- Gemini Flash is recommended: `GEMINI_MODEL=models/gemini-1.5-flash-002` (~$0.17 per 1,000 photos)
- Use `SMUGMUG_IMAGE_SIZE=M` (Medium) to save 85-88% on costs vs Display size
- Medium size (87KB) provides 300 tokens vs Display (17MB) at 50K tokens
- Never use 'latest' for Gemini model - it may resolve to expensive Pro models

### Story Curation Engine

**Location:** `src/lib/story-curation/narrative-arcs.ts`

**6 Story Types:**
1. **Game-Winning Rally** - Final 5 minutes, peak intensity moments
2. **Player Highlight Reel** - Top portfolio-worthy shots per player
3. **Season Journey** - Representative photos from each week/period
4. **Comeback Story** - Emotional pattern: determination → intensity → triumph
5. **Technical Excellence** - Highest quality shots (sharpness/composition ≥9)
6. **Emotion Spectrum** - Best photo for each emotion in a game

**Pattern:** Each detection function:
- Filters photos by criteria (time, quality, emotion)
- Sorts/sequences chronologically or by quality
- Calculates emotional curve for timeline visualization
- Returns `NarrativeArc` with photos, title, description, metadata

**API Endpoints:**
- `POST /api/stories/generate` - Generate new story
- `GET /api/stories/[id]` - Retrieve story by ID

### Motion Design System

**Unified Tokens** (`src/lib/motion-tokens.ts`):
```typescript
MOTION.spring.gentle    // Smooth, natural springs
MOTION.spring.snappy    // Quick, responsive springs
MOTION.duration.fast    // 0.2s for quick transitions
MOTION.ease.easeOut     // [0.16, 1, 0.3, 1] for smooth exits
```

**Emotion Palette:**
- Each emotion has primary color, gradient, and glow effect
- Used for filters, timeline, photo cards, story viewer
- Examples: triumph=#FFD700, intensity=#FF4500, focus=#4169E1

**Play Type Icons:**
- attack=⚡, block=🛡️, dig=🤿, set=🎯, serve=🎾, etc.
- Displayed in filters, photo metadata overlays

### Component Organization

```
src/components/
├── story/              # Story viewer, gallery, generation modal
├── interactions/       # MagneticFilterOrb, ContextualCursor, EmotionTimeline
├── portfolio/          # PortfolioGrid, QualityGradient, PlayTypeMorphGrid
├── delight/            # Badges, confetti, sound effects
├── filters/            # PhotoFilters (magnetic orb system)
├── athlete/            # Athlete dashboard components
├── coach/              # Coach dashboard components
├── common/             # Shared UI components
└── layouts/            # Page layouts
```

### Supabase Integration

**Client Setup:**
- Server components: `src/lib/supabase/server.ts` (uses cookies)
- Client components: `src/lib/supabase/client.ts` (browser)

**Database Tables:**
- `photo_metadata` - Enriched AI metadata (migration 001)
- `stories` - Generated stories (migration 002)
- Performance indexes on portfolio_worthy, play_type, emotion, action_intensity

**Pattern:** Always use server-side Supabase in API routes and server components for security.

## Important Patterns

### 1. Image Optimization
- Next.js Image component configured for SmugMug (`photos.smugmug.com`)
- AVIF/WebP formats with multiple device sizes
- 7-day cache TTL for remote images
- Quality tiers: 50, 75, 90

### 2. Performance
- Virtual scrolling with `@tanstack/react-virtual` for 10K+ photos
- Lazy loading with Intersection Observer
- Skeleton loaders for loading states
- SWR for client-side caching

### 3. Testing Strategy
- **Visual tests** verify UI rendering, image optimization, filter interactions
- **Journey tests** verify end-to-end user workflows
- Playwright config optimized for M3 Max (6 workers locally, 4 on CI)
- Screenshots on failure, video on retry only (memory optimization)

### 4. Build Process
- `scripts/build-wrapper.js` orchestrates smart context generation
- Checks SmugMug for updates before every build
- Falls back to full rebuild if incremental update fails
- Vercel deployments use optimized context (no regeneration)

### 5. TypeScript Paths
- `@/*` aliases to `src/*`
- Strict mode is disabled (gradual migration)
- Target ES2017 for broader compatibility

## Common Workflows

### Adding a New Story Type

1. Add detection function in `src/lib/story-curation/narrative-arcs.ts`:
```typescript
export function detectNewStoryType(photos: Photo[], context: Context): NarrativeArc | null {
  // Filter and sort logic
  // Calculate emotional curve
  // Return NarrativeArc
}
```

2. Add case in `src/app/api/stories/generate/route.ts`:
```typescript
case 'new-story-type':
  story = detectNewStoryType(photos, context);
  break;
```

3. Add option in `src/components/story/StoryGenerationModal.tsx`

### Adding a New Filter
1. Update `PhotoMetadata` type if needed
2. Add filter option to `MagneticFilterOrb` component
3. Update filter state in `PhotoFilters.tsx`
4. Add corresponding database index if querying frequently

### Enriching New Photos
1. Add photos to SmugMug album
2. Run `pnpm enrich:smugmug` to analyze with AI
3. Run `pnpm sync:metadata` to upload to Supabase
4. Rebuild context: `REBUILD_CONTEXT=true pnpm build`

## Database Schema

**photo_metadata table:**
- Quality scores: sharpness, exposure_accuracy, composition_score, emotional_impact (DECIMAL 0-10)
- Boolean flags: portfolio_worthy, print_ready, social_media_optimized
- Enums: emotion, play_type, action_intensity, composition, time_of_day
- Arrays: use_cases (TEXT[])
- Metadata: ai_provider, ai_cost, enriched_at

**Indexes:** portfolio_worthy, print_ready, play_type, action_intensity, use_cases (GIN), emotion, composition, time_of_day

## Environment Variables

**Required:**
```bash
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role (server-side only)
```

**SmugMug (optional for development):**
```bash
SMUGMUG_API_KEY=
SMUGMUG_API_SECRET=
SMUGMUG_ACCESS_TOKEN=
SMUGMUG_ACCESS_TOKEN_SECRET=
SMUGMUG_USERNAME=
```

**AI Vision (choose one):**
```bash
GOOGLE_API_KEY=                 # Recommended: Gemini Flash
ANTHROPIC_API_KEY=              # Alternative: Claude
OPENAI_API_KEY=                 # Alternative: GPT-4 Vision
```

**Cost Control:**
```bash
GEMINI_MODEL=models/gemini-1.5-flash-002  # Use Flash, not Pro
SMUGMUG_IMAGE_SIZE=M                      # Medium = 85% cost savings
```

## Performance Targets

- Lighthouse score: 90+ (Performance, Accessibility, Best Practices, SEO)
- Page load time: <2s
- Story generation: <3s
- 60fps animations maintained
- Support 10K+ photos with virtual scrolling

## Key Files

- `src/types/photo.ts` - Core type definitions
- `src/lib/motion-tokens.ts` - Design system tokens
- `src/lib/story-curation/narrative-arcs.ts` - Story detection algorithms
- `scripts/build-wrapper.js` - Intelligent build orchestration
- `scripts/build-context.ts` - Gallery context generation
- `scripts/enrich-smugmug.ts` - AI metadata enrichment
- `tailwind.config.ts` - Theme with emotion palette
- `playwright.config.ts` - Test configuration
- `supabase/migrations/` - Database schema

## Notes

- Always use pnpm, not npm or yarn (lockfile compatibility)
- Test visual changes with `pnpm test:visual:update` before committing
- Run type-check before builds: `pnpm type-check`
- SmugMug API rate limits: be mindful when enriching large albums
- AI costs add up quickly - always use Medium image size and Flash models
- Build wrapper is smart - don't bypass it unless debugging
- Context file (`gallery-context.json`) is gitignored - regenerated on each deployment
