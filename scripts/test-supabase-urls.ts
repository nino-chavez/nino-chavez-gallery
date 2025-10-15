#!/usr/bin/env tsx
/**
 * Test script to check Supabase photo URLs
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function testSupabaseUrls() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch 5 photos
  const { data, error } = await supabase
    .from('photo_metadata')
    .select('photo_id, image_key, ImageUrl, OriginalUrl')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📊 Supabase Data (First 5 Photos):\n');
  data?.forEach((row, i) => {
    console.log(`${i + 1}. photo_id: ${row.photo_id}`);
    console.log(`   image_key: ${row.image_key}`);
    console.log(`   ImageUrl: ${row.ImageUrl || 'NULL'}`);
    console.log(`   OriginalUrl: ${row.OriginalUrl || 'NULL'}`);
    console.log('');
  });

  // Count URLs
  const { count: totalCount } = await supabase
    .from('photo_metadata')
    .select('photo_id', { count: 'exact', head: true });

  const { count: withImageUrl } = await supabase
    .from('photo_metadata')
    .select('photo_id', { count: 'exact', head: true })
    .not('ImageUrl', 'is', null);

  console.log(`\n📈 Statistics:`);
  console.log(`   Total photos: ${totalCount}`);
  console.log(`   With ImageUrl: ${withImageUrl}`);
  console.log(`   Without ImageUrl: ${(totalCount || 0) - (withImageUrl || 0)}`);
}

testSupabaseUrls();