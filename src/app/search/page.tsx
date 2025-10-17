'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Fuse from 'fuse.js';
import { Heading, Text } from '@/components/ui';
import { EmptyState } from '@/components/common/EmptyState';
import { formatMetadata, getDisplayTags } from '@/lib/metadata-formatter';

interface Photo {
  imageKey: string;
  fileName: string;
  title: string;
  caption: string;
  keywords: string[];
  imageUrl: string;
  thumbnailUrl: string;
  albumName: string;
  albumKey: string;
}

interface FilterState {
  sports: string[];
  albums: string[];
  dateRange: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    sports: [],
    albums: [],
    dateRange: 'all',
  });

  // Available filter options
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [availableAlbums, setAvailableAlbums] = useState<Array<{ key: string; name: string }>>([]);

  // Load all photos on mount
  useEffect(() => {
    setLoading(true);
    // Fetch photos from first 10 albums (balance between UX and performance)
    fetch('/api/search?limit=10&includePhotos=true')
      .then(res => res.json())
      .then(data => {
        const sportsSet = new Set<string>();
        const albumsMap = new Map<string, string>();

        // Extract unique sports and albums from photos
        data.photos.forEach((photo: any) => {
          albumsMap.set(photo.albumKey, photo.albumName);

          // Extract sports from keywords (handle both string and array types)
          if (photo.keywords) {
            const keywordsArray = typeof photo.keywords === 'string'
              ? photo.keywords.split(/[;,]/)
              : photo.keywords;

            keywordsArray.forEach((keyword: string) => {
              const trimmed = keyword.trim().toLowerCase();
              if (trimmed.startsWith('sport:')) {
                sportsSet.add(trimmed.replace('sport:', '').trim());
              } else if (['volleyball', 'basketball', 'soccer', 'baseball', 'softball', 'football', 'bmx'].some(sport => trimmed.includes(sport))) {
                sportsSet.add(trimmed);
              }
            });
          }
        });

        // Transform API response to Photo format
        const photos: Photo[] = data.photos.map((photo: any) => ({
          imageKey: photo.imageKey,
          fileName: photo.fileName,
          title: photo.title,
          caption: photo.caption,
          keywords: photo.keywords
            ? (typeof photo.keywords === 'string'
                ? photo.keywords.split(/[;,]/).map((k: string) => k.trim())
                : photo.keywords)
            : [],
          imageUrl: photo.imageUrl,
          thumbnailUrl: photo.thumbnailUrl,
          albumName: photo.albumName,
          albumKey: photo.albumKey,
        }));

        setAllPhotos(photos);
        setAvailableSports(Array.from(sportsSet).sort());
        setAvailableAlbums(Array.from(albumsMap.entries()).map(([key, name]) => ({ key, name })));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load search data:', err);
        setLoading(false);
      });
  }, []);

  // Fuzzy search with Fuse.js
  const fuse = useMemo(() => {
    return new Fuse(allPhotos, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'caption', weight: 0.3 },
        { name: 'keywords', weight: 0.2 },
        { name: 'albumName', weight: 0.1 },
      ],
      threshold: 0.4, // More lenient matching
      includeScore: true,
      minMatchCharLength: 2,
    });
  }, [allPhotos]);

  // Perform search
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);

    if (!searchQuery.trim() && filters.sports.length === 0 && filters.albums.length === 0) {
      setResults([]);
      return;
    }

    let filtered = allPhotos;

    // Apply filters first
    if (filters.sports.length > 0) {
      filtered = filtered.filter(photo =>
        photo.keywords.some(keyword =>
          filters.sports.some(sport =>
            keyword.toLowerCase().includes(sport.toLowerCase())
          )
        )
      );
    }

    if (filters.albums.length > 0) {
      filtered = filtered.filter(photo =>
        filters.albums.includes(photo.albumKey)
      );
    }

    // Then apply fuzzy search if query exists
    if (searchQuery.trim()) {
      const fuseInstance = new Fuse(filtered, {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'caption', weight: 0.3 },
          { name: 'keywords', weight: 0.2 },
          { name: 'albumName', weight: 0.1 },
        ],
        threshold: 0.4,
        includeScore: true,
        minMatchCharLength: 2,
      });

      const searchResults = fuseInstance.search(searchQuery);
      setResults(searchResults.map(result => result.item).slice(0, 50));
    } else {
      setResults(filtered.slice(0, 50));
    }
  };

  // Update search when query or filters change
  useEffect(() => {
    handleSearch(query);
  }, [query, filters, allPhotos]);

  const toggleFilter = (type: keyof FilterState, value: string) => {
    setFilters(prev => {
      const current = prev[type] as string[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];

      return { ...prev, [type]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({ sports: [], albums: [], dateRange: 'all' });
    setQuery('');
  };

  const hasActiveFilters = filters.sports.length > 0 || filters.albums.length > 0 || query.trim();

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Albums
          </a>
          <Heading level={1} className="mb-3">
            Search Photos
          </Heading>
          <Text variant="body" className="max-w-3xl">
            Search across {allPhotos.length} photos with AI-enriched metadata
          </Text>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, description, or keywords..."
              className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Search Stats */}
          <Text variant="caption" className="mt-3">
            {loading ? (
              'Loading...'
            ) : hasActiveFilters ? (
              <>Found {results.length} result{results.length !== 1 ? 's' : ''}</>
            ) : (
              'Enter a search term or apply filters'
            )}
          </Text>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-6">
          {/* Sports Filter */}
          {availableSports.length > 0 && (
            <div>
              <Heading level={3} className="mb-3">Sports</Heading>
              <div className="flex flex-wrap gap-2">
                {availableSports.slice(0, 10).map((sport) => (
                  <button
                    key={sport}
                    onClick={() => toggleFilter('sports', sport)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filters.sports.includes(sport)
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Albums Filter */}
          {availableAlbums.length > 0 && (
            <div>
              <Heading level={3} className="mb-3">Albums</Heading>
              <div className="flex flex-wrap gap-2">
                {availableAlbums.slice(0, 8).map((album) => (
                  <button
                    key={album.key}
                    onClick={() => toggleFilter('albums', album.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filters.albums.includes(album.key)
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {album.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((photo) => (
              <a
                key={photo.imageKey}
                href={`/album/${photo.albumKey}`}
                className="group block bg-zinc-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all duration-200"
              >
                <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                  {photo.thumbnailUrl ? (
                    <Image
                      src={photo.thumbnailUrl}
                      alt={photo.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-16 h-16 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {(() => {
                    const formatted = formatMetadata({
                      title: photo.title,
                      caption: photo.caption,
                      keywords: photo.keywords.join('; '),
                    });
                    const displayTags = getDisplayTags({
                      title: photo.title,
                      caption: photo.caption,
                      keywords: photo.keywords.join('; '),
                    }, 3);

                    return (
                      <>
                        <Heading level={3} className="line-clamp-2 mb-1">
                          {formatted.displayTitle}
                        </Heading>
                        <Text variant="caption" className="mb-2">{photo.albumName}</Text>
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
                      </>
                    );
                  })()}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* No Results - Task 3.1.4: Integrate EmptyState component */}
        {!loading && hasActiveFilters && results.length === 0 && (
          <EmptyState
            type="search"
            searchQuery={query}
            action={{
              label: 'Clear Filters',
              onClick: clearFilters,
            }}
          />
        )}

        {/* Example Queries */}
        {!hasActiveFilters && (
          <div className="bg-zinc-900 rounded-xl p-8">
            <Heading level={2} className="mb-6">
              Try These Searches
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'volleyball',
                'spike',
                'championship',
                'action',
                'celebration',
                'indoor',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="text-left px-6 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
