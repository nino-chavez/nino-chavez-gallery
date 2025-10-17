#!/usr/bin/env tsx
/**
 * Intelligent Gallery Context Builder
 *
 * Features:
 * - Full rebuild: Complete context regeneration
 * - Incremental: Only new/changed albums since last build
 * - Change detection: Lightweight check for updates
 *
 * Usage:
 *   pnpm run build:context              # Full rebuild
 *   pnpm run build:context --incremental # Incremental update only
 *   pnpm run build:context --check-latest # Check for new content (no build)
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { writeFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
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
  // SmugMug metadata for Supabase
  photoDate?: string;          // DateTimeOriginal from EXIF
  dateAdded?: string;           // When added to album
  aspectRatio?: number;
  cameraMode?: string;
  cameraModel?: string;
  lensModel?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  latitude?: number;
  longitude?: number;
  locationName?: string;
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
  // Privacy settings
  privacy: 'Public' | 'Unlisted' | 'Private';
  worldSearchable: boolean;
  smugSearchable: string;
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
 * Get all albums with pagination
 * Only fetch Public albums (exclude Unlisted and Private)
 *
 * SmugMug Privacy Levels:
 * - Public: Listed publicly, anyone can see
 * - Unlisted: Only accessible via direct link (not listed)
 * - Private: Only owner and granted users can see
 */
