'use client';

import { useAlbumTracking } from '@/lib/hooks/usePrefetch';
import { AlbumGallery } from './AlbumGallery';
import type { SmugMugImage } from '@/types/smugmug';

interface AlbumPageClientProps {
  albumKey: string;
  images: SmugMugImage[];
}

/**
 * Client-side album page component with prefetch tracking
 */
export function AlbumPageClient({ albumKey, images }: AlbumPageClientProps) {
  // Track album view and prefetch related albums
  const { prefetchTargets } = useAlbumTracking(albumKey);

  // Debug: Log prefetch targets (can remove in production)
  if (prefetchTargets.length > 0) {
    console.debug('[Prefetch] Will prefetch albums:', prefetchTargets);
  }

  return <AlbumGallery images={images} />;
}
