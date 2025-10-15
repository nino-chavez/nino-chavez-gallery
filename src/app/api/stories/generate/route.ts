import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  detectGameWinningRally,
  detectPlayerHighlightReel,
  detectSeasonJourney,
  detectComebackStory,
  detectTechnicalExcellence,
  detectEmotionSpectrum,
} from '@/lib/story-curation/narrative-arcs';
import type { NarrativeArc } from '@/lib/story-curation/narrative-arcs';
import type { Photo } from '@/types/photo';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { storyType, context } = body;

    // Fetch photos based on context
    let photos: Photo[];
    if (context.gameId) {
      photos = await fetchGamePhotos(supabase, context.gameId);
    } else if (context.playerId) {
      photos = await fetchPlayerPhotos(supabase, context.playerId);
    } else if (context.seasonId) {
      photos = await fetchSeasonPhotos(supabase, context.seasonId);
    } else if (context.browseId) {
      // Handle browse context - fetch all photos
      photos = await fetchBrowsePhotos(supabase);
    } else {
      return NextResponse.json(
        { error: 'Missing context (gameId, playerId, seasonId, or browseId required)' },
        { status: 400 }
      );
    }

    // Generate story based on type
    let story: NarrativeArc | null = null;

    switch (storyType) {
      case 'game-winning-rally':
        story = detectGameWinningRally(photos, context);
        break;
      case 'player-highlight':
        story = detectPlayerHighlightReel(photos, context.playerId || context.browseId, context.playerName || context.browseName);
        break;
      case 'season-journey':
        story = detectSeasonJourney(photos, context.seasonId || context.browseId, context.seasonName || context.browseName);
        break;
      case 'comeback-story':
        story = detectComebackStory(photos, context);
        break;
      case 'technical-excellence':
        story = detectTechnicalExcellence(photos, context);
        break;
      case 'emotion-spectrum':
        story = detectEmotionSpectrum(photos, context);
        break;
      default:
        return NextResponse.json(
          { error: `Invalid story type: ${storyType}` },
          { status: 400 }
        );
    }

    if (!story) {
      return NextResponse.json(
        { error: 'Not enough photos to generate this story type' },
        { status: 400 }
      );
    }

    // Save story to database
    const savedStory = await saveStory(supabase, story, context);

    return NextResponse.json({ story: savedStory });
  } catch (error) {
    console.error('Error generating story:', error);
    return NextResponse.json(
      { error: 'Failed to generate story' },
      { status: 500 }
    );
  }
}

async function fetchGamePhotos(supabase: any, gameId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photo_metadata')
    .select('*')
    .eq('game_id', gameId)
    .order('enriched_at');

  if (error) throw error;

  // Transform to Photo type
  return data.map((item: any) => ({
    id: item.photo_id,
    image_key: item.image_key,
    image_url: `/api/smugmug/images/${item.image_key}`,
    title: '',
    caption: '',
    keywords: [],
    created_at: item.enriched_at,
    metadata: {
      sharpness: item.sharpness,
      exposure_accuracy: item.exposure_accuracy,
      composition_score: item.composition_score,
      emotional_impact: item.emotional_impact,
      portfolio_worthy: item.portfolio_worthy,
      print_ready: item.print_ready,
      social_media_optimized: item.social_media_optimized,
      emotion: item.emotion,
      composition: item.composition,
      time_of_day: item.time_of_day,
      play_type: item.play_type,
      action_intensity: item.action_intensity,
      use_cases: item.use_cases,
      ai_provider: item.ai_provider,
      ai_cost: item.ai_cost,
      enriched_at: item.enriched_at,
    },
  }));
}

