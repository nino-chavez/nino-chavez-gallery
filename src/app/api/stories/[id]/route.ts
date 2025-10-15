import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Photo } from '@/types/photo';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  try {
    const { id } = await params;

    // Fetch story details
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();

    if (storyError) throw storyError;

    // Fetch story photos with metadata
    const { data: storyPhotos, error: photosError } = await supabase
      .from('story_photos')
      .select(`
        sequence_order,
        caption,
        transition_type,
        duration_seconds,
        photo_id
      `)
      .eq('story_id', id)
      .order('sequence_order');

    if (photosError) throw photosError;

    // Fetch photo metadata for each photo
    const photoIds = storyPhotos.map(sp => sp.photo_id);
    const { data: photoMetadata, error: metadataError } = await supabase
      .from('photo_metadata')
      .select('*')
      .in('photo_id', photoIds);

    if (metadataError) throw metadataError;

    // Build photo objects
    const photos: Photo[] = storyPhotos.map((sp) => {
      const metadata = photoMetadata.find(pm => pm.photo_id === sp.photo_id);
      return {
        id: sp.photo_id,
        image_key: metadata?.image_key || '',
        image_url: `/api/smugmug/images/${metadata?.image_key}`,
        title: '',
        caption: sp.caption || '',
        keywords: [],
        created_at: metadata?.enriched_at || new Date().toISOString(),
        metadata: metadata ? {
          sharpness: metadata.sharpness,
          exposure_accuracy: metadata.exposure_accuracy,
          composition_score: metadata.composition_score,
          emotional_impact: metadata.emotional_impact,
          portfolio_worthy: metadata.portfolio_worthy,
          print_ready: metadata.print_ready,
          social_media_optimized: metadata.social_media_optimized,
          emotion: metadata.emotion,
          composition: metadata.composition,
          time_of_day: metadata.time_of_day,
          play_type: metadata.play_type,
          action_intensity: metadata.action_intensity,
          use_cases: metadata.use_cases,
          ai_provider: metadata.ai_provider,
          ai_cost: metadata.ai_cost,
          enriched_at: metadata.enriched_at,
        } : null,
      };
    });

    // Calculate metadata for the story
    const avgQuality = photos.reduce((sum, p) => {
      if (!p.metadata) return sum;
      return sum + (
        (p.metadata.sharpness || 0) +
        (p.metadata.exposure_accuracy || 0) +
        (p.metadata.composition_score || 0) +
        (p.metadata.emotional_impact || 0)
      ) / 4;
    }, 0) / photos.length;

    const peakMoments = photos.filter(p => 
      p.metadata?.action_intensity === 'peak'
    ).length;

    // Build complete story object
    const completeStory = {
      type: story.story_type,
      photos,
      title: story.title,
      description: story.description,
      emotionalCurve: story.emotional_curve,
      metadata: {
        avgQuality: Math.round(avgQuality * 10) / 10,
        peakMoments,
        duration: `${Math.round((photos.length * 3) / 60)} min video`,
      },
    };

    return NextResponse.json({ story: completeStory });
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json(
      { error: 'Failed to fetch story' },
      { status: 500 }
    );
  }
}