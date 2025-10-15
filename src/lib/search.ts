import type { Photo } from '@/types/photo';

export function enhancedPhotoSearch(
  query: string,
  photos: Photo[]
): Photo[] {
  const lowerQuery = query.toLowerCase();

  // Metadata-based search patterns
  const patterns: Array<{test: RegExp, filter: (p: Photo) => boolean}> = [
    // Quality patterns
    {
      test: /high quality|portfolio|best|top quality/i,
      filter: (p) => p.metadata?.portfolio_worthy === true
    },
    {
      test: /print ready|print quality|printable/i,
      filter: (p) => p.metadata?.print_ready === true
    },
    {
      test: /social media|instagram|facebook|social sharing/i,
      filter: (p) => p.metadata?.social_media_optimized === true
    },

    // Action patterns
    {
      test: /action|intense|dynamic|high energy|peak action/i,
      filter: (p) => p.metadata?.action_intensity === 'high' || p.metadata?.action_intensity === 'peak'
    },
    {
      test: /spike|attack|kill|offense/i,
      filter: (p) => p.metadata?.play_type === 'attack'
    },
    {
      test: /block|blocking|defense/i,
      filter: (p) => p.metadata?.play_type === 'block'
    },
    {
      test: /dig|digging|save|defensive/i,
      filter: (p) => p.metadata?.play_type === 'dig'
    },
    {
      test: /serve|serving|service/i,
      filter: (p) => p.metadata?.play_type === 'serve'
    },
    {
      test: /set|setting|assist/i,
      filter: (p) => p.metadata?.play_type === 'set'
    },
    {
      test: /pass|passing|reception/i,
      filter: (p) => p.metadata?.play_type === 'pass'
    },

    // Emotion patterns
    {
      test: /celebration|victory|triumph|winning|success/i,
      filter: (p) => p.metadata?.emotion === 'triumph' || p.metadata?.play_type === 'celebration'
    },
    {
      test: /focus|concentration|intense|determination/i,
      filter: (p) => p.metadata?.emotion === 'focus' || p.metadata?.emotion === 'determination'
    },
    {
      test: /intensity|power|strength|aggressive/i,
      filter: (p) => p.metadata?.emotion === 'intensity'
    },
    {
      test: /excitement|exciting|energy|dynamic/i,
      filter: (p) => p.metadata?.emotion === 'excitement'
    },

    // Composition patterns
    {
      test: /golden hour|sunset|dawn|magic hour/i,
      filter: (p) => p.metadata?.time_of_day === 'golden-hour'
    },
    {
      test: /motion blur|action shot|fast movement|dynamic/i,
      filter: (p) => p.metadata?.composition === 'motion-blur'
    },
    {
      test: /rule of thirds|composition|balanced/i,
      filter: (p) => p.metadata?.composition === 'rule-of-thirds'
    },
    {
      test: /close.?up|closeup|detail|macro/i,
      filter: (p) => p.metadata?.composition === 'close-up'
    },
    {
      test: /wide.?angle|wide|landscape|panorama/i,
      filter: (p) => p.metadata?.composition === 'wide-angle'
    },

    // Time patterns
    {
      test: /morning|dawn|early/i,
      filter: (p) => p.metadata?.time_of_day === 'morning'
    },
    {
      test: /afternoon|daytime|midday/i,
      filter: (p) => p.metadata?.time_of_day === 'afternoon' || p.metadata?.time_of_day === 'midday'
    },
    {
      test: /evening|dusk|night/i,
      filter: (p) => p.metadata?.time_of_day === 'evening' || p.metadata?.time_of_day === 'night'
    },

    // Use case patterns
    {
      test: /hero|banner|main|featured/i,
      filter: (p) => p.metadata?.use_cases?.includes('website-hero')
    },
    {
      test: /portfolio|professional|showcase/i,
      filter: (p) => p.metadata?.use_cases?.includes('athlete-portfolio')
    },
    {
      test: /editorial|magazine|news|article/i,
      filter: (p) => p.metadata?.use_cases?.includes('editorial')
    }
  ];

  // Check metadata patterns first
  for (const pattern of patterns) {
    if (pattern.test.test(lowerQuery)) {
      return photos.filter(pattern.filter);
    }
  }

  // Fallback to keyword search
  return photos.filter(photo => {
    const searchText = [
      photo.title,
      photo.caption,
      ...(photo.keywords || []),
      photo.metadata?.emotion,
      photo.metadata?.play_type,
      photo.metadata?.composition,
      photo.metadata?.time_of_day,
    ].filter(Boolean).join(' ').toLowerCase();

    return searchText.includes(lowerQuery);
  });
}

export function getSearchSuggestions(query: string, photos: Photo[]): string[] {
  const suggestions = new Set<string>();
  const lowerQuery = query.toLowerCase();

  // Add emotion suggestions
  const emotions = ['triumph', 'focus', 'intensity', 'determination', 'excitement'];
  emotions.forEach(emotion => {
    if (emotion.includes(lowerQuery)) {
      suggestions.add(emotion);
    }
  });

  // Add play type suggestions
  const playTypes = ['attack', 'block', 'dig', 'serve', 'set', 'pass'];
  playTypes.forEach(playType => {
    if (playType.includes(lowerQuery)) {
      suggestions.add(playType);
    }
  });

  // Add composition suggestions
  const compositions = ['rule-of-thirds', 'motion-blur', 'close-up', 'wide-angle'];
  compositions.forEach(composition => {
    if (composition.includes(lowerQuery)) {
      suggestions.add(composition.replace('-', ' '));
    }
  });

  // Add quality suggestions
  if (lowerQuery.includes('quality') || lowerQuery.includes('best')) {
    suggestions.add('portfolio quality');
    suggestions.add('print ready');
  }

  if (lowerQuery.includes('social')) {
    suggestions.add('social media');
  }

  if (lowerQuery.includes('action') || lowerQuery.includes('intense')) {
    suggestions.add('high action');
    suggestions.add('peak intensity');
  }

  return Array.from(suggestions).slice(0, 8);
}

export function searchPhotosWithAnalytics(
  query: string,
  photos: Photo[]
): { results: Photo[], searchType: string, searchTime: number, metadata: any } {
  const startTime = Date.now();
  const results = enhancedPhotoSearch(query, photos);
  const searchTime = Date.now() - startTime;

  // Determine search type
  let searchType = 'keyword';
  const lowerQuery = query.toLowerCase();

  if (/high quality|portfolio|best|print ready|social media/.test(lowerQuery)) {
    searchType = 'quality';
  } else if (/attack|block|dig|serve|set|pass|celebration/.test(lowerQuery)) {
    searchType = 'play_type';
  } else if (/triumph|focus|intensity|determination|excitement/.test(lowerQuery)) {
    searchType = 'emotion';
  } else if (/golden hour|motion blur|rule of thirds|close up|wide angle/.test(lowerQuery)) {
    searchType = 'composition';
  }

  return {
    results,
    searchTime,
    searchType,
    metadata: {
      query,
      resultCount: results.length,
      searchType,
      searchTime,
      timestamp: new Date().toISOString()
    }
  };
}