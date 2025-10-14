'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);

  // Load all photos on mount
  useEffect(() => {
    fetch('/api/gallery')
      .then(res => res.json())
      .then(context => {
        const photos: Photo[] = [];
        context.albums.forEach((album: any) => {
          album.photos.forEach((photo: any) => {
            photos.push({
              ...photo,
              albumName: album.name,
              albumKey: album.albumKey,
            });
          });
        });
        setAllPhotos(photos);
      });
  }, []);

  // Simple client-side keyword search
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);

    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    // Search across title, caption, and keywords
    const searchTerms = searchQuery.toLowerCase().split(' ');
    const matches = allPhotos.filter(photo => {
      const searchableText = [
        photo.title,
        photo.caption,
        ...photo.keywords,
        photo.albumName,
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });

    setResults(matches.slice(0, 50)); // Limit to 50 results
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Albums
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Search Photos
          </h1>

          {/* Search Input */}
          <div className="max-w-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by keywords (e.g., 'volleyball spike dramatic')"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-600">
              Searching across {allPhotos.length.toLocaleString()} enriched photos
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Searching...</p>
          </div>
        )}

        {/* Results */}
        {!loading && query && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No photos found matching "{query}"</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="mb-4">
              <p className="text-gray-700">
                Found {results.length} photo{results.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((photo) => (
                <div
                  key={photo.imageKey}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <a href={`/album/${photo.albumKey}`}>
                    <div className="relative aspect-square">
                      <Image
                        src={photo.thumbnailUrl}
                        alt={photo.title || photo.fileName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                        {photo.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">
                        {photo.albumName}
                      </p>
                      {photo.caption && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Example Queries */}
        {!query && (
          <div className="mt-12 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Try These Searches
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'volleyball spike',
                'dramatic sunset',
                'celebration moment',
                'intense focus',
                'beach volleyball',
                'indoor court action',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => handleSearch(example)}
                  className="text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
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
