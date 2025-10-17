/**
 * Story Data Management for Emotion Galaxy 3D
 *
 * Handles fetching and managing story data for constellation rendering.
 * Maps story photos to their 3D positions in the galaxy based on spatial positioning.
 *
 * Features:
 * - Fetch stories from /api/stories endpoint
 * - Map story photos to particle positions
 * - Cache story data to prevent redundant fetches
 * - Support both active and all stories queries
 */

import { Vector3 } from 'three';

/**
 * Story photo with position in story sequence
 */
export interface StoryPhoto {
  id: string;
  position_in_story: number;
  emotion: 'triumph' | 'focus' | 'intensity' | 'determination' | 'excitement' | 'serenity';
  emotional_impact: number;
  image_url: string;
  title?: string;
  caption?: string;
}

/**
 * Story with photos for constellation rendering
 */
export interface Story {
  id: string;
  story_type: 'game-winning-rally' | 'player-highlight' | 'season-journey' | 'comeback' | 'technical-excellence' | 'emotion-spectrum';
  title: string;
  description: string;
  emotion_theme: 'triumph' | 'focus' | 'intensity' | 'determination' | 'excitement' | 'serenity';
  photos: StoryPhoto[];
  created_at: string;
}

/**
 * Story constellation with 3D positions
 */
export interface StoryConstellation {
  story: Story;
  photoPositions: Array<{
    photoId: string;
    position: Vector3;
    positionInStory: number;
  }>;
}

/**
 * Cache for story data to prevent redundant fetches
 */
let storiesCache: Story[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch stories from API
 *
 * @param activeOnly - If true, only fetch active stories (default: true)
 * @returns Array of stories
 */
export async function fetchStories(activeOnly: boolean = true): Promise<Story[]> {
  // Check cache validity
  if (storiesCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return storiesCache;
  }

  try {
    const url = activeOnly ? '/api/stories?active=true' : '/api/stories';
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Failed to fetch stories:', response.statusText);
      return [];
    }

    const stories: Story[] = await response.json();

    // Update cache
    storiesCache = stories;
    cacheTimestamp = Date.now();

    return stories;
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
}

/**
 * Map story photos to their 3D positions in the galaxy
 *
 * @param story - Story with photos
 * @param photoPositionMap - Map of photoId to 3D position from PhotoParticleSystem
 * @returns Story constellation with photo positions
 */
export function mapStoryToConstellation(
  story: Story,
  photoPositionMap: Map<string, Vector3>
): StoryConstellation | null {
  // Filter out photos that don't have positions in the galaxy
  const photoPositions = story.photos
    .map((photo) => {
      const position = photoPositionMap.get(photo.id);
      if (!position) return null;

      return {
        photoId: photo.id,
        position: position.clone(),
        positionInStory: photo.position_in_story,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.positionInStory - b.positionInStory);

  // Need at least 2 photos to draw a constellation line
  if (photoPositions.length < 2) {
    return null;
  }

  return {
    story,
    photoPositions,
  };
}

/**
 * Get all story constellations for current galaxy photos
 *
 * @param photoPositionMap - Map of photoId to 3D position from PhotoParticleSystem
 * @param activeOnly - If true, only get active stories (default: true)
 * @returns Array of story constellations
 */
export async function getStoryConstellations(
  photoPositionMap: Map<string, Vector3>,
  activeOnly: boolean = true
): Promise<StoryConstellation[]> {
  const stories = await fetchStories(activeOnly);

  const constellations = stories
    .map((story) => mapStoryToConstellation(story, photoPositionMap))
    .filter((constellation): constellation is StoryConstellation => constellation !== null);

  return constellations;
}

/**
 * Clear story cache (useful when stories are updated)
 */
export function clearStoryCache(): void {
  storiesCache = null;
  cacheTimestamp = null;
}

/**
 * Get mock story data for testing without API
 * Useful during development when API isn't available
 */
export function getMockStory(): Story {
  return {
    id: 'mock-story-1',
    story_type: 'game-winning-rally',
    title: 'Final Point Victory',
    description: 'The game-winning rally that secured the championship',
    emotion_theme: 'triumph',
    photos: [
      {
        id: 'photo-1',
        position_in_story: 1,
        emotion: 'focus',
        emotional_impact: 8,
        image_url: '/placeholder-1.jpg',
        title: 'Setup',
      },
      {
        id: 'photo-2',
        position_in_story: 2,
        emotion: 'intensity',
        emotional_impact: 9,
        image_url: '/placeholder-2.jpg',
        title: 'The Attack',
      },
      {
        id: 'photo-3',
        position_in_story: 3,
        emotion: 'triumph',
        emotional_impact: 10,
        image_url: '/placeholder-3.jpg',
        title: 'Victory',
      },
    ],
    created_at: new Date().toISOString(),
  };
}
