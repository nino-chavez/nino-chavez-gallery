#!/usr/bin/env tsx
/**
 * End-to-End Image URL Validation Test
 * 
 * Tests the complete pipeline:
 * 1. Local SQLite enrichment DB URLs
 * 2. Supabase remote DB sync
 * 3. Frontend rendering capability
 * 
 * Usage:
 *   pnpm tsx scripts/e2e-image-url-test.ts --db=enrichment-gemini-production.db
 *   pnpm tsx scripts/e2e-image-url-test.ts --db=enrichment-gemini-production.db --limit=50
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import { URL } from 'url';

interface TestResult {
  stage: string;
  passed: number;
  failed: number;
  errors: string[];
  samples: any[];
}

interface URLValidationResult {
  url: string;
  status: number;
  valid: boolean;
  error?: string;
}

// Utility: HEAD request to check if URL resolves
async function validateUrl(url: string): Promise<URLValidationResult> {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const timeoutHandle = setTimeout(() => {
        resolve({
          url,
          status: 0,
          valid: false,
          error: 'Timeout after 5s',
        });
      }, 5000);

      const req = https.request(
        {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'HEAD',
          timeout: 5000,
        },
        (res) => {
          clearTimeout(timeoutHandle);
          resolve({
            url,
            status: res.statusCode || 0,
            valid: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 400,
            error:
              (res.statusCode || 0) >= 400 ? `HTTP ${res.statusCode}` : undefined,
          });
        }
      );

      req.on('error', (err) => {
        clearTimeout(timeoutHandle);
        resolve({
          url,
          status: 0,
          valid: false,
          error: err.message,
        });
      });

      req.end();
    } catch (err: any) {
      resolve({
        url,
        status: 0,
        valid: false,
        error: err.message,
      });
    }
  });
}

async function runEndToEndTest(sqliteDbPath: string, limit: number = 10) {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 END-TO-END IMAGE URL VALIDATION TEST');
  console.log('='.repeat(80) + '\n');

  const results: TestResult[] = [];

  // ============================================================
  // STAGE 1: Local SQLite Enrichment DB
  // ============================================================
  console.log('📊 STAGE 1: Local SQLite Enrichment DB\n');

  let stage1Result: TestResult = {
    stage: 'SQLite Local DB',
    passed: 0,
    failed: 0,
    errors: [],
    samples: [],
  };

  try {
    const db = new Database(sqliteDbPath);

    // Get photos with URLs
    const photos = db
      .prepare(
        `
      SELECT image_key, album_key, image_url, processed_at
      FROM photos
      WHERE status = 'processed' AND image_url IS NOT NULL
      LIMIT ?
    `
      )
      .all(limit) as any[];

    console.log(`✅ Found ${photos.length} processed photos with image_url\n`);

    if (photos.length === 0) {
      stage1Result.errors.push('No processed photos with image_url found');
      results.push(stage1Result);
    } else {
      // Validate sample URLs
      console.log(`🔗 Testing ${Math.min(5, photos.length)} URL samples for SmugMug resolution:\n`);

      for (let i = 0; i < Math.min(5, photos.length); i++) {
        const photo = photos[i];
        console.log(`  ${i + 1}. ${photo.image_key}`);
        console.log(`     URL: ${photo.image_url}`);

        const validation = await validateUrl(photo.image_url);
        console.log(
          `     Status: ${validation.status} ${validation.valid ? '✅' : '❌'}`
        );

        if (validation.error) {
          console.log(`     Error: ${validation.error}`);
          stage1Result.failed++;
          stage1Result.errors.push(
            `${photo.image_key}: ${validation.error}`
          );
        } else {
          stage1Result.passed++;
        }

        stage1Result.samples.push({
          image_key: photo.image_key,
          url: photo.image_url,
          ...validation,
        });

        console.log('');
      }

      // Count URLs by pattern
      const urlPatterns: Record<string, number> = {};
      for (const photo of photos) {
        const match = photo.image_url.match(/photos\/([^/]+)/);
        const pattern = match ? match[1] : 'unknown';
        urlPatterns[pattern] = (urlPatterns[pattern] || 0) + 1;
      }

      console.log(`📈 URL Patterns Found (${photos.length} total):`);
      for (const [pattern, count] of Object.entries(urlPatterns)) {
        console.log(`   ${pattern}: ${count} photos`);
      }

      results.push(stage1Result);
    }

    db.close();
  } catch (error: any) {
    stage1Result.errors.push(error.message);
    results.push(stage1Result);
    console.error(`❌ Stage 1 failed:`, error.message);
  }

  console.log('\n' + '-'.repeat(80) + '\n');

  // ============================================================
  // STAGE 2: Supabase Remote DB Sync Validation
  // ============================================================
  console.log('📊 STAGE 2: Supabase Remote DB Sync\n');

  let stage2Result: TestResult = {
    stage: 'Supabase Remote DB',
    passed: 0,
    failed: 0,
    errors: [],
    samples: [],
  };

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch same photos from Supabase
    const { data: remotePhotos, error } = await supabase
      .from('photo_metadata')
      .select('photo_id, image_key, ImageUrl, OriginalUrl, ThumbnailUrl')
      .limit(limit);

    if (error) {
      stage2Result.errors.push(`Supabase query failed: ${error.message}`);
      results.push(stage2Result);
      console.error(`❌ Failed to fetch from Supabase:`, error);
    } else {
      console.log(`✅ Found ${remotePhotos?.length || 0} photos in Supabase\n`);

      if (remotePhotos && remotePhotos.length > 0) {
        // Get URL statistics
        const stats = {
          totalPhotos: remotePhotos.length,
          withImageUrl: remotePhotos.filter((p: any) => p.ImageUrl).length,
          withOriginalUrl: remotePhotos.filter((p: any) => p.OriginalUrl)
            .length,
          withThumbnailUrl: remotePhotos.filter((p: any) => p.ThumbnailUrl)
            .length,
        };

        console.log('📊 URL Column Statistics:');
        console.log(`   Total photos: ${stats.totalPhotos}`);
        console.log(
          `   With ImageUrl: ${stats.withImageUrl} (${((stats.withImageUrl / stats.totalPhotos) * 100).toFixed(1)}%)`
        );
        console.log(
          `   With OriginalUrl: ${stats.withOriginalUrl} (${((stats.withOriginalUrl / stats.totalPhotos) * 100).toFixed(1)}%)`
        );
        console.log(
          `   With ThumbnailUrl: ${stats.withThumbnailUrl} (${((stats.withThumbnailUrl / stats.totalPhotos) * 100).toFixed(1)}%)\n`
        );

        // Test sample URLs
        console.log(`🔗 Testing ${Math.min(5, remotePhotos.length)} Supabase URLs:\n`);

        for (let i = 0; i < Math.min(5, remotePhotos.length); i++) {
          const photo = remotePhotos[i];
          const url = photo.ImageUrl || photo.OriginalUrl;

          console.log(`  ${i + 1}. ${photo.image_key}`);
          console.log(`     ImageUrl: ${photo.ImageUrl || 'NULL'}`);
          console.log(`     OriginalUrl: ${photo.OriginalUrl || 'NULL'}`);

          if (url) {
            const validation = await validateUrl(url);
            console.log(
              `     Status: ${validation.status} ${validation.valid ? '✅' : '❌'}`
            );

            if (validation.error) {
              console.log(`     Error: ${validation.error}`);
              stage2Result.failed++;
            } else {
              stage2Result.passed++;
            }

            stage2Result.samples.push({
              image_key: photo.image_key,
              url,
              ...validation,
            });
          } else {
            console.log(`     ❌ No URL in ImageUrl or OriginalUrl`);
            stage2Result.failed++;
            stage2Result.errors.push(`${photo.image_key}: Missing both URLs`);
          }

          console.log('');
        }
      }

      results.push(stage2Result);
    }
  } catch (error: any) {
    stage2Result.errors.push(error.message);
    results.push(stage2Result);
    console.error(`❌ Stage 2 failed:`, error.message);
  }

  console.log('\n' + '-'.repeat(80) + '\n');

  // ============================================================
  // STAGE 3: Frontend Usage Validation
  // ============================================================
  console.log('📊 STAGE 3: Frontend URL Usage Logic\n');

  let stage3Result: TestResult = {
    stage: 'Frontend Rendering',
    passed: 0,
    failed: 0,
    errors: [],
    samples: [],
  };

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test the frontend's URL resolution logic
    const { data: frontendTestPhotos } = await supabase
      .from('photo_metadata')
      .select('photo_id, image_key, ImageUrl, OriginalUrl')
      .limit(10);

    if (frontendTestPhotos && frontendTestPhotos.length > 0) {
      console.log(`🎨 Testing frontend URL resolution logic:\n`);

      for (let i = 0; i < Math.min(5, frontendTestPhotos.length); i++) {
        const row = frontendTestPhotos[i];
        // This mimics the frontend logic from src/lib/supabase/client.ts line 76
        const imageUrl =
          row.ImageUrl || row.OriginalUrl || `/api/smugmug/images/${row.image_key}`;

        console.log(`  ${i + 1}. ${row.image_key}`);
        console.log(`     Resolved URL: ${imageUrl}`);

        // Check if URL is absolute and resolves
        if (imageUrl.startsWith('http')) {
          const validation = await validateUrl(imageUrl);
          console.log(
            `     Status: ${validation.status} ${validation.valid ? '✅' : '❌'}`
          );

          if (validation.error) {
            console.log(`     Error: ${validation.error}`);
            stage3Result.failed++;
            stage3Result.errors.push(
              `${row.image_key}: ${validation.error}`
            );
          } else {
            stage3Result.passed++;
          }

          stage3Result.samples.push({
            image_key: row.image_key,
            url: imageUrl,
            ...validation,
          });
        } else {
          console.log(`     ℹ️  Relative URL (backend proxy)`);
          stage3Result.samples.push({
            image_key: row.image_key,
            url: imageUrl,
            valid: true,
            status: 'relative',
          });
        }

        console.log('');
      }
    }

    results.push(stage3Result);
  } catch (error: any) {
    stage3Result.errors.push(error.message);
    results.push(stage3Result);
    console.error(`❌ Stage 3 failed:`, error.message);
  }

  // ============================================================
  // SUMMARY REPORT
  // ============================================================
  console.log('\n' + '='.repeat(80));
  console.log('📋 TEST SUMMARY REPORT');
  console.log('='.repeat(80) + '\n');

  let totalPassed = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  for (const result of results) {
    totalPassed += result.passed;
    totalFailed += result.failed;
    allErrors.push(...result.errors);

    console.log(`${result.stage}:`);
    console.log(`  ✅ Passed: ${result.passed}`);
    console.log(`  ❌ Failed: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log(`  Errors:`);
      for (const err of result.errors.slice(0, 3)) {
        console.log(`    - ${err}`);
      }
      if (result.errors.length > 3) {
        console.log(`    ... and ${result.errors.length - 3} more`);
      }
    }
    console.log('');
  }

  console.log('-'.repeat(80) + '\n');
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);

  if (totalFailed === 0 && totalPassed > 0) {
    console.log(
      '\n✨ All tests passed! Image URL pipeline is working correctly.\n'
    );
  } else if (totalFailed > 0) {
    console.log('\n⚠️  Some tests failed. See errors above.\n');
  } else {
    console.log('\n⚠️  No tests were executed. Check your configuration.\n');
  }

  console.log('='.repeat(80) + '\n');

  // Save detailed report
  const reportPath = `test-results/e2e-image-url-${Date.now()}.json`;
  console.log(`📄 Detailed report saved to: ${reportPath}`);

  const fs = await import('fs/promises');
  await fs.mkdir('test-results', { recursive: true });
  await fs.writeFile(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          totalPassed,
          totalFailed,
          totalTests: totalPassed + totalFailed,
        },
        stages: results,
      },
      null,
      2
    )
  );
}

// CLI usage
const dbPath = process.argv
  .find((arg) => arg.startsWith('--db='))
  ?.split('=')[1];
const limitArg = process.argv
  .find((arg) => arg.startsWith('--limit='))
  ?.split('=')[1];
const limit = limitArg ? parseInt(limitArg) : 10;

if (!dbPath) {
  console.error('❌ Usage: pnpm tsx scripts/e2e-image-url-test.ts --db=<path>');
  console.error(
    '❌ Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
  );
  process.exit(1);
}

runEndToEndTest(dbPath, limit).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});