/**
 * Photo Types for Enriched Metadata Implementation
 *
 * These types represent the complete photo data structure including
 * enriched metadata from AI analysis for enhanced user experience.
 */

// Type definitions for enriched metadata
export interface PhotoMetadata {
  // Quality scores (0-10)
  sharpness: number;
  exposure_accuracy: number;
  composition_score: number;
  emotional_impact: number;

  // Portfolio flags
  portfolio_worthy: boolean;
  print_ready: boolean;
  social_media_optimized: boolean;

  // Composition & Emotion
  emotion: 'triumph' | 'focus' | 'intensity' | 'determination' | 'excitement' | 'serenity';
  composition: 'rule-of-thirds' | 'leading-lines' | 'symmetry' | 'motion-blur' | 'close-up' | 'wide-angle' | 'dramatic-angle';
  time_of_day: 'morning' | 'afternoon' | 'golden-hour' | 'evening' | 'night' | 'midday';

  // Volleyball-specific
  play_type: 'attack' | 'block' | 'dig' | 'set' | 'serve' | 'pass' | 'celebration' | 'timeout' | null;
  action_intensity: 'low' | 'medium' | 'high' | 'peak';

  // Use cases
  use_cases: Array<'social-media' | 'website-hero' | 'athlete-portfolio' | 'print' | 'editorial'>;

  // AI metadata
  ai_provider: 'gemini' | 'claude' | 'openai';
  ai_cost: number;
  enriched_at: string;
}

export interface Photo {
  id: string;
  image_key: string;
  image_url: string;
  title: string;
  caption: string;
  keywords: string[];
  created_at: string;
  metadata: PhotoMetadata | null;
}

// Filter state for photo filtering
export interface PhotoFilterState {
  // Quality filters
  portfolioWorthy?: boolean;
  minQualityScore?: number;
  printReady?: boolean;
  socialMediaOptimized?: boolean;

  // Composition & Emotion
  emotions?: string[];
  compositions?: string[];
  timeOfDay?: string[];

  // Volleyball-specific
  playTypes?: string[];
  actionIntensities?: string[];

  // Use cases
  useCases?: string[];
}

// User preferences for recommendations
export interface UserPreferences {
  favoriteEmotions: Map<string, number>;
  favoritePlayTypes: Map<string, number>;
  favoriteCompositions: Map<string, number>;
  avgQualityThreshold: number;
}