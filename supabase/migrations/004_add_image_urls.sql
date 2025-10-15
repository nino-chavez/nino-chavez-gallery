-- Add image URL columns to photo_metadata table
-- Migration: 004_add_image_urls

-- Add ImageUrl and OriginalUrl columns
ALTER TABLE photo_metadata
ADD COLUMN IF NOT EXISTS "ImageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "OriginalUrl" TEXT;

-- Add ThumbnailUrl for performance (optional but recommended)
ALTER TABLE photo_metadata
ADD COLUMN IF NOT EXISTS "ThumbnailUrl" TEXT;

-- Add ArchivedUrl for backup copies (optional)
ALTER TABLE photo_metadata
ADD COLUMN IF NOT EXISTS "ArchivedUrl" TEXT;

-- Add album metadata (useful for organization)
ALTER TABLE photo_metadata
ADD COLUMN IF NOT EXISTS album_key TEXT,
ADD COLUMN IF NOT EXISTS album_name TEXT;

-- Create index on ImageUrl for faster lookups
CREATE INDEX IF NOT EXISTS idx_image_url ON photo_metadata("ImageUrl");

-- Add comment
COMMENT ON COLUMN photo_metadata."ImageUrl" IS 'Primary display URL from SmugMug (typically D size)';
COMMENT ON COLUMN photo_metadata."OriginalUrl" IS 'Original full-resolution URL from SmugMug';
COMMENT ON COLUMN photo_metadata."ThumbnailUrl" IS 'Thumbnail URL for previews (typically S or M size)';
