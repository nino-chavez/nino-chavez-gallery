#!/usr/bin/env tsx
/**
 * SmugMug Metadata Enrichment Script (Phase 1: Existing Photos)
 *
 * Fetches existing photos from SmugMug, enriches with Vision AI,
 * and updates SmugMug metadata via API.
 *
 * Usage:
 *   pnpm run enrich:smugmug --since 30d                    # Last 30 days
 *   pnpm run enrich:smugmug --since 30d --max-cost=1      # With $1 cost cap
 *   pnpm run enrich:smugmug --album ALBUM_KEY             # Specific album
 *   pnpm run enrich:smugmug --all --max-cost=20           # All photos, $20 cap
 *   pnpm run enrich:smugmug --all --dry-run               # Preview only
 *
 * Performance Tuning:
 *   --concurrency=N   Batch size (default: 10, was 3)
 *                     Claude API allows 50 req/min, so 10-20 is safe
 *   --delay=N         Delay between batches in ms (default: 500ms, was 2000ms)
 *                     Can set to 0 for maximum speed within API limits
 *
 * Cost Management:
 *   --max-cost=N   Set maximum cost in USD (default: $10)
 *                  Script stops automatically when cap is reached
 *                  Actual costs tracked from API responses in real-time
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { analyzePhoto as analyzePhotoWithVision } from './vision-client.js';

// Configuration
const CONFIG = {
  dryRun: process.argv.includes('--dry-run'),
  all: process.argv.includes('--all'),
  since: process.argv.find(arg => arg.startsWith('--since'))?.split('=')[1],
  albumKey: process.argv.find(arg => arg.startsWith('--album'))?.split('=')[1],
  maxConcurrency: parseInt(process.argv.find(arg => arg.startsWith('--concurrency'))?.split('=')[1] || '10'), // Default 10, can override
  batchDelay: parseInt(process.argv.find(arg => arg.startsWith('--delay'))?.split('=')[1] || '500'), // 500ms default (was 2000ms)
  tempDir: './temp-downloads',
  maxCost: parseFloat(process.argv.find(arg => arg.startsWith('--max-cost'))?.split('=')[1] || '10'), // Default $10 cap
  costPerImage: 0, // Will be set based on provider
};

// SmugMug OAuth client
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

interface EnrichedMetadata {
  title: string;
  caption: string;
  keywords: string[];
}

interface CostTracker {
  totalCost: number;
  photosProcessed: number;
  costPerPhoto: number;
}

const costTracker: CostTracker = {
  totalCost: 0,
  photosProcessed: 0,
  costPerPhoto: 0,
};

/**
 * Make authenticated SmugMug API request
 */
