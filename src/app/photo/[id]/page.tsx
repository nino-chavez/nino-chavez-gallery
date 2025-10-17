import { PhotoDetail } from '@/components/photo/PhotoDetail';
import { Heading, Text } from '@/components/ui';
import { EmotionAmbience, type EmotionType } from '@/components/transitions';
import { createClient } from '@/lib/supabase/server';
import type { Photo } from '@/types/photo';

interface PhotoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id } = await params;
  const photo = await getPhoto(id);

  if (!photo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heading level={1} className="mb-2">Photo Not Found</Heading>
          <Text variant="body">The photo you're looking for doesn't exist.</Text>
        </div>
      </div>
    );
  }

  return (
    <EmotionAmbience emotion={photo.metadata?.emotion as EmotionType}>
      <PhotoDetail photo={photo} />
    </EmotionAmbience>
  );
}

// Server action to fetch photo with metadata
async function getPhoto(id: string): Promise<Photo | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('photos')
    .select(`
      *,
      metadata:photo_metadata(*)
    `)
    .eq('id', id)
    .single();

  if (!data) return null;

  // Transform the data to match our Photo type
  return {
    id: data.id,
    image_key: data.image_key,
    image_url: data.image_url,
    title: data.title,
    caption: data.caption,
    keywords: data.keywords || [],
    created_at: data.created_at,
    metadata: data.metadata ? {
      sharpness: data.metadata.sharpness,
      exposure_accuracy: data.metadata.exposure_accuracy,
      composition_score: data.metadata.composition_score,
      emotional_impact: data.metadata.emotional_impact,
      portfolio_worthy: data.metadata.portfolio_worthy,
      print_ready: data.metadata.print_ready,
      social_media_optimized: data.metadata.social_media_optimized,
      emotion: data.metadata.emotion,
      composition: data.metadata.composition,
      time_of_day: data.metadata.time_of_day,
      play_type: data.metadata.play_type,
      action_intensity: data.metadata.action_intensity,
      use_cases: data.metadata.use_cases,
      ai_provider: data.metadata.ai_provider,
      ai_cost: data.metadata.ai_cost,
      enriched_at: data.metadata.enriched_at
    } : null
  };
}
