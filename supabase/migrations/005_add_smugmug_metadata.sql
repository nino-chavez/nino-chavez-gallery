-- Add comprehensive SmugMug metadata for enhanced frontend features
-- Migration: 005_add_smugmug_metadata

-- Date fields for proper sorting and timeline features (skip photo_date - already added in previous migration)
ALTER TABLE photo_metadata
ADD COLUMN IF NOT EXISTS upload_date TIMESTAMP,          -- When uploaded to SmugMug
ADD COLUMN IF NOT EXISTS date_added TIMESTAMP,           -- When added to album
-- Image metadata for layout and display
ADD COLUMN IF NOT EXISTS width INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS aspect_ratio DECIMAL(5,3),      -- Calculated width/height for layout
-- Album context for grouping and breadcrumbs
ADD COLUMN IF NOT EXISTS album_key TEXT,
ADD COLUMN IF NOT EXISTS album_name TEXT,
-- Geolocation for map features (future)
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS location_name TEXT,
-- EXIF camera data (future - photography enthusiasts)
ADD COLUMN IF NOT EXISTS camera_make TEXT,
ADD COLUMN IF NOT EXISTS camera_model TEXT,
ADD COLUMN IF NOT EXISTS lens_model TEXT,
ADD COLUMN IF NOT EXISTS focal_length TEXT,
ADD COLUMN IF NOT EXISTS aperture TEXT,
ADD COLUMN IF NOT EXISTS shutter_speed TEXT,
ADD COLUMN IF NOT EXISTS iso INTEGER;

-- Create indexes for performance (skip if exists)
CREATE INDEX IF NOT EXISTS idx_photo_date ON photo_metadata(photo_date);
CREATE INDEX IF NOT EXISTS idx_upload_date ON photo_metadata(upload_date);
CREATE INDEX IF NOT EXISTS idx_album_key ON photo_metadata(album_key);
CREATE INDEX IF NOT EXISTS idx_aspect_ratio ON photo_metadata(aspect_ratio);

-- Backfill photo_date from enriched_at as temporary measure
-- (Will be replaced by actual dates from backfill script)
UPDATE photo_metadata
SET photo_date = enriched_at
WHERE photo_date IS NULL;

COMMENT ON COLUMN photo_metadata.photo_date IS 'Actual photo capture date from EXIF (preferred for sorting)';
COMMENT ON COLUMN photo_metadata.upload_date IS 'When photo was uploaded to SmugMug';
COMMENT ON COLUMN photo_metadata.date_added IS 'When photo was added to album (fallback date)';
COMMENT ON COLUMN photo_metadata.aspect_ratio IS 'Width/height ratio for responsive layout (e.g., 1.5 for 3:2 aspect)';
