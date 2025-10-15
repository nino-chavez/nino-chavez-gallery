# Installation & Deployment Guide
**AI-Enriched Photo Gallery with Story Curation**

---

## Prerequisites

- Node.js 20+ 
- pnpm 9+
- Supabase account
- SmugMug API credentials (optional)

---

## Installation

### 1. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Install missing dependency for virtual scrolling
pnpm add @tanstack/react-virtual

# Install PDF export (optional - for story exports)
pnpm add jspdf @types/jspdf
```

### 2. Environment Setup

Create `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# SmugMug (if using)
SMUGMUG_API_KEY=your_api_key
SMUGMUG_API_SECRET=your_api_secret

# AI Providers (for metadata enrichment)
GOOGLE_AI_API_KEY=your_gemini_key
```

### 3. Database Setup

```bash
# Run migrations in Supabase
# Navigate to SQL Editor in Supabase dashboard

# Run migrations in order:
# 1. supabase/migrations/001_create_photo_metadata.sql
# 2. supabase/migrations/002_create_stories_tables.sql
```

### 4. Metadata Sync

If you have enriched photos in SQLite:

```bash
# Sync metadata from SQLite to Supabase
pnpm run sync:metadata --db=path/to/enrichment.db
```

---

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

---

## Component Usage Guide

### Story Curation

```tsx
import { StoryGallery } from '@/components/story/StoryGallery';
import { StoryViewer } from '@/components/story/StoryViewer';

// In your component
<StoryGallery 
  stories={stories}
  onGenerateNew={() => generateStory()}
/>
```

### Magnetic Filters

```tsx
import { MagneticFilterBar } from '@/components/filters/MagneticFilterBar';

<MagneticFilterBar
  filters={filters}
  onChange={setFilters}
  photoCount={filteredPhotos.length}
/>
```

### Quality Gradient Grid

```tsx
import { QualityGradientGrid } from '@/components/portfolio/QualityGradientGrid';

<QualityGradientGrid 
  photos={photos}
  onPhotoClick={handleClick}
/>
```

### 3D Photo Gravity

```tsx
import { PhotoGravity } from '@/components/portfolio/PhotoGravity';

<PhotoGravity
  photos={photos}
  onPhotoClick={handleClick}
/>
```

### Emotion Timeline

```tsx
import { EmotionTimeline } from '@/components/interactions/EmotionTimeline';

<EmotionTimeline
  photos={photos}
  onPhotoSetChange={setFilteredPhotos}
/>
```

### Discovery Badges

```tsx
import { DiscoveryTracker } from '@/components/delight/DiscoveryBadges';

<DiscoveryTracker viewedPhoto={currentPhoto} />
```

---

## API Endpoints

### Generate Story

```typescript
POST /api/stories/generate
{
  "storyType": "player-highlight",
  "context": {
    "playerId": "uuid",
    "playerName": "Player Name"
  }
}
```

### Get Story

```typescript
GET /api/stories/{storyId}
```

### Story Types

- `game-winning-rally` - Final 5 minutes with peak intensity
- `player-highlight` - Top 10 portfolio moments
- `season-journey` - One photo per game
- `comeback-story` - Determination → intensity → triumph pattern
- `technical-excellence` - High-quality shots (sharpness + composition >= 9)
- `emotion-spectrum` - 4+ different emotions in one game

---

## Performance Optimization

### Lazy Loading

All images use the LazyImage component with Intersection Observer:

```tsx
import { LazyImage } from '@/components/common/LazyImage';

<LazyImage 
  src={photo.image_url}
  alt={photo.title}
  quality={avgQuality}
  priority={isAboveFold}
/>
```

### Virtual Scrolling

For large photo sets (1000+ photos):

```tsx
import { VirtualizedPhotoGrid } from '@/components/gallery/VirtualizedPhotoGrid';

<VirtualizedPhotoGrid photos={photos} columns={4} />
```

### Sound Effects

Enable/disable sound effects:

```tsx
import { soundManager } from '@/lib/sound-effects';

// Disable sounds
soundManager?.setEnabled(false);

