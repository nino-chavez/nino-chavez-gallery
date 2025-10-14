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

import { config } from 'dotenv';
import { readdir, readFile, stat } from 'fs/promises';
import { join, basename, dirname } from 'path';
import { execSync } from 'child_process';
import { analyzePhoto as analyzePhotoWithVision } from './vision-client.js';
import { geocodeVenue, extractVenueName, getCachedLocationCount } from './geocoding-service.js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const CONFIG = {
  dryRun: process.argv.includes('--dry-run'),
  overwrite: process.argv.includes('--overwrite'),
  imageExtensions: ['.jpg', '.jpeg', '.JPG', '.JPEG'],
  maxConcurrency: parseInt(process.argv.find(arg => arg.startsWith('--concurrency'))?.split('=')[1] || '10'), // Default 10, can override
  batchDelay: parseInt(process.argv.find(arg => arg.startsWith('--delay'))?.split('=')[1] || '0'), // 0ms default = no delay
};

interface TechnicalMetadata {
  camera: string;
  lens: string;
  focalLength: string;
  aperture: string;
  shutterSpeed: string;
  iso: number;
  shootingStyles: string[];
  difficultyTags: string[];
}

interface EventMetadata {
  venue: string;
  sport: string;
  gender?: string;
  season: string;
  month: string;
  year: number;
  timestamp?: Date;
}

interface LocationMetadata {
  venue: string;
  city: string;
  state: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone: string;
}

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
  technical: TechnicalMetadata;
  event: EventMetadata;
  location?: LocationMetadata;
}

/**
 * Extract technical metadata from EXIF
 */
function extractTechnicalMetadata(exif: any): TechnicalMetadata {
  const iso = parseInt(exif.ISO) || 0;
  const shutterSpeed = String(exif.ShutterSpeed || exif.ExposureTime || '');
  const aperture = String(exif.Aperture || exif.FNumber || '');
  const focalLength = String(exif.FocalLength || '');

  // Classify shooting style based on camera settings
  const shootingStyles: string[] = [];
  const difficultyTags: string[] = [];

  // Shutter speed analysis
  if (shutterSpeed) {
    const shutterStr = String(shutterSpeed);
    const shutterNum = parseFloat(shutterStr.replace(/[^\d.]/g, ''));
    if (shutterNum >= 1000) {
      shootingStyles.push('fast-action', 'motion-freeze');
      difficultyTags.push('technique:motion-freeze');
    } else if (shutterNum >= 500) {
      shootingStyles.push('fast-action');
    }
  }

  // ISO analysis
  if (iso >= 3200) {
    shootingStyles.push('low-light');
    difficultyTags.push('challenge:low-light');
  } else if (iso >= 1600) {
    shootingStyles.push('indoor');
    difficultyTags.push('challenge:indoor-sports');
  }

  // Aperture analysis
  if (aperture) {
    const apertureStr = String(aperture);
    const apertureNum = parseFloat(apertureStr.replace(/[^\d.]/g, ''));
    if (apertureNum && apertureNum <= 2.8) {
      shootingStyles.push('wide-aperture', 'shallow-depth');
      difficultyTags.push('technique:shallow-dof');
    }
  }

  // Focal length analysis
  if (focalLength) {
    const focalStr = String(focalLength);
    const focalNum = parseInt(focalStr.replace(/[^\d]/g, ''));
    if (focalNum >= 200) {
      shootingStyles.push('super-telephoto');
    } else if (focalNum >= 100) {
      shootingStyles.push('telephoto');
    }
  }

  return {
    camera: `${exif.Make || ''} ${exif.Model || ''}`.trim(),
    lens: exif.LensModel || exif.Lens || '',
    focalLength: focalLength,
    aperture: aperture,
    shutterSpeed: shutterSpeed,
    iso: iso,
    shootingStyles: [...new Set(shootingStyles)],
    difficultyTags: [...new Set(difficultyTags)],
  };
}

