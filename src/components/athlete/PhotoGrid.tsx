import type { Photo } from '@/types/photo';

interface PhotoGridProps {
  photos: Photo[];
  aspectRatio?: 'square' | 'landscape' | 'portrait';
}

export function PhotoGrid({ photos, aspectRatio = 'landscape' }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg mb-2">No photos in this category</div>
        <div className="text-sm">Photos need enriched metadata to appear here</div>
      </div>
    );
  }

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'portrait':
        return 'aspect-[3/4]';
      default:
        return 'aspect-[4/3]';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {photos.map(photo => (
        <div key={photo.id} className="group cursor-pointer">
          <div className="relative overflow-hidden rounded-lg bg-gray-100">
            <img
              src={photo.image_url}
              alt={photo.title}
              className={`w-full h-full object-cover ${getAspectRatioClass()} group-hover:scale-105 transition-transform duration-200`}
            />

            {/* Quality badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              {photo.metadata?.portfolio_worthy && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  ⭐
                </span>
              )}
              {photo.metadata?.print_ready && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                  🖨️
                </span>
              )}
            </div>

            {/* Metadata overlay on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-end">
              <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-sm font-medium">{photo.title}</div>
                {photo.metadata && (
                  <div className="text-xs mt-1 space-y-1">
                    <div>Quality: {photo.metadata.composition_score}/10</div>
                    <div>{photo.metadata.emotion} • {photo.metadata.play_type}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}