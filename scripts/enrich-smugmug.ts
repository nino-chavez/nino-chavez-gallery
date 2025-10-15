#!/usr/bin/env tsx
/**
 * SmugMug Collection Enrichment Script with SQLite State Management
 *
 * Usage:
 *   pnpm run enrich:smugmug --model=gemini --gemini-model=models/gemini-1.5-flash-002 --concurrency=2 --run-name=production
 *   pnpm run enrich:smugmug --model=gemini --gemini-model=models/gemini-2.5-pro-002 --concurrency=2 --cost-cap=300
 *   pnpm run enrich:smugmug --model=claude --age-filter="<24months" --concurrency=50
 *   pnpm run enrich:smugmug --model=gemini --limit=10 --run-name=test
 *   pnpm run enrich:smugmug --validate-only
 *   pnpm run enrich:smugmug --dry-run --limit=10
 *
 * Options:
 *   --model=<claude|gemini>          AI model to use
 *   --gemini-model=<model-name>      Explicit Gemini model (e.g., models/gemini-1.5-flash-002, models/gemini-2.5-pro-002)
 *   --age-filter=<"<24months"|">24months">  Filter photos by age
 *   --concurrency=<number>           Number of parallel requests (default: 50)
 *   --limit=<number>                 Limit number of photos to process
 *   --run-name=<string>              Custom name for this run (default: timestamp)
 *   --cost-cap=<number>              Maximum cost in dollars (default: 60.0)
 *   --dry-run                        Simulate without calling APIs
 *   --validate-only                  Validate configuration without processing
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import Database from 'better-sqlite3';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { analyzePhoto as analyzePhotoWithVision } from './vision-client.js';
import chalk from 'chalk';

// Configuration
interface Config {
  model: 'claude' | 'gemini';
  geminiModel?: string;
  ageFilter: '<24months' | '>24months';
  concurrency: number;
  dryRun: boolean;
  validateOnly: boolean;
  limit?: number;
  costCap: number;
  runName?: string;
}

function parseArgs(): Config {
  const args = process.argv.slice(2);
  const config: Config = {
    model: 'claude',
    ageFilter: '<24months',
    concurrency: 50,
    dryRun: args.includes('--dry-run'),
    validateOnly: args.includes('--validate-only'),
    costCap: 60.0,
  };

  const modelArg = args.find(arg => arg.startsWith('--model='));
  if (modelArg) config.model = modelArg.split('=')[1] as 'claude' | 'gemini';

  const geminiModelArg = args.find(arg => arg.startsWith('--gemini-model='));
  if (geminiModelArg) config.geminiModel = geminiModelArg.split('=')[1].replace(/["']/g, '');

  const ageArg = args.find(arg => arg.startsWith('--age-filter='));
  if (ageArg) config.ageFilter = ageArg.split('=')[1].replace(/["']/g, '') as any;

  const concurrencyArg = args.find(arg => arg.startsWith('--concurrency='));
  if (concurrencyArg) config.concurrency = parseInt(concurrencyArg.split('=')[1]);

  const limitArg = args.find(arg => arg.startsWith('--limit='));
  if (limitArg) config.limit = parseInt(limitArg.split('=')[1]);

  const costCapArg = args.find(arg => arg.startsWith('--cost-cap='));
  if (costCapArg) config.costCap = parseFloat(costCapArg.split('=')[1]);

  const runNameArg = args.find(arg => arg.startsWith('--run-name='));
  if (runNameArg) config.runName = runNameArg.split('=')[1].replace(/["']/g, '');

  return config;
}

// SQLite Database
function initDatabase(model: string, runName?: string): Database.Database {
  // Generate database name with timestamp or custom run name
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dbName = runName || timestamp;
  const dbPath = `enrichment-${model}-${dbName}.db`;

  console.log(chalk.gray(`   Database: ${dbPath}`));

  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS photos (
      image_key TEXT PRIMARY KEY,
      album_key TEXT NOT NULL,
      album_name TEXT,
      image_url TEXT,
      status TEXT DEFAULT 'pending',
      metadata_json TEXT,
      cost REAL DEFAULT 0,
      attempts INTEGER DEFAULT 0,
      last_error TEXT,
      processed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_status ON photos(status);
    CREATE INDEX IF NOT EXISTS idx_album ON photos(album_key);
  `);

  return db;
}

// SmugMug OAuth (for future metadata writes)
const oauth = new OAuth({
  consumer: { key: process.env.SMUGMUG_API_KEY!, secret: process.env.SMUGMUG_API_SECRET! },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString, key) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64');
  },
});

// Age Filtering
function get24MonthCutoffDate(): Date {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 24);
  return cutoff;
}

function filterAlbumsByAge(albums: any[], ageFilter: '<24months' | '>24months'): any[] {
  const cutoff = get24MonthCutoffDate();
  return albums.filter(album => {
    const lastUpdated = new Date(album.lastUpdated);
    return ageFilter === '<24months' ? lastUpdated >= cutoff : lastUpdated < cutoff;
  });
}

// Pre-validation
async function validateAndInitialize(config: Config, db: Database.Database) {
  console.log(chalk.cyan('\n🔍 Pre-flight Validation\n'));

  if (!existsSync('gallery-context.json')) {
    throw new Error('gallery-context.json not found. Run: pnpm run build:context');
  }

  const context = JSON.parse(readFileSync('gallery-context.json', 'utf-8'));
  const allAlbums = context.albums || [];

  console.log(`   Total albums: ${allAlbums.length}`);
  console.log(`   Total photos: ${context.totalPhotos}`);

  const filteredAlbums = filterAlbumsByAge(allAlbums, config.ageFilter);
  const filteredPhotos = filteredAlbums.reduce((sum: number, a: any) => sum + a.photoCount, 0);

  console.log(`\n   Age filter: ${config.ageFilter}`);
  console.log(`   Filtered albums: ${filteredAlbums.length}`);
  console.log(`   Filtered photos: ${filteredPhotos}`);

  let photosToProcess = filteredPhotos;
  if (config.limit) {
    photosToProcess = Math.min(config.limit, filteredPhotos);
    console.log(chalk.yellow(`\n   ⚠️  Limit applied: processing only ${photosToProcess} photos`));
  }

  // Get accurate cost estimate using the vision client's pricing
  const { estimateCost, getProviderName } = await import('./vision-client.js');
  const estimatedCost = estimateCost(photosToProcess, config.model, config.geminiModel);
  const costPerPhoto = estimatedCost / photosToProcess;
  const estimatedTime = photosToProcess / 1500;
  const modelName = getProviderName(config.geminiModel);

  console.log(`\n   Model: ${modelName}`);
  if (config.model === 'gemini' && config.geminiModel) {
    console.log(chalk.cyan(`   Gemini Model: ${config.geminiModel}`));
  }
  console.log(`   Cost per photo: $${costPerPhoto.toFixed(6)}`);
  console.log(chalk.bold(`   Estimated cost: $${estimatedCost.toFixed(2)}`));
  console.log(`   Estimated time: ${estimatedTime.toFixed(1)} hours`);

  if (estimatedCost > config.costCap) {
    throw new Error(`Estimated cost ($${estimatedCost.toFixed(2)}) exceeds cap ($${config.costCap})`);
  }

  // Initialize database
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM photos').get() as any;

  if (existingCount.count === 0) {
    console.log(chalk.cyan('\n📝 Initializing database...'));

    const insert = db.prepare(`
      INSERT OR IGNORE INTO photos (image_key, album_key, album_name, image_url, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);

    const transaction = db.transaction((albums: any[]) => {
      let count = 0;
      for (const album of albums) {
        if (config.limit && count >= config.limit) break;

        for (const photo of album.photos || []) {
          if (config.limit && count >= config.limit) break;
          insert.run(photo.imageKey, album.albumKey, album.name, photo.imageUrl);
          count++;
        }
      }
    });

    transaction(filteredAlbums);
    console.log(chalk.green(`   ✅ Initialized ${photosToProcess} photos in database`));
  } else {
    console.log(chalk.green(`\n   ✅ Resuming from existing database (${existingCount.count} photos)`));
  }

  return { totalPhotos: photosToProcess, estimatedCost };
}

// Progress Tracking
function getProgress(db: Database.Database) {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status='processed' THEN 1 ELSE 0 END) as processed,
      SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN cost > 0 THEN cost ELSE 0 END) as total_cost
    FROM photos
  `).get() as any;

  return {
    total: stats.total || 0,
    processed: stats.processed || 0,
    failed: stats.failed || 0,
    pending: stats.pending || 0,
    totalCost: stats.total_cost || 0,
  };
}

function printProgress(stats: any, startTime: Date) {
  const elapsed = (Date.now() - startTime.getTime()) / 1000 / 3600;
  const rate = elapsed > 0 ? stats.processed / elapsed : 0;
  const remaining = rate > 0 ? stats.pending / rate : 0;
  const percentComplete = stats.total > 0 ? ((stats.processed + stats.failed) / stats.total) * 100 : 0;

  console.log(chalk.cyan('\n━'.repeat(60)));
  console.log(chalk.bold('📊 Progress'));
  console.log(chalk.cyan('━'.repeat(60)));
  console.log(`   Processed: ${stats.processed.toLocaleString()} / ${stats.total.toLocaleString()} (${percentComplete.toFixed(1)}%)`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Pending: ${stats.pending.toLocaleString()}`);
  console.log(`   Cost: $${stats.totalCost.toFixed(2)}`);
  console.log(`   Speed: ${Math.round(rate * 60)} photos/hour`);
  console.log(`   Elapsed: ${elapsed.toFixed(1)}h | Remaining: ${remaining.toFixed(1)}h`);
  console.log(chalk.cyan('━'.repeat(60)));
}

// Enrichment Logic with retry
async function enrichPhoto(
  photo: any,
  config: Config,
  db: Database.Database,
  retryCount = 0
): Promise<{ success: boolean; cost: number }> {
  const maxRetries = 3;

  try {
    let result, cost = 0;

    if (config.dryRun) {
      result = { mock: true, title: 'Dry Run', cost: 0 };
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate API delay
    } else {
      result = await analyzePhotoWithVision(
        photo.image_url,
        {
          sport: 'sports',
          eventName: photo.album_name,
          albumName: photo.album_name,
        },
        config.model, // Pass the model parameter
        config.geminiModel // Pass the explicit Gemini model if specified
      );
      cost = result.cost;
    }

    // Update database
    db.prepare(`
      UPDATE photos
      SET status = 'processed',
          metadata_json = ?,
          cost = ?,
          processed_at = ?
      WHERE image_key = ?
    `).run(
      JSON.stringify(result),
      cost,
      new Date().toISOString(),
      photo.image_key
    );

    return { success: true, cost };
  } catch (error: any) {
    // Check if it's a rate limit error (429)
    const is429 = error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.message?.includes('Quota exceeded');

    if (is429 && retryCount < maxRetries) {
      // Extract retry delay from error message if available
      const retryMatch = error.message.match(/retry in (\d+(?:\.\d+)?)/i);
      const retryDelaySeconds = retryMatch ? parseFloat(retryMatch[1]) : Math.pow(2, retryCount) * 5;

      console.log(chalk.yellow(`   ⏳ Rate limit hit for ${photo.image_key}, retrying in ${retryDelaySeconds.toFixed(1)}s (attempt ${retryCount + 1}/${maxRetries})`));
      await new Promise(resolve => setTimeout(resolve, retryDelaySeconds * 1000));

      // Retry
      return enrichPhoto(photo, config, db, retryCount + 1);
    }

    // Permanent failure
    db.prepare(`
      UPDATE photos
      SET status = 'failed',
          attempts = attempts + 1,
          last_error = ?
      WHERE image_key = ?
    `).run(error.message || String(error), photo.image_key);

    console.error(chalk.red(`   ❌ Failed: ${photo.image_key}: ${error.message}`));
    return { success: false, cost: 0 };
  }
}

// Main
async function main() {
  const config = parseArgs();
  const startTime = new Date();

  console.log(chalk.bold.cyan('\n🚀 SmugMug Collection Enrichment\n'));
  console.log(`   Provider: ${config.model}`);
  if (config.model === 'gemini') {
    const geminiModel = config.geminiModel || process.env.GEMINI_MODEL || 'models/gemini-1.5-flash-002';
    console.log(chalk.bold.yellow(`   Gemini Model: ${geminiModel}`));
    if (!config.geminiModel && !process.env.GEMINI_MODEL) {
      console.log(chalk.yellow(`   ⚠️  Using default Flash model. Use --gemini-model to specify Pro or other models.`));
    }
  }
  console.log(`   Age filter: ${config.ageFilter}`);
  console.log(`   Concurrency: ${config.concurrency}`);
  console.log(`   Dry run: ${config.dryRun ? 'Yes' : 'No'}`);

  // Ensure cache directory exists
  mkdirSync(`cache/${config.model}-metadata`, { recursive: true });

  // Initialize database
  const db = initDatabase(config.model, config.runName);

  // Validate and initialize
  const validation = await validateAndInitialize(config, db);

  if (config.validateOnly) {
    console.log(chalk.green('\n✅ Validation complete\n'));
    db.close();
    return;
  }

  // Graceful shutdown
  let shuttingDown = false;
  process.on('SIGINT', () => {
    if (shuttingDown) process.exit(1);
    shuttingDown = true;
    console.log(chalk.yellow('\n⚠️  Shutting down gracefully...'));
    printProgress(getProgress(db), startTime);
    db.close();
    console.log(chalk.green('✅ Database closed. Safe to exit.\n'));
    process.exit(0);
  });

  // Main enrichment loop
  console.log(chalk.cyan('\n🔄 Starting enrichment...\n'));

  let batchNum = 0;
  let totalProcessed = 0;
  const batchStartTimes: number[] = [];

  // Rate limiting: For Gemini 2.5 Pro, limit is 150 RPM
  // With concurrency=100, we need to throttle batches
  const isGemini = config.model === 'gemini';
  const rpmLimit = 150;
  const batchDelayMs = isGemini ? (config.concurrency / rpmLimit) * 60 * 1000 : 0;

  console.log(chalk.gray(`   Rate limit: ${isGemini ? `${rpmLimit} RPM, batch delay ${(batchDelayMs / 1000).toFixed(1)}s` : 'None (Claude)'}\n`));

  while (true) {
    const batchStartTime = Date.now();

    // Get next batch
    const pending = db.prepare(`
      SELECT * FROM photos
      WHERE status = 'pending'
      LIMIT ?
    `).all(config.concurrency) as any[];

    if (pending.length === 0) {
      console.log(chalk.green('\n✅ All photos processed!'));
      break;
    }

    // Process batch in parallel
    const results = await Promise.allSettled(
      pending.map(photo => enrichPhoto(photo, config, db))
    );

    batchNum++;
    totalProcessed += results.length;

    // Calculate actual batch duration
    const batchDuration = Date.now() - batchStartTime;
    batchStartTimes.push(batchDuration);

    // Print progress every 5 batches
    if (batchNum % 5 === 0 || pending.length < config.concurrency) {
      printProgress(getProgress(db), startTime);
    } else {
      // Quick status
      const stats = getProgress(db);
      console.log(chalk.gray(`   Batch ${batchNum}: ${stats.processed}/${stats.total} ($${stats.totalCost.toFixed(2)}) [${(batchDuration / 1000).toFixed(1)}s]`));
    }

    // Throttle if needed (only for Gemini to respect RPM limit)
    if (isGemini && batchDelayMs > batchDuration) {
      const waitTime = batchDelayMs - batchDuration;
      console.log(chalk.gray(`   ⏱️  Throttling ${(waitTime / 1000).toFixed(1)}s to respect rate limit`));
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Force garbage collection every 20 batches to prevent memory buildup
    if (batchNum % 20 === 0 && global.gc) {
      console.log(chalk.gray(`   🗑️  Running garbage collection (batch ${batchNum})`));
      global.gc();
    }
  }

  // Final summary
  const finalStats = getProgress(db);
  console.log(chalk.bold.green('\n🎉 Enrichment Complete!\n'));
  printProgress(finalStats, startTime);

  // Save summary with matching filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dbName = config.runName || timestamp;
  const summaryPath = `enrichment-${config.model}-${dbName}-summary.json`;

  const summary = {
    ...finalStats,
    model: config.model,
    ageFilter: config.ageFilter,
    concurrency: config.concurrency,
    runName: dbName,
    startTime: startTime.toISOString(),
    endTime: new Date().toISOString(),
    duration: ((Date.now() - startTime.getTime()) / 1000 / 3600).toFixed(2) + 'h',
  };

  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log(chalk.cyan(`\n📄 Summary saved: ${summaryPath}\n`));

  db.close();
}

main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});
