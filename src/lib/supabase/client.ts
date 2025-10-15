/**
 * Supabase Client for Server-Side Database Queries
 *
 * This client connects to the remote Supabase database where enriched
 * photo metadata is stored after sync from SQLite.
 */

import { createClient } from '@supabase/supabase-js';
import type { Photo, PhotoFilterState } from '@/types/photo';

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Create Supabase client with service role key for server-side access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Fetch photos from Supabase with optional filters
 */
export async function fetchPhotos(filters?: PhotoFilterState): Promise<Photo[]> {
  let query = supabase
    .from('photo_metadata')
    .select('*')
    .order('enriched_at', { ascending: false });

  // Apply filters - columns are directly on the table
  if (filters?.portfolioWorthy) {
    query = query.eq('portfolio_worthy', true);
  }

  if (filters?.minQualityScore) {
    // Calculate average quality score from metadata
    // This would need a more complex query or filtering on the client
  }

  if (filters?.printReady) {
    query = query.eq('print_ready', true);
  }

  if (filters?.socialMediaOptimized) {
    query = query.eq('social_media_optimized', true);
  }

  if (filters?.playTypes && filters.playTypes.length > 0) {
    query = query.in('play_type', filters.playTypes);
  }

  if (filters?.emotions && filters.emotions.length > 0) {
    query = query.in('emotion', filters.emotions);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase] Error fetching photos:', error);
    throw new Error(`Failed to fetch photos: ${error.message}`);
  }

  // Map photo_metadata to Photo type
  const photos: Photo[] = (data || []).map((row: any) => ({
    id: row.photo_id,
    image_key: row.image_key,
    // Note: image_url needs to be fetched from SmugMug API
    // For now, construct a placeholder URL pattern
    image_url: `https://photos.smugmug.com/photos/${row.image_key}/0/D/${row.image_key}-D.jpg`,
    title: row.image_key, // Placeholder
    caption: '',
    keywords: [],
    created_at: row.enriched_at,
    metadata: {
      sharpness: row.sharpness,
      exposure_accuracy: row.exposure_accuracy,
      composition_score: row.composition_score,
      emotional_impact: row.emotional_impact,
      portfolio_worthy: row.portfolio_worthy,
      print_ready: row.print_ready,
      social_media_optimized: row.social_media_optimized,
      emotion: row.emotion,
      composition: row.composition,
      time_of_day: row.time_of_day,
      play_type: row.play_type,
      action_intensity: row.action_intensity,
      use_cases: row.use_cases || [],
      ai_provider: row.ai_provider,
      ai_cost: row.ai_cost,
      enriched_at: row.enriched_at,
    },
  }));

  return photos;
}

/**
 * Get count of photos matching filters
 */
export async function getPhotoCount(filters?: PhotoFilterState): Promise<number> {
  let query = supabase
    .from('photo_metadata')
    .select('photo_id', { count: 'exact', head: true });

  // Apply same filters as fetchPhotos
  if (filters?.portfolioWorthy) {
    query = query.eq('portfolio_worthy', true);
  }

  const { count, error } = await query;

  if (error) {
    console.error('[Supabase] Error counting photos:', error);
    throw new Error(`Failed to count photos: ${error.message}`);
  }

  return count || 0;
}

/**
 * Test database connection and log stats
 */
export async function testConnection(): Promise<{
  connected: boolean;
  totalPhotos: number;
  portfolioPhotos: number;
}> {
  try {
    const { count: totalPhotos } = await supabase
      .from('photo_metadata')
      .select('photo_id', { count: 'exact', head: true });

    const { count: portfolioPhotos } = await supabase
      .from('photo_metadata')
      .select('photo_id', { count: 'exact', head: true })
      .eq('portfolio_worthy', true);

    return {
      connected: true,
      totalPhotos: totalPhotos || 0,
      portfolioPhotos: portfolioPhotos || 0,
    };
  } catch (error) {
    console.error('[Supabase] Connection test failed:', error);
    return {
      connected: false,
      totalPhotos: 0,
      portfolioPhotos: 0,
    };
  }
}

export { supabase };