/**
 * Extract event metadata from folder name and EXIF
 */
function extractEventMetadata(photoPath: string, exif: any): EventMetadata {
  const dirName = basename(dirname(photoPath));
  const parts = dirName.split('-');

  let sport = 'sports';
  let eventName = dirName;
  let gender: string | undefined;
  let date: Date | undefined;

  // Parse date if present (YYYY-MM-DD prefix)
  if (parts.length >= 3 && /^\d{4}$/.test(parts[0])) {
    date = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
    eventName = parts.slice(3).join('-');
  } else if (exif.DateTimeOriginal) {
    // Fall back to EXIF date (format: "2025:09:24 17:53:02")
    const dateStr = String(exif.DateTimeOriginal).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    date = new Date(dateStr);
  }

  // Detect gender
  if (/\b(women|womens|girls)\b/i.test(dirName)) {
    gender = 'womens';
  } else if (/\b(men|mens|boys)\b/i.test(dirName)) {
    gender = 'mens';
  }

  // Detect sport
  const sportPatterns: Record<string, RegExp> = {
    bmx: /\b(bmx|bike|cycling)\b/i,
    skateboarding: /\b(skat(e|ing|eboard)|sk8)\b/i,
    volleyball: /\b(volley(ball)?|vball|vb)\b/i,
    basketball: /\b(basketball|bball|hoops)\b/i,
    soccer: /\b(soccer|football)\b/i,
    baseball: /\b(baseball|softball)\b/i,
  };

  for (const [sportName, pattern] of Object.entries(sportPatterns)) {
    if (pattern.test(dirName)) {
      sport = sportName;
      break;
    }
  }

  // Extract venue name (first part before sport/gender)
  let venue = eventName;
  const venueParts = eventName.split('-').filter(p => !sportPatterns[sport]?.test(p) && !/(women|mens|girls|boys)/i.test(p));
  if (venueParts.length > 0) {
    venue = venueParts[0];
  }

  // Determine season and month
  const month = date ? date.toLocaleString('default', { month: 'long' }).toLowerCase() : '';
  const year = date ? date.getFullYear() : new Date().getFullYear();

  let season = 'unknown';
  if (date) {
    const monthNum = date.getMonth() + 1;
    if (monthNum >= 3 && monthNum <= 5) season = 'spring';
    else if (monthNum >= 6 && monthNum <= 8) season = 'summer';
    else if (monthNum >= 9 && monthNum <= 11) season = 'fall';
    else season = 'winter';
  }

  return {
    venue,
    sport,
    gender,
    season,
    month,
    year,
    timestamp: date,
  };
}

/**
 * Legacy context extraction for backward compatibility
 */
