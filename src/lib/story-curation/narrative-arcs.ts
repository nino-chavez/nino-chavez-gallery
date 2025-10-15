import type { Photo } from '@/types/photo';

export interface NarrativeArc {
  type: 'game-winning-rally' | 'player-highlight' | 'season-journey' | 'comeback-story' | 'technical-excellence' | 'emotion-spectrum';
  photos: Photo[];
  title: string;
  description: string;
  emotionalCurve: Array<{
    timestamp: string;
    emotion: string;
    intensity: number;
  }>;
  metadata: {
    avgQuality: number;
    peakMoments: number;
    duration: string;
  };
}

export interface GameContext {
  gameId: string;
  teamName: string;
  opponentName: string;
  startTime: string;
  endTime: string;
  finalScore?: string;
}

/**
 * Detect game-winning rally from final moments
 */
export function detectGameWinningRally(
  photos: Photo[],
  gameContext: GameContext
): NarrativeArc | null {
  // 1. Find photos from final 5 minutes
  const gameEndTime = new Date(gameContext.endTime).getTime();
  const fiveMinutesBefore = gameEndTime - (5 * 60 * 1000);

  const finalMoments = photos.filter(p => {
    const photoTime = new Date(p.created_at).getTime();
    return photoTime >= fiveMinutesBefore && photoTime <= gameEndTime;
  });

  // 2. Filter for peak intensity + triumph/intensity emotions
  const rallyPhotos = finalMoments.filter(p =>
    p.metadata?.action_intensity === 'peak' &&
    (p.metadata?.emotion === 'triumph' || p.metadata?.emotion === 'intensity')
  );

  // 3. Sequence chronologically
  const sequence = rallyPhotos.sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Need at least 3 photos for a story
  if (sequence.length < 3) return null;

  // 4. Calculate emotional curve
  const emotionalCurve = sequence.map(p => ({
    timestamp: p.created_at,
    emotion: p.metadata?.emotion || 'unknown',
    intensity: calculateIntensityScore(p.metadata),
  }));

  // 5. Calculate metadata
  const avgQuality = calculateAvgQuality(sequence);
  const peakMoments = sequence.filter(p => p.metadata?.action_intensity === 'peak').length;

  return {
    type: 'game-winning-rally',
    photos: sequence,
    title: `${gameContext.teamName} Game-Winning Rally`,
    description: `The final ${sequence.length} moments that secured victory${gameContext.finalScore ? ` (${gameContext.finalScore})` : ''}`,
    emotionalCurve,
    metadata: {
      avgQuality: Math.round(avgQuality * 10) / 10,
      peakMoments,
      duration: `${Math.round((sequence.length * 3) / 60)} min video`,
    },
  };
}

/**
 * Generate player highlight reel
 */
export function detectPlayerHighlightReel(
  photos: Photo[],
  playerId: string,
  playerName: string,
  limit = 10
): NarrativeArc {
  // 1. Filter photos featuring this player (in real implementation, would check photo.athletes)
  const playerPhotos = photos; // Simplified for now

  // 2. Sort by portfolio_worthy + emotional_impact + composition_score
  const highlights = playerPhotos
    .filter(p => p.metadata?.portfolio_worthy)
    .sort((a, b) => {
      const scoreA =
        (a.metadata?.emotional_impact || 0) * 2 +
        (a.metadata?.composition_score || 0) * 1.5 +
        (a.metadata?.sharpness || 0);
      const scoreB =
        (b.metadata?.emotional_impact || 0) * 2 +
        (b.metadata?.composition_score || 0) * 1.5 +
        (b.metadata?.sharpness || 0);
      return scoreB - scoreA;
    })
    .slice(0, limit);

  const emotionalCurve = highlights.map(p => ({
    timestamp: p.created_at,
    emotion: p.metadata?.emotion || 'unknown',
    intensity: calculateIntensityScore(p.metadata),
  }));

  const avgQuality = calculateAvgQuality(highlights);
  const peakMoments = highlights.filter(p => p.metadata?.action_intensity === 'peak').length;

  return {
    type: 'player-highlight',
    photos: highlights,
    title: `${playerName}: Top ${limit} Highlights`,
    description: `Portfolio-quality moments showcasing ${playerName}'s best performances`,
    emotionalCurve,
    metadata: {
      avgQuality: Math.round(avgQuality * 10) / 10,
      peakMoments,
      duration: `${Math.round((highlights.length * 4) / 60)} min video`,
    },
  };
}

