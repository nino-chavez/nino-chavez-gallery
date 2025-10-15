'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { PhotoFilterState } from '@/types/photo';

export function PortfolioFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<PhotoFilterState>({
    portfolioWorthy: true, // Always true for portfolio
    minQualityScore: 8, // High quality threshold
  });

  const updateFilters = (newFilters: PhotoFilterState) => {
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();

    if (newFilters.minQualityScore) {
      params.set('minQuality', newFilters.minQualityScore.toString());
    }
    if (newFilters.emotions?.length) {
      params.set('emotions', newFilters.emotions.join(','));
    }
    if (newFilters.compositions?.length) {
      params.set('compositions', newFilters.compositions.join(','));
    }
    if (newFilters.playTypes?.length) {
      params.set('playTypes', newFilters.playTypes.join(','));
    }

    const queryString = params.toString();
    router.push(`/portfolio${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 mb-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          ⭐ Portfolio Quality
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          🖨️ Print Ready
        </button>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          📈 High Impact
        </button>
      </div>

      <div className="text-sm text-gray-600">
        Showing curated collection of top-quality photos with advanced filtering options
      </div>
    </div>
  );
}