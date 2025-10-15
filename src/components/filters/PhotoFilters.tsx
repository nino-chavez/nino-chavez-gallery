'use client';

import { useState } from 'react';
import type { PhotoFilterState } from '@/types/photo';
import { Button } from '@/components/ui';

interface PhotoFiltersProps {
  filters: PhotoFilterState;
  onChange: (filters: PhotoFilterState) => void;
  photoCount: number;
}

// Emotion color mapping for badges
const EMOTION_COLORS = {
  triumph: 'bg-emotion-triumph/10 text-emotion-triumph border-emotion-triumph/30',
  focus: 'bg-emotion-focus/10 text-emotion-focus border-emotion-focus/30',
  intensity: 'bg-emotion-intensity/10 text-emotion-intensity border-emotion-intensity/30',
  determination: 'bg-emotion-determination/10 text-emotion-determination border-emotion-determination/30',
  excitement: 'bg-emotion-excitement/10 text-emotion-excitement border-emotion-excitement/30',
  serenity: 'bg-emotion-serenity/10 text-emotion-serenity border-emotion-serenity/30',
};

export function PhotoFilters({ filters, onChange, photoCount }: PhotoFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (updates: Partial<PhotoFilterState>) => {
    onChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onChange({});
  };

  return (
    <div className="photo-filters bg-gray-50 rounded-lg shadow-sm border p-4 mb-6">
      {/* Quick filters */}
      <div className="quick-filters flex flex-wrap gap-2 mb-4">
        <FilterButton
          active={filters.portfolioWorthy}
          onClick={() => updateFilters({ portfolioWorthy: !filters.portfolioWorthy })}
        >
          ⭐ Portfolio Quality
        </FilterButton>

        <FilterButton
          active={filters.printReady}
          onClick={() => updateFilters({ printReady: !filters.printReady })}
        >
          🖨️ Print Ready
        </FilterButton>

        <FilterButton
          active={filters.socialMediaOptimized}
          onClick={() => updateFilters({ socialMediaOptimized: !filters.socialMediaOptimized })}
        >
          📱 Social Media
        </FilterButton>
      </div>

      {/* Advanced filters toggle */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="icon"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-accent hover:text-accent-hover"
        >
          {isExpanded ? 'Hide' : 'Show'} Advanced Filters
        </Button>

        {(filters.portfolioWorthy || filters.printReady || filters.socialMediaOptimized ||
          filters.minQualityScore || filters.emotions?.length || filters.compositions?.length ||
          filters.playTypes?.length || filters.actionIntensities?.length || filters.useCases?.length) && (
          <Button
            variant="icon"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear all
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="advanced-filters space-y-4 border-t pt-4">
          {/* Quality slider */}
          <FilterGroup label="Minimum Quality Score">
            <div className="space-y-2">
              <Slider
                min={0}
                max={10}
                value={filters.minQualityScore || 0}
                onChange={(value) => updateFilters({ minQualityScore: value })}
              />
              <div className="text-sm text-gray-600">
                Current: {filters.minQualityScore || 0}/10
              </div>
            </div>
          </FilterGroup>

          {/* Emotion multi-select with emotion palette colors */}
          <FilterGroup label="Emotion">
            <EmotionMultiSelect
              options={['triumph', 'focus', 'intensity', 'determination', 'excitement', 'serenity']}
              selected={filters.emotions || []}
              onChange={(emotions) => updateFilters({ emotions })}
            />
          </FilterGroup>

          {/* Composition multi-select */}
          <FilterGroup label="Composition">
            <MultiSelect
              options={['rule-of-thirds', 'leading-lines', 'symmetry', 'motion-blur', 'close-up', 'wide-angle', 'dramatic-angle']}
              selected={filters.compositions || []}
              onChange={(compositions) => updateFilters({ compositions })}
            />
          </FilterGroup>

          {/* Time of day */}
          <FilterGroup label="Time of Day">
            <MultiSelect
              options={['morning', 'afternoon', 'golden-hour', 'evening', 'night', 'midday']}
              selected={filters.timeOfDay || []}
              onChange={(timeOfDay) => updateFilters({ timeOfDay })}
            />
          </FilterGroup>

          {/* Play type multi-select */}
          <FilterGroup label="Play Type">
            <MultiSelect
              options={['attack', 'block', 'dig', 'set', 'serve', 'pass', 'celebration', 'timeout']}
              selected={filters.playTypes || []}
              onChange={(playTypes) => updateFilters({ playTypes })}
            />
          </FilterGroup>

          {/* Action intensity */}
          <FilterGroup label="Action Intensity">
            <ButtonGroup
              options={['low', 'medium', 'high', 'peak']}
              selected={filters.actionIntensities || []}
              onChange={(actionIntensities) => updateFilters({ actionIntensities })}
            />
          </FilterGroup>

          {/* Use cases */}
          <FilterGroup label="Use Cases">
            <MultiSelect
              options={['social-media', 'website-hero', 'athlete-portfolio', 'print', 'editorial']}
              selected={filters.useCases || []}
              onChange={(useCases) => updateFilters({ useCases })}
            />
          </FilterGroup>
        </div>
      )}

      {/* Result count */}
      <div className="filter-results text-sm text-gray-600 pt-2 border-t">
        {photoCount} photos match your filters
      </div>
    </div>
  );
}

// Helper Components
interface FilterButtonProps {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
        active
          ? 'bg-accent/10 text-accent border-accent/30'
          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

interface FilterGroupProps {
  label: string;
  children: React.ReactNode;
}

function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div className="filter-group">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

function Slider({ min, max, value, onChange }: SliderProps) {
  return (
    <div className="relative">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

interface EmotionMultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

// Emotion-specific multi-select with emotion palette colors
function EmotionMultiSelect({ options, selected, onChange }: EmotionMultiSelectProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {options.map(option => {
        const emotionColor = EMOTION_COLORS[option as keyof typeof EMOTION_COLORS] || '';
        return (
          <button
            key={option}
            onClick={() => toggleOption(option)}
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              selected.includes(option)
                ? emotionColor
                : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {option.replace('-', ' ')}
          </button>
        );
      })}
    </div>
  );
}

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function MultiSelect({ options, selected, onChange }: MultiSelectProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {options.map(option => (
        <button
          key={option}
          onClick={() => toggleOption(option)}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            selected.includes(option)
              ? 'bg-accent/10 text-accent border-accent/30'
              : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
          }`}
        >
          {option.replace('-', ' ')}
        </button>
      ))}
    </div>
  );
}

interface ButtonGroupProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function ButtonGroup({ options, selected, onChange }: ButtonGroupProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {options.map(option => (
        <button
          key={option}
          onClick={() => toggleOption(option)}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            selected.includes(option)
              ? 'bg-accent/10 text-accent border-accent/30'
              : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
