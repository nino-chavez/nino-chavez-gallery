/**
 * Geocoding Service
 *
 * Converts venue names to GPS coordinates using OpenStreetMap Nominatim API
 * Free, no API key required, with built-in caching to avoid repeated requests
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface GeocodingResult {
  venue: string;
  city: string;
  state: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone: string;
  cachedAt: string;
}

interface GeocodingCache {
  [venueName: string]: GeocodingResult;
}

const CACHE_PATH = resolve(process.cwd(), '.geocoding-cache.json');
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

// Load cache
let cache: GeocodingCache = {};
if (existsSync(CACHE_PATH)) {
  try {
    cache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
  } catch (error) {
    console.warn('Failed to load geocoding cache, starting fresh');
  }
}

/**
 * Save cache to disk
 */
function saveCache() {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * Geocode a venue name to location data
 * Uses cache first, then calls Nominatim API if needed
 */
export async function geocodeVenue(venueName: string): Promise<GeocodingResult | null> {
  // Normalize venue name for cache key
  const cacheKey = venueName.toLowerCase().trim();

  // Check cache first
  if (cache[cacheKey]) {
    console.log(`   📍 Geocoding cache hit: ${venueName}`);
    return cache[cacheKey];
  }

  // Call Nominatim API
  console.log(`   🌍 Geocoding: ${venueName}...`);

  try {
    // Add delay to respect rate limits (max 1 request per second)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch(
      `${NOMINATIM_API}?` + new URLSearchParams({
        q: venueName,
        format: 'json',
        limit: '1',
        addressdetails: '1',
      }),
      {
        headers: {
          'User-Agent': 'NinoGallery/1.0 (photo metadata enrichment)',
        },
      }
    );

    if (!response.ok) {
      console.warn(`   ⚠️  Geocoding failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      console.warn(`   ⚠️  No geocoding results for: ${venueName}`);
      return null;
    }

    const result = results[0];
    const address = result.address || {};

    // Determine timezone based on coordinates (simplified - using US timezones)
    const timezone = getTimezoneFromCoords(
      parseFloat(result.lat),
      parseFloat(result.lon)
    );

    const geocodedResult: GeocodingResult = {
      venue: result.display_name.split(',')[0], // First part is usually the venue name
      city: address.city || address.town || address.village || '',
      state: address.state || '',
      country: address.country || 'USA',
      coordinates: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      },
      timezone,
      cachedAt: new Date().toISOString(),
    };

    // Cache the result
    cache[cacheKey] = geocodedResult;
    saveCache();

    console.log(`   ✅ Geocoded: ${geocodedResult.city}, ${geocodedResult.state}`);
    return geocodedResult;
  } catch (error) {
    console.error(`   ❌ Geocoding error for ${venueName}:`, error);
    return null;
  }
}

/**
 * Simple timezone estimation based on longitude
 * (This is a simplified approach - for production, use a proper timezone library)
 */
function getTimezoneFromCoords(lat: number, lng: number): string {
  // US timezones by longitude ranges (approximate)
  if (lng > -75) return 'America/New_York'; // Eastern
  if (lng > -90) return 'America/Chicago'; // Central
  if (lng > -105) return 'America/Denver'; // Mountain
  if (lng > -125) return 'America/Los_Angeles'; // Pacific
  return 'America/New_York'; // Default
}

/**
 * Extract venue name from folder path
 * Examples:
 * - "carthage-womens-vball" → "Carthage College"
 * - "north-central-college" → "North Central College"
 */
export function extractVenueName(folderPath: string): string | null {
  const folderName = folderPath.split('/').pop() || '';

  // Common venue patterns
  const venuePatterns: Record<string, string> = {
    carthage: 'Carthage College',
    'north-central': 'North Central College',
    'aurora-university': 'Aurora University',
    millikin: 'Millikin University',
    lewis: 'Lewis University',
    northwestern: 'Northwestern University',
    'wheaton-north': 'Wheaton North High School',
    'wheaton-south': 'Wheaton South High School',
    'downers-grove': 'Downers Grove High School',
    plainfield: 'Plainfield High School',
    benet: 'Benet Academy',
    stanford: 'Stanford University',
    ucla: 'UCLA',
    gcu: 'Grand Canyon University',
    pepperdine: 'Pepperdine University',
  };

  // Check for known venues
  for (const [pattern, venue] of Object.entries(venuePatterns)) {
    if (folderName.toLowerCase().includes(pattern)) {
      return venue;
    }
  }

  return null;
}

/**
 * Get cached location count
 */
export function getCachedLocationCount(): number {
  return Object.keys(cache).length;
}
