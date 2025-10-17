# SmugMug Metadata Upgrade

## Overview

Comprehensive upgrade to store and utilize SmugMug metadata for proper photo sorting, enhanced frontend features, and future capabilities.

## Problem Solved

**Original Issue:** Photos were sorted by `enriched_at` (when AI analyzed them) instead of actual photo dates, causing old photos from 2022 to appear as "most recent" because they were analyzed recently.

**Solution:** Added comprehensive SmugMug metadata fields to Supabase and created backfill script to populate them from SmugMug API.

## Changes Made

### 1. Database Migration (`005_add_smugmug_metadata.sql`)

Added comprehensive metadata columns to `photo_metadata` table:

**Date Fields:**
- `photo_date` - Actual photo capture date from EXIF (PRIORITIZED for sorting)
- `upload_date` - When uploaded to SmugMug
- `date_added` - When added to album (fallback)

**Image Metadata:**
- `width`, `height` - Dimensions for responsive layout
- `file_name` - Original filename
- `aspect_ratio` - Width/height ratio (calculated)

**Album Context:**
- `album_key` - Album identifier
- `album_name` - Album display name

**Geolocation (Future - Map Features):**
- `latitude`, `longitude` - GPS coordinates
- `location_name` - Location description

**EXIF Camera Data (Future - Photography Enthusiasts):**
- `camera_make`, `camera_model` - Camera info
- `lens_model` - Lens used
- `focal_length`, `aperture`, `shutter_speed`, `iso` - Technical settings

### 2. Backfill Script (`backfill-smugmug-metadata.ts`)

**Purpose:** Fetch metadata from SmugMug API and update Supabase WITHOUT calling LLMs.

**Features:**
- Fetches comprehensive metadata from SmugMug API
- Updates Supabase with dates, dimensions, album info, EXIF data
- Smart skipping of already-complete records
- Batch processing with rate limiting
- Dry-run mode for testing
- Progress tracking and error handling

**Usage:**
```bash
# Backfill all photos
pnpm run backfill:smugmug

# Test with limit
pnpm run backfill:smugmug --limit=100

# Dry run (no writes)
pnpm run backfill:smugmug --dry-run
```

### 3. Frontend Updates

**client.ts (`/sites/nino-chavez-gallery-v2/src/lib/supabase/client.ts`):**
- Changed sorting from `enriched_at` to `photo_date`
- Updated `created_at` mapping to use `photo_date` with fallback to `enriched_at`

**route.ts (`/sites/nino-chavez-gallery-v2/src/app/api/photos/route.ts`):**
- Updated date sorting to use `created_at` field (which now maps to `photo_date`)

**types/photo.ts:**
- Added `smugmug` optional field with all new metadata
- Maintains backward compatibility with existing code

### 4. NPM Scripts

Added to `package.json`:
```json
"backfill:smugmug": "tsx scripts/backfill-smugmug-metadata.ts"
```

## Next Steps

### Immediate (Required)

1. **Run the backfill script:**
   ```bash
   cd /Users/nino/Workspace/02-local-dev/sites/nino-chavez-gallery
   pnpm run backfill:smugmug
   ```

2. **Verify results:**
   - Check that photos now sort by actual date
   - Old photos (2022) should appear in their correct chronological position
   - Recent photos should appear at the top

### Future Enhancements

**Enabled by New Metadata:**

1. **Responsive Layout** (aspect_ratio)
   - Masonry grid with proper aspect ratios
   - No content layout shift
   - Optimized image loading

2. **Album Grouping** (album_key, album_name)
   - Browse by album
   - Album breadcrumbs in photo detail
   - Album-based filtering

3. **Map Features** (latitude, longitude)
   - Photo map view
   - Location-based discovery
   - Geographic clustering

4. **Photography Details** (EXIF data)
   - Camera settings overlay
   - Filter by camera/lens
   - Technical analysis for enthusiasts

5. **Timeline Features** (multiple date fields)
   - Upload date vs capture date comparison
   - Time-based navigation
   - Date range filtering

## Frontend Feature Ideas

### Now Possible

1. **Smart Layout Engine**
   ```typescript
   // Use aspect_ratio for masonry grid
   const columnHeight = photos.reduce((acc, photo) =>
     acc + (baseHeight / (photo.smugmug?.aspect_ratio || 1.5)), 0
   );
   ```

2. **Album Navigation**
   ```typescript
   // Group photos by album
   const albumGroups = photos.reduce((acc, photo) => {
     const key = photo.smugmug?.album_key || 'unknown';
     (acc[key] = acc[key] || []).push(photo);
     return acc;
   }, {});
   ```

3. **Geolocation Map**
   ```typescript
   // Filter photos with GPS data
   const geoPhotos = photos.filter(p =>
     p.smugmug?.latitude && p.smugmug?.longitude
   );
   ```

4. **Camera Info Badge**
   ```tsx
   {photo.smugmug?.camera_model && (
     <div className="camera-badge">
       <CameraIcon />
       {photo.smugmug.camera_model}
       {photo.smugmug.focal_length && ` • ${photo.smugmug.focal_length}`}
       {photo.smugmug.aperture && ` • ƒ/${photo.smugmug.aperture}`}
     </div>
   )}
   ```

## Data Migration Notes

**Backfill Process:**
- Migration 005 added columns with `IF NOT EXISTS` (safe to re-run)
- Backfilled `photo_date` from `enriched_at` as temporary measure
- Backfill script replaces temporary dates with actual SmugMug dates
- Album fields may already exist from previous migrations (safely skipped)

**Backward Compatibility:**
- All new fields are optional
- Frontend code works with or without SmugMug metadata
- Graceful degradation for missing data

## Troubleshooting

**Issue:** Photos still showing wrong order
**Fix:** Run backfill script to populate actual dates

**Issue:** Backfill script fails with auth error
**Fix:** Check `.env.local` has all SmugMug credentials:
- `SMUGMUG_API_KEY`
- `SMUGMUG_API_SECRET`
- `SMUGMUG_ACCESS_TOKEN`
- `SMUGMUG_ACCESS_TOKEN_SECRET`

**Issue:** Rate limit errors
**Fix:** Script includes rate limiting (1 second between batches), but you can reduce batch size or add delays

## Cost & Performance

**SmugMug API Calls:**
- ~1 API call per photo for metadata
- Rate limited to 10 photos per batch
- 1 second delay between batches
- For 3,500 photos: ~6 minutes runtime

**Database Updates:**
- Batch upserts (10 at a time)
- Smart skipping of complete records
- Minimal impact on production database

**NO LLM Costs:**
- This script only fetches SmugMug metadata
- Zero AI/LLM API calls
- Zero additional enrichment costs

## Files Modified

1. `/sites/nino-chavez-gallery/supabase/migrations/005_add_smugmug_metadata.sql`
2. `/sites/nino-chavez-gallery/scripts/backfill-smugmug-metadata.ts` (NEW)
3. `/sites/nino-chavez-gallery/package.json`
4. `/sites/nino-chavez-gallery-v2/src/lib/supabase/client.ts`
5. `/sites/nino-chavez-gallery-v2/src/app/api/photos/route.ts`
6. `/sites/nino-chavez-gallery-v2/src/types/photo.ts`

---

**Migration Applied:** ✅ Migration 005 successfully applied to Supabase
**Backfill Script:** ✅ Ready to run
**Frontend:** ✅ Updated to use photo_date for sorting
**Next Action:** Run `pnpm run backfill:smugmug` to populate metadata
