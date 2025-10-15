import type { Photo, UserPreferences } from '@/types/photo';

export function findSimilarPhotos(
  targetPhoto: Photo,
  allPhotos: Photo[],
  limit = 6
): Photo[] {
  return allPhotos
    .filter(p => p.id !== targetPhoto.id)
    .map(photo => ({
      photo,
      score: calculateSimilarityScore(targetPhoto, photo)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.photo);
}

function calculateSimilarityScore(a: Photo, b: Photo): number {
  let score = 0;

  // Skip if no metadata
  if (!a.metadata || !b.metadata) return 0;

  // Emotion match (high weight)
  if (a.metadata.emotion === b.metadata.emotion) score += 30;

  // Play type match (high weight)
  if (a.metadata.play_type === b.metadata.play_type) score += 25;

  // Composition match (medium weight)
  if (a.metadata.composition === b.metadata.composition) score += 15;

  // Action intensity match (medium weight)
  if (a.metadata.action_intensity === b.metadata.action_intensity) score += 15;

  // Time of day match (low weight)
  if (a.metadata.time_of_day === b.metadata.time_of_day) score += 10;

  // Quality similarity (closer = better)
  const qualityDiff = Math.abs(
    (a.metadata.composition_score || 0) - (b.metadata.composition_score || 0)
  );
  score += Math.max(0, 10 - qualityDiff);

  return score;
}

export function getRecommendations(
  viewHistory: Photo[],
  allPhotos: Photo[],
  limit = 10
): Photo[] {
  // Analyze user preferences from view history
  const preferences = analyzePreferences(viewHistory);

  return allPhotos
    .filter(p => !viewHistory.some(h => h.id === p.id))
    .filter(p => p.metadata?.portfolio_worthy) // Only recommend quality photos
    .map(photo => ({
      photo,
      score: calculatePreferenceMatch(photo, preferences)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.photo);
}

function analyzePreferences(viewHistory: Photo[]): UserPreferences {
  const emotions = new Map<string, number>();
  const playTypes = new Map<string, number>();
  const compositions = new Map<string, number>();

  let totalQuality = 0;
  let qualityCount = 0;

  for (const photo of viewHistory) {
    if (!photo.metadata) continue;

    // Count preferences
    const emotion = photo.metadata.emotion;
    if (emotion) {
      emotions.set(emotion, (emotions.get(emotion) || 0) + 1);
    }

    const playType = photo.metadata.play_type;
    if (playType) {
      playTypes.set(playType, (playTypes.get(playType) || 0) + 1);
    }

    const composition = photo.metadata.composition;
    if (composition) {
      compositions.set(composition, (compositions.get(composition) || 0) + 1);
    }

    // Track quality preferences
    if (photo.metadata.composition_score) {
      totalQuality += photo.metadata.composition_score;
      qualityCount++;
    }
  }

  return {
    favoriteEmotions: emotions,
    favoritePlayTypes: playTypes,
    favoriteCompositions: compositions,
    avgQualityThreshold: qualityCount > 0 ? totalQuality / qualityCount : 7,
  };
}

function calculatePreferenceMatch(photo: Photo, prefs: UserPreferences): number {
  let score = 0;

  if (!photo.metadata) return 0;

  // Emotion preference match
  const emotion = photo.metadata.emotion;
  if (emotion) {
    score += (prefs.favoriteEmotions.get(emotion) || 0) * 20;
  }

  // Play type preference match
  const playType = photo.metadata.play_type;
  if (playType) {
    score += (prefs.favoritePlayTypes.get(playType) || 0) * 15;
  }

  // Composition preference match
  const composition = photo.metadata.composition;
  if (composition) {
    score += (prefs.favoriteCompositions.get(composition) || 0) * 10;
  }

  // Quality threshold bonus
  if ((photo.metadata.composition_score || 0) >= prefs.avgQualityThreshold) {
    score += 25;
  }

  // Portfolio worthy bonus
  if (photo.metadata.portfolio_worthy) {
    score += 20;
  }

  return score;
}

export function getTrendingPhotos(
  allPhotos: Photo[],
  limit = 12
): Photo[] {
  return allPhotos
    .filter(p => p.metadata?.portfolio_worthy)
    .sort((a, b) => {
      // Sort by combination of quality and recency
      const aScore = (a.metadata?.emotional_impact || 0) + (a.metadata?.composition_score || 0);
      const bScore = (b.metadata?.emotional_impact || 0) + (b.metadata?.composition_score || 0);

      if (Math.abs(aScore - bScore) < 1) {
        // If quality is similar, sort by recency
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      return bScore - aScore;
    })
    .slice(0, limit);
}

export function getPhotosByEmotion(
  allPhotos: Photo[],
  emotion: string,
  limit = 8
): Photo[] {
  return allPhotos
    .filter(p => p.metadata?.emotion === emotion && p.metadata.portfolio_worthy)
    .sort((a, b) => (b.metadata?.emotional_impact || 0) - (a.metadata?.emotional_impact || 0))
    .slice(0, limit);
}

export function getPhotosByPlayType(
  allPhotos: Photo[],
  playType: string,
  limit = 8
): Photo[] {
  return allPhotos
    .filter(p => p.metadata?.play_type === playType && p.metadata.portfolio_worthy)
    .sort((a, b) => (b.metadata?.composition_score || 0) - (a.metadata?.composition_score || 0))
    .slice(0, limit);
}