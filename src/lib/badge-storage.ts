/**
 * Badge Storage Utilities
 *
 * Handles reading badge unlock state and discovery progress from localStorage.
 * Includes error handling for disabled localStorage and invalid data.
 */

export interface DiscoveryProgress {
  emotionsSeen: string[];
  playTypesSeen: string[];
  portfolioPhotosSeen: number;
  peakMomentsSeen: number;
  goldenHourPhotosSeen: number;
  printReadyPhotosSeen: number;
  totalPhotosViewed: number;
}

export interface BadgeProgress {
  emotionExplorer: string;
  playAnalyst: string;
  portfolioHunter: string;
  peakSeeker: string;
  goldenEye: string;
  printMaster: string;
}

const STORAGE_KEYS = {
  BADGES: 'discovery-badges',
  PROGRESS: 'discovery-progress',
} as const;

/**
 * Load unlocked badges from localStorage
 * Returns a Set of badge IDs that have been unlocked
 * Returns empty Set on error or if localStorage is disabled
 */
export function loadUnlockedBadges(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BADGES);

    if (!stored) {
      return new Set<string>();
    }

    const badgeArray = JSON.parse(stored);

    if (!Array.isArray(badgeArray)) {
      console.warn('Invalid badge data format in localStorage');
      return new Set<string>();
    }

    return new Set<string>(badgeArray);
  } catch (error) {
    console.error('Failed to load unlocked badges:', error);
    return new Set<string>();
  }
}

/**
 * Load discovery progress from localStorage
 * Returns progress object with all discovery counters
 * Returns default empty state on error or if localStorage is disabled
 */
export function loadBadgeProgress(): DiscoveryProgress {
  const defaultProgress: DiscoveryProgress = {
    emotionsSeen: [],
    playTypesSeen: [],
    portfolioPhotosSeen: 0,
    peakMomentsSeen: 0,
    goldenHourPhotosSeen: 0,
    printReadyPhotosSeen: 0,
    totalPhotosViewed: 0,
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);

    if (!stored) {
      return defaultProgress;
    }

    const progress = JSON.parse(stored);

    // Validate structure
    if (typeof progress !== 'object' || progress === null) {
      console.warn('Invalid progress data format in localStorage');
      return defaultProgress;
    }

    // Convert Set objects back from JSON arrays if needed
    return {
      emotionsSeen: Array.isArray(progress.emotionsSeen)
        ? progress.emotionsSeen
        : progress.emotionsSeen?.values
          ? Array.from(progress.emotionsSeen.values())
          : [],
      playTypesSeen: Array.isArray(progress.playTypesSeen)
        ? progress.playTypesSeen
        : progress.playTypesSeen?.values
          ? Array.from(progress.playTypesSeen.values())
          : [],
      portfolioPhotosSeen: Number(progress.portfolioPhotosSeen) || 0,
      peakMomentsSeen: Number(progress.peakMomentsSeen) || 0,
      goldenHourPhotosSeen: Number(progress.goldenHourPhotosSeen) || 0,
      printReadyPhotosSeen: Number(progress.printReadyPhotosSeen) || 0,
      totalPhotosViewed: Number(progress.totalPhotosViewed) || 0,
    };
  } catch (error) {
    console.error('Failed to load badge progress:', error);
    return defaultProgress;
  }
}

/**
 * Save unlocked badges to localStorage (for future use)
 * Currently badges are unlocked by DiscoveryBadges component
 */
export function saveUnlockedBadges(badges: Set<string>): void {
  try {
    const badgeArray = Array.from(badges);
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badgeArray));
  } catch (error) {
    console.error('Failed to save unlocked badges:', error);
  }
}

/**
 * Save discovery progress to localStorage (for future use)
 * Currently progress is tracked by DiscoveryBadges component
 */
export function saveBadgeProgress(progress: DiscoveryProgress): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save badge progress:', error);
  }
}

/**
 * Calculate progress towards each badge unlock
 * Returns current/required progress for each badge
 */
export function calculateBadgeProgress(progress: DiscoveryProgress): BadgeProgress {
  const emotionCount = 6; // Total emotions available
  const playTypeCount = 7; // Total play types available

  return {
    emotionExplorer: `${progress.emotionsSeen.length}/${emotionCount}`,
    playAnalyst: `${progress.playTypesSeen.length}/${playTypeCount}`,
    portfolioHunter: `${progress.portfolioPhotosSeen}/10`,
    peakSeeker: `${progress.peakMomentsSeen}/5`,
    goldenEye: `${progress.goldenHourPhotosSeen}/5`,
    printMaster: `${progress.printReadyPhotosSeen}/10`,
  };
}
