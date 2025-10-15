'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Photo } from '@/types/photo';

interface PortfolioGridProps {
  photos: Photo[];
}

export function PortfolioGrid({ photos }: PortfolioGridProps) {
  const [sortBy, setSortBy] = useState<'quality' | 'emotion' | 'recent'>('quality');
  const router = useRouter();

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      switch (sortBy) {
        case 'quality':
          return (b.metadata?.composition_score || 0) - (a.metadata?.composition_score || 0);
        case 'emotion':
          return (b.metadata?.emotional_impact || 0) - (a.metadata?.emotional_impact || 0);
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [photos, sortBy]);

  const handlePhotoClick = (photo: Photo) => {
    router.push(`/photo/${photo.id}`);
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No portfolio photos found</div>
        <div className="text-gray-400">Photos need to be enriched with metadata first</div>
      </div>
    );
  }

  return (
    <div className="portfolio-grid">
      {/* Sort controls */}
      <div className="portfolio-controls mb-6">
        <div className="flex gap-2">
          <SortButton
            active={sortBy === 'quality'}
            onClick={() => setSortBy('quality')}
          >
            Quality Score
          </SortButton>
          <SortButton
            active={sortBy === 'emotion'}
            onClick={() => setSortBy('emotion')}
          >
            Emotional Impact
          </SortButton>
          <SortButton
            active={sortBy === 'recent'}
            onClick={() => setSortBy('recent')}
          >
            Most Recent
          </SortButton>
        </div>
      </div>

      {/* Masonry grid */}
      <div className="masonry-grid columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {sortedPhotos.map(photo => (
          <div
            key={photo.id}
            className="break-inside-avoid cursor-pointer group relative"
            onClick={() => handlePhotoClick(photo)}
          >
            <img
              src={photo.image_url}
              alt={photo.title}
              className="w-full h-auto rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
            />

            {/* Quality badges overlay */}
            <div className="absolute top-2 left-2 flex gap-1">
              {photo.metadata?.portfolio_worthy && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                  ⭐ Portfolio
                </span>
              )}
              {photo.metadata?.print_ready && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  🖨️ Print
                </span>
              )}
            </div>

            {/* Metadata overlay on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-end">
              <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-sm font-medium">{photo.title}</div>
                {photo.metadata && (
                  <div className="text-xs mt-1 space-y-1">
                    <div>Quality: {photo.metadata.composition_score}/10</div>
                    <div>Emotion: {photo.metadata.emotion}</div>
                    <div>Play: {photo.metadata.play_type}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SortButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function SortButton({ active, onClick, children }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}