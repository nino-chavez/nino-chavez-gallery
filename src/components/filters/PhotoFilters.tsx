import { useState } from 'react';
import type { PhotoFilterState } from '@/types/photo';

interface PhotoFiltersProps {
  filters: PhotoFilterState;
  onChange: (filters: PhotoFilterState) => void;
  photoCount: number;
}

export function PhotoFilters({ filters, onChange, photoCount }: PhotoFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (updates: Partial<PhotoFilterState>) => {
    onChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onChange({});
  };

  return (
    <div className="photo-filters bg-white rounded-lg shadow-sm border p-4 mb-6">
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
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {isExpanded ? 'Hide' : 'Show'} Advanced Filters
        </button>

        {(filters.portfolioWorthy || filters.printReady || filters.socialMediaOptimized ||
          filters.minQualityScore || filters.emotions?.length || filters.compositions?.length ||
          filters.playTypes?.length || filters.actionIntensities?.length || filters.useCases?.length) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
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

          {/* Emotion multi-select */}
          <FilterGroup label="Emotion">
            <MultiSelect
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
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
        active
          ? 'bg-blue-100 text-blue-800 border-blue-300'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
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
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}