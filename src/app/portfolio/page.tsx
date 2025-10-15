'use client';

import { useState, useEffect } from 'react';
import { QualityGradientGrid } from '@/components/portfolio/QualityGradientGrid';
import { PlayTypeMorphGrid } from '@/components/gallery/PlayTypeMorphGrid';
import { EmotionTimeline } from '@/components/interactions/EmotionTimeline';
import { MagneticFilterBar } from '@/components/filters/MagneticFilterBar';
import { ContextualCursor } from '@/components/interactions/ContextualCursor';
import { usePhotoFilters } from '@/hooks/usePhotoFilters';
import type { PhotoFilterState, Photo } from '@/types/photo';

type ViewMode = 'grid' | 'quality' | 'timeline';

export default function PortfolioPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('quality');
  const [filters, setFilters] = useState<PhotoFilterState>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [hoveredPhoto, setHoveredPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const filteredPhotos = usePhotoFilters(photos, filters);

  useEffect(() => {
    // Fetch portfolio-worthy photos from API
    const fetchPhotos = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/gallery?portfolioWorthy=true');
        const data = await response.json();
        setPhotos(data.photos || []);
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  return (
    <div className="portfolio-page min-h-screen bg-white">
      {/* Contextual cursor */}
      <ContextualCursor hoveredPhoto={hoveredPhoto} />

      <header className="py-12 px-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Portfolio Showcase</h1>
        <p className="text-gray-600 mb-8">
          Curated collection of top-quality action sports photography
        </p>

        {/* View mode toggle */}
        <div className="flex gap-4 justify-center mb-8">
          <button
            className={`px-4 py-2 rounded-full transition-colors ${
              viewMode === 'quality' ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setViewMode('quality')}
          >
            ✨ Quality View
          </button>
          <button
            className={`px-4 py-2 rounded-full transition-colors ${
              viewMode === 'grid' ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setViewMode('grid')}
          >
            📐 Grid View
          </button>
          <button
            className={`px-4 py-2 rounded-full transition-colors ${
              viewMode === 'timeline' ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setViewMode('timeline')}
          >
            ⏱️ Timeline
          </button>
        </div>

        <MagneticFilterBar
          filters={filters}
          onChange={setFilters}
          photoCount={filteredPhotos.length}
        />
      </header>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-gray-600">Loading portfolio...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredPhotos.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📸</div>
          <h2 className="text-2xl font-bold mb-2">No photos found</h2>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or check back later
          </p>
          <button
            onClick={() => setFilters({})}
            className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Render based on view mode */}
      {!isLoading && filteredPhotos.length > 0 && (
        <div 
          className="px-8 pb-12"
          onMouseEnter={() => {}}
          onMouseLeave={() => setHoveredPhoto(null)}
        >
          {viewMode === 'quality' && (
            <QualityGradientGrid 
              photos={filteredPhotos}
              onPhotoClick={(photo) => setHoveredPhoto(photo)}
            />
          )}
          {viewMode === 'grid' && (
            <PlayTypeMorphGrid 
              photos={filteredPhotos} 
              activePlayType={null}
              onPhotoClick={(photo) => setHoveredPhoto(photo)}
            />
          )}
          {viewMode === 'timeline' && (
            <EmotionTimeline 
              photos={filteredPhotos} 
              onPhotoSetChange={setPhotos} 
            />
          )}
        </div>
      )}
    </div>
  );
}