// Set volume (0-1)
soundManager?.setVolume(0.3);
```

---

## Deployment

### Vercel Deployment

```bash
# Deploy to Vercel
vercel deploy --prod

# Environment variables will be read from Vercel dashboard
```

### Pre-Deployment Checklist

- [ ] Run database migrations
- [ ] Sync enriched metadata to Supabase
- [ ] Test story generation with real data
- [ ] Run Lighthouse audit (target: 90+)
- [ ] Test on mobile devices
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Test with slow 3G network
- [ ] Verify accessibility (keyboard nav, screen readers)

### Post-Deployment

- [ ] Monitor error rates in Sentry
- [ ] Check API response times
- [ ] Verify story generation works
- [ ] Test filter performance
- [ ] Validate 3D rendering on various devices

---

## Troubleshooting

### Common Issues

**Issue**: GSAP Draggable not working
**Solution**: Ensure GSAP is imported and registered:
```tsx
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
gsap.registerPlugin(Draggable);
```

**Issue**: Three.js performance issues
**Solution**: Limit photos in 3D view to 100:
```tsx
photos.slice(0, 100)
```

**Issue**: Story generation fails
**Solution**: Check that photos have required metadata:
- `emotion`
- `action_intensity`
- `play_type`
- Quality scores

**Issue**: PDF export error (jsPDF not found)
**Solution**: Install jsPDF:
```bash
pnpm add jspdf @types/jspdf
```

---

## Architecture Notes

### Component Hierarchy

```
app/
├── portfolio/page.tsx (Portfolio showcase with 4 view modes)
├── athlete/[id]/page.tsx (Athlete dashboard with stories)
└── api/
    └── stories/
        ├── generate/route.ts (Generate stories)
        └── [id]/route.ts (Fetch story details)

components/
├── story/
│   ├── StoryViewer.tsx (Full-screen story player)
│   └── StoryGallery.tsx (Browse stories)
├── interactions/
│   ├── MagneticFilterOrb.tsx (Physics-based filters)
│   ├── ContextualCursor.tsx (Metadata on hover)
│   ├── EmotionTimeline.tsx (GSAP scrubber)
│   └── MomentumScroll.tsx (Smart snapping)
├── portfolio/
│   ├── QualityGradientGrid.tsx (Visual quality)
│   └── PhotoGravity.tsx (3D clustering)
├── delight/
│   └── DiscoveryBadges.tsx (Gamification)
└── common/
    └── LazyImage.tsx (Performance)

lib/
├── motion-tokens.ts (Design system)
├── sound-effects.ts (Audio feedback)
├── recommendations.ts (Similarity scoring)
├── search.ts (Natural language)
└── story-curation/
    ├── narrative-arcs.ts (6 detection algorithms)
    └── pdf-export.ts (PDF generation)
```

### Data Flow

1. **Photo Upload** → SmugMug API
2. **Metadata Enrichment** → Gemini Vision API → SQLite cache
3. **Metadata Sync** → Supabase `photo_metadata` table
4. **Story Generation** → Narrative arc detection → `stories` table
5. **Display** → React components → User interaction

---

## Testing

### Manual Testing Checklist

- [ ] Generate each of 6 story types
- [ ] Test all 4 portfolio view modes
- [ ] Verify magnetic filter physics
- [ ] Test keyboard navigation
- [ ] Verify mobile swipe gestures
- [ ] Test lazy loading performance
- [ ] Verify discovery badges unlock
- [ ] Test PDF export
- [ ] Verify accessibility features

### Performance Testing

```bash
# Run Lighthouse audit
lighthouse https://your-site.vercel.app --view

# Target scores:
# Performance: 90+
# Accessibility: 90+
# Best Practices: 90+
# SEO: 90+
```

---

## Support

For issues or questions:
1. Check [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for feature status
2. Review [UNIFIED_IMPLEMENTATION_PLAN.md](./UNIFIED_IMPLEMENTATION_PLAN.md) for architecture
3. See [AI_STORY_CURATION.md](./AI_STORY_CURATION.md) for story features

---

**Last Updated**: 2025-01-15