async function smugmugRequest(endpoint: string, method = 'GET', body?: any) {
  const url = `https://api.smugmug.com${endpoint}`;
  const request = { url, method };

  const authHeader = oauth.toHeader(oauth.authorize(request, token));

  const options: RequestInit = {
    method,
    headers: {
      ...authHeader,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`SmugMug API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.Response;
}

/**
 * Get authenticated user info
 */
async function getAuthUser() {
  const response = await smugmugRequest('/api/v2!authuser');
  return response.User;
}

/**
 * Get all albums
 */
async function getAlbums() {
  console.log('📂 Fetching albums...');

  // First get authenticated user to get proper URI
  const user = await getAuthUser();
  console.log(`   User: ${user.NickName}`);

  // Use the user's Uris.UserAlbums to get albums
  const response = await smugmugRequest(user.Uris.UserAlbums.Uri);
  return response.Album || [];
}

/**
 * Get images for album with image size URLs
 */
async function getAlbumImages(albumKey: string) {
  // Request image URLs for different sizes using _expand parameter
  // This tells SmugMug API to include ImageSizes in the response
  const response = await smugmugRequest(`/api/v2/album/${albumKey}!images?_expand=ImageSizes`);

  const images = response.AlbumImage || [];
  return images;
}

/**
 * Download image temporarily
 */
async function downloadImage(imageUrl: string, imageKey: string): Promise<string> {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();

  await mkdir(CONFIG.tempDir, { recursive: true });
  const filepath = join(CONFIG.tempDir, `${imageKey}.jpg`);
  await writeFile(filepath, Buffer.from(buffer));

  return filepath;
}

/**
 * Analyze photo using unified vision client (Claude/OpenAI/Gemini)
 */
async function analyzePhoto(imageUrl: string, context: {
  albumName: string;
  existingTitle?: string;
  existingKeywords?: string[];
}): Promise<EnrichedMetadata> {
  // Extract sport/event from album name
  const sport = detectSportFromAlbum(context.albumName);

  const result = await analyzePhotoWithVision(imageUrl, {
    sport,
    eventName: context.albumName,
    albumName: context.albumName,
    existingTitle: context.existingTitle,
    existingKeywords: context.existingKeywords,
  });

  // Track actual cost from API response
  if (result.cost) {
    costTracker.totalCost += result.cost;
    costTracker.photosProcessed++;
    costTracker.costPerPhoto = costTracker.totalCost / costTracker.photosProcessed;
  }

  // Convert vision result to enriched metadata format
  return {
    title: result.title,
    caption: result.caption,
    keywords: [
      ...result.keywords.tier1,
      ...result.keywords.tier2,
      ...result.keywords.tier3,
    ],
  };
}

/**
 * Detect sport from album name
 */
function detectSportFromAlbum(albumName: string): string {
  const albumLower = albumName.toLowerCase();

  const sportPatterns: Record<string, RegExp> = {
    volleyball: /\b(volley(ball)?|vball|vb\b|wvb|mvb)\b/i,
    bmx: /\b(bmx|bike|cycling)\b/i,
    skateboarding: /\b(skat(e|ing|eboard)|sk8)\b/i,
    surfing: /\b(surf|wave)\b/i,
    snowboarding: /\b(snow(board)?|shred)\b/i,
  };

  for (const [sport, pattern] of Object.entries(sportPatterns)) {
    if (pattern.test(albumName)) return sport;
  }

  // Check for common volleyball venue keywords
  if (albumLower.includes('turf') || albumLower.includes('grass') || albumLower.includes('beach')) {
    // These venues are commonly used for volleyball
    return 'volleyball';
  }

  return 'action sports';
}

/**
 * Update SmugMug image metadata
 */
async function updateImageMetadata(imageUri: string, metadata: EnrichedMetadata) {
  if (CONFIG.dryRun) {
    console.log(`    🔍 [DRY RUN] Would update:`);
    console.log(`       Title: ${metadata.title}`);
    console.log(`       Keywords: ${metadata.keywords.length} tags`);
    return;
  }

  await smugmugRequest(imageUri, 'PATCH', {
    Title: metadata.title,
    Caption: metadata.caption,
    Keywords: metadata.keywords.join('; '),  // Semicolon separator (SmugMug format)
  });

  console.log(`    ✅ Metadata updated in SmugMug`);
}

/**
 * Check if image already has enriched metadata
 *
 * NOTE: SmugMug strips colons from structured keywords (sport:volleyball → sportvolleyball)
 * So we check for comprehensive metadata instead: title + caption + 15+ keywords
 */
function hasEnrichedMetadata(image: any): boolean {
  return !!(
    image.Title &&
    image.Caption &&
    image.Keywords &&
    image.Keywords.split(';').length >= 15
  );
}

/**
 * Process single photo
 */
async function processPhoto(image: any, albumName: string) {
  console.log(`  🔍 Processing: ${image.FileName}`);

  // Skip videos - only process photos
  if (image.IsVideo) {
    console.log(`    🎥 Video file, skipping`);
    return { status: 'skipped' };
  }

  // Skip if already enriched
  if (hasEnrichedMetadata(image) && !CONFIG.dryRun) {
    console.log(`    ⏭️  Already enriched, skipping`);
    return { status: 'skipped' };
  }

  try {
    // Get image sizes to find one under 5MB for Claude
    let imageUrl: string | undefined;
    let sizeUsed = 'Unknown';

    // Fetch available image sizes from SmugMug API
    if (image.Uris?.ImageSizes || image.Uris?.LargestImage) {
      try {
        const sizeUri = image.Uris?.ImageSizes?.Uri || image.Uris?.Image?.Uri;
        const sizesResponse = await smugmugRequest(sizeUri);

        // SmugMug returns image sizes under different keys
        // Try to find Medium or Large size URLs
        const sizeKeys = ['MediumImageUrl', 'LargeImageUrl', 'SmallImageUrl', 'XLargeImageUrl'];
        for (const key of sizeKeys) {
          if (sizesResponse[key]) {
            imageUrl = sizesResponse[key];
            sizeUsed = key.replace('ImageUrl', '');
            break;
          }
        }

        // Also check nested ImageSizes object
        if (!imageUrl && sizesResponse.ImageSizes) {
          for (const key of sizeKeys) {
            if (sizesResponse.ImageSizes[key]) {
              imageUrl = sizesResponse.ImageSizes[key];
              sizeUsed = key.replace('ImageUrl', '');
              break;
            }
          }
        }
      } catch (err) {
        console.log(`    ⚠️  Could not fetch image sizes, using fallback`);
      }
    }

    // Fallback to direct URL properties
    if (!imageUrl) {
      imageUrl = image.MediumImageUrl || image.LargeImageUrl || image.SmallImageUrl || image.ArchivedUri;
      sizeUsed = image.MediumImageUrl ? 'Medium' : image.LargeImageUrl ? 'Large' : image.SmallImageUrl ? 'Small' : 'Original';
    }

    if (!imageUrl) {
      console.log(`    ⚠️  No image URL available, skipping`);
      return { status: 'error', error: 'No image URL' };
    }

    console.log(`    📏 Using ${sizeUsed} size`);

    // Analyze with vision API
    const metadata = await analyzePhoto(imageUrl, {
      albumName,
      existingTitle: image.Title,
      existingKeywords: image.Keywords?.split(',').map((k: string) => k.trim()),
    });

    // Update SmugMug
    await updateImageMetadata(image.Uris.Image.Uri, metadata);

    return { status: 'success', metadata };
  } catch (error) {
    console.error(`    ❌ Error: ${error}`);
    return { status: 'error', error };
  }
}

/**
 * Process album
 */
async function processAlbum(album: any) {
  console.log(`\n📂 Album: ${album.Name}`);
  console.log(`   Key: ${album.AlbumKey}`);

  const images = await getAlbumImages(album.AlbumKey);
  console.log(`   Images: ${images.length}`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < images.length; i += CONFIG.maxConcurrency) {
    // Check cost cap before processing batch
    if (costTracker.totalCost >= CONFIG.maxCost) {
      console.log(`\n⚠️  Cost cap reached: $${costTracker.totalCost.toFixed(4)} / $${CONFIG.maxCost}`);
      console.log(`   Stopping enrichment to prevent exceeding budget`);
      console.log(`   Processed ${processed} of ${images.length} images in this album`);
      break;
    }

    const batch = images.slice(i, i + CONFIG.maxConcurrency);

    const results = await Promise.all(
      batch.map(img => processPhoto(img, album.Name))
    );

    results.forEach(result => {
      if (result.status === 'success') processed++;
      else if (result.status === 'skipped') skipped++;
      else errors++;
    });

    // Progress with cost tracking
    console.log(`\n   Progress: ${i + batch.length}/${images.length}`);
    if (costTracker.totalCost > 0) {
      console.log(`   💰 Current cost: $${costTracker.totalCost.toFixed(4)} / $${CONFIG.maxCost} cap`);
      console.log(`   📊 Avg cost/photo: $${costTracker.costPerPhoto.toFixed(6)}`);
    }

    // Rate limiting (reduced from 2000ms to configurable delay)
    if (i + CONFIG.maxConcurrency < images.length) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.batchDelay));
    }
  }

  return { processed, skipped, errors, total: images.length, costCapReached: costTracker.totalCost >= CONFIG.maxCost };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 SmugMug Metadata Enrichment\n');

  // Validate environment
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GOOGLE_API_KEY) {
    console.error('❌ No vision API key found. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY');
    process.exit(1);
  }

  if (!process.env.SMUGMUG_API_KEY) {
    console.error('❌ SmugMug credentials not set');
    process.exit(1);
  }

  // Show which provider will be used and set cost per image
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('🤖 Using Claude Sonnet 4 (Anthropic)');
    CONFIG.costPerImage = 0.0036; // ~$3.60 per 1,000 photos
  } else if (process.env.OPENAI_API_KEY) {
    console.log('🤖 Using GPT-4o (OpenAI)');
    CONFIG.costPerImage = 0.01; // ~$10 per 1,000 photos
  } else {
    console.log('🤖 Using Gemini (Google)');
    CONFIG.costPerImage = 0.001; // ~$1 per 1,000 photos
  }

  console.log(`💰 Cost cap: $${CONFIG.maxCost.toFixed(2)}`);
  console.log(`   Estimated cost per photo: $${CONFIG.costPerImage.toFixed(6)}`);
  console.log(`⚡ Performance: ${CONFIG.maxConcurrency} concurrent, ${CONFIG.batchDelay}ms delay`);
  console.log();

  // Fetch albums
  const albums = await getAlbums();
  console.log(`📚 Found ${albums.length} albums\n`);

  // Filter albums based on options
  let albumsToProcess = albums;

  if (CONFIG.albumKey) {
    albumsToProcess = albums.filter((a: any) => a.AlbumKey === CONFIG.albumKey);
  } else if (CONFIG.since) {
    const sinceDate = parseSinceArg(CONFIG.since);
    albumsToProcess = albums.filter((a: any) => {
      const albumDate = new Date(a.LastUpdated);
      return albumDate >= sinceDate;
    });
    console.log(`🔍 Filtering albums since ${sinceDate.toLocaleDateString()}`);
  }

  if (albumsToProcess.length === 0) {
    console.log('❌ No albums to process');
    return;
  }

  console.log(`📊 Processing ${albumsToProcess.length} albums...\n`);

  // Process albums
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let totalImages = 0;
  let costCapReached = false;

  for (const album of albumsToProcess) {
    // Check if we've hit the cost cap
    if (costTracker.totalCost >= CONFIG.maxCost) {
      console.log(`\n⚠️  Cost cap of $${CONFIG.maxCost} reached. Stopping album processing.`);
      costCapReached = true;
      break;
    }

    const result = await processAlbum(album);
    totalProcessed += result.processed;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
    totalImages += result.total;

    if (result.costCapReached) {
      costCapReached = true;
      break;
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  if (costCapReached) {
    console.log('⚠️  Processing stopped - cost cap reached!\n');
  } else {
    console.log('✅ Processing complete!\n');
  }
  console.log(`   Albums processed: ${albumsToProcess.length}`);
  console.log(`   Total images: ${totalImages}`);
  console.log(`   Enriched: ${totalProcessed}`);
  console.log(`   Skipped: ${totalSkipped}`);
  console.log(`   Errors: ${totalErrors}`);

  if (CONFIG.dryRun) {
    console.log(`\n🔍 DRY RUN - No changes made to SmugMug`);
  }

  // Actual cost tracking
  const provider = process.env.ANTHROPIC_API_KEY ? 'Claude Sonnet 4' : process.env.OPENAI_API_KEY ? 'GPT-4o' : 'Gemini';
  console.log(`\n💰 Cost Summary (${provider}):`);
  console.log(`   Actual cost: $${costTracker.totalCost.toFixed(4)}`);
  console.log(`   Cost cap: $${CONFIG.maxCost.toFixed(2)}`);
  console.log(`   Avg per photo: $${costTracker.costPerPhoto.toFixed(6)}`);
  console.log(`   Photos processed: ${costTracker.photosProcessed}`);

  if (costCapReached) {
    console.log(`\n⚠️  WARNING: Cost cap reached at $${costTracker.totalCost.toFixed(4)}`);
    console.log(`   To continue, increase --max-cost or process remaining albums separately`);
  }

  // Cleanup temp directory
  try {
    await rm(CONFIG.tempDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Parse --since argument (7d, 30d, 1w, 1m, etc.)
 */
function parseSinceArg(since: string): Date {
  const now = new Date();
  const match = since.match(/^(\d+)([dwmy])$/);

  if (!match) {
    throw new Error(`Invalid --since format: ${since}. Use: 7d, 30d, 1w, 1m`);
  }

  const [, amount, unit] = match;
  const days = {
    d: parseInt(amount),
    w: parseInt(amount) * 7,
    m: parseInt(amount) * 30,
    y: parseInt(amount) * 365,
  }[unit]!;

  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
