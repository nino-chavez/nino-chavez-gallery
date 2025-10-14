#!/usr/bin/env tsx
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

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

async function smugmugRequest(endpoint: string) {
  const url = `https://api.smugmug.com${endpoint}`;
  const request = { url, method: 'GET' };
  const authHeader = oauth.toHeader(oauth.authorize(request, token));

  const response = await fetch(url, {
    headers: {
      ...authHeader,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  return data.Response;
}

async function main() {
  // Get authenticated user
  const userData = await smugmugRequest('/api/v2!authuser');
  const user = userData.User;

  console.log(`User: ${user.NickName}`);

  // Get albums
  const albumsData = await smugmugRequest(user.Uris.UserAlbums.Uri);
  const albums = albumsData.Album || [];

  // Find Demo album
  const demoAlbum = albums.find((a: any) => a.Name === 'Demo' || a.UrlPath?.includes('Demo'));

  if (demoAlbum) {
    console.log(`\nDemo Album Found:`);
    console.log(`  Name: ${demoAlbum.Name}`);
    console.log(`  AlbumKey: ${demoAlbum.AlbumKey}`);
    console.log(`  WebUri: ${demoAlbum.WebUri}`);
    console.log(`  UrlPath: ${demoAlbum.UrlPath}`);
  } else {
    console.log('\nDemo album not found');
    console.log('Available albums:', albums.map((a: any) => a.Name).slice(0, 10).join(', '));
  }
}

main().catch(console.error);
