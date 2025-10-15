import type { Photo } from '@/types/photo';
import { findSimilarPhotos } from '@/lib/recommendations';

interface SimilarPhotosProps {
  currentPhoto: Photo;
  allPhotos?: Photo[];
}

export function SimilarPhotos({ currentPhoto, allPhotos = [] }: SimilarPhotosProps) {
  // Use real recommendations algorithm
  const similarPhotos = findSimilarPhotos(currentPhoto, allPhotos, 3);

  if (similarPhotos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg mb-2">No similar photos found</div>
        <div className="text-sm">Photos need enriched metadata to find similar images</div>
      </div>
    );
  }

  return (
    <div className="similar-photos">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {similarPhotos.map(photo => (
          <div key={photo.id} className="similar-photo-card group cursor-pointer">
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={photo.image_url}
                alt={photo.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
              />

              {/* Quality badges */}
              <div className="absolute top-2 left-2">
                {photo.metadata?.portfolio_worthy && (
                  <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    ⭐
                  </span>
                )}
              </div>

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center text-white p-4">
                  <div className="text-sm font-medium">{photo.title}</div>
                  <div className="text-xs mt-1">
                    Quality: {photo.metadata?.composition_score}/10
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2">
              <h4 className="text-sm font-medium text-gray-900">{photo.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                {photo.metadata && (
                  <>
                    <span className="text-xs text-gray-500">
                      {photo.metadata.emotion}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {photo.metadata.play_type}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}