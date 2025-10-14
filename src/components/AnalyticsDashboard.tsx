'use client';

import { useState, useEffect } from 'react';
import { useGalleryAnalytics } from '@/lib/hooks/usePrefetch';

interface AnalyticsData {
  totalViews: number;
  uniqueAlbums: number;
  popularAlbums: string[];
  recentAlbums: string[];
  avgViewsPerAlbum: number;
}

/**
 * Analytics dashboard showing user behavior insights
 */
export function AnalyticsDashboard() {
  const { getAnalytics } = useGalleryAnalytics();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load analytics on mount
    const data = getAnalytics();
    setAnalytics(data);
  }, [getAnalytics]);

  if (!analytics || analytics.totalViews === 0) {
    return null; // Don't show if no data
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Collapsed: Show icon button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg shadow-lg transition-colors"
          aria-label="Show analytics"
        >
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm text-white font-medium">
            {analytics.totalViews} {analytics.totalViews === 1 ? 'view' : 'views'}
          </span>
        </button>
      )}

      {/* Expanded: Show full dashboard */}
      {isExpanded && (
        <div className="w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-sm font-semibold text-white">Your Activity</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-zinc-500 hover:text-white transition-colors"
              aria-label="Close analytics"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="p-4 space-y-4">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{analytics.totalViews}</div>
                <div className="text-xs text-zinc-400">Total Views</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{analytics.uniqueAlbums}</div>
                <div className="text-xs text-zinc-400">Albums Viewed</div>
              </div>
            </div>

            {/* Average Views */}
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-lg font-semibold text-white">
                {analytics.avgViewsPerAlbum.toFixed(1)}
              </div>
              <div className="text-xs text-zinc-400">Avg Views per Album</div>
            </div>

            {/* Popular Albums */}
            {analytics.popularAlbums.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                  Most Viewed
                </h4>
                <div className="space-y-1">
                  {analytics.popularAlbums.slice(0, 3).map((albumKey, index) => (
                    <a
                      key={albumKey}
                      href={`/album/${albumKey}`}
                      className="block px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors"
                    >
                      <span className="text-blue-400 font-medium">#{index + 1}</span> {albumKey}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Albums */}
            {analytics.recentAlbums.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                  Recently Viewed
                </h4>
                <div className="space-y-1">
                  {analytics.recentAlbums.slice(0, 3).map((albumKey) => (
                    <a
                      key={albumKey}
                      href={`/album/${albumKey}`}
                      className="block px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors truncate"
                    >
                      {albumKey}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
            <p className="text-xs text-zinc-500 text-center">
              Data stored locally in your browser
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
