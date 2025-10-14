/**
 * Browse Data Hook
 *
 * Extracts taxonomy and metadata from albums for intelligent browse layouts
 */

interface Album {
  albumKey: string;
  name: string;
  description: string;
  photoCount: number;
  keywords: string;
  thumbnailUrl?: string;
}

interface SportGroup {
  sport: string;
  albums: Album[];
  totalPhotos: number;
}

interface TimelineGroup {
  period: string; // e.g., "November 2024", "Q4 2024"
  albums: Album[];
  totalPhotos: number;
}

interface ActionGroup {
  action: string;
  albums: Album[];
  totalPhotos: number;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  albums: Album[];
}

/**
 * Extract sport taxonomy from keywords
 *
 * SmugMug strips colons, so we look for direct sport keywords:
 * - "volleyball", "basketball", "bmx", "skateboarding", etc.
 */
function extractSports(albums: Album[]): SportGroup[] {
  const sportMap = new Map<string, Album[]>();

  // Known sports to detect (expandable)
  const SPORT_KEYWORDS = [
    'volleyball',
    'basketball',
    'bmx',
    'skateboarding',
    'soccer',
    'football',
    'baseball',
    'hockey',
    'tennis',
    'track',
    'wrestling',
    'swimming',
    'softball',
    'lacrosse',
  ];

  albums.forEach((album) => {
    const keywords = album.keywords.toLowerCase();
    const keywordList = keywords.split(/[;,]/).map((k) => k.trim());

    // Check album name too for sports
    const nameWords = album.name.toLowerCase().split(/\s+/);

    for (const sport of SPORT_KEYWORDS) {
      if (keywordList.includes(sport) || nameWords.includes(sport)) {
        if (!sportMap.has(sport)) {
          sportMap.set(sport, []);
        }
        sportMap.get(sport)!.push(album);
        break; // Only assign to one sport per album
      }
    }
  });

  return Array.from(sportMap.entries())
    .map(([sport, albums]) => ({
      sport: capitalizeWord(sport),
      albums,
      totalPhotos: albums.reduce((sum, a) => sum + a.photoCount, 0),
    }))
    .sort((a, b) => b.totalPhotos - a.totalPhotos); // Sort by photo count
}

/**
 * Group albums by timeline (month/quarter)
 *
 * Uses album name patterns or keywords to infer date
 */
function extractTimeline(albums: Album[]): TimelineGroup[] {
  const timelineMap = new Map<string, Album[]>();

  albums.forEach((album) => {
    // Try to extract date from album name
    // Pattern: "Basketball - Nov 15 2024", "BMX Street 2024-11-08"
    const dateMatch =
      album.name.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}[,\s]+(\d{4})\b/i) ||
      album.name.match(/\b(\d{4})-(0[1-9]|1[0-2])-(\d{2})\b/) ||
      album.name.match(/\b(20\d{2})\b/); // Just year as fallback

    if (dateMatch) {
      let period: string;

      if (dateMatch[0].includes('-')) {
        // ISO format: 2024-11-08
        const [year, month] = dateMatch[0].split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
        period = `${monthName} ${year}`;
      } else if (dateMatch[1] && dateMatch[2]) {
        // Month name format: Nov 15 2024
        period = `${capitalizeWord(dateMatch[1])} ${dateMatch[2]}`;
      } else {
        // Year only
        period = dateMatch[1];
      }

      if (!timelineMap.has(period)) {
        timelineMap.set(period, []);
      }
      timelineMap.get(period)!.push(album);
    }
  });

  return Array.from(timelineMap.entries())
    .map(([period, albums]) => ({
      period,
      albums,
      totalPhotos: albums.reduce((sum, a) => sum + a.photoCount, 0),
    }))
    .sort((a, b) => {
      // Sort by date (most recent first)
      const dateA = parsePeriod(a.period);
      const dateB = parsePeriod(b.period);
      return dateB.getTime() - dateA.getTime();
    });
}

/**
 * Extract action types from keywords
 *
 * Since SmugMug strips colons, look for action-related keywords:
 * - "jump", "spike", "dunk", "celebration", "intensity", etc.
 */
function extractActionTypes(albums: Album[]): ActionGroup[] {
  const actionMap = new Map<string, Album[]>();

  // Known action/emotion keywords
  const ACTION_KEYWORDS = [
    'jump',
    'spike',
    'dunk',
    'launch',
    'serve',
    'shoot',
    'pass',
    'block',
    'celebration',
    'celebrate',
    'victory',
    'intensity',
    'focus',
    'teamwork',
    'motion',
    'action',
    'defense',
    'offense',
  ];

  albums.forEach((album) => {
    const keywords = album.keywords.toLowerCase();
    const keywordList = keywords.split(/[;,]/).map((k) => k.trim());

    for (const action of ACTION_KEYWORDS) {
      if (keywordList.includes(action)) {
        if (!actionMap.has(action)) {
          actionMap.set(action, []);
        }
        actionMap.get(action)!.push(album);
        break; // Only assign to one action per album
      }
    }
  });

  return Array.from(actionMap.entries())
    .map(([action, albums]) => ({
      action: capitalizeWord(action),
      albums,
      totalPhotos: albums.reduce((sum, a) => sum + a.photoCount, 0),
    }))
    .sort((a, b) => b.totalPhotos - a.totalPhotos);
}

/**
 * Create curated collections
 */
function createCollections(albums: Album[]): Collection[] {
  const collections: Collection[] = [];

  // Editor's Picks (albums with "featured" keyword)
  const editorsPicks = albums.filter((a) =>
    a.keywords.toLowerCase().includes('featured')
  );
  if (editorsPicks.length > 0) {
    collections.push({
      id: 'editors-picks',
      name: "Editor's Picks",
      description: 'Hand-selected best albums',
      albums: editorsPicks,
    });
  }

  // Best of Each Sport (top album per sport by photo count)
  const sportGroups = extractSports(albums);
  const bestOfSport = sportGroups.map((group) => group.albums[0]).filter(Boolean);
  if (bestOfSport.length > 0) {
    collections.push({
      id: 'best-of-sport',
      name: 'Best of Each Sport',
      description: 'Top album from each sport category',
      albums: bestOfSport,
    });
  }

  // Recently Added (last 10 albums by name/date)
  const recentAlbums = albums.slice(0, 10);
  collections.push({
    id: 'recent',
    name: 'Recently Added',
    description: 'Latest albums uploaded',
    albums: recentAlbums,
  });

  // Largest Albums
  const largestAlbums = [...albums]
    .sort((a, b) => b.photoCount - a.photoCount)
    .slice(0, 10);
  collections.push({
    id: 'largest',
    name: 'Epic Collections',
    description: 'Albums with the most photos',
    albums: largestAlbums,
  });

  return collections;
}

/**
 * Utility: Capitalize first letter
 */
function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Utility: Parse period string to Date
 */
function parsePeriod(period: string): Date {
  // Try to parse "November 2024" or "2024"
  const parts = period.split(' ');
  if (parts.length === 2) {
    const month = new Date(`${parts[0]} 1, ${parts[1]}`).getMonth();
    return new Date(parseInt(parts[1]), month, 1);
  } else {
    return new Date(parseInt(parts[0]), 0, 1);
  }
}

/**
 * Main hook
 */
export function useBrowseData(albums: Album[]) {
  return {
    sports: extractSports(albums),
    timeline: extractTimeline(albums),
    actionTypes: extractActionTypes(albums),
    collections: createCollections(albums),
  };
}

export type { Album, SportGroup, TimelineGroup, ActionGroup, Collection };
