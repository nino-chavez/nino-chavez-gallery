-- Performance Optimization Indexes for photo_metadata table
-- Created: 2025-10-15
-- Expected Impact: 80% reduction in query time for filtered views

-- Index for fast lookups by image key (already exists as idx_portfolio_worthy, etc.)
-- Note: image_key is already indexed via primary key photo_id relationship

-- Index for fast lookups by album key (batch queries)
ALTER TABLE photo_metadata ADD COLUMN IF NOT EXISTS album_key TEXT;
CREATE INDEX IF NOT EXISTS idx_photo_metadata_album_key
ON photo_metadata(album_key);

-- Composite index for portfolio-worthy + quality (portfolio page optimization)
CREATE INDEX IF NOT EXISTS idx_photo_metadata_portfolio_quality
ON photo_metadata(portfolio_worthy, composition_score DESC NULLS LAST)
WHERE portfolio_worthy = true;

-- Index for quality sorting (composition score DESC)
CREATE INDEX IF NOT EXISTS idx_photo_metadata_quality_sort
ON photo_metadata(composition_score DESC NULLS LAST);

-- Composite index for play type + quality (common filter combination)
-- Note: idx_play_type already exists, this adds quality sorting
CREATE INDEX IF NOT EXISTS idx_photo_metadata_play_quality
ON photo_metadata(play_type, composition_score DESC NULLS LAST);

-- Note: idx_emotion and idx_action_intensity already exist from migration 001

-- Note: idx_print_ready already exists from migration 001

-- Index for timestamp-based queries (chronological sorting)
CREATE INDEX IF NOT EXISTS idx_photo_metadata_enriched_at
ON photo_metadata(enriched_at DESC);

-- Index for sharpness sorting (high-quality filtering)
CREATE INDEX IF NOT EXISTS idx_photo_metadata_sharpness
ON photo_metadata(sharpness DESC NULLS LAST);

-- Index for emotional impact sorting
CREATE INDEX IF NOT EXISTS idx_photo_metadata_emotional_impact
ON photo_metadata(emotional_impact DESC NULLS LAST);

-- Analyze table to update query planner statistics
ANALYZE photo_metadata;

-- Add comments for documentation
COMMENT ON INDEX idx_photo_metadata_album_key IS 'Fast lookup by album for batch queries';
COMMENT ON INDEX idx_photo_metadata_portfolio_quality IS 'Optimized for portfolio page queries';
COMMENT ON INDEX idx_photo_metadata_quality_sort IS 'Quality sorting optimization';
COMMENT ON INDEX idx_photo_metadata_play_quality IS 'Combined play type filtering with quality sort';
COMMENT ON INDEX idx_photo_metadata_enriched_at IS 'Chronological sorting by enrichment date';
COMMENT ON INDEX idx_photo_metadata_sharpness IS 'Sharpness-based quality filtering';
COMMENT ON INDEX idx_photo_metadata_emotional_impact IS 'Emotional impact sorting';