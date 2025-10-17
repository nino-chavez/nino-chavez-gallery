'use client';

import { useState, useTransition } from 'react';
import type { PhotoFilterState } from '@/types/photo';
import { Button } from '@/components/ui';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { MagneticFilterOrb, type EmotionFilterType } from '@/components/interactions/MagneticFilterOrb';

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
  // Task 1.3.3: Use useTransition to track filter application state
  const [isPending, startTransition] = useTransition();

  const updateFilters = (updates: Partial<PhotoFilterState>) => {
    // Wrap filter updates in startTransition for loading state
    startTransition(() => {
      onChange({ ...filters, ...updates });
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      onChange({});
    });
  };

  return (
    <div className="photo-filters bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-6 mb-6">
      {/* Quick filters - Now using MagneticFilterOrb */}
      <div className="quick-filters flex flex-wrap gap-4 mb-6">
        <MagneticFilterOrb
          label="Portfolio Quality"
          icon="⭐"
          active={filters.portfolioWorthy || false}
          onClick={() => updateFilters({ portfolioWorthy: !filters.portfolioWorthy })}
          emotionType="triumph"
          magneticRadius={120}
        />

        <MagneticFilterOrb
          label="Print Ready"
          icon="🖨️"
          active={filters.printReady || false}
          onClick={() => updateFilters({ printReady: !filters.printReady })}
          emotionType="focus"
          magneticRadius={120}
        />

        <MagneticFilterOrb
          label="Social Media"
          icon="📱"
          active={filters.socialMediaOptimized || false}
          onClick={() => updateFilters({ socialMediaOptimized: !filters.socialMediaOptimized })}
          emotionType="excitement"
          magneticRadius={120}
        />
      </div>

      {/* Advanced filters toggle */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="icon"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white/70 hover:text-white transition-colors"
          disabled={isPending}
        >
          {isExpanded ? '↑ Hide' : '↓ Show'} Advanced Filters
        </Button>

        {(filters.portfolioWorthy || filters.printReady || filters.socialMediaOptimized ||
          filters.minQualityScore || filters.emotions?.length || filters.compositions?.length ||
          filters.playTypes?.length || filters.actionIntensities?.length || filters.useCases?.length) && (
          <Button
            variant="icon"
            size="sm"
            onClick={clearFilters}
            className="text-red-400/80 hover:text-red-300 transition-colors"
            disabled={isPending}
          >
            ✕ Clear all
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="advanced-filters space-y-6 border-t border-white/10 pt-6">
          {/* Quality slider */}
          <FilterGroup label="Minimum Quality Score">
            <div className="space-y-2">
              <Slider
                min={0}
                max={10}
                value={filters.minQualityScore || 0}
                onChange={(value) => updateFilters({ minQualityScore: value })}
                disabled={isPending}
              />
              <div className="text-sm text-white/60">
                Current: {filters.minQualityScore || 0}/10
              </div>
            </div>
          </FilterGroup>

          {/* Emotion multi-select using MagneticFilterOrbs */}
          <FilterGroup label="Emotion">
            <div className="flex flex-wrap gap-3">
              {(['triumph', 'focus', 'intensity', 'determination', 'excitement', 'serenity'] as EmotionFilterType[]).map((emotion) => {
                const emotionIcons = {
                  triumph: '🏆',
                  focus: '🎯',
                  intensity: '🔥',
                  determination: '💪',
                  excitement: '✨',
                  serenity: '🏔️',
                };
                return (
                  <MagneticFilterOrb
                    key={emotion}
                    label={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                    icon={emotionIcons[emotion]}
                    active={(filters.emotions || []).includes(emotion)}
                    onClick={() => {
                      const current = filters.emotions || [];
                      const updated = current.includes(emotion)
                        ? current.filter(e => e !== emotion)
                        : [...current, emotion];
                      updateFilters({ emotions: updated });
                    }}
                    emotionType={emotion}
                    magneticRadius={100}
                  />
                );
              })}
            </div>
          </FilterGroup>

          {/* Composition multi-select */}
          <FilterGroup label="Composition">
            <MultiSelect
              options={['rule-of-thirds', 'leading-lines', 'symmetry', 'motion-blur', 'close-up', 'wide-angle', 'dramatic-angle']}
              selected={filters.compositions || []}
              onChange={(compositions) => updateFilters({ compositions })}
              disabled={isPending}
            />
          </FilterGroup>

          {/* Time of day */}
          <FilterGroup label="Time of Day">
            <MultiSelect
              options={['morning', 'afternoon', 'golden-hour', 'evening', 'night', 'midday']}
              selected={filters.timeOfDay || []}
              onChange={(timeOfDay) => updateFilters({ timeOfDay })}
              disabled={isPending}
            />
          </FilterGroup>

          {/* Play type multi-select */}
          <FilterGroup label="Play Type">
            <MultiSelect
              options={['attack', 'block', 'dig', 'set', 'serve', 'pass', 'celebration', 'timeout']}
              selected={filters.playTypes || []}
              onChange={(playTypes) => updateFilters({ playTypes })}
              disabled={isPending}
            />
          </FilterGroup>

          {/* Action intensity */}
          <FilterGroup label="Action Intensity">
            <ButtonGroup
              options={['low', 'medium', 'high', 'peak']}
              selected={filters.actionIntensities || []}
              onChange={(actionIntensities) => updateFilters({ actionIntensities })}
              disabled={isPending}
            />
          </FilterGroup>

          {/* Use cases */}
          <FilterGroup label="Use Cases">
            <MultiSelect
              options={['social-media', 'website-hero', 'athlete-portfolio', 'print', 'editorial']}
              selected={filters.useCases || []}
              onChange={(useCases) => updateFilters({ useCases })}
              disabled={isPending}
            />
          </FilterGroup>
        </div>
      )}

      {/* Task 1.3.3: Loading indicator for filter application */}
      {/* Result count with loading state */}
      <div className="filter-results text-sm text-white/70 pt-4 border-t border-white/10 flex items-center gap-2">
        {isPending ? (
          <>
            <LoadingSpinner size="sm" inline aria-label="Applying filters" />
            <span aria-live="polite" className="animate-pulse">Applying filters...</span>
          </>
        ) : (
          <span aria-live="polite" className="font-medium">
            <span className="text-emotion-triumph">{photoCount}</span> photos match your filters
          </span>
        )}
      </div>
    </div>
  );
}

// Helper Components
interface FilterButtonProps {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function FilterButton({ active, onClick, children, disabled }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 text-sm rounded-full border transition-all duration-300 ease-out hover:shadow-lg hover:shadow-accent/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
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
      <label className="block text-sm font-semibold text-white/90 mb-3 tracking-wide uppercase">
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
  disabled?: boolean;
}

function Slider({ min, max, value, onChange, disabled }: SliderProps) {
  return (
    <div className="relative">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider accent-emotion-triumph hover:accent-emotion-intensity transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          background: `linear-gradient(to right, rgb(255, 215, 0) 0%, rgb(255, 215, 0) ${(value / max) * 100}%, rgba(255, 255, 255, 0.1) ${(value / max) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-white/50 mt-2">
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
  disabled?: boolean;
}

// Emotion-specific multi-select with emotion palette colors
function EmotionMultiSelect({ options, selected, onChange, disabled }: EmotionMultiSelectProps) {
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
            disabled={disabled}
            className={`px-2 py-1 text-xs rounded border transition-all duration-300 ease-out hover:shadow-lg hover:shadow-accent/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
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
  disabled?: boolean;
}

function MultiSelect({ options, selected, onChange, disabled }: MultiSelectProps) {
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
          disabled={disabled}
          className={`px-2 py-1 text-xs rounded border transition-all duration-300 ease-out hover:shadow-lg hover:shadow-accent/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
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
  disabled?: boolean;
}

function ButtonGroup({ options, selected, onChange, disabled }: ButtonGroupProps) {
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
          disabled={disabled}
          className={`px-2 py-1 text-xs rounded border transition-all duration-300 ease-out hover:shadow-lg hover:shadow-accent/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
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
