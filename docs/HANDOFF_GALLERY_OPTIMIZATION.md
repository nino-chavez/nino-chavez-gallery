# Gallery Optimization Handoff

**Date**: October 14, 2025
**Status**: Ready for Implementation
**Priority**: High (Performance optimization + Future-proofing)

## Context

The gallery app currently generates an 18MB `gallery-context.json` file containing 294 albums and 21,152 photos, but **never uses it**. Instead, the app makes live SmugMug API calls for every request, resulting in:
- Slow search performance (API latency on every search)
- Wasted build time (7+ minutes generating unused context)
- Unnecessary API costs

## Objective

Implement a two-phase optimization:
1. **Phase 1 (Quick Win)**: Use pre-generated `gallery-context.json` for instant search
2. **Phase 2 (Future-proof)**: Prepare Supabase migration for scale beyond 50K photos

## Phase 1: Use Gallery Context File

### Files to Modify

#### 1. `src/app/api/search/route.ts`
**Current behavior**: Fetches from SmugMug API via proxy
**Target behavior**: Read from `gallery-context.json`

**Current code** (lines 19-72):
```typescript
// Fetch albums
const albums = await fetchAlbums();
const albumsToSearch = albums.slice(0, limit);

// Fetch photos from each album in parallel
const albumsWithPhotos = await Promise.all(
  albumsToSearch.map(async (album) => {
    const images = await fetchAlbumImages(album.AlbumKey);
    // ... mapping logic
  })
);
```

**Target implementation**:
```typescript
import galleryContext from '@/../../gallery-context.json';

// Use pre-built context (instant, no API calls)
const albums = galleryContext.albums.slice(0, limit);

if (!includePhotos) {
  return NextResponse.json({
    albums: albums.map(album => ({
      albumKey: album.albumKey,
      albumName: album.name,
      description: album.description || '',
      keywords: album.keywords || '',
      photoCount: album.photoCount,
    })),
    totalAlbums: galleryContext.totalAlbums,
    searchedAlbums: albums.length,
  });
}

// Flatten photos from context (already loaded)
const albumsWithPhotos = albums.map(album => ({
  albumKey: album.albumKey,
  albumName: album.name,
  albumDescription: album.description || '',
  albumKeywords: album.keywords || '',
  photos: album.photos.map(img => ({
    imageKey: img.imageKey,
    fileName: img.fileName,
    title: img.title || '',
    caption: img.caption || '',
    keywords: img.keywords || [],
    thumbnailUrl: img.thumbnailUrl,
    imageUrl: img.imageUrl,
    albumKey: album.albumKey,
    albumName: album.name,
  })),
}));

const allPhotos = albumsWithPhotos.flatMap(album => album.photos);

return NextResponse.json({
  photos: allPhotos,
  totalPhotos: allPhotos.length,
  totalAlbums: galleryContext.totalAlbums,
  searchedAlbums: albumsWithPhotos.length,
  albums: albumsWithPhotos.map(({ photos, ...album }) => album),
});
```

**Benefits**:
- ⚡ **10-100x faster** (no network latency)
- 💰 **Zero API costs** for search
- 🚀 **Works offline** for development
- ✅ **Already enriched** with AI-generated metadata

#### 2. TypeScript Configuration
May need to add JSON import support to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true,
    // ... existing config
  }
}
```

#### 3. Verify Other Usage
Check if any other API routes should also use the context:
```bash
grep -r "fetchAlbums\|fetchAlbumImages" src/app/api/
```

### Testing Phase 1

1. **Verify import works**:
   ```bash
   pnpm type-check
   ```

2. **Test search API locally**:
   ```bash
   curl "http://localhost:3000/api/search?limit=5&includePhotos=true"
   ```

3. **Performance comparison**:
   - Before: Measure response time with API calls
   - After: Measure response time with context file
   - Expected: 10-100x improvement

4. **Verify data integrity**:
   - Check photo counts match
   - Verify image URLs are valid
   - Test with/without photos parameter

### Expected Outcomes

- Search API response time: **<50ms** (from ~500-2000ms)
- Build time: **Unchanged** (context still needed)
- Bundle size: **+18MB** in server bundle (acceptable for server-side)
- SmugMug API calls: **~95% reduction** (only album detail pages)

---

## Phase 2: Supabase Migration (Future-proofing)

### When to Migrate

Trigger migration when:
- Photo count exceeds **50,000**
- Need **real-time metadata updates** without redeploying
- Want **advanced search** (fuzzy, semantic, faceted filters)
- Multiple users need to **edit metadata simultaneously**

### Implementation Plan

#### Step 1: Initialize Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
cd /Users/nino/Workspace/02-local-dev/nino-chavez-gallery
npx supabase init

# Start local instance
npx supabase start
```

