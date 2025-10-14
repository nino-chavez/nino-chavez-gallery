/**
 * Test script to verify album pagination is working
 */

import { fetchAlbums } from './src/lib/smugmug/client';

async function testPagination() {
  console.log('Testing SmugMug album pagination...\n');

  try {
    const albums = await fetchAlbums();

    console.log(`✅ Successfully fetched ${albums.length} albums`);
    console.log(`   Total images across all albums: ${albums.reduce((sum, a) => sum + a.TotalImageCount, 0).toLocaleString()}`);

    if (albums.length > 50) {
      console.log('\n✅ PAGINATION WORKING: Fetched more than 50 albums!');
    } else if (albums.length === 50) {
      console.log('\n⚠️  WARNING: Only 50 albums fetched - pagination may not be working');
    } else {
      console.log('\n✅ Fetched fewer than 50 albums (this is fine if you have <50 albums)');
    }

    console.log('\nFirst 5 albums:');
    albums.slice(0, 5).forEach((album, i) => {
      console.log(`  ${i + 1}. ${album.Title} (${album.TotalImageCount} photos)`);
    });

    if (albums.length > 50) {
      console.log('\nLast 5 albums:');
      albums.slice(-5).forEach((album, i) => {
        console.log(`  ${albums.length - 4 + i}. ${album.Title} (${album.TotalImageCount} photos)`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

testPagination();
