'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Photo } from '@/types/photo';
import { Button, Text } from '@/components/ui';
import { PhotoSkeleton } from '@/components/common/PhotoSkeleton';

interface PortfolioGridProps {
  photos: Photo[];
  isLoading?: boolean;
}

export function PortfolioGrid({ photos, isLoading = false }: PortfolioGridProps) {
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

  if (!isLoading && photos.length === 0) {
    return (
      <div className="text-center py-12">
        <Text variant="body" className="mb-2">No portfolio photos found</Text>
        <Text variant="caption">Photos need to be enriched with metadata first</Text>
      </div>
    );
  }

  return (
    <div className="portfolio-grid">
      {/* Sort controls */}
      <div className="portfolio-controls mb-6">
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'quality' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('quality')}
          >
            Quality Score
          </Button>
          <Button
            variant={sortBy === 'emotion' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('emotion')}
          >
            Emotional Impact
          </Button>
          <Button
            variant={sortBy === 'recent' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('recent')}
          >
            Most Recent
          </Button>
        </div>
      </div>

      {/* Optimized responsive grid */}
      <div className="portfolio-grid-container grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-2 md:gap-3 lg:gap-4">
        {isLoading ? (
          // Display skeleton placeholders during loading (12 items)
          Array.from({ length: 12 }).map((_, index) => (
            <PhotoSkeleton key={`skeleton-${index}`} />
          ))
        ) : (
          // Display actual photos when loaded
          sortedPhotos.map(photo => (
            <div
              key={photo.id}
              className="cursor-pointer group relative overflow-hidden rounded-lg"
              onClick={() => handlePhotoClick(photo)}
            >
              {/* Aspect ratio container */}
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                <Image
                  src={photo.image_url}
                  alt={photo.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  quality={90}
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />

                {/* Quality badges overlay */}
                <div className="absolute top-2 left-2 flex gap-1 z-10">
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
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-end">
                  <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Text variant="label" className="text-white">{photo.title}</Text>
                    {photo.metadata && (
                      <div className="mt-1 space-y-1">
                        <Text variant="caption" className="text-white/90">Quality: {photo.metadata.composition_score}/10</Text>
                        <Text variant="caption" className="text-white/90">Emotion: {photo.metadata.emotion}</Text>
                        <Text variant="caption" className="text-white/90">Play: {photo.metadata.play_type}</Text>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
