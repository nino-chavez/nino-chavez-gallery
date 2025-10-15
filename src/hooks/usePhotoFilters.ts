import { useMemo } from 'react';
import type { Photo } from '@/types/photo';
import type { PhotoFilterState } from '@/types/photo';

export function usePhotoFilters(photos: Photo[], filters: PhotoFilterState): Photo[] {
  return useMemo(() => {
    return photos.filter(photo => {
      // Skip photos without metadata
      if (!photo.metadata) return false;

      // Quality filters
      if (filters.portfolioWorthy && !photo.metadata.portfolio_worthy) return false;
      if (filters.printReady && !photo.metadata.print_ready) return false;
      if (filters.socialMediaOptimized && !photo.metadata.social_media_optimized) return false;

      // Minimum quality score (average across all metrics)
      if (filters.minQualityScore) {
        const avgQuality = (
          (photo.metadata.sharpness || 0) +
          (photo.metadata.exposure_accuracy || 0) +
          (photo.metadata.composition_score || 0) +
          (photo.metadata.emotional_impact || 0)
        ) / 4;

        if (avgQuality < filters.minQualityScore) return false;
      }

      // Emotion filter
      if (filters.emotions?.length && !filters.emotions.includes(photo.metadata.emotion)) {
        return false;
      }

      // Composition filter
      if (filters.compositions?.length && !filters.compositions.includes(photo.metadata.composition)) {
        return false;
      }

      // Time of day filter
      if (filters.timeOfDay?.length && !filters.timeOfDay.includes(photo.metadata.time_of_day)) {
        return false;
      }

      // Play type filter
      if (filters.playTypes?.length && !filters.playTypes.includes(photo.metadata.play_type || '')) {
        return false;
      }

      // Action intensity filter
      if (filters.actionIntensities?.length &&
          !filters.actionIntensities.includes(photo.metadata.action_intensity)) {
        return false;
      }

      // Use cases filter
      if (filters.useCases?.length) {
        const hasMatchingUseCase = filters.useCases.some(uc =>
          photo.metadata?.use_cases?.includes(uc as any)
        );
        if (!hasMatchingUseCase) return false;
      }

      return true;
    });
  }, [photos, filters]);
}