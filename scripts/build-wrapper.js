#!/usr/bin/env node
/**
 * Build Wrapper Script
 *
 * Intelligently decides whether to regenerate gallery-context.json before build.
 *
 * Scenarios:
 * 1. Local builds: Use committed gallery-context.json (fast)
 * 2. Force regeneration: Set REBUILD_CONTEXT=true (when albums change)
 * 3. Missing context: Auto-generate if gallery-context.json doesn't exist
 *
 * Usage:
 *   pnpm build                              # Uses committed context (fast)
 *   REBUILD_CONTEXT=true pnpm build         # Regenerates context (slow)
 *   pnpm build:force-context                # Always regenerates (explicit)
 */

const { existsSync } = require('fs');
const { execSync } = require('child_process');
const { resolve } = require('path');

const CONTEXT_PATH = resolve(process.cwd(), 'gallery-context.json');
const REBUILD_CONTEXT = process.env.REBUILD_CONTEXT === 'true';
const IS_VERCEL = process.env.VERCEL === '1';

console.log('\n🔧 Gallery Build Wrapper\n');

// Check if context file exists
const contextExists = existsSync(CONTEXT_PATH);

if (!contextExists) {
  console.log('⚠️  gallery-context.json not found');
  console.log('📦 Generating context file...\n');

  try {
    execSync('pnpm run build:context', { stdio: 'inherit' });
    console.log('\n✅ Context generated successfully\n');
  } catch (error) {
    console.error('\n❌ Failed to generate context');
    console.error('   Make sure SmugMug credentials are set in .env.local');
    process.exit(1);
  }
} else if (REBUILD_CONTEXT) {
  console.log('🔄 REBUILD_CONTEXT=true - Regenerating context...\n');

  try {
    execSync('pnpm run build:context', { stdio: 'inherit' });
    console.log('\n✅ Context regenerated successfully\n');
  } catch (error) {
    console.error('\n❌ Failed to regenerate context');
    process.exit(1);
  }
} else {
  console.log('✅ Using existing gallery-context.json');

  if (IS_VERCEL) {
    console.log('   (Vercel deployment - using committed context for fast builds)');
  } else {
    console.log('   (Set REBUILD_CONTEXT=true to force regeneration)');
  }

  console.log();
}

console.log('🚀 Proceeding with Next.js build...\n');
