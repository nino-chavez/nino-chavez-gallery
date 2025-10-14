#!/usr/bin/env node
/**
* Intelligent Gallery Build Wrapper
*
* Smart context management with change detection and incremental updates.
*
* Features:
* - Automatic change detection (compares timestamps)
* - Incremental regeneration (only processes new/changed albums)
* - Smart rebuild decisions based on SmugMug vs local state
*
* Usage:
*   pnpm build                              # Smart decision (check for changes)
*   REBUILD_CONTEXT=true pnpm build         # Force full regeneration
*   pnpm build:check-updates                # Check if updates needed (no rebuild)
*   pnpm build:incremental                  # Incremental update only
*/

const { existsSync, readFileSync } = require('fs');
const { execSync } = require('child_process');
const { resolve } = require('path');

const CONTEXT_PATH = resolve(process.cwd(), 'gallery-context.json');
const REBUILD_CONTEXT = process.env.REBUILD_CONTEXT === 'true';
const INCREMENTAL_MODE = process.env.INCREMENTAL_ONLY === 'true';
const CHECK_ONLY = process.env.CHECK_UPDATES === 'true';
const IS_VERCEL = process.env.VERCEL === '1';

console.log('\n🔧 Intelligent Gallery Build Wrapper\n');

// Helper function to check for SmugMug updates
function checkForUpdates() {
  try {
    // Get latest album info from SmugMug (lightweight check)
    const latestInfo = execSync('tsx scripts/build-context.ts --check-latest', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const { latestAlbumDate, totalAlbums } = JSON.parse(latestInfo);

   if (!existsSync(CONTEXT_PATH)) {
     return { needsUpdate: true, reason: 'No context file exists' };
   }

   const context = JSON.parse(readFileSync(CONTEXT_PATH, 'utf8'));
   const contextDate = new Date(context.generatedAt);
   const smugmugDate = new Date(latestAlbumDate);

   if (smugmugDate > contextDate) {
     return {
       needsUpdate: true,
       reason: `New content detected (${totalAlbums} albums, latest: ${smugmugDate.toISOString()})`
     };
   }

   return { needsUpdate: false, reason: 'Content is up to date' };
 } catch (error) {
   console.warn('⚠️  Could not check for updates:', error.message);
   return { needsUpdate: true, reason: 'Update check failed, rebuilding to be safe' };
 }
}

// Main logic
const contextExists = existsSync(CONTEXT_PATH);

if (CHECK_ONLY) {
 console.log('🔍 Checking for SmugMug updates...\n');
 const result = checkForUpdates();
 console.log(`   ${result.needsUpdate ? '🔄' : '✅'} ${result.reason}`);

 if (result.needsUpdate) {
   process.exit(1); // Signal that updates are needed
 } else {
   process.exit(0); // Signal that no updates needed
 }
}

if (!contextExists) {
 console.log('⚠️  gallery-context.json not found');
 console.log('📦 Generating initial context file...\n');

 try {
   execSync('pnpm run build:context', { stdio: 'inherit' });
   console.log('\n✅ Context generated successfully\n');
 } catch (error) {
   console.error('\n❌ Failed to generate context');
   console.error('   Make sure SmugMug credentials are set in .env.local');
   process.exit(1);
 }
} else if (REBUILD_CONTEXT) {
 console.log('🔄 REBUILD_CONTEXT=true - Force full regeneration...\n');

 try {
   execSync('pnpm run build:context', { stdio: 'inherit' });
   console.log('\n✅ Context regenerated successfully\n');
 } catch (error) {
   console.error('\n❌ Failed to regenerate context');
   process.exit(1);
 }
} else if (INCREMENTAL_MODE) {
 console.log('⚡ Incremental mode - checking for new content...\n');

 const updateCheck = checkForUpdates();
 if (updateCheck.needsUpdate) {
   console.log(`   📈 ${updateCheck.reason}`);
   console.log('   🔄 Running incremental update...\n');

   try {
     execSync('pnpm run build:context --incremental', { stdio: 'inherit' });
     console.log('\n✅ Incremental update completed\n');
   } catch (error) {
     console.error('\n❌ Incremental update failed, falling back to full rebuild');
     execSync('pnpm run build:context', { stdio: 'inherit' });
   }
 } else {
   console.log(`   ${updateCheck.reason}`);
   console.log('   ⏭️  Skipping incremental update\n');
 }
} else {
 // Smart mode - check if updates needed
 console.log('🧠 Smart mode - checking for updates...\n');

 const updateCheck = checkForUpdates();
 if (updateCheck.needsUpdate) {
   console.log(`   📈 ${updateCheck.reason}`);
   console.log('   🔄 Regenerating context...\n');

   try {
     execSync('pnpm run build:context', { stdio: 'inherit' });
     console.log('\n✅ Context updated successfully\n');
   } catch (error) {
     console.error('\n❌ Failed to update context');
     process.exit(1);
   }
 } else {
   console.log(`   ${updateCheck.reason}`);

   if (IS_VERCEL) {
     console.log('   (Vercel deployment - using optimized context)');
   } else {
     console.log('   (Use REBUILD_CONTEXT=true to force regeneration)');
   }

   console.log();
 }
}

console.log('🚀 Proceeding with Next.js build...\n');