/**
 * Generate season journey
 */
export function detectSeasonJourney(
  photos: Photo[],
  seasonId: string,
  seasonName: string
): NarrativeArc {
  // 1. Group photos by game/event (simplified - using date clustering)
  const photosByTime = groupByTimeRange(photos, 'week');

  // 2. Select representative photo from each time period (highest emotional impact)
  const keyMoments = photosByTime.map(timePhotos => {
    return timePhotos.reduce((best, current) =>
      (current.metadata?.emotional_impact || 0) > (best.metadata?.emotional_impact || 0)
        ? current
        : best
    );
  }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const emotionalCurve = keyMoments.map(p => ({
    timestamp: p.created_at,
    emotion: p.metadata?.emotion || 'unknown',
    intensity: calculateIntensityScore(p.metadata),
  }));

  const avgQuality = calculateAvgQuality(keyMoments);
  const peakMoments = keyMoments.filter(p => p.metadata?.action_intensity === 'peak').length;

  return {
    type: 'season-journey',
    photos: keyMoments,
    title: `${seasonName}: The Journey`,
    description: `${keyMoments.length} pivotal moments that defined the season`,
    emotionalCurve,
    metadata: {
      avgQuality: Math.round(avgQuality * 10) / 10,
      peakMoments,
      duration: `${Math.round((keyMoments.length * 4) / 60)} min video`,
    },
  };
}

/**
 * Detect comeback story
 */
export function detectComebackStory(
  photos: Photo[],
  gameContext: GameContext
): NarrativeArc | null {
  // 1. Sort photos chronologically
  const chronological = [...photos].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // 2. Detect pattern: determination → intensity → triumph
  const pattern = detectEmotionalPattern(chronological, [
    'determination',
    'intensity',
    'triumph',
  ]);

  if (!pattern || pattern.length < 5) return null;

  const emotionalCurve = pattern.map(p => ({
    timestamp: p.created_at,
    emotion: p.metadata?.emotion || 'unknown',
    intensity: calculateIntensityScore(p.metadata),
  }));

  const avgQuality = calculateAvgQuality(pattern);
  const peakMoments = pattern.filter(p => p.metadata?.action_intensity === 'peak').length;

  return {
    type: 'comeback-story',
    photos: pattern,
    title: `${gameContext.teamName}: The Comeback`,
    description: `From adversity to victory in ${pattern.length} defining moments`,
    emotionalCurve,
    metadata: {
      avgQuality: Math.round(avgQuality * 10) / 10,
      peakMoments,
      duration: `${Math.round((pattern.length * 3.5) / 60)} min video`,
    },
  };
}

/**
 * Detect technical excellence collection
 */
export function detectTechnicalExcellence(
  photos: Photo[],
  context: { teamName: string; eventName: string }
): NarrativeArc | null {
  const excellence = photos.filter(p =>
    (p.metadata?.sharpness || 0) >= 9 &&
    (p.metadata?.composition_score || 0) >= 9 &&
    p.metadata?.portfolio_worthy === true
  );

  if (excellence.length < 8) return null;

  // Sort by overall quality
  const sorted = excellence
    .sort((a, b) => calculateAverageQuality(b.metadata) - calculateAverageQuality(a.metadata))
    .slice(0, 12);

  const emotionalCurve = sorted.map(p => ({
    timestamp: p.created_at,
    emotion: p.metadata?.emotion || 'unknown',
    intensity: calculateIntensityScore(p.metadata),
  }));

  const avgQuality = calculateAvgQuality(sorted);

  return {
    type: 'technical-excellence',
    photos: sorted,
    title: `${context.teamName}: Technical Excellence`,
    description: `${sorted.length} portfolio-quality shots from ${context.eventName}`,
    emotionalCurve,
    metadata: {
      avgQuality: Math.round(avgQuality * 10) / 10,
      peakMoments: sorted.filter(p => p.metadata?.action_intensity === 'peak').length,
      duration: `${Math.round((sorted.length * 4) / 60)} min video`,
    },
  };
}

/**
 * Detect emotion spectrum in a single game
 */
export function detectEmotionSpectrum(
  photos: Photo[],
  gameContext: GameContext
): NarrativeArc | null {
  // 1. Group by emotion
  const byEmotion = groupBy(photos, p => p.metadata?.emotion || 'unknown');

  // Need at least 4 different emotions
  if (Object.keys(byEmotion).length < 4) return null;

  // 2. Select best photo for each emotion
  const spectrum = Object.entries(byEmotion)
    .map(([emotion, emotionPhotos]) => {
      return emotionPhotos.reduce((best, current) =>
        calculateAverageQuality(current.metadata) > calculateAverageQuality(best.metadata)
          ? current
          : best
      );
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const emotionalCurve = spectrum.map(p => ({
    timestamp: p.created_at,
    emotion: p.metadata?.emotion || 'unknown',
    intensity: calculateIntensityScore(p.metadata),
  }));

  const avgQuality = calculateAvgQuality(spectrum);

  return {
    type: 'emotion-spectrum',
    photos: spectrum,
    title: `${gameContext.teamName}: Full Spectrum`,
    description: `The emotional journey of the game in ${spectrum.length} moments`,
    emotionalCurve,
    metadata: {
      avgQuality: Math.round(avgQuality * 10) / 10,
      peakMoments: spectrum.filter(p => p.metadata?.action_intensity === 'peak').length,
      duration: `${Math.round((spectrum.length * 3) / 60)} min video`,
    },
  };
}

// Utility functions

function calculateIntensityScore(metadata: any): number {
  if (!metadata) return 0;
  const intensityMap = { low: 2.5, medium: 5, high: 7.5, peak: 10 };
  return intensityMap[metadata.action_intensity] || 0;
}

function calculateAvgQuality(photos: Photo[]): number {
  if (photos.length === 0) return 0;
  return photos.reduce((sum, p) => sum + calculateAverageQuality(p.metadata), 0) / photos.length;
}

function calculateAverageQuality(metadata: any): number {
  if (!metadata) return 0;
  return (
    (metadata.sharpness || 0) +
    (metadata.exposure_accuracy || 0) +
    (metadata.composition_score || 0) +
    (metadata.emotional_impact || 0)
  ) / 4;
}

function groupBy<T>(array: T[], key: string | ((item: T) => string)): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : (item as any)[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

function groupByTimeRange(photos: Photo[], range: 'day' | 'week' | 'month'): Photo[][] {
  const groups: Photo[][] = [];
  const sorted = [...photos].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let currentGroup: Photo[] = [];
  let lastTimestamp = 0;

  for (const photo of sorted) {
    const timestamp = new Date(photo.created_at).getTime();
    const rangeMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    }[range];

    if (timestamp - lastTimestamp > rangeMs) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [photo];
    } else {
      currentGroup.push(photo);
    }

    lastTimestamp = timestamp;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

function detectEmotionalPattern(photos: Photo[], pattern: string[]): Photo[] {
  const result: Photo[] = [];
  let patternIndex = 0;

  for (const photo of photos) {
    if (photo.metadata?.emotion === pattern[patternIndex]) {
      result.push(photo);
      patternIndex++;
      if (patternIndex === pattern.length) {
        patternIndex = pattern.length - 1; // Stay on last pattern element
      }
    }
  }

  return result;
}