async function fetchPlayerPhotos(supabase: any, playerId: string): Promise<Photo[]> {
  // In a real implementation, would filter by player_id in photos table
  // For now, fetch all and filter client-side
  const { data, error } = await supabase
    .from('photo_metadata')
    .select('*')
    .order('enriched_at');

  if (error) throw error;

  return data.map((item: any) => ({
    id: item.photo_id,
    image_key: item.image_key,
    image_url: `/api/smugmug/images/${item.image_key}`,
    title: '',
    caption: '',
    keywords: [],
    created_at: item.enriched_at,
    metadata: {
      sharpness: item.sharpness,
      exposure_accuracy: item.exposure_accuracy,
      composition_score: item.composition_score,
      emotional_impact: item.emotional_impact,
      portfolio_worthy: item.portfolio_worthy,
      print_ready: item.print_ready,
      social_media_optimized: item.social_media_optimized,
      emotion: item.emotion,
      composition: item.composition,
      time_of_day: item.time_of_day,
      play_type: item.play_type,
      action_intensity: item.action_intensity,
      use_cases: item.use_cases,
      ai_provider: item.ai_provider,
      ai_cost: item.ai_cost,
      enriched_at: item.enriched_at,
    },
  }));
}

async function fetchSeasonPhotos(supabase: any, seasonId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photo_metadata')
    .select('*')
    .eq('season_id', seasonId)
    .order('enriched_at');

  if (error) throw error;

  return data.map((item: any) => ({
    id: item.photo_id,
    image_key: item.image_key,
    image_url: `/api/smugmug/images/${item.image_key}`,
    title: '',
    caption: '',
    keywords: [],
    created_at: item.enriched_at,
    metadata: {
      sharpness: item.sharpness,
      exposure_accuracy: item.exposure_accuracy,
      composition_score: item.composition_score,
      emotional_impact: item.emotional_impact,
      portfolio_worthy: item.portfolio_worthy,
      print_ready: item.print_ready,
      social_media_optimized: item.social_media_optimized,
      emotion: item.emotion,
      composition: item.composition,
      time_of_day: item.time_of_day,
      play_type: item.play_type,
      action_intensity: item.action_intensity,
      use_cases: item.use_cases,
      ai_provider: item.ai_provider,
      ai_cost: item.ai_cost,
      enriched_at: item.enriched_at,
    },
  }));
}

/**
 * Fetch photos for browse context
 * Returns all photos from the gallery for story generation
 */
async function fetchBrowsePhotos(supabase: any): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photo_metadata')
    .select('*')
    .order('enriched_at');

  if (error) throw error;

  return data.map((item: any) => ({
    id: item.photo_id,
    image_key: item.image_key,
    image_url: `/api/smugmug/images/${item.image_key}`,
    title: '',
    caption: '',
    keywords: [],
    created_at: item.enriched_at,
    metadata: {
      sharpness: item.sharpness,
      exposure_accuracy: item.exposure_accuracy,
      composition_score: item.composition_score,
      emotional_impact: item.emotional_impact,
      portfolio_worthy: item.portfolio_worthy,
      print_ready: item.print_ready,
      social_media_optimized: item.social_media_optimized,
      emotion: item.emotion,
      composition: item.composition,
      time_of_day: item.time_of_day,
      play_type: item.play_type,
      action_intensity: item.action_intensity,
      use_cases: item.use_cases,
      ai_provider: item.ai_provider,
      ai_cost: item.ai_cost,
      enriched_at: item.enriched_at,
    },
  }));
}

async function saveStory(supabase: any, story: NarrativeArc, context: any) {
  // Insert story
  const { data: savedStory, error: storyError } = await supabase
    .from('stories')
    .insert({
      story_type: story.type,
      title: story.title,
      description: story.description,
      game_id: context.gameId || null,
      season_id: context.seasonId || null,
      player_id: context.playerId || null,
      team_id: context.teamId || null,
      photo_count: story.photos.length,
      emotional_curve: story.emotionalCurve,
    })
    .select()
    .single();

  if (storyError) throw storyError;

  // Insert story_photos
  const storyPhotos = story.photos.map((photo, index) => ({
    story_id: savedStory.id,
    photo_id: photo.id,
    sequence_order: index,
  }));

  const { error: photosError } = await supabase
    .from('story_photos')
    .insert(storyPhotos);

  if (photosError) throw photosError;

  return savedStory;
}