function extractContext(photoPath: string): {
  eventName: string;
  sport: string;
  location?: string;
  date?: Date;
} {
  const exif = readExistingEXIF(photoPath);
  const eventMetadata = extractEventMetadata(photoPath, exif);

  return {
    eventName: eventMetadata.venue,
    sport: eventMetadata.sport,
    location: eventMetadata.venue,
    date: eventMetadata.timestamp,
  };
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
 * Analyze photo with unified vision client (Claude/OpenAI/Gemini) + Phase 1 & 2 metadata
 */
async function analyzePhoto(photoPath: string, context: ReturnType<typeof extractContext>): Promise<EnrichedMetadata> {
  console.log(`  🔍 Analyzing: ${basename(photoPath)}`);

  const existingExif = readExistingEXIF(photoPath);

  // Extract Phase 1 metadata
  const technical = extractTechnicalMetadata(existingExif);
  const event = extractEventMetadata(photoPath, existingExif);

  console.log(`    📷 ${technical.camera} | ${technical.shutterSpeed} f/${technical.aperture} ISO${technical.iso}`);
  console.log(`    🏟️  ${event.venue} - ${event.sport}${event.gender ? ` (${event.gender})` : ''} | ${event.season} ${event.year}`);

  // Phase 2: Location enrichment (geocoding)
  let location: LocationMetadata | undefined;
  const venueName = extractVenueName(photoPath);
  if (venueName) {
    const geocoded = await geocodeVenue(venueName);
    if (geocoded) {
      location = geocoded;
      console.log(`    📍 ${location.city}, ${location.state} (${location.coordinates.lat.toFixed(4)}, ${location.coordinates.lng.toFixed(4)})`);
    }
  }

  // Convert local file to data URL for vision client
  const imageBuffer = await readFile(photoPath);
  const base64Image = imageBuffer.toString('base64');
  const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

  const result = await analyzePhotoWithVision(imageDataUrl, {
    sport: context.sport,
    eventName: context.eventName,
    albumName: context.eventName,
    existingTitle: existingExif.Title,
    existingKeywords: existingExif.Keywords ?
      (Array.isArray(existingExif.Keywords) ? existingExif.Keywords : existingExif.Keywords.split(',').map((k: string) => k.trim())) :
      undefined,
    date: context.date,
    location: context.location,
  });

  console.log(`    ✅ Title: ${result.title}`);
  console.log(`    📝 Keywords: ${Object.values(result.keywords).flat().length} tags + ${technical.shootingStyles.length} shooting styles`);

  // Convert vision result to enriched metadata format
  return {
    title: result.title,
    caption: result.caption,
    keywords: result.keywords,
    emotion: result.keywords.tier3.find((k: string) => k.startsWith('emotion:'))?.replace('emotion:', '') || '',
    composition: result.keywords.tier3.find((k: string) => k.startsWith('composition:'))?.replace('composition:', '') || '',
    timeOfDay: result.keywords.tier3.find((k: string) => k.startsWith('time:'))?.replace('time:', '') || '',
    technical,
    event,
    location, // Phase 2: GPS coordinates and location data
  };
}

/**
 * Write metadata to EXIF
 */
function writeMetadataToExif(photoPath: string, metadata: EnrichedMetadata, dryRun = false): void {
  // Combine AI keywords + Phase 1 technical & event keywords + Phase 2 location keywords
  // NOTE: Use underscores instead of colons/hyphens to avoid SmugMug concatenation
  const allKeywords = [
    ...metadata.keywords.tier1.map(k => k.replace(/-/g, '_')),
    ...metadata.keywords.tier2.map(k => k.replace(/-/g, '_')),
    ...metadata.keywords.tier3.map(k => k.replace(/:/g, '_').replace(/-/g, '_')),
    // Technical metadata keywords (use underscores for structured tags)
    ...metadata.technical.shootingStyles.map(s => `style_${s.replace(/-/g, '_')}`),
    ...metadata.technical.difficultyTags.map(t => t.replace(/:/g, '_').replace(/-/g, '_')),
    `camera_${metadata.technical.camera.toLowerCase().replace(/[\s-]+/g, '_')}`,
    `lens_${metadata.technical.lens.toLowerCase().replace(/[\s-]+/g, '_').substring(0, 30)}`,
    `iso_${metadata.technical.iso}`,
    // Event metadata keywords
    `venue_${metadata.event.venue.toLowerCase().replace(/[\s-]+/g, '_')}`,
    `season_${metadata.event.season}`,
    `month_${metadata.event.month}`,
    `year_${metadata.event.year}`,
    ...(metadata.event.gender ? [`gender_${metadata.event.gender}`] : []),
    // Phase 2: Location metadata keywords
    ...(metadata.location ? [
      `city_${metadata.location.city.toLowerCase().replace(/[\s-]+/g, '_')}`,
      `state_${metadata.location.state.toLowerCase().replace(/[\s-]+/g, '_')}`,
      `country_${metadata.location.country.toLowerCase().replace(/[\s-]+/g, '_')}`,
    ] : []),
  ];

  // Write keywords as individual -Keywords= entries to avoid IPTC length limit
  const keywordArgs = allKeywords.map(kw => `-Keywords="${kw}"`).join(' ');

  // Build comprehensive EXIF command
  const commands = [
    `-Title="${metadata.title}"`,
    `-Caption-Abstract="${metadata.caption}"`,
    `-Description="${metadata.caption}"`,
    keywordArgs, // Individual keyword entries
    `-Subject="${allKeywords.join(', ')}"`, // XMP Subject can still be comma-separated
    // Custom XMP fields for structured Phase 1 metadata
    `-XMP-photoshop:CameraModel="${metadata.technical.camera}"`,
    `-XMP-aux:Lens="${metadata.technical.lens}"`,
    `-XMP-dc:Subject="${metadata.event.venue}"`,
    `-XMP-iptcExt:Event="${metadata.event.venue} - ${metadata.event.sport}"`,
    // Phase 2: GPS coordinates
    ...(metadata.location ? [
      `-GPSLatitude="${metadata.location.coordinates.lat}"`,
      `-GPSLongitude="${metadata.location.coordinates.lng}"`,
      `-GPSLatitudeRef="${metadata.location.coordinates.lat >= 0 ? 'N' : 'S'}"`,
      `-GPSLongitudeRef="${metadata.location.coordinates.lng >= 0 ? 'E' : 'W'}"`,
      `-XMP-iptcExt:LocationShown="${metadata.location.city}, ${metadata.location.state}"`,
    ] : []),
    `-overwrite_original`,
  ];

  const exifCommand = `exiftool ${commands.join(' ')} "${photoPath}" 2>&1 | grep -v "IPTC:Keywords exceeds" || true`;

  if (dryRun) {
    console.log(`    🔍 [DRY RUN] Would execute: exiftool ...`);
    console.log(`    Phase 1 Keywords: ${metadata.technical.shootingStyles.length} styles, ${metadata.technical.difficultyTags.length} difficulty tags`);
    return;
  }

  try {
    execSync(exifCommand, { encoding: 'utf-8', shell: '/bin/bash' });
    console.log(`    ✅ Metadata written to EXIF (${allKeywords.length} total keywords)`);
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

    // Optional delay between batches (default 0 = no delay)
    if (CONFIG.batchDelay > 0 && i + CONFIG.maxConcurrency < photosToProcess.length) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.batchDelay));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Processing complete!`);
  console.log(`   Total: ${photos.length}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   📍 Geocoding cache: ${getCachedLocationCount()} locations`);

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
  // Check for any vision API key
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GOOGLE_API_KEY) {
    console.error('❌ No vision API key found. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY');
    process.exit(1);
  }

  // Show which provider will be used
  console.log('🚀 Local Photo Enrichment\n');
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('🤖 Using Claude Sonnet 4 (Anthropic) - Recommended for large images');
  } else if (process.env.OPENAI_API_KEY) {
    console.log('🤖 Using GPT-4o (OpenAI)');
  } else {
    console.log('🤖 Using Gemini (Google)');
  }
  console.log(`⚡ Performance: ${CONFIG.maxConcurrency} concurrent, ${CONFIG.batchDelay}ms delay\n`);

  const targetDir = process.argv[2];

  if (!targetDir) {
    console.error('❌ No directory specified');
    console.error('\nUsage:');
    console.error('  pnpm run enrich <directory> [options]');
    console.error('\nOptions:');
    console.error('  --dry-run              Preview without making changes');
    console.error('  --overwrite            Re-enrich already enriched photos');
    console.error('  --concurrency=N        Batch size (default: 10)');
    console.error('  --delay=N              Delay between batches in ms (default: 0)');
    console.error('\nExamples:');
    console.error('  pnpm run enrich ~/Photos/exports/2025-01-20-BMX/');
    console.error('  pnpm run enrich ~/Photos/exports/latest/ --dry-run');
    console.error('  pnpm run enrich ~/Photos/exports/latest/ --concurrency=15 --delay=500');
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
