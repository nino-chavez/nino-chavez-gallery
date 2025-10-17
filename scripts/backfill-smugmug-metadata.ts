#!/usr/bin/env tsx
/**
 * Backfill SmugMug Metadata to Supabase
 *
 * Fetches comprehensive metadata from SmugMug API and updates Supabase
 * with dates, dimensions, album info, and EXIF data.
 *
 * NO LLM CALLS - Only SmugMug API data collection
 *
 * Usage:
 *   pnpm run backfill:smugmug              # Backfill all photos
 *   pnpm run backfill:smugmug --limit=100  # Limit to 100 photos
 *   pnpm run backfill:smugmug --dry-run    # Test without writing
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import chalk from 'chalk';

// SmugMug OAuth setup
const oauth = new OAuth({
  consumer: {
    key: process.env.SMUGMUG_API_KEY!,
    secret: process.env.SMUGMUG_API_SECRET!,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString, key) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64');
  },
});

const token = {
  key: process.env.SMUGMUG_ACCESS_TOKEN!,
  secret: process.env.SMUGMUG_ACCESS_TOKEN_SECRET!,
};

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BackfillStats {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Make authenticated SmugMug API request
 */
async function smugmugRequest(endpoint: string): Promise<any> {
  const url = `https://api.smugmug.com${endpoint}`;
  const request = { url, method: 'GET' };

  const authHeader = oauth.toHeader(oauth.authorize(request, token));

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...authHeader,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`SmugMug API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.Response;
}

/**
 * Get image metadata from SmugMug
 */
async function getImageMetadata(imageKey: string): Promise<any> {
  try {
    const response = await smugmugRequest(`/api/v2/image/${imageKey}`);
    return response.Image;
  } catch (error) {
    console.error(chalk.red(`  ❌ Failed to fetch metadata for ${imageKey}:`, error));
    return null;
  }
}

/**
 * Extract and normalize metadata for Supabase
 */
function extractMetadata(image: any) {
  // Calculate aspect ratio
  const width = image.OriginalWidth || image.Width;
  const height = image.OriginalHeight || image.Height;
  const aspect_ratio = width && height ? parseFloat((width / height).toFixed(3)) : null;

  return {
    // Dates (prioritize DateTimeOriginal from EXIF, fallback to UploadDate/DateAdded)
    photo_date: image.DateTimeOriginal || image.UploadDate || image.DateAdded || null,
    upload_date: image.UploadDate || null,
    date_added: image.DateAdded || null,

    // Image dimensions
    width,
    height,
    file_name: image.FileName || null,
    aspect_ratio,

    // EXIF camera data
    camera_make: image.CameraMake || null,
    camera_model: image.CameraModel || null,
    lens_model: image.LensModel || null,
    focal_length: image.FocalLength || null,
    aperture: image.Aperture || null,
    shutter_speed: image.ShutterSpeed || null,
    iso: image.ISO ? parseInt(image.ISO) : null,

    // Geolocation
    latitude: image.Latitude || null,
    longitude: image.Longitude || null,
    location_name: image.Location || null,
  };
}

/**
 * Backfill metadata for all photos
 */
async function backfillMetadata(options: { limit?: number; dryRun?: boolean }) {
  const { limit, dryRun = false } = options;

  console.log(chalk.cyan('\n🔄 SmugMug Metadata Backfill\n'));
  console.log(`   Mode: ${dryRun ? chalk.yellow('DRY RUN') : chalk.green('LIVE')}`);
  if (limit) console.log(`   Limit: ${limit} photos`);

  const stats: BackfillStats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Get all photos from Supabase that need metadata
    const query = supabase
      .from('photo_metadata')
      .select('photo_id, image_key, photo_date, width')
      .order('enriched_at', { ascending: false });

    if (limit) {
      query.limit(limit);
    }

    const { data: photos, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch photos: ${fetchError.message}`);
    }

    if (!photos || photos.length === 0) {
      console.log(chalk.yellow('\n⚠️  No photos found in database'));
      return;
    }

    stats.total = photos.length;
    console.log(chalk.gray(`\n   Found ${stats.total} photos to process\n`));

    // Process photos in batches
    const batchSize = 10; // SmugMug rate limiting
    for (let i = 0; i < photos.length; i += batchSize) {
      const batch = photos.slice(i, Math.min(i + batchSize, photos.length));

      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map(async (photo) => {
          // Skip if already has complete metadata
          if (photo.photo_date && photo.width) {
            stats.skipped++;
            return { success: true, skipped: true };
          }

          // Fetch metadata from SmugMug
          const imageData = await getImageMetadata(photo.image_key);
          if (!imageData) {
            stats.errors++;
            return { success: false };
          }

          // Extract metadata
          const metadata = extractMetadata(imageData);

          // Update Supabase
          if (!dryRun) {
            const { error: updateError } = await supabase
              .from('photo_metadata')
              .update(metadata)
              .eq('photo_id', photo.photo_id);

            if (updateError) {
              console.error(chalk.red(`  ❌ Failed to update ${photo.image_key}:`), updateError);
              stats.errors++;
              return { success: false };
            }
          }

          stats.updated++;
          return { success: true };
        })
      );

      // Progress update
      const processed = i + batch.length;
      const percent = ((processed / stats.total) * 100).toFixed(1);
      console.log(
        chalk.gray(`   Progress: ${processed}/${stats.total} (${percent}%) - `) +
        chalk.green(`${stats.updated} updated`) +
        chalk.gray(`, ${stats.skipped} skipped, `) +
        chalk.red(`${stats.errors} errors`)
      );

      // Rate limiting delay (SmugMug has rate limits)
      if (i + batchSize < photos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second between batches
      }
    }

    // Final summary
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.bold.green('✅ Backfill Complete!\n'));
    console.log(`   Total photos: ${stats.total}`);
    console.log(chalk.green(`   Updated: ${stats.updated}`));
    console.log(chalk.gray(`   Skipped: ${stats.skipped} (already complete)`));
    console.log(chalk.red(`   Errors: ${stats.errors}`));
    console.log(chalk.cyan('='.repeat(60) + '\n'));

    if (dryRun) {
      console.log(chalk.yellow('   💡 This was a DRY RUN - no data was written'));
      console.log(chalk.yellow('   💡 Run without --dry-run to apply changes\n'));
    }

  } catch (error) {
    console.error(chalk.red('\n💥 Fatal error:'), error);
    process.exit(1);
  }
}

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);

  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

  const dryRun = args.includes('--dry-run');

  return { limit, dryRun };
}

// Validate environment
function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SMUGMUG_API_KEY',
    'SMUGMUG_API_SECRET',
    'SMUGMUG_ACCESS_TOKEN',
    'SMUGMUG_ACCESS_TOKEN_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(chalk.red('\n❌ Missing required environment variables:'));
    missing.forEach(key => console.error(chalk.red(`   - ${key}`)));
    console.error(chalk.gray('\n   Make sure these are set in .env.local\n'));
    process.exit(1);
  }
}

// Main
async function main() {
  validateEnvironment();
  const options = parseArgs();
  await backfillMetadata(options);
}

main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});
