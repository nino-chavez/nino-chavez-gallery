'use client';

import { MagneticFilterOrb } from '@/components/interactions/MagneticFilterOrb';
import type { PhotoFilterState } from '@/types/photo';

interface MagneticFilterBarProps {
  filters: PhotoFilterState;
  onChange: (filters: PhotoFilterState) => void;
  photoCount: number;
}

export function MagneticFilterBar({ filters, onChange, photoCount }: MagneticFilterBarProps) {
  return (
    <div className="magnetic-filter-bar">
      {/* Quick filters */}
      <div className="flex gap-4 flex-wrap justify-center mb-6">
        <MagneticFilterOrb
          icon="⭐"
          label="Portfolio Quality"
          active={!!filters.portfolioWorthy}
          onClick={() => onChange({ ...filters, portfolioWorthy: !filters.portfolioWorthy })}
        />

        <MagneticFilterOrb
          icon="🖨️"
          label="Print Ready"
          active={!!filters.printReady}
          onClick={() => onChange({ ...filters, printReady: !filters.printReady })}
        />

        <MagneticFilterOrb
          icon="📱"
          label="Social Media"
          active={!!filters.socialMediaOptimized}
          onClick={() => onChange({ ...filters, socialMediaOptimized: !filters.socialMediaOptimized })}
        />

        <MagneticFilterOrb
          icon="⚡"
          label="Peak Moments"
          active={filters.actionIntensities?.includes('peak') || false}
          onClick={() => onChange({
            ...filters,
            actionIntensities: filters.actionIntensities?.includes('peak')
              ? filters.actionIntensities.filter(i => i !== 'peak')
              : [...(filters.actionIntensities || []), 'peak']
          })}
        />

        <MagneticFilterOrb
          icon="🎨"
          label="Golden Hour"
          active={filters.timeOfDay?.includes('golden-hour') || false}
          onClick={() => onChange({
            ...filters,
            timeOfDay: filters.timeOfDay?.includes('golden-hour')
              ? filters.timeOfDay.filter(t => t !== 'golden-hour')
              : [...(filters.timeOfDay || []), 'golden-hour']
          })}
        />
      </div>

      {/* Result count */}
      <div className="text-center text-sm text-gray-600">
        {photoCount} photos match your filters
      </div>
    </div>
  );
}