#### Step 2: Create Database Schema

Create `supabase/migrations/20251014000000_create_gallery_schema.sql`:

```sql
-- Albums table
CREATE TABLE albums (
  album_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  url_name TEXT,
  photo_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ,
  keywords TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
  image_key TEXT PRIMARY KEY,
  album_key TEXT NOT NULL REFERENCES albums(album_key) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  title TEXT,
  caption TEXT,
  keywords TEXT[], -- Array of keywords
  image_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_photos_album ON photos(album_key);
CREATE INDEX idx_albums_updated ON albums(last_updated DESC);

-- Full-text search on photos
CREATE INDEX idx_photos_search ON photos USING GIN(
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(caption, '') || ' ' ||
    COALESCE(array_to_string(keywords, ' '), '')
  )
);

-- Full-text search on albums
CREATE INDEX idx_albums_search ON albums USING GIN(
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(keywords, '')
  )
);

-- Optional: Embeddings for semantic search (if using pgvector)
-- CREATE EXTENSION IF NOT EXISTS vector;
-- ALTER TABLE photos ADD COLUMN embedding vector(1536);
-- CREATE INDEX idx_photos_embedding ON photos USING ivfflat (embedding vector_cosine_ops);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Step 3: Create Migration Script

Create `scripts/migrate-to-supabase.ts`:

```typescript
/**
 * Migrate gallery-context.json to Supabase
 *
 * Usage:
 *   tsx scripts/migrate-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import galleryContext from '../gallery-context.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin key for bulk insert
);

async function migrate() {
  console.log('🚀 Starting Supabase migration...\n');
  console.log(`   Albums: ${galleryContext.totalAlbums}`);
  console.log(`   Photos: ${galleryContext.totalPhotos}\n`);

  // Batch insert albums
  console.log('📂 Inserting albums...');
  const albums = galleryContext.albums.map(album => ({
    album_key: album.albumKey,
    name: album.name,
    description: album.description,
    url_name: album.urlName,
    photo_count: album.photoCount,
    last_updated: album.lastUpdated,
    keywords: album.keywords,
  }));

  const { error: albumError } = await supabase
    .from('albums')
    .upsert(albums, { onConflict: 'album_key' });

  if (albumError) {
    console.error('❌ Album insert failed:', albumError);
    process.exit(1);
  }
  console.log(`   ✅ Inserted ${albums.length} albums\n`);

  // Batch insert photos (in chunks of 1000)
  console.log('📸 Inserting photos...');
  const allPhotos = galleryContext.albums.flatMap(album =>
    album.photos.map(photo => ({
      image_key: photo.imageKey,
      album_key: album.albumKey,
      file_name: photo.fileName,
      title: photo.title,
      caption: photo.caption,
      keywords: photo.keywords,
      image_url: photo.imageUrl,
      thumbnail_url: photo.thumbnailUrl,
      width: photo.width,
      height: photo.height,
    }))
  );

  const CHUNK_SIZE = 1000;
  for (let i = 0; i < allPhotos.length; i += CHUNK_SIZE) {
    const chunk = allPhotos.slice(i, i + CHUNK_SIZE);
    const { error: photoError } = await supabase
      .from('photos')
      .upsert(chunk, { onConflict: 'image_key' });

    if (photoError) {
      console.error(`❌ Photo insert failed at chunk ${i}:`, photoError);
      process.exit(1);
    }

    console.log(`   ✓ Inserted chunk ${i / CHUNK_SIZE + 1} (${chunk.length} photos)`);
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Total photos inserted: ${allPhotos.length}`);
}

migrate().catch(console.error);
```

#### Step 4: Update API Routes

Create `src/lib/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

Update `src/app/api/search/route.ts` to use Supabase:

```typescript
import { supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
  const query = searchParams.get('q') || '';

  // Full-text search with PostgreSQL
  let photosQuery = supabase
    .from('photos')
    .select(`
      *,
      albums (
        album_key,
        name,
        description
      )
    `)
    .limit(limit * 100); // Fetch from first N albums

  if (query) {
    // Full-text search
    photosQuery = photosQuery.textSearch(
      'title,caption,keywords',
      query,
      { type: 'websearch' }
    );
  }

  const { data: photos, error } = await photosQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    photos: photos || [],
    totalPhotos: photos?.length || 0,
  });
}
```

#### Step 5: Environment Variables

Add to `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase DB Direct Connection (for migrations)
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

Add to Vercel environment variables (production).

#### Step 6: Testing

```bash
# Run migration
tsx scripts/migrate-to-supabase.ts

# Verify data
npx supabase db pull

# Test search API
curl "http://localhost:3000/api/search?q=volleyball&limit=5"

# Compare performance
npm run test:search-performance
```

### Migration Checklist

- [ ] Initialize Supabase project (`npx supabase init`)
- [ ] Create schema migration file
- [ ] Run migrations (`npx supabase db push`)
- [ ] Create migration script (`scripts/migrate-to-supabase.ts`)
- [ ] Run migration to populate database
- [ ] Install Supabase client (`pnpm add @supabase/supabase-js`)
- [ ] Create Supabase client utilities
- [ ] Update search API to use Supabase
- [ ] Update album detail pages to use Supabase
- [ ] Add environment variables to Vercel
- [ ] Test locally with Supabase local instance
- [ ] Deploy and test in production
- [ ] Monitor performance and query times
- [ ] Optional: Remove `gallery-context.json` generation from build

---

## Current State

### Completed Work
✅ Implemented pagination across all SmugMug API calls (now fetching 294 albums vs 50)
✅ Created intelligent build wrapper to avoid regenerating context on every deploy
✅ Generated complete `gallery-context.json` (18MB, 21,152 photos, 3,550 enriched)
✅ Fixed all TypeScript build errors
✅ Documented build strategy in `docs/BUILD_STRATEGY.md`

### Pending Work
⏳ **Phase 1**: Update search API to use `gallery-context.json` (this handoff)
⏳ **Phase 2**: Set up Supabase migration (this handoff)

### Key Files

- **Context file**: `/Users/nino/Workspace/02-local-dev/nino-chavez-gallery/gallery-context.json` (18MB, 294 albums, 21,152 photos)
- **Search API**: `src/app/api/search/route.ts` (currently uses SmugMug API, needs to use context)
- **Build wrapper**: `scripts/build-wrapper.js` (smart context regeneration)
- **Build docs**: `docs/BUILD_STRATEGY.md` (build strategy documentation)

### Important Notes

1. **Don't break existing functionality**: Album detail pages may still need direct SmugMug API calls (check `src/app/albums/[albumKey]/page.tsx`)

2. **Gallery context structure**: The JSON structure is slightly different from SmugMug API response:
   - Context uses `albumKey`, `imageKey` (camelCase)
   - SmugMug API uses `AlbumKey`, `ImageKey` (PascalCase)
   - Map fields carefully

3. **Build strategy**: The context file is now committed to git and only regenerated when `REBUILD_CONTEXT=true`

4. **Performance targets**:
   - Phase 1: Search API <50ms (from ~500-2000ms)
   - Phase 2: Search API <100ms with Supabase (with advanced queries)

---

## Success Criteria

### Phase 1 Success
- [ ] Search API uses `gallery-context.json` instead of SmugMug API
- [ ] Response time <50ms for search requests
- [ ] All existing search functionality works
- [ ] No increase in client bundle size (context loaded server-side only)
- [ ] TypeScript compilation succeeds
- [ ] Tests pass (if any exist)

### Phase 2 Success
- [ ] Supabase project created and configured
- [ ] All 21,152 photos migrated successfully
- [ ] Search API uses Supabase with full-text search
- [ ] Album and photo CRUD operations work
- [ ] Performance maintained or improved (<100ms queries)
- [ ] Documentation updated for database usage

---

## References

- **Build strategy**: `docs/BUILD_STRATEGY.md`
- **SmugMug API audit**: `docs/audits/smugmug-api-audit.md`
- **Gallery context**: `/gallery-context.json`
- **Supabase docs**: https://supabase.com/docs
- **Next.js App Router**: https://nextjs.org/docs/app

---

## Questions for Nino

Before starting implementation:

1. **Phase 1 priority**: Should we implement Phase 1 immediately or wait?
2. **Supabase project**: Do you have an existing Supabase org or should we create new?
3. **Cost considerations**: Are you on Supabase free tier or pro? (affects limits)
4. **Search features**: Do you need advanced search (fuzzy, filters) or just basic keyword search?
5. **Real-time updates**: How often does SmugMug content change? (determines migration urgency)

---

**Next Agent**: Start with Phase 1 for immediate performance gains. Phase 2 can wait until scale demands it or real-time updates are needed.
