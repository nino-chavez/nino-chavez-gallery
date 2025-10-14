#!/usr/bin/env tsx
/**
 * Check SmugMug Album Privacy Settings
 *
 * This script fetches a single album to see what privacy fields are available
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

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

async function main() {
  // Fetch a public album for comparison
  const publicAlbumKey = '2Xv5JS'; // WVB - North Central vs Carthage

  console.log('Fetching Public album details...\n');
  const response = await smugmugRequest(`/api/v2/album/${publicAlbumKey}`);

  const album = response.Album;

  console.log('Album Details:');
  console.log('==============');
  console.log('Name:', album.Name);
  console.log('Privacy:', album.Privacy);
  console.log('Security Type:', album.SecurityType);
  console.log('Password Protected:', album.PasswordProtected);
  console.log('Hidden:', album.Hidden);
  console.log('Keywords:', album.Keywords);
  console.log('Description:', album.Description);
  console.log('\nFull Album Object:');
  console.log(JSON.stringify(album, null, 2));
}

main().catch(console.error);
