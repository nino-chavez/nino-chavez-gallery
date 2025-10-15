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
    {
      id: '1',
      image_key: 'similar-1',
      image_url: 'https://picsum.photos/400/300?random=1',
      title: 'Similar Action Shot',
      caption: 'Another great volleyball moment',
      keywords: ['volleyball', 'action'],
      created_at: new Date().toISOString(),
      metadata: {
        sharpness: 8.5,
        exposure_accuracy: 8.2,
        composition_score: 8.8,
        emotional_impact: 9.0,
        portfolio_worthy: true,
        print_ready: true,
        social_media_optimized: true,
        emotion: 'intensity',
        composition: 'rule-of-thirds',
        time_of_day: 'afternoon',
        play_type: 'attack',
        action_intensity: 'high',
        use_cases: ['social-media', 'athlete-portfolio'],
        ai_provider: 'gemini',
        ai_cost: 0.02,
        enriched_at: new Date().toISOString()
      }
    },
    {
      id: '2',
      image_key: 'similar-2',
      image_url: 'https://picsum.photos/400/300?random=2',
      title: 'Similar Composition',
      caption: 'Great framing and lighting',
      keywords: ['volleyball', 'sports'],
      created_at: new Date().toISOString(),
      metadata: {
        sharpness: 9.0,
        exposure_accuracy: 8.8,
        composition_score: 9.2,
        emotional_impact: 8.5,
        portfolio_worthy: true,
        print_ready: false,
        social_media_optimized: true,
        emotion: 'focus',
        composition: 'leading-lines',
        time_of_day: 'golden-hour',
        play_type: 'block',
        action_intensity: 'peak',
        use_cases: ['social-media', 'website-hero'],
        ai_provider: 'gemini',
        ai_cost: 0.02,
        enriched_at: new Date().toISOString()
      }
    },
    {
      id: '3',
      image_key: 'similar-3',
      image_url: 'https://picsum.photos/400/300?random=3',
      title: 'Similar Emotion',
      caption: 'Captures the same intensity',
      keywords: ['volleyball', 'emotion'],
      created_at: new Date().toISOString(),
      metadata: {
        sharpness: 8.2,
        exposure_accuracy: 8.5,
        composition_score: 8.0,
        emotional_impact: 9.5,
        portfolio_worthy: false,
        print_ready: false,
        social_media_optimized: true,
        emotion: 'triumph',
        composition: 'close-up',
        time_of_day: 'evening',
        play_type: 'celebration',
        action_intensity: 'medium',
        use_cases: ['social-media'],
        ai_provider: 'gemini',
        ai_cost: 0.02,
        enriched_at: new Date().toISOString()
      }
    }
  ];

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