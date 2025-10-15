-- Create photo_metadata table for enriched photo metadata
-- Migration: 001_create_photo_metadata

CREATE TABLE photo_metadata (
  photo_id TEXT PRIMARY KEY,
  image_key TEXT NOT NULL,

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
  emotion TEXT,
  composition TEXT,
  time_of_day TEXT,

  -- Volleyball-specific
  play_type TEXT,
  action_intensity TEXT,

  -- Use cases (array)
  use_cases TEXT[],

  -- AI metadata
  ai_provider TEXT,
  ai_cost DECIMAL(8,6),
  enriched_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_play_type CHECK (
    play_type IN ('attack', 'block', 'dig', 'set', 'serve', 'pass', 'celebration', 'timeout', NULL)
  ),
  CONSTRAINT valid_intensity CHECK (
    action_intensity IN ('low', 'medium', 'high', 'peak')
  )
);

-- Create indexes for performance
CREATE INDEX idx_portfolio_worthy ON photo_metadata(portfolio_worthy);
CREATE INDEX idx_print_ready ON photo_metadata(print_ready);
CREATE INDEX idx_play_type ON photo_metadata(play_type);
CREATE INDEX idx_action_intensity ON photo_metadata(action_intensity);
CREATE INDEX idx_use_cases ON photo_metadata USING GIN(use_cases);
CREATE INDEX idx_emotion ON photo_metadata(emotion);
CREATE INDEX idx_composition ON photo_metadata(composition);
CREATE INDEX idx_time_of_day ON photo_metadata(time_of_day);

-- Add foreign key constraint (assuming photos table exists)
-- ALTER TABLE photo_metadata ADD CONSTRAINT fk_photo_image_key
-- FOREIGN KEY (image_key) REFERENCES photos(image_key) ON DELETE CASCADE;