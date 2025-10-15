'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { PhotoFilterState } from '@/types/photo';

export function useUrlFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<PhotoFilterState>({});

  // Parse URL params into filter state
  useEffect(() => {
    const params = searchParams;

    const newFilters: PhotoFilterState = {};

    // Quality filters
    if (params.get('portfolioWorthy') === 'true') {
      newFilters.portfolioWorthy = true;
    }
    if (params.get('printReady') === 'true') {
      newFilters.printReady = true;
    }
    if (params.get('socialMediaOptimized') === 'true') {
      newFilters.socialMediaOptimized = true;
    }

    // Quality score
    const minQuality = params.get('minQuality');
    if (minQuality) {
      newFilters.minQualityScore = parseFloat(minQuality);
    }

    // Multi-select filters
    const emotions = params.get('emotions');
    if (emotions) {
      newFilters.emotions = emotions.split(',');
    }

    const compositions = params.get('compositions');
    if (compositions) {
      newFilters.compositions = compositions.split(',');
    }

    const timeOfDay = params.get('timeOfDay');
    if (timeOfDay) {
      newFilters.timeOfDay = timeOfDay.split(',');
    }

    const playTypes = params.get('playTypes');
    if (playTypes) {
      newFilters.playTypes = playTypes.split(',');
    }

    const actionIntensities = params.get('actionIntensities');
    if (actionIntensities) {
      newFilters.actionIntensities = actionIntensities.split(',');
    }

    const useCases = params.get('useCases');
    if (useCases) {
      newFilters.useCases = useCases.split(',');
    }

    setFilters(newFilters);
  }, [searchParams]);

  // Update URL when filters change
  const updateFilters = useCallback((newFilters: PhotoFilterState) => {
    setFilters(newFilters);

    const params = new URLSearchParams();

    // Add filters to URL params
    if (newFilters.portfolioWorthy) {
      params.set('portfolioWorthy', 'true');
    }
    if (newFilters.printReady) {
      params.set('printReady', 'true');
    }
    if (newFilters.socialMediaOptimized) {
      params.set('socialMediaOptimized', 'true');
    }

    if (newFilters.minQualityScore) {
      params.set('minQuality', newFilters.minQualityScore.toString());
    }

    if (newFilters.emotions?.length) {
      params.set('emotions', newFilters.emotions.join(','));
    }
    if (newFilters.compositions?.length) {
      params.set('compositions', newFilters.compositions.join(','));
    }
    if (newFilters.timeOfDay?.length) {
      params.set('timeOfDay', newFilters.timeOfDay.join(','));
    }
    if (newFilters.playTypes?.length) {
      params.set('playTypes', newFilters.playTypes.join(','));
    }
    if (newFilters.actionIntensities?.length) {
      params.set('actionIntensities', newFilters.actionIntensities.join(','));
    }
    if (newFilters.useCases?.length) {
      params.set('useCases', newFilters.useCases.join(','));
    }

    const queryString = params.toString();
    const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;

    // Use replace instead of push to avoid adding to history
    window.history.replaceState({}, '', newUrl);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  return {
    filters,
    updateFilters,
    clearFilters,
  };
}