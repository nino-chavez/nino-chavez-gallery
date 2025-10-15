-- Create stories and story_photos tables for AI Story-Curation Engine
-- Migration: 002_create_stories_tables

-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_type TEXT NOT NULL, -- game-winning-rally, player-highlight, etc.
  title TEXT NOT NULL,
  description TEXT,

  -- Context
  game_id UUID, -- REFERENCES games(id) when games table exists
  season_id UUID, -- REFERENCES seasons(id) when seasons table exists
  player_id UUID, -- REFERENCES players(id) when players table exists
  team_id UUID, -- REFERENCES teams(id) when teams table exists

  -- Metadata
  photo_count INT NOT NULL,
  duration_seconds INT, -- For video exports
  emotional_curve JSONB, -- Array of {timestamp, emotion, intensity}

  -- Status
  status TEXT DEFAULT 'generated', -- generated, published, archived
  visibility TEXT DEFAULT 'private', -- private, team, public

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Story photos (junction table)
CREATE TABLE story_photos (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  photo_id TEXT REFERENCES photo_metadata(photo_id) ON DELETE CASCADE,
  sequence_order INT NOT NULL, -- Order in the story
  caption TEXT, -- Optional per-photo caption
  transition_type TEXT, -- fade, slide, zoom (for video export)
  duration_seconds DECIMAL(4,2) DEFAULT 3.0,

  PRIMARY KEY (story_id, photo_id),
  UNIQUE (story_id, sequence_order)
);

-- Create indexes for performance
CREATE INDEX idx_stories_type ON stories(story_type);
CREATE INDEX idx_stories_game ON stories(game_id);
CREATE INDEX idx_stories_player ON stories(player_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_visibility ON stories(visibility);
CREATE INDEX idx_stories_created_at ON stories(created_at);

CREATE INDEX idx_story_photos_story_id ON story_photos(story_id);
CREATE INDEX idx_story_photos_photo_id ON story_photos(photo_id);
CREATE INDEX idx_story_photos_sequence ON story_photos(story_id, sequence_order);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();