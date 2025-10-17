#!/usr/bin/env tsx
/**
 * Sync ALL enriched metadata from multiple SQLite databases to Supabase
 *
 * This script:
 * 1. Finds all enrichment-*.db files
 * 2. Syncs AI metadata from each database
 * 3. Merges data intelligently (newest wins for conflicts)
 *
 * Usage:
 *   pnpm run sync:all                           # Auto-discover all .db files
 *   pnpm run sync:all --dbs="db1.db,db2.db"    # Specify databases
 *   pnpm run sync:all --pattern="enrichment-*" # Custom pattern
 */

// Load environment variables first
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import { readdirSync } from 'fs';
import chalk from 'chalk';

interface EnrichedPhoto {
  image_key: string;
  album_key: string;
  album_name: string;
  image_url: string;
  metadata_json: string;
  cost: number;
  processed_at: string;
}

interface SyncStats {
  database: string;
  photos: number;
  synced: number;
  skipped: number;
  errors: number;
}

/**
 * Find all database files matching pattern
 */
function findDatabases(pattern: string = 'enrichment-*.db'): string[] {
  try {
    const files = readdirSync('.');
    const dbFiles = files.filter(file => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        return regex.test(file);
      }
      return file === pattern;
    });
    return dbFiles;
  } catch (error) {
    console.error(chalk.red('Error finding databases:'), error);
    return [];
  }
}

/**
 * Sync metadata from a single SQLite database
 */
async function syncDatabase(
  sqliteDbPath: string,
  supabase: any
): Promise<SyncStats> {
  const stats: SyncStats = {
    database: sqliteDbPath,
    photos: 0,
    synced: 0,
    skipped: 0,
    errors: 0,
  };

  console.log(chalk.cyan(`\n📂 Processing: ${sqliteDbPath}`));

  const db = new Database(sqliteDbPath, { readonly: true });

  try {
    // Get all processed photos
    const photos = db.prepare(`
      SELECT image_key, album_key, album_name, image_url, metadata_json, cost, processed_at
      FROM photos
      WHERE status = 'processed'
    `).all() as EnrichedPhoto[];

    stats.photos = photos.length;
    console.log(chalk.gray(`   Found ${photos.length} processed photos`));

    if (photos.length === 0) {
      console.log(chalk.yellow('   ⚠️  No photos to sync'));
      return stats;
    }

    // Process in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < photos.length; i += batchSize) {
      const batch = photos.slice(i, Math.min(i + batchSize, photos.length));

      for (const photo of batch) {
        try {
          const metadata = JSON.parse(photo.metadata_json);

          // Check if photo already exists with newer data
          const { data: existing } = await supabase
            .from('photo_metadata')
            .select('enriched_at')
            .eq('photo_id', photo.image_key)
            .single();

          // Skip if existing data is newer
          if (existing && new Date(existing.enriched_at) > new Date(photo.processed_at)) {
            stats.skipped++;
            continue;
          }

          const { error } = await supabase
            .from('photo_metadata')
            .upsert({
              photo_id: photo.image_key,
              image_key: photo.image_key,
              album_key: photo.album_key,
              album_name: photo.album_name,

              // Image URLs
              ImageUrl: photo.image_url,
              OriginalUrl: photo.image_url,
              ThumbnailUrl: photo.image_url?.replace('/D/', '/M/'),

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

          stats.synced++;
        } catch (error: any) {
          console.error(chalk.red(`   ❌ ${photo.image_key}:`), error.message);
          stats.errors++;
        }
      }

      // Progress update
      const processed = Math.min(i + batchSize, photos.length);
      const percent = ((processed / photos.length) * 100).toFixed(0);
      process.stdout.write(
        chalk.gray(`\r   Progress: ${processed}/${photos.length} (${percent}%) - `) +
        chalk.green(`${stats.synced} synced`) +
        chalk.gray(`, ${stats.skipped} skipped, `) +
        chalk.red(`${stats.errors} errors`)
      );
    }

    console.log(); // New line after progress
    console.log(chalk.green(`   ✅ Complete: ${stats.synced} synced, ${stats.skipped} skipped, ${stats.errors} errors`));

  } catch (error) {
    console.error(chalk.red('   💥 Fatal error:'), error);
  } finally {
    db.close();
  }

  return stats;
}

/**
 * Main sync function
 */
async function syncAllMetadata(databases: string[]) {
  console.log(chalk.bold.cyan('\n🔄 Multi-Database Sync to Supabase\n'));

  if (databases.length === 0) {
    console.log(chalk.yellow('⚠️  No databases found to sync'));
    console.log(chalk.gray('\n   Usage:'));
    console.log(chalk.gray('   - pnpm run sync:all'));
    console.log(chalk.gray('   - pnpm run sync:all --dbs="db1.db,db2.db"'));
    console.log(chalk.gray('   - pnpm run sync:all --pattern="enrichment-*"\n'));
    return;
  }

  console.log(chalk.gray(`   Databases: ${databases.join(', ')}\n`));

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Sync each database
  const allStats: SyncStats[] = [];
  for (const dbPath of databases) {
    const stats = await syncDatabase(dbPath, supabase);
    allStats.push(stats);
  }

  // Final summary
  const totalPhotos = allStats.reduce((sum, s) => sum + s.photos, 0);
  const totalSynced = allStats.reduce((sum, s) => sum + s.synced, 0);
  const totalSkipped = allStats.reduce((sum, s) => sum + s.skipped, 0);
  const totalErrors = allStats.reduce((sum, s) => sum + s.errors, 0);

  console.log(chalk.cyan('\n' + '='.repeat(60)));
  console.log(chalk.bold.green('✅ Multi-Database Sync Complete!\n'));
  console.log(`   Databases processed: ${allStats.length}`);
  console.log(`   Total photos: ${totalPhotos}`);
  console.log(chalk.green(`   Synced: ${totalSynced}`));
  console.log(chalk.gray(`   Skipped: ${totalSkipped} (already up-to-date)`));
  console.log(chalk.red(`   Errors: ${totalErrors}`));
  console.log(chalk.cyan('='.repeat(60) + '\n'));

  // Per-database breakdown
  if (allStats.length > 1) {
    console.log(chalk.bold('Per-Database Results:\n'));
    allStats.forEach(stat => {
      console.log(`   ${stat.database}:`);
      console.log(chalk.gray(`      Photos: ${stat.photos}`));
      console.log(chalk.green(`      Synced: ${stat.synced}`));
      console.log(chalk.gray(`      Skipped: ${stat.skipped}`));
      if (stat.errors > 0) {
        console.log(chalk.red(`      Errors: ${stat.errors}`));
      }
    });
    console.log();
  }
}

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);

  // Check for explicit database list
  const dbsArg = args.find(arg => arg.startsWith('--dbs='));
  if (dbsArg) {
    return dbsArg.split('=')[1].split(',').map(db => db.trim());
  }

  // Check for pattern
  const patternArg = args.find(arg => arg.startsWith('--pattern='));
  const pattern = patternArg ? patternArg.split('=')[1] : 'enrichment-*.db';

  // Auto-discover databases
  return findDatabases(pattern);
}

// Validate environment
function validateEnvironment() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(chalk.red('\n❌ Missing Supabase credentials'));
    console.error(chalk.gray('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local\n'));
    process.exit(1);
  }
}

// Main
async function main() {
  validateEnvironment();
  const databases = parseArgs();
  await syncAllMetadata(databases);
}

main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});
