import type { Photo } from '@/types/photo';

interface UseCaseSuggestionsProps {
  photo: Photo;
}

export function UseCaseSuggestions({ photo }: UseCaseSuggestionsProps) {
  const { metadata } = photo;
  if (!metadata || !metadata.use_cases?.length) return null;

  const useCaseDetails = {
    'social-media': {
      icon: '📱',
      title: 'Social Media',
      description: 'Perfect for Instagram, Facebook, and other social platforms',
      benefits: ['Optimized dimensions', 'High visual impact', 'Quick loading']
    },
    'website-hero': {
      icon: '🌟',
      title: 'Website Hero',
      description: 'Ideal for website banners and hero sections',
      benefits: ['High resolution', 'Strong composition', 'Professional quality']
    },
    'athlete-portfolio': {
      icon: '🏆',
      title: 'Athlete Portfolio',
      description: 'Great for athlete profiles and highlight reels',
      benefits: ['Action-focused', 'Emotional impact', 'Portfolio quality']
    },
    'print': {
      icon: '🖨️',
      title: 'Print Materials',
      description: 'Excellent for posters, magazines, and print media',
      benefits: ['Print-ready quality', 'High resolution', 'Sharp details']
    },
    'editorial': {
      icon: '📰',
      title: 'Editorial Use',
      description: 'Suitable for newspapers, magazines, and articles',
      benefits: ['Storytelling power', 'Newsworthy moments', 'Professional finish']
    }
  };

  return (
    <div className="use-case-suggestions bg-blue-50 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span>💡</span>
        Recommended Uses
      </h3>

      <div className="space-y-3">
        {metadata.use_cases.map(useCase => {
          const details = useCaseDetails[useCase as keyof typeof useCaseDetails];
          if (!details) return null;

          return (
            <div key={useCase} className="use-case-item bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-start gap-3">
                <span className="text-lg">{details.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{details.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{details.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {details.benefits.map((benefit, index) => (
                      <span
                        key={index}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}