#!/usr/bin/env tsx
/**
 * Local Photo Enrichment Script (Phase 2: Lightroom → SmugMug Workflow)
 *
 * Enriches photos after Lightroom export, before SmugMug upload.
 *
 * Usage:
 *   pnpm run enrich ~/Photos/exports/latest/
 *   pnpm run enrich ~/Photos/exports/latest/ --dry-run
 *   pnpm run enrich ~/Photos/exports/latest/ --overwrite
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, basename, dirname } from 'path';
import { execSync } from 'child_process';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CONFIG = {
  dryRun: process.argv.includes('--dry-run'),
  overwrite: process.argv.includes('--overwrite'),
  imageExtensions: ['.jpg', '.jpeg', '.JPG', '.JPEG'],
  maxConcurrency: 5,
};

interface EnrichedMetadata {
  title: string;
  caption: string;
  keywords: {
    tier1: string[];
    tier2: string[];
    tier3: string[];
  };
  emotion: string;
  composition: string;
  timeOfDay: string;
}

/**
 * Extract context from Lightroom export folder
 */
function extractContext(photoPath: string): {
  eventName: string;
  sport: string;
  location?: string;
  date?: Date;
} {
  const dirName = basename(dirname(photoPath));

  // Lightroom export naming: YYYY-MM-DD-EventName or EventName
  const parts = dirName.split('-');

  let sport = 'sports';
  let eventName = dirName;
  let location: string | undefined;
  let date: Date | undefined;

  // Parse date if present (YYYY-MM-DD prefix)
  if (parts.length >= 3 && /^\d{4}$/.test(parts[0])) {
    date = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
    eventName = parts.slice(3).join('-');
  }

  // Detect sport
  const sportPatterns: Record<string, RegExp> = {
    bmx: /\b(bmx|bike|cycling)\b/i,
    skateboarding: /\b(skat(e|ing|eboard)|sk8)\b/i,
    volleyball: /\b(volley(ball)?|vball)\b/i,
  };

  for (const [sportName, pattern] of Object.entries(sportPatterns)) {
    if (pattern.test(dirName)) {
      sport = sportName;
      break;
    }
  }

  return { eventName, sport, location, date };
}

/**
 * Read existing EXIF from Lightroom export
 */
function readExistingEXIF(photoPath: string): any {
  try {
    const exifJson = execSync(`exiftool -json "${photoPath}"`, { encoding: 'utf-8' });
    return JSON.parse(exifJson)[0];
  } catch {
    return {};
  }
}

/**
 * Analyze photo with GPT-4 Vision
 */
