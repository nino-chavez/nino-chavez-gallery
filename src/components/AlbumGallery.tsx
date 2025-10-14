'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatMetadata, getDisplayTags } from '@/lib/metadata-formatter';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import type { SmugMugImage } from '@/types/smugmug';

interface AlbumGalleryProps {
  images: SmugMugImage[];
}

export function AlbumGallery({ images }: AlbumGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Transform SmugMug images to lightbox format
  const lightboxPhotos = images.map(img => ({
    imageKey: img.ImageKey,
    imageUrl: img.LargeImageUrl || img.ArchivedUri || img.ThumbnailUrl,
    thumbnailUrl: img.ThumbnailUrl,
    title: img.Title,
    caption: img.Caption,
    keywords: img.Keywords,
    fileName: img.FileName,
  }));

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((photo, index) => {
          const formatted = formatMetadata({
            title: photo.Title,
            caption: photo.Caption,
            keywords: photo.Keywords,
          });
          const displayTags = getDisplayTags({
            title: photo.Title,
            caption: photo.Caption,
            keywords: photo.Keywords,
          }, 3);

          return (
            <button
              key={photo.ImageKey}
              onClick={() => setLightboxIndex(index)}
              className="group bg-zinc-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all duration-200 text-left"
            >
              <div className="relative aspect-square bg-zinc-800">
                <Image
                  src={photo.ThumbnailUrl}
                  alt={formatted.displayTitle}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">
                  {formatted.displayTitle}
                </h3>
                {formatted.displayCaption && (
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-2">
                    {formatted.displayCaption}
                  </p>
                )}
                {displayTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {displayTags.map((tag, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-1 rounded ${
                          tag.category === 'sport'
                            ? 'bg-blue-900/30 text-blue-400 border border-blue-800'
                            : tag.category === 'action'
                            ? 'bg-orange-900/30 text-orange-400 border border-orange-800'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          isOpen={true}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
