#!/usr/bin/env tsx
/**
 * End-to-End Metadata Test
 * 1. Enrich one photo with Phase 1 metadata
 * 2. Upload to SmugMug Demo album
 * 3. Retrieve via API and verify metadata
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { readFile } from 'fs/promises';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { execSync } from 'child_process';

const DEMO_ALBUM_KEY = 'qjMSL2';
const TEST_PHOTO = '/Users/nino/Workspace/01-editing/export/photos/carthage/carthage-womens-vball-50.jpg';

const oauth = new OAuth({
  consumer: {
    key: process.env.SMUGMUG_API_KEY || '',
    secret: process.env.SMUGMUG_API_SECRET || '',
  },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString, key) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64');
  },
});

const token = {
  key: process.env.SMUGMUG_ACCESS_TOKEN || '',
  secret: process.env.SMUGMUG_ACCESS_TOKEN_SECRET || '',
};

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
  const data = await response.json();
  return data.Response;
}

async function uploadPhoto(photoPath: string, albumKey: string) {
  console.log('\n📤 Uploading photo to SmugMug...');

  // Upload photo
  const photoBuffer = await readFile(photoPath);
  const fileName = photoPath.split('/').pop();

  const uploadUrl = `https://upload.smugmug.com/${fileName}`;
  const uploadRequest = { url: uploadUrl, method: 'POST' };
  const authHeader = oauth.toHeader(oauth.authorize(uploadRequest, token));

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      ...authHeader,
      'X-Smug-AlbumUri': `/api/v2/album/${albumKey}`,
      'X-Smug-FileName': fileName || '',
      'X-Smug-ResponseType': 'JSON',
      'Content-Type': 'application/octet-stream',
      'Content-Length': photoBuffer.length.toString(),
    },
    body: photoBuffer,
  });

  const uploadData = await uploadResponse.json();

  if (uploadData.stat === 'ok') {
    console.log(`✅ Photo uploaded successfully`);
    console.log(`   Image URI: ${uploadData.Image.ImageUri}`);
    return uploadData.Image.ImageUri;
  } else {
    throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
  }
}

async function getImageMetadata(imageUri: string) {
  console.log('\n🔍 Retrieving metadata from SmugMug...');

  const imageData = await smugmugRequest(imageUri);
  const image = imageData.Image;

  console.log(`\n📊 SmugMug Metadata:`);
  console.log(`   Title: ${image.Title || '(none)'}`);
  console.log(`   Caption: ${image.Caption || '(none)'}`);
  console.log(`   Keywords: ${image.Keywords || '(none)'}`);

  return image;
}

function getLocalMetadata(photoPath: string) {
  console.log('\n📁 Local EXIF Metadata:');

  try {
    const exifJson = execSync(`exiftool -json -Title -Caption-Abstract -Keywords "${photoPath}"`, {
      encoding: 'utf-8',
    });
    const exif = JSON.parse(exifJson)[0];

    console.log(`   Title: ${exif.Title || '(none)'}`);
    console.log(`   Caption: ${exif['Caption-Abstract'] || '(none)'}`);

    const keywords = Array.isArray(exif.Keywords)
      ? exif.Keywords
      : exif.Keywords?.split(',').map((k: string) => k.trim());

    console.log(`   Keywords (${keywords?.length || 0} total):`);
    if (keywords) {
      // Show Phase 1 keywords
      const phase1Keywords = keywords.filter((k: string) =>
        k.startsWith('style:') ||
        k.startsWith('challenge:') ||
        k.startsWith('technique:') ||
        k.startsWith('camera:') ||
        k.startsWith('lens:') ||
        k.startsWith('iso:') ||
        k.startsWith('venue:') ||
        k.startsWith('season:') ||
        k.startsWith('month:') ||
        k.startsWith('year:') ||
        k.startsWith('gender:')
      );

      console.log(`   Phase 1 Keywords (${phase1Keywords.length}):`);
      phase1Keywords.forEach(k => console.log(`     - ${k}`));
    }

    return exif;
  } catch (error) {
    console.error(`❌ Error reading EXIF: ${error}`);
    return null;
  }
}

function compareMetadata(local: any, smugmug: any) {
  console.log(`\n🔬 Metadata Comparison:`);

  // Title
  const titleMatch = local.Title === smugmug.Title;
  console.log(`   Title: ${titleMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
  if (!titleMatch) {
    console.log(`     Local:    ${local.Title}`);
    console.log(`     SmugMug:  ${smugmug.Title}`);
  }

  // Caption
  const captionMatch = local['Caption-Abstract'] === smugmug.Caption;
  console.log(`   Caption: ${captionMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
  if (!captionMatch) {
    console.log(`     Local:    ${local['Caption-Abstract']}`);
    console.log(`     SmugMug:  ${smugmug.Caption}`);
  }

  // Keywords
  const localKeywords = Array.isArray(local.Keywords)
    ? local.Keywords
    : local.Keywords?.split(',').map((k: string) => k.trim()) || [];

  const smugmugKeywords = smugmug.Keywords
    ? smugmug.Keywords.split(';').map((k: string) => k.trim())
    : [];

  console.log(`   Keywords: ${localKeywords.length} local, ${smugmugKeywords.length} in SmugMug`);

  // Check if Phase 1 keywords made it through
  const phase1KeywordsLocal = localKeywords.filter((k: string) =>
    k.startsWith('style:') ||
    k.startsWith('venue:') ||
    k.startsWith('season:')
  );

  const phase1KeywordsSmugMug = smugmugKeywords.filter((k: string) =>
    k.startsWith('style:') ||
    k.startsWith('venue:') ||
    k.startsWith('season:')
  );

  console.log(`   Phase 1 Keywords: ${phase1KeywordsLocal.length} local, ${phase1KeywordsSmugMug.length} in SmugMug`);

  if (phase1KeywordsSmugMug.length > 0) {
    console.log(`   ✅ Phase 1 metadata preserved in SmugMug!`);
    console.log(`   Sample Phase 1 keywords in SmugMug:`);
    phase1KeywordsSmugMug.slice(0, 5).forEach(k => console.log(`     - ${k}`));
  } else {
    console.log(`   ⚠️  Phase 1 keywords not found in SmugMug`);
  }
}

async function main() {
  console.log('🧪 End-to-End Metadata Test\n');
  console.log('='.repeat(60));

  // Step 1: Check local metadata
  console.log('\n📋 Step 1: Check local metadata');
  const localMetadata = getLocalMetadata(TEST_PHOTO);

  if (!localMetadata) {
    console.error('❌ Could not read local metadata');
    return;
  }

  // Step 2: Upload to SmugMug
  console.log('\n📋 Step 2: Upload to SmugMug Demo album');
  const imageUri = await uploadPhoto(TEST_PHOTO, DEMO_ALBUM_KEY);

  // Wait a moment for SmugMug to process
  console.log('\n⏳ Waiting 3 seconds for SmugMug to process...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 3: Retrieve from SmugMug
  console.log('\n📋 Step 3: Retrieve metadata from SmugMug');
  const smugmugMetadata = await getImageMetadata(imageUri);

  // Step 4: Compare
  console.log('\n📋 Step 4: Compare metadata');
  compareMetadata(localMetadata, smugmugMetadata);

  console.log('\n' + '='.repeat(60));
  console.log('✅ End-to-End Test Complete!');
}

main().catch(console.error);