async function getAlbums() {
  console.log('📂 Fetching albums...');

  const user = await getAuthUser();
  console.log(`   User: ${user.NickName}`);

  let allAlbums: any[] = [];
  let start = 1;
  const count = 100; // Max per page

  // Pagination loop - fetch all pages
  while (true) {
    console.log(`   Fetching albums page (start=${start}, count=${count})...`);

    const response = await smugmugRequest(`${user.Uris.UserAlbums.Uri}?count=${count}&start=${start}`);
    const pageAlbums = response.Album || [];
    allAlbums.push(...pageAlbums);

    console.log(`   ✓ Fetched ${pageAlbums.length} albums (total so far: ${allAlbums.length})`);

    // Check if we've fetched all albums
    if (pageAlbums.length < count || !response.Pages?.NextPage) {
      break;
    }

    start += count;
  }

  // Only keep Public albums (filter out Unlisted and Private)
  const publicAlbums = allAlbums.filter(album => album.Privacy === 'Public');
  const unlistedCount = allAlbums.filter(album => album.Privacy === 'Unlisted').length;
  const privateCount = allAlbums.filter(album => album.Privacy === 'Private').length;

  console.log(`   ✅ Successfully fetched ${allAlbums.length} total albums:`);
  console.log(`      ${publicAlbums.length} public (included)`);
  console.log(`      ${unlistedCount} unlisted (filtered - direct link only)`);
  console.log(`      ${privateCount} private (filtered)\n`);

  return publicAlbums;
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

    // Calculate aspect ratio
    const width = image.OriginalWidth || 0;
    const height = image.OriginalHeight || 0;
    const aspectRatio = width && height ? parseFloat((width / height).toFixed(3)) : undefined;

    photos.push({
      imageKey: image.ImageKey,
      fileName: image.FileName,
      title: image.Title || '',
      caption: image.Caption || '',
      keywords: image.Keywords ? image.Keywords.split(';').map((k: string) => k.trim()) : [],
      uploadDate: image.UploadDate || image.DateAdded,
      imageUrl: urls.display,
      thumbnailUrl: urls.thumbnail,
      width,
      height,
      // SmugMug metadata (for Supabase sync)
      photoDate: image.DateTimeOriginal || image.UploadDate || image.DateAdded,
      dateAdded: image.DateAdded,
      aspectRatio,
      cameraMode: image.CameraMake,
      cameraModel: image.CameraModel,
      lensModel: image.LensModel,
      focalLength: image.FocalLength,
      aperture: image.Aperture,
      shutterSpeed: image.ShutterSpeed,
      iso: image.ISO ? parseInt(image.ISO) : undefined,
      latitude: image.Latitude,
      longitude: image.Longitude,
      locationName: image.Location,
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
    // Privacy settings
    privacy: album.Privacy || 'Public',
    worldSearchable: album.WorldSearchable || false,
    smugSearchable: album.SmugSearchable || 'No',
  };
}

/**
 * Check for latest album info (lightweight, no logging)
 */
async function checkLatestAlbumInfo(): Promise<{latestAlbumDate: string, totalAlbums: number}> {
  const user = await getAuthUser();

  let allAlbums: any[] = [];
  let start = 1;
  const count = 100;

  // Pagination loop - fetch all pages (no logging)
  while (true) {
    const response = await smugmugRequest(`${user.Uris.UserAlbums.Uri}?count=${count}&start=${start}`);
    const pageAlbums = response.Album || [];
    allAlbums.push(...pageAlbums);

    if (pageAlbums.length < count || !response.Pages?.NextPage) {
      break;
    }

    start += count;
  }

  const latestAlbum = allAlbums.reduce((latest, album) =>
    new Date(album.LastUpdated) > new Date(latest.LastUpdated) ? album : latest
  );

  return {
    latestAlbumDate: latestAlbum.LastUpdated,
    totalAlbums: allAlbums.length
  };
}

/**
 * Main execution
 */
async function main() {
  const isIncremental = process.argv.includes('--incremental');
  const isCheckLatest = process.argv.includes('--check-latest');

  // Handle check-latest mode (lightweight, no file operations)
  if (isCheckLatest) {
    if (!process.env.SMUGMUG_API_KEY) {
      console.error('❌ SmugMug credentials not set');
      process.exit(1);
    }

    const latestInfo = await checkLatestAlbumInfo();

    // Output ONLY JSON for wrapper script to parse (no extra logging)
    process.stdout.write(JSON.stringify(latestInfo));
    return;
  }

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

  // Handle incremental mode
  let albumsToProcess = albums;
  if (isIncremental && existsSync(resolve(process.cwd(), 'gallery-context.json'))) {
    const existingContext = JSON.parse(
      readFileSync(resolve(process.cwd(), 'gallery-context.json'), 'utf8')
    );

    const existingAlbumKeys = new Set(existingContext.albums.map((a: Album) => a.albumKey));
    const newAlbums = albums.filter(album => !existingAlbumKeys.has(album.AlbumKey));

    console.log(`⚡ Incremental mode: ${newAlbums.length} new albums to process`);
    console.log(`   (skipping ${existingAlbumKeys.size} existing albums)\n`);

    if (newAlbums.length === 0) {
      console.log('✅ No new albums found - context is up to date\n');
      return;
    }

    albumsToProcess = newAlbums;
  }

  // Process albums
  const processedAlbums: Album[] = [];
  let totalPhotos = 0;
  let enrichedPhotos = 0;

  for (const album of albumsToProcess) {
    const processed = await processAlbum(album);
    processedAlbums.push(processed);

    totalPhotos += processed.photoCount;
    enrichedPhotos += processed.photos.filter(
      p => p.title && p.caption && p.keywords.length >= 15
    ).length;
  }

  // Build context
  const user = await getAuthUser();

  let finalContext: GalleryContext;

  if (isIncremental && existsSync(resolve(process.cwd(), 'gallery-context.json'))) {
    // Incremental: merge with existing context
    const existingContext = JSON.parse(
      readFileSync(resolve(process.cwd(), 'gallery-context.json'), 'utf8')
    ) as GalleryContext;

    finalContext = {
      username: user.NickName,
      generatedAt: new Date().toISOString(),
      totalAlbums: existingContext.totalAlbums + processedAlbums.length,
      totalPhotos: existingContext.totalPhotos + totalPhotos,
      enrichedPhotos: existingContext.enrichedPhotos + enrichedPhotos,
      albums: [...existingContext.albums, ...processedAlbums],
    };

    console.log(`📈 Incremental update: +${processedAlbums.length} albums, +${totalPhotos} photos`);
  } else {
    // Full build
    finalContext = {
      username: user.NickName,
      generatedAt: new Date().toISOString(),
      totalAlbums: processedAlbums.length,
      totalPhotos,
      enrichedPhotos,
      albums: processedAlbums,
    };
  }

  // Write to file
  const outputPath = resolve(process.cwd(), 'gallery-context.json');
  await writeFile(outputPath, JSON.stringify(finalContext, null, 2), 'utf-8');

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Gallery Context Built!\n');
  console.log(`   Username: ${finalContext.username}`);
  console.log(`   Albums: ${finalContext.totalAlbums}`);
  console.log(`   Total photos: ${finalContext.totalPhotos}`);
  console.log(`   Enriched: ${finalContext.enrichedPhotos} (${((finalContext.enrichedPhotos / finalContext.totalPhotos) * 100).toFixed(1)}%)`);
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
