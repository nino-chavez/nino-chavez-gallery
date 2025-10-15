/**
 * Sync enriched metadata from SQLite to Supabase
 *
 * Usage:
 *   pnpm run sync:metadata --db=enrichment-gemini-production.db
 */

// Load environment variables first
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';

interface EnrichedPhoto {
  image_key: string;
  album_key: string;
  album_name: string;
  image_url: string;
  metadata_json: string;
  cost: number;
  processed_at: string;
}

async function syncMetadata(sqliteDbPath: string) {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Open SQLite database
  const db = new Database(sqliteDbPath);

  try {
    // Get all processed photos
    const photos = db.prepare(`
      SELECT image_key, album_key, album_name, image_url, metadata_json, cost, processed_at
      FROM photos
      WHERE status = 'processed'
    `).all() as EnrichedPhoto[];

    console.log(`🔄 Syncing ${photos.length} photos from ${sqliteDbPath}...`);

    let synced = 0;
    let errors = 0;

    for (const photo of photos) {
      try {
        const metadata = JSON.parse(photo.metadata_json);

        const { error } = await supabase
          .from('photo_metadata')
          .upsert({
            photo_id: photo.image_key,
            image_key: photo.image_key,
            album_key: photo.album_key,

            // Quality scores
            sharpness: metadata.quality?.sharpness,
            exposure_accuracy: metadata.quality?.exposureAccuracy,
            composition_score: metadata.quality?.compositionScore,
            emotional_impact: metadata.quality?.emotionalImpact,

            // Portfolio flags
            portfolio_worthy: metadata.portfolioWorthy || false,
            print_ready: metadata.printReady || false,
            social_media_optimized: metadata.socialMediaOptimized || false,

            // Composition & Emotion
            emotion: metadata.emotion,
            composition: metadata.composition,
            time_of_day: metadata.timeOfDay,

            // Volleyball-specific
            play_type: metadata.playType,
            action_intensity: metadata.actionIntensity,

            // Use cases
            use_cases: metadata.useCases || [],

            // AI metadata
            ai_provider: metadata.provider,
            ai_cost: photo.cost,
            enriched_at: photo.processed_at,
          });

        if (error) throw error;

        synced++;
        if (synced % 100 === 0) {
          console.log(`  ✅ Synced ${synced}/${photos.length}...`);
        }
      } catch (error) {
        console.error(`❌ Error syncing ${photo.image_key}:`, error);
        errors++;
      }
    }

    console.log(`\n🎉 Sync complete: ${synced} synced, ${errors} errors`);
  } catch (error) {
    console.error('💥 Fatal error during sync:', error);
  } finally {
    db.close();
  }
}

// CLI usage
const dbPath = process.argv.find(arg => arg.startsWith('--db='))?.split('=')[1];
if (!dbPath) {
  console.error('❌ Usage: pnpm run sync:metadata --db=enrichment-gemini-production.db');
  console.error('❌ Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

syncMetadata(dbPath);