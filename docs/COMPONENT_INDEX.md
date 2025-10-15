# Component Index & Integration Guide
**Complete Reference for All Implemented Components**

---

## 🗺️ QUICK NAVIGATION

| Category | Components | Location | Status |
|----------|-----------|----------|--------|
| [Story Curation](#story-curation) | 3 components, 2 APIs | `src/components/story/`, `src/app/api/stories/` | ✅ Complete |
| [Motion & Interactions](#motion--interactions) | 8 components | `src/components/interactions/`, `src/components/mobile/` | ✅ Complete |
| [Portfolio](#portfolio-showcase) | 3 components, 1 route | `src/components/portfolio/`, `src/app/portfolio/` | ✅ Complete |
| [Discovery](#discovery--delight) | 1 component | `src/components/delight/` | ✅ Complete |
| [Common](#common-components) | 5 utilities | `src/components/common/` | ✅ Complete |
| [Dashboards](#dashboards) | 2 pages | `src/app/athlete/`, `src/components/coach/` | ✅ Complete |
| [Libraries](#core-libraries) | 4 utilities | `src/lib/` | ✅ Complete |

---

## 📖 STORY CURATION

### StoryViewer
**File**: [`src/components/story/StoryViewer.tsx`](../src/components/story/StoryViewer.tsx)  
**Purpose**: Full-screen story player with auto-play and emotional curve  
**Lines**: 218

**Props**:
```typescript
interface StoryViewerProps {
  story: NarrativeArc;
  autoPlay?: boolean;
  onClose?: () => void;
}
```

**Features**:
- Auto-advances every 3 seconds
- Keyboard controls: ←/→ (navigate), Space (play/pause), Esc (close)
- Emotional curve graph with seek functionality
- Progress dots
- Story metadata display
- Smooth transitions

**Usage**:
```tsx
<StoryViewer 
  story={narrativeArc}
  autoPlay
  onClose={() => setShowStory(false)}
/>
```

### StoryGallery
**File**: [`src/components/story/StoryGallery.tsx`](../src/components/story/StoryGallery.tsx)  
**Purpose**: Browse and load generated stories  
**Lines**: 133

**Props**:
```typescript
interface StoryGalleryProps {
  stories: Story[];
  onGenerateNew?: () => void;
}
```

**Features**:
- Animated story cards
- Hover effects with play button
- Loading states
- Empty state with CTA
- Loads full story on click

**Usage**:
```tsx
<StoryGallery 
  stories={athleteStories}
  onGenerateNew={() => openGenerationModal()}
/>
```

### StoryGenerationModal
**File**: [`src/components/story/StoryGenerationModal.tsx`](../src/components/story/StoryGenerationModal.tsx)  
**Purpose**: UI for selecting and generating story types  
**Lines**: 186

**Props**:
```typescript
interface StoryGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: {
    type: 'athlete' | 'game' | 'season';
    id: string;
    name: string;
  };
}
```

**Features**:
- Context-aware story type filtering
- Visual story type selection
- Loading feedback
- Error handling with retry
- Focus trap for accessibility

**Usage**:
```tsx
<StoryGenerationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  context={{ type: 'athlete', id: athleteId, name: athleteName }}
/>
```

### Story APIs

**Generate Story**  
**File**: [`src/app/api/stories/generate/route.ts`](../src/app/api/stories/generate/route.ts)  
**Endpoint**: `POST /api/stories/generate`

**Request**:
```json
{
  "storyType": "player-highlight",
  "context": {
    "playerId": "uuid",
    "playerName": "John Doe"
  }
}
```

**Response**:
```json
{
  "story": {
    "id": "uuid",
    "story_type": "player-highlight",
    "title": "John Doe: Top 10 Highlights",
    "photo_count": 10,
    ...
  }
}
```

**Retrieve Story**  
**File**: [`src/app/api/stories/[id]/route.ts`](../src/app/api/stories/[id]/route.ts)  
**Endpoint**: `GET /api/stories/{id}`

**Response**: Complete `NarrativeArc` object with photos and metadata

---

## 🎨 MOTION & INTERACTIONS

### MagneticFilterOrb
**File**: [`src/components/interactions/MagneticFilterOrb.tsx`](../src/components/interactions/MagneticFilterOrb.tsx)  
**Purpose**: Physics-based magnetic filter button  
**Lines**: 77

**Features**:
- Magnetic attraction on hover
- Spring-based animations
- Active state styling
- Keyboard accessible (Enter/Space)

**Usage**:
```tsx
<MagneticFilterOrb
  icon="⭐"
  label="Portfolio Quality"
  active={isActive}
  onClick={toggleFilter}
  magneticRadius={100}
/>
```

### MagneticFilterBar
**File**: [`src/components/filters/MagneticFilterBar.tsx`](../src/components/filters/MagneticFilterBar.tsx)  
**Purpose**: Collection of magnetic filter orbs  
**Lines**: 62

**Filters**:
- Portfolio Quality
- Print Ready
- Social Media
- Peak Moments
- Golden Hour

**Usage**:
```tsx
<MagneticFilterBar
  filters={filterState}
  onChange={setFilters}
  photoCount={filteredPhotos.length}
/>
```

### ContextualCursor
**File**: [`src/components/interactions/ContextualCursor.tsx`](../src/components/interactions/ContextualCursor.tsx)  
**Purpose**: Custom cursor showing photo metadata on hover  
**Lines**: 96

**Features**:
- Follows mouse with GSAP
- Color changes based on emotion
- Shows quality score
- Portfolio/print badges
- Play type label

**Usage**:
```tsx
<ContextualCursor hoveredPhoto={currentHoveredPhoto} />
```

### EmotionTimeline
**File**: [`src/components/interactions/EmotionTimeline.tsx`](../src/components/interactions/EmotionTimeline.tsx)  
**Purpose**: Draggable timeline scrubber for emotions  
**Lines**: 133

**Features**:
- GSAP Draggable scrubber
- Emotion clustering
- Snap to emotion boundaries
- Photo count per emotion

**Usage**:
```tsx
<EmotionTimeline
  photos={gamePhotos}
  onPhotoSetChange={setFilteredPhotos}
/>
```

### PlayTypeMorphGrid
**File**: [`src/components/gallery/PlayTypeMorphGrid.tsx`](../src/components/gallery/PlayTypeMorphGrid.tsx)  
**Purpose**: Grid with smooth layout animations when filtering  
**Lines**: 105

**Features**:
- Framer Motion LayoutGroup
- Smooth entry/exit animations
- Play type badges
- Quality indicators

**Usage**:
```tsx
<PlayTypeMorphGrid
  photos={photos}
  activePlayType={selectedPlayType}
  onPhotoClick={handlePhotoClick}
/>
```

### MomentumScroll
**File**: [`src/components/interactions/MomentumScroll.tsx`](../src/components/interactions/MomentumScroll.tsx)  
**Purpose**: Scrolling that snaps to high-quality photos  
**Lines**: 125

**Features**:
- Spring-based smooth scrolling
- Auto-snap to 8+ quality photos
- Portfolio photo indicators
- Scroll progress tracking

**Usage**:
```tsx
<MomentumScroll photos={photos}>
  {(photo) => <PhotoCard photo={photo} />}
</MomentumScroll>
```

### SwipeableCarousel
**File**: [`src/components/mobile/SwipeableCarousel.tsx`](../src/components/mobile/SwipeableCarousel.tsx)  
**Purpose**: Mobile-optimized swipeable photo carousel  
**Lines**: 157

**Features**:
- Touch gesture detection
- Swipe threshold
- Pagination dots
- Navigation arrows
- Metadata overlay

**Usage**:
```tsx
<SwipeableCarousel
  photos={photos}
  onPhotoChange={(photo, index) => console.log(photo)}
/>
```

---

## 🎭 PORTFOLIO SHOWCASE

### QualityGradientGrid
**File**: [`src/components/portfolio/QualityGradientGrid.tsx`](../src/components/portfolio/QualityGradientGrid.tsx)  
**Purpose**: Visual quality indicators with dynamic brightness/blur  
**Lines**: 126

**Features**:
- GSAP brightness animation (50-100% based on quality)
- Blur based on sharpness (0-5px)
- Circular quality score on hover
- Quality breakdown (4 metrics)

**Usage**:
```tsx
<QualityGradientGrid
  photos={portfolioPhotos}
  onPhotoClick={handleClick}
/>
```

### PhotoGravity
**File**: [`src/components/portfolio/PhotoGravity.tsx`](../src/components/portfolio/PhotoGravity.tsx)  
**Purpose**: 3D photo clustering with Three.js  
**Lines**: 185

**Features**:
- Clusters by play type (7 groups)
- Similarity-based positioning on hover
- Orbit controls (drag to rotate)
- Smooth lerp animations
- Performance limited to 100 photos

**Usage**:
```tsx
<PhotoGravity
  photos={photos}
  onPhotoClick={handlePhotoClick}
/>
```

### Portfolio Route
**File**: [`src/app/portfolio/page.tsx`](../src/app/portfolio/page.tsx)  
**Purpose**: Main portfolio page with view mode switcher  
**Lines**: 135

**View Modes**:
1. **Quality**: QualityGradientGrid with visual quality
2. **Grid**: PlayTypeMorphGrid with filtering
3. **Timeline**: EmotionTimeline scrubber

**Features**:
- View mode switcher
- Magnetic filter bar
- Contextual cursor
- Loading/empty states

---

## 🏆 DISCOVERY & DELIGHT

### DiscoveryBadges
**File**: [`src/components/delight/DiscoveryBadges.tsx`](../src/components/delight/DiscoveryBadges.tsx)  
**Purpose**: Gamification with unlockable achievements  
**Lines**: 194

**6 Badges**:
- 🎭 Emotion Explorer (all emotions)
- 🏐 Volleyball Connoisseur (all play types)
- ⭐ Quality Hunter (10 portfolio photos)
- ⚡ Peak Seeker (5 peak moments)
- 🌅 Golden Hour Enthusiast (5 golden hour)
- 🖼️ Print Collector (10 print-ready)

**Components**:
- `DiscoveryTracker` - Tracks progress and unlocks
- `BadgeCollection` - Displays earned badges

**Usage**:
```tsx
// In gallery
<DiscoveryTracker viewedPhoto={currentPhoto} />

// In profile
<BadgeCollection badges={unlockedBadges} />
```

---

## 🛠️ COMMON COMPONENTS

### LazyImage
**File**: [`src/components/common/LazyImage.tsx`](../src/components/common/LazyImage.tsx)  
**Purpose**: Performance-optimized image loading  
**Lines**: 72

**Features**:
- Intersection Observer
- Skeleton placeholder
- Quality-based brightness
- Priority loading option

**Usage**:
```tsx
<LazyImage
  src={photo.image_url}
  alt={photo.title}
  quality={avgQuality}
  priority={isAboveFold}
  className="w-full h-full object-cover"
/>
```

### LoadingState
**File**: [`src/components/common/LoadingState.tsx`](../src/components/common/LoadingState.tsx)  
**Purpose**: Reusable loading indicators  
**Lines**: 69

**Components**:
- `LoadingState` - Spinning loader with message
- `SkeletonGrid` - Grid of skeleton cards
- `LoadingBar` - Progress bar

**Usage**:
```tsx
<LoadingState message="Generating story..." size="lg" />
<SkeletonGrid count={12} />
<LoadingBar progress={percentage} />
```

### ErrorState
**File**: [`src/components/common/ErrorState.tsx`](../src/components/common/ErrorState.tsx)  
**Purpose**: Error handling with retry logic  
**Lines**: 99

**Components**:
- `ErrorState` - Full error page with retry
- `InlineError` - Dismissible error banner
- `EmptyState` - No results state

**Usage**:
```tsx
<ErrorState 
  message="Failed to load photos"
  onRetry={refetch}
  error={errorObject}
/>

<InlineError 
  message="Story generation failed"
  onDismiss={clearError}
/>

<EmptyState
  icon="📸"
  title="No photos found"
  description="Try adjusting filters"
  action={{ label: "Clear Filters", onClick: clearFilters }}
/>
```

### Accessibility
**File**: [`src/components/common/Accessibility.tsx`](../src/components/common/Accessibility.tsx)  
**Purpose**: Accessibility utilities and hooks  
**Lines**: 128

**Exports**:
- `ScreenReaderAnnouncement` - Announce dynamic changes
- `useFocusTrap` - Trap focus in modals
- `SkipToMain` - Skip navigation link
- `useReducedMotion` - Detect motion preferences
- `useKeyboardShortcuts` - Keyboard shortcut handler
- `AriaLiveRegion` - Live region for announcements

**Usage**:
```tsx
// Focus trap
useFocusTrap(isModalOpen);

// Reduced motion
const prefersReducedMotion = useReducedMotion();

// Keyboard shortcuts
useKeyboardShortcuts({
  'escape': closeModal,
  'ctrl+s': saveChanges,
});

// Screen reader
<ScreenReaderAnnouncement message={`${count} photos loaded`} />
```

### VirtualizedPhotoGrid
**File**: [`src/components/gallery/VirtualizedPhotoGrid.tsx`](../src/components/gallery/VirtualizedPhotoGrid.tsx)  
**Purpose**: Virtual scrolling for 10K+ photos  
**Lines**: 59  
**Requires**: `@tanstack/react-virtual`

**Usage**:
```tsx
<VirtualizedPhotoGrid
  photos={largePhotoArray}
  columns={4}
  renderPhoto={(photo) => <PhotoCard photo={photo} />}
/>
```

---

## 👤 DASHBOARDS

### Athlete Dashboard
**File**: [`src/app/athlete/[id]/page.tsx`](../src/app/athlete/[id]/page.tsx)  
**Purpose**: Complete athlete portfolio dashboard  
**Lines**: 138

**Sections**:
1. **Your Stories** - StoryGallery with generation button
2. **Your Best Shots** - Portfolio-worthy photos
3. **Peak Moments** - Game-deciding plays
4. **Social Media Pack** - Optimized for sharing
5. **Print Recommendations** - Print-ready photos
6. **Play Analysis** - PlayBreakdown visualization

**Route**: `/athlete/[id]`

### Coach Season Highlights
**File**: [`src/components/coach/SeasonHighlights.tsx`](../src/components/coach/SeasonHighlights.tsx)  
**Purpose**: Season narrative for coaches  
**Lines**: 103

**Sections**:
1. **Peak Moments** - Maximum intensity plays
2. **Technical Excellence** - Highest quality shots
3. **Victory Celebrations** - Triumph moments
4. **Emotional Journey** - Season timeline
5. **Portfolio Collection** - Best photos overall

**Usage**:
```tsx
<SeasonHighlights teamId={teamId} />
```

---

## 📚 CORE LIBRARIES

### Motion Tokens
**File**: [`src/lib/motion-tokens.ts`](../src/lib/motion-tokens.ts)  
**Purpose**: Unified design system for animations  
**Lines**: 71

**Exports**:
```typescript
export const MOTION = {
  spring: { gentle, responsive, snappy },
  duration: { instant, fast, base, slow, slower },
  ease: { easeOut, easeInOut, anticipate }
};

export const EMOTION_PALETTE = {
  triumph, focus, intensity, determination, excitement, serenity
};

export const EMOTION_ICONS = { /* emoji map */ };
export const PLAY_TYPE_ICONS = { /* emoji map */ };
```

**Usage**:
```tsx
import { MOTION, EMOTION_PALETTE, EMOTION_ICONS } from '@/lib/motion-tokens';

<motion.div
  whileHover={{ scale: 1.2 }}
  transition={MOTION.spring.snappy}
  style={{ background: EMOTION_PALETTE.triumph.gradient }}
>
  {EMOTION_ICONS.triumph} Triumph!
</motion.div>
```

### Sound Effects
**File**: [`src/lib/sound-effects.ts`](../src/lib/sound-effects.ts)  
**Purpose**: Audio feedback system  
**Lines**: 56

**Sounds**:
- `quality-high` - High-quality photo hover
- `portfolio` - Portfolio-worthy photo
- `badge-unlock` - Achievement unlocked
- `filter-click` - Filter interaction
- `photo-hover` - General hover

**Usage**:
```tsx
import { soundManager } from '@/lib/sound-effects';

// Play sound
soundManager?.play('portfolio');

// Configure
soundManager?.setEnabled(false);
soundManager?.setVolume(0.3);
```

### Recommendations
**File**: [`src/lib/recommendations.ts`](../src/lib/recommendations.ts)  
**Purpose**: Photo similarity and recommendations  
**Lines**: 188

**Functions**:
```typescript
findSimilarPhotos(targetPhoto, allPhotos, limit) // Similar to target
getRecommendations(viewHistory, allPhotos, limit) // Based on preferences
getTrendingPhotos(allPhotos, limit) // Trending photos
getPhotosByEmotion(allPhotos, emotion, limit) // Filter by emotion
getPhotosByPlayType(allPhotos, playType, limit) // Filter by play type
```

### Search
**File**: [`src/lib/search.ts`](../src/lib/search.ts)  
**Purpose**: Natural language photo search  
**Lines**: 227

**Features**:
- Metadata-based pattern matching
- Natural language queries
- Search suggestions
- Search analytics

**Patterns Supported**:
- Quality: "high quality", "portfolio", "best"
- Actions: "spike", "block", "dig", "serve"
- Emotions: "celebration", "focus", "intensity"
- Composition: "golden hour", "motion blur"

**Usage**:
```typescript
import { enhancedPhotoSearch, getSearchSuggestions } from '@/lib/search';

const results = enhancedPhotoSearch("best celebration photos", photos);
const suggestions = getSearchSuggestions("cel", photos);
```

### PDF Export
**File**: [`src/lib/story-curation/pdf-export.ts`](../src/lib/story-curation/pdf-export.ts)  
**Purpose**: Export stories as PDFs  
**Lines**: 127  
**Requires**: `jspdf`

**Functions**:
```typescript
exportStoryAsPDF(story) // Returns Blob
downloadStoryPDF(story) // Triggers download
```

**Usage**:
```tsx
import { downloadStoryPDF } from '@/lib/story-curation/pdf-export';

<button onClick={() => downloadStoryPDF(story)}>
  Download PDF
</button>
```

---

## 🔗 INTEGRATION EXAMPLES

### Complete Story Flow

```tsx
'use client';

import { useState } from 'react';
import { StoryGallery } from '@/components/story/StoryGallery';
import { StoryGenerationModal } from '@/components/story/StoryGenerationModal';

export function AthletePage({ athleteId, athleteName }) {
  const [stories, setStories] = useState([]);
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <StoryGallery
        stories={stories}
        onGenerateNew={() => setShowModal(true)}
      />

      <StoryGenerationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        context={{
          type: 'athlete',
          id: athleteId,
          name: athleteName
        }}
      />
    </div>
  );
}
```

### Complete Portfolio Experience

```tsx
'use client';

import { useState } from 'react';
import { QualityGradientGrid } from '@/components/portfolio/QualityGradientGrid';
import { PlayTypeMorphGrid } from '@/components/gallery/PlayTypeMorphGrid';
import { EmotionTimeline } from '@/components/interactions/EmotionTimeline';
import { MagneticFilterBar } from '@/components/filters/MagneticFilterBar';
import { ContextualCursor } from '@/components/interactions/ContextualCursor';
import { usePhotoFilters } from '@/hooks/usePhotoFilters';

export function PortfolioPage() {
  const [viewMode, setViewMode] = useState('quality');
  const [filters, setFilters] = useState({});
  const [hoveredPhoto, setHoveredPhoto] = useState(null);
  const [photos, setPhotos] = useState([]);

  const filteredPhotos = usePhotoFilters(photos, filters);

  return (
    <div>
      <ContextualCursor hoveredPhoto={hoveredPhoto} />
      
      <MagneticFilterBar
        filters={filters}
        onChange={setFilters}
        photoCount={filteredPhotos.length}
      />

      {viewMode === 'quality' && (
        <QualityGradientGrid photos={filteredPhotos} />
      )}
      {viewMode === 'grid' && (
        <PlayTypeMorphGrid photos={filteredPhotos} activePlayType={null} />
      )}
      {viewMode === 'timeline' && (
        <EmotionTimeline photos={filteredPhotos} onPhotoSetChange={setPhotos} />
      )}
    </div>
  );
}
```

### Complete Discovery Integration

```tsx
'use client';

import { useState } from 'react';
import { DiscoveryTracker } from '@/components/delight/DiscoveryBadges';
import { soundManager } from '@/lib/sound-effects';

export function Gallery() {
  const [currentPhoto, setCurrentPhoto] = useState(null);

  const handlePhotoHover = (photo) => {
    setCurrentPhoto(photo);
    
    // Play sound based on quality
    if (photo.metadata?.portfolio_worthy) {
      soundManager?.play('portfolio');
    } else if (avgQuality >= 8) {
      soundManager?.play('quality-high');
    }
  };

  return (
    <div>
      {/* Track discoveries */}
      <DiscoveryTracker viewedPhoto={currentPhoto} />

      {/* Your photo grid */}
      <div onMouseEnter={handlePhotoHover}>
        {/* Photos */}
      </div>
    </div>
  );
}
```

---

## 🎯 COMPONENT DEPENDENCIES

### Required npm Packages

**Installed**:
- framer-motion (animations)
- gsap (advanced motion)
- three, @react-three/fiber, @react-three/drei (3D)
- canvas-confetti (celebrations)
- @use-gesture/react (touch gestures)

**To Install**:
```bash
pnpm add @tanstack/react-virtual jspdf @types/jspdf
```

### Component Dependencies Graph

```
StoryViewer
  └─ motion-tokens (EMOTION_ICONS)
  └─ framer-motion

StoryGallery
  └─ StoryViewer
  └─ framer-motion

QualityGradientGrid
  └─ gsap
  └─ framer-motion

PhotoGravity
  └─ three
  └─ @react-three/fiber
  └─ @react-three/drei

DiscoveryBadges
  └─ canvas-confetti
  └─ motion-tokens
  └─ framer-motion

EmotionTimeline
  └─ gsap (Draggable plugin)
  └─ motion-tokens

MagneticFilterOrb
  └─ framer-motion
  └─ motion-tokens
```

---

## 📋 QUICK REFERENCE

### Import Paths

```typescript
// Story Curation
import { StoryViewer } from '@/components/story/StoryViewer';
import { StoryGallery } from '@/components/story/StoryGallery';
import { StoryGenerationModal } from '@/components/story/StoryGenerationModal';

// Motion & Interactions
import { MagneticFilterOrb } from '@/components/interactions/MagneticFilterOrb';
import { MagneticFilterBar } from '@/components/filters/MagneticFilterBar';
import { ContextualCursor } from '@/components/interactions/ContextualCursor';
import { EmotionTimeline } from '@/components/interactions/EmotionTimeline';
import { MomentumScroll } from '@/components/interactions/MomentumScroll';
import { SwipeableCarousel } from '@/components/mobile/SwipeableCarousel';

// Portfolio
import { QualityGradientGrid } from '@/components/portfolio/QualityGradientGrid';
import { PhotoGravity } from '@/components/portfolio/PhotoGravity';
import { PlayTypeMorphGrid } from '@/components/gallery/PlayTypeMorphGrid';

// Discovery
import { DiscoveryTracker, BadgeCollection } from '@/components/delight/DiscoveryBadges';

// Common
import { LazyImage } from '@/components/common/LazyImage';
import { LoadingState, SkeletonGrid, LoadingBar } from '@/components/common/LoadingState';
import { ErrorState, InlineError, EmptyState } from '@/components/common/ErrorState';
import { useFocusTrap, useReducedMotion } from '@/components/common/Accessibility';

// Libraries
import { MOTION, EMOTION_PALETTE, EMOTION_ICONS, PLAY_TYPE_ICONS } from '@/lib/motion-tokens';
import { soundManager } from '@/lib/sound-effects';
import { findSimilarPhotos, getRecommendations } from '@/lib/recommendations';
import { enhancedPhotoSearch } from '@/lib/search';
import { downloadStoryPDF } from '@/lib/story-curation/pdf-export';

// Hooks
import { usePhotoFilters } from '@/hooks/usePhotoFilters';
```

---

## 🎓 BEST PRACTICES

### Performance
- Always use `LazyImage` for photo rendering
- Use `VirtualizedPhotoGrid` for 1000+ photos
- Limit 3D gravity to 100 photos
- Enable lazy loading by default

### Accessibility
- Use `useFocusTrap` in all modals
- Respect `useReducedMotion` for animations
- Include ARIA labels on all interactive elements
- Test with keyboard navigation

### Motion
- Use `MOTION` tokens for consistent animations
- Apply `EMOTION_PALETTE` for emotion-based coloring
- Enable sound effects for premium feel
- Trigger confetti for achievements

### Error Handling
- Always wrap async operations in try/catch
- Show `LoadingState` during async operations
- Display `ErrorState` with retry on failures
- Provide `EmptyState` for no results

---

## 📞 TROUBLESHOOTING

### Common Issues

**"Cannot find module '@tanstack/react-virtual'"**
```bash
pnpm add @tanstack/react-virtual
```

**"jsPDF is not defined"**
```bash
pnpm add jspdf @types/jspdf
```

**"GSAP Draggable not working"**
```tsx
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
gsap.registerPlugin(Draggable);
```

**"Three.js performance issues"**
```tsx
// Limit photos in 3D view
<PhotoGravity photos={photos.slice(0, 100)} />
```

**"Story generation fails"**
- Check photos have required metadata (emotion, play_type, action_intensity)
- Verify database migrations ran
- Check API credentials

---

**Total Components**: 29 production-ready components  
**Total Documentation**: 7 comprehensive guides  
**Status**: Ready for dependency installation and deployment

See [`NEXT_STEPS.md`](./NEXT_STEPS.md) for deployment action plan.