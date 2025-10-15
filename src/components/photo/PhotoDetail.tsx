import { QualityBadges } from './QualityBadges';
import { QualityMetrics } from './QualityMetrics';
import { MetadataTags } from './MetadataTags';
import { UseCaseSuggestions } from './UseCaseSuggestions';
import { SimilarPhotos } from './SimilarPhotos';
import type { Photo } from '@/types/photo';

interface PhotoDetailProps {
  photo: Photo;
}

export function PhotoDetail({ photo }: PhotoDetailProps) {
  return (
    <div className="photo-detail max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hero image section */}
        <div className="lg:col-span-2">
          <div className="photo-hero relative">
            <img
              src={photo.image_url}
              alt={photo.title}
              className="w-full h-auto rounded-lg shadow-lg"
            />

            {/* Quality badges overlay */}
            <div className="absolute top-4 left-4">
              <QualityBadges photo={photo} />
            </div>

            {/* Action buttons overlay */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm hover:bg-opacity-70 transition-colors">
                Share
              </button>
              <button className="bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm hover:bg-opacity-70 transition-colors">
                Download
              </button>
              {photo.metadata?.print_ready && (
                <button className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
                  🖨️ Order Print
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Metadata sidebar */}
        <aside className="photo-metadata space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{photo.title}</h1>
            <p className="text-gray-600">{photo.caption}</p>
          </div>

          {/* Quality scores */}
          <QualityMetrics photo={photo} />

          {/* Metadata tags */}
          <MetadataTags photo={photo} />

          {/* Use case suggestions */}
          <UseCaseSuggestions photo={photo} />

          {/* Actions */}
          <div className="photo-actions space-y-3">
            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Download Full Resolution
            </button>

            {photo.metadata?.print_ready && (
              <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
                Order Professional Print
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded hover:bg-gray-200 transition-colors">
                📱 Social Share
              </button>
              <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded hover:bg-gray-200 transition-colors">
                ⭐ Add to Favorites
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Similar photos section */}
      <section className="similar-photos mt-12">
        <h3 className="text-xl font-bold mb-6">Similar Photos</h3>
        <SimilarPhotos currentPhoto={photo} />
      </section>
    </div>
  );
}