async function analyzePhoto(photoPath: string, context: ReturnType<typeof extractContext>): Promise<EnrichedMetadata> {
  console.log(`  🔍 Analyzing: ${basename(photoPath)}`);

  const imageBuffer = await readFile(photoPath);
  const base64Image = imageBuffer.toString('base64');

  const existingExif = readExistingEXIF(photoPath);

  const prompt = `Analyze this ${context.sport} photo from "${context.eventName}".

Context:
- Sport: ${context.sport}
- Event: ${context.eventName}
${context.date ? `- Date: ${context.date.toLocaleDateString()}` : ''}
${context.location ? `- Location: ${context.location}` : ''}
${existingExif.Make ? `- Camera: ${existingExif.Make} ${existingExif.Model}` : ''}
${existingExif.Title ? `- Existing title: ${existingExif.Title}` : ''}
${existingExif.Keywords ? `- Existing keywords: ${existingExif.Keywords}` : ''}

Generate metadata in JSON:

{
  "title": "8-word max, action-focused",
  "caption": "20-word descriptive caption",
  "keywords": {
    "tier1": ["sport", "action", "subject"] (3-5 core),
    "tier2": ["emotion", "composition", "lighting"] (5-7 descriptive),
    "tier3": ["sport:${context.sport}", "action:xxx", "emotion:xxx", "composition:xxx", "time:xxx"] (7-10 structured)
  },
  "emotion": "triumph|focus|intensity|playfulness|determination",
  "composition": "rule-of-thirds|leading-lines|symmetry|motion-blur|close-up",
  "timeOfDay": "morning|afternoon|golden-hour|evening|night"
}

Keep best existing keywords, add new ones.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: 'high' } },
      ],
    }],
    max_tokens: 800,
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No response from GPT-4');

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse JSON');

  const metadata: EnrichedMetadata = JSON.parse(jsonMatch[0]);

  console.log(`    ✅ Title: ${metadata.title}`);
  console.log(`    📝 Keywords: ${Object.values(metadata.keywords).flat().length} tags`);

  return metadata;
}

/**
 * Write metadata to EXIF
 */
function writeMetadataToExif(photoPath: string, metadata: EnrichedMetadata, dryRun = false): void {
  const allKeywords = [
    ...metadata.keywords.tier1,
    ...metadata.keywords.tier2,
    ...metadata.keywords.tier3,
  ];

  const keywordsString = allKeywords.join(', ');

  const commands = [
    `-Title="${metadata.title}"`,
    `-Caption-Abstract="${metadata.caption}"`,
    `-Description="${metadata.caption}"`,
    `-Keywords="${keywordsString}"`,
    `-Subject="${keywordsString}"`,
    `-overwrite_original`,
  ];

  const exifCommand = `exiftool ${commands.join(' ')} "${photoPath}"`;

  if (dryRun) {
    console.log(`    🔍 [DRY RUN] Would execute: exiftool ...`);
    return;
  }

  try {
    execSync(exifCommand, { encoding: 'utf-8' });
    console.log(`    ✅ Metadata written to EXIF`);
  } catch (error) {
    console.error(`    ❌ Failed to write EXIF: ${error}`);
    throw error;
  }
}

/**
 * Check if already enriched
 */
function hasEnrichedMetadata(photoPath: string): boolean {
  try {
    const exifJson = execSync(`exiftool -json -Keywords "${photoPath}"`, { encoding: 'utf-8' });
    const exif = JSON.parse(exifJson)[0];

    if (exif.Keywords) {
      const keywords = Array.isArray(exif.Keywords)
        ? exif.Keywords
        : exif.Keywords.split(',').map((k: string) => k.trim());

      return keywords.some((k: string) => k.includes(':'));
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Process directory
 */
async function processDirectory(dirPath: string): Promise<void> {
  console.log(`\n📂 Processing: ${dirPath}\n`);

  const photos: string[] = [];

  async function findImages(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await findImages(fullPath);
      } else if (CONFIG.imageExtensions.some(ext => entry.name.endsWith(ext))) {
        photos.push(fullPath);
      }
    }
  }

  await findImages(dirPath);

  console.log(`📸 Found ${photos.length} photos`);

  const photosToProcess = CONFIG.overwrite
    ? photos
    : photos.filter(p => !hasEnrichedMetadata(p));

  const skippedCount = photos.length - photosToProcess.length;
  if (skippedCount > 0) {
    console.log(`⏭️  Skipping ${skippedCount} already enriched (use --overwrite to force)`);
  }

  if (photosToProcess.length === 0) {
    console.log('✅ All photos already enriched!');
    return;
  }

  console.log(`🔄 Processing ${photosToProcess.length} photos...\n`);

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < photosToProcess.length; i += CONFIG.maxConcurrency) {
    const batch = photosToProcess.slice(i, i + CONFIG.maxConcurrency);

    await Promise.all(
      batch.map(async photoPath => {
        try {
          const context = extractContext(photoPath);
          const metadata = await analyzePhoto(photoPath, context);
          writeMetadataToExif(photoPath, metadata, CONFIG.dryRun);
          processed++;
        } catch (error) {
          console.error(`  ❌ Error: ${basename(photoPath)}:`, error);
          errors++;
        }
      })
    );

    console.log(`\n📊 Progress: ${processed + errors}/${photosToProcess.length} (${errors} errors)\n`);

    if (i + CONFIG.maxConcurrency < photosToProcess.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Processing complete!`);
  console.log(`   Total: ${photos.length}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Errors: ${errors}`);

  if (CONFIG.dryRun) {
    console.log(`\n🔍 DRY RUN - No files modified`);
  }

  const costPerPhoto = 0.01;
  const totalCost = photosToProcess.length * costPerPhoto;
  console.log(`\n💰 Estimated cost: $${totalCost.toFixed(2)}`);

  // Next step reminder
  if (!CONFIG.dryRun && processed > 0) {
    console.log(`\n✨ Next steps:`);
    console.log(`   1. Review enriched metadata: exiftool -Title -Keywords "${photosToProcess[0]}"`);
    console.log(`   2. Upload to SmugMug via SmugMug Uploader`);
    console.log(`   3. Metadata will be automatically indexed by SmugMug`);
  }
}

/**
 * Main
 */
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set');
    process.exit(1);
  }

  const targetDir = process.argv[2];

  if (!targetDir) {
    console.error('❌ No directory specified');
    console.error('\nUsage:');
    console.error('  pnpm run enrich <directory> [--dry-run] [--overwrite]');
    console.error('\nExamples:');
    console.error('  pnpm run enrich ~/Photos/exports/2025-01-20-BMX/');
    console.error('  pnpm run enrich ~/Photos/exports/latest/ --dry-run');
    process.exit(1);
  }

  try {
    const stats = await stat(targetDir);
    if (!stats.isDirectory()) {
      console.error(`❌ Not a directory: ${targetDir}`);
      process.exit(1);
    }
  } catch {
    console.error(`❌ Directory not found: ${targetDir}`);
    process.exit(1);
  }

  await processDirectory(targetDir);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
