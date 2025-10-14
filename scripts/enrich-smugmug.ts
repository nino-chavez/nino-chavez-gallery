#!/usr/bin/env tsx
/**
 * SmugMug Metadata Enrichment Script (Phase 1: Existing Photos)
 *
 * Fetches existing photos from SmugMug, enriches with GPT-4 Vision,
 * and updates SmugMug metadata via API.
 *
 * Usage:
 *   pnpm run enrich:smugmug --all                 # Enrich all photos
 *   pnpm run enrich:smugmug --since 7d            # Last 7 days
 *   pnpm run enrich:smugmug --album ALBUM_KEY    # Specific album
 *   pnpm run enrich:smugmug --all --dry-run      # Preview only
 */

import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configuration
const CONFIG = {
  dryRun: process.argv.includes('--dry-run'),
  all: process.argv.includes('--all'),
  since: process.argv.find(arg => arg.startsWith('--since'))?.split('=')[1],
  albumKey: process.argv.find(arg => arg.startsWith('--album'))?.split('=')[1],
  maxConcurrency: 3, // Process 3 photos at a time (slower but safer)
  tempDir: './temp-downloads',
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
 * Get all albums
 */
async function getAlbums() {
  console.log('📂 Fetching albums...');
  const response = await smugmugRequest(`/api/v2/user/${process.env.SMUGMUG_USERNAME}!albums`);
  return response.Album || [];
}

/**
 * Get images for album
 */
async function getAlbumImages(albumKey: string) {
  const response = await smugmugRequest(`/api/v2/album/${albumKey}!images`);
  return response.AlbumImage || [];
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
 * Analyze photo with GPT-4 Vision
 */
async function analyzePhoto(imageUrl: string, context: {
  albumName: string;
  existingTitle?: string;
  existingKeywords?: string[];
}): Promise<EnrichedMetadata> {
  const prompt = `Analyze this sports photography image.

Context:
- Album: ${context.albumName}
${context.existingTitle ? `- Current title: ${context.existingTitle}` : ''}
${context.existingKeywords?.length ? `- Existing keywords: ${context.existingKeywords.join(', ')}` : ''}

Generate metadata in JSON format:

{
  "title": "8-word max, action-focused title",
  "caption": "20-word descriptive caption",
  "keywords": ["sport", "action", "subject", "emotion", "composition", "lighting", "sport:bmx", "action:jump", "emotion:intensity", "composition:rule-of-thirds", "time:golden-hour"]
}

Important:
- Keep best existing keywords, add new ones
- Use structured keywords with colon format (key:value)
- Be specific to what you see`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
      ],
    }],
    max_tokens: 500,
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No response from GPT-4');

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse JSON response');

  return JSON.parse(jsonMatch[0]);
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
    Keywords: metadata.keywords.join(', '),
  });

  console.log(`    ✅ Metadata updated in SmugMug`);
}

/**
 * Check if image already has enriched metadata
 */
function hasEnrichedMetadata(image: any): boolean {
  if (!image.Keywords) return false;

  const keywords = image.Keywords.split(',').map((k: string) => k.trim());
  return keywords.some((k: string) => k.includes(':'));
}

/**
 * Process single photo
 */
async function processPhoto(image: any, albumName: string) {
  console.log(`  🔍 Processing: ${image.FileName}`);

  // Skip if already enriched
  if (hasEnrichedMetadata(image) && !CONFIG.dryRun) {
    console.log(`    ⏭️  Already enriched, skipping`);
    return { status: 'skipped' };
  }

  try {
    // Use ArchivedUri (SmugMug CDN URL) - no download needed!
    const imageUrl = image.ArchivedUri;

    if (!imageUrl) {
      console.log(`    ⚠️  No image URL available, skipping`);
      return { status: 'error', error: 'No image URL' };
    }

    // Analyze with GPT-4 Vision
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
    const batch = images.slice(i, i + CONFIG.maxConcurrency);

    const results = await Promise.all(
      batch.map(img => processPhoto(img, album.Name))
    );

    results.forEach(result => {
      if (result.status === 'success') processed++;
      else if (result.status === 'skipped') skipped++;
      else errors++;
    });

    // Progress
    console.log(`\n   Progress: ${i + batch.length}/${images.length}`);

    // Rate limiting
    if (i + CONFIG.maxConcurrency < images.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return { processed, skipped, errors, total: images.length };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 SmugMug Metadata Enrichment\n');

  // Validate environment
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set');
    process.exit(1);
  }

  if (!process.env.SMUGMUG_API_KEY) {
    console.error('❌ SmugMug credentials not set');
    process.exit(1);
  }

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

  for (const album of albumsToProcess) {
    const result = await processAlbum(album);
    totalProcessed += result.processed;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
    totalImages += result.total;
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Processing complete!\n');
  console.log(`   Albums processed: ${albumsToProcess.length}`);
  console.log(`   Total images: ${totalImages}`);
  console.log(`   Enriched: ${totalProcessed}`);
  console.log(`   Skipped: ${totalSkipped}`);
  console.log(`   Errors: ${totalErrors}`);

  if (CONFIG.dryRun) {
    console.log(`\n🔍 DRY RUN - No changes made to SmugMug`);
  }

  // Cost estimate
  const costPerImage = 0.01;
  const totalCost = totalProcessed * costPerImage;
  console.log(`\n💰 Estimated cost: $${totalCost.toFixed(2)}`);

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
