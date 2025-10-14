#!/usr/bin/env tsx
/**
 * Gallery Context Builder
 *
 * Fetches all enriched photo metadata from SmugMug and generates
 * a gallery-context.json file for the Next.js app.
 *
 * This context includes:
 * - Album structure
 * - Photo metadata (titles, captions, keywords)
 * - Event clustering data
 * - Search optimization data
 *
 * Usage:
 *   pnpm run build:context              # Full rebuild
 *   pnpm run build:context --incremental # Only fetch updates
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { writeFile } from 'fs/promises';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

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

interface Photo {
  imageKey: string;
  fileName: string;
  title: string;
  caption: string;
  keywords: string[];
  uploadDate: string;
  imageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

interface Album {
  albumKey: string;
  name: string;
  description: string;
  urlName: string;
  photoCount: number;
  createdDate: string;
  lastUpdated: string;
  photos: Photo[];
}

interface GalleryContext {
  username: string;
  generatedAt: string;
  totalAlbums: number;
  totalPhotos: number;
  enrichedPhotos: number;
  albums: Album[];
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

  const user = await getAuthUser();
  console.log(`   User: ${user.NickName}`);

  const response = await smugmugRequest(user.Uris.UserAlbums.Uri);
  return response.Album || [];
}

/**
 * Get album images with metadata
 */
async function getAlbumImages(albumKey: string): Promise<any[]> {
  const response = await smugmugRequest(`/api/v2/album/${albumKey}!images`);
  return response.AlbumImage || [];
}

/**
 * Get image sizes for thumbnails and display (use direct properties, skip extra API call)
 */
function getImageSizes(image: any): { thumbnail: string; display: string } {
  return {
    thumbnail: image.ThumbnailUrl || image.ThumbImageUrl || '',
    display: image.MediumImageUrl || image.LargeImageUrl || image.ArchivedUri || '',
  };
}

/**
 * Process single album
 */
async function processAlbum(album: any): Promise<Album> {
  console.log(`\n📂 Processing: ${album.Name}`);

  const images = await getAlbumImages(album.AlbumKey);
  console.log(`   Images: ${images.length}`);

  const photos: Photo[] = [];
  let enrichedCount = 0;

  for (const image of images) {
    // Skip videos
    if (image.IsVideo) continue;

    // Check if enriched
    const isEnriched = !!(
      image.Title &&
      image.Caption &&
      image.Keywords &&
      image.Keywords.split(';').length >= 15
    );

    if (isEnriched) enrichedCount++;

    // Get image URLs
    const urls = getImageSizes(image);

    photos.push({
      imageKey: image.ImageKey,
      fileName: image.FileName,
      title: image.Title || '',
      caption: image.Caption || '',
      keywords: image.Keywords ? image.Keywords.split(';').map((k: string) => k.trim()) : [],
      uploadDate: image.UploadDate || image.DateAdded,
      imageUrl: urls.display,
      thumbnailUrl: urls.thumbnail,
      width: image.OriginalWidth || 0,
      height: image.OriginalHeight || 0,
    });
  }

  console.log(`   ✅ Processed ${photos.length} photos (${enrichedCount} enriched)`);

  return {
    albumKey: album.AlbumKey,
    name: album.Name,
    description: album.Description || '',
    urlName: album.UrlName,
    photoCount: photos.length,
    createdDate: album.DateAdded,
    lastUpdated: album.LastUpdated,
    photos,
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Building Gallery Context\n');

  // Validate environment
  if (!process.env.SMUGMUG_API_KEY) {
    console.error('❌ SmugMug credentials not set');
    process.exit(1);
  }

  const startTime = Date.now();

  // Fetch albums
  const albums = await getAlbums();
  console.log(`📚 Found ${albums.length} albums\n`);

  // Process albums
  const processedAlbums: Album[] = [];
  let totalPhotos = 0;
  let enrichedPhotos = 0;

  for (const album of albums) {
    const processed = await processAlbum(album);
    processedAlbums.push(processed);

    totalPhotos += processed.photoCount;
    enrichedPhotos += processed.photos.filter(
      p => p.title && p.caption && p.keywords.length >= 15
    ).length;
  }

  // Build context
  const user = await getAuthUser();
  const context: GalleryContext = {
    username: user.NickName,
    generatedAt: new Date().toISOString(),
    totalAlbums: processedAlbums.length,
    totalPhotos,
    enrichedPhotos,
    albums: processedAlbums,
  };

  // Write to file
  const outputPath = resolve(process.cwd(), 'gallery-context.json');
  await writeFile(outputPath, JSON.stringify(context, null, 2), 'utf-8');

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Gallery Context Built!\n');
  console.log(`   Username: ${context.username}`);
  console.log(`   Albums: ${context.totalAlbums}`);
  console.log(`   Total photos: ${context.totalPhotos}`);
  console.log(`   Enriched: ${context.enrichedPhotos} (${((enrichedPhotos / totalPhotos) * 100).toFixed(1)}%)`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Duration: ${duration}s`);
  console.log('='.repeat(60) + '\n');

  console.log('💡 Next steps:');
  console.log('   1. Review gallery-context.json');
  console.log('   2. Start Next.js dev server: pnpm dev');
  console.log('   3. View gallery at http://localhost:3000\n');
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
