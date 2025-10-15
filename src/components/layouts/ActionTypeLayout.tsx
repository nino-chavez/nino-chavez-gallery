'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import type { ActionGroup } from '@/lib/hooks/useBrowseData';

interface ActionTypeLayoutProps {
  actionTypes: ActionGroup[];
}

/**
 * Action Type Layout
 *
 * Groups albums by action/emotion (jump, dunk, celebrate, etc.)
 */
export function ActionTypeLayout({ actionTypes }: ActionTypeLayoutProps) {
  if (actionTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">No action tags detected</p>
        <p className="text-zinc-600 text-sm mt-2">
          Add action: or emotion: tags to album keywords
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {actionTypes.map((actionGroup) => (
        <section key={actionGroup.action} className="space-y-6">
          {/* Action Header */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-primary/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-50">
                  {actionGroup.action}
                </h2>
                <p className="text-zinc-500 text-sm">
                  {actionGroup.albums.length} {actionGroup.albums.length === 1 ? 'album' : 'albums'} •{' '}
                  {actionGroup.totalPhotos.toLocaleString()} photos
                </p>
              </div>
            </div>
          </div>

          {/* Albums Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {actionGroup.albums.map((album) => (
              <Link
                key={album.albumKey}
                href={`/album/${album.albumKey}`}
                className="group block bg-zinc-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-accent-primary transition-all duration-200"
              >
                {/* Album thumbnail */}
                <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                  {album.thumbnailUrl ? (
                    <Image
                      src={album.thumbnailUrl}
                      alt={album.name}
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
                  {/* Photo count badge */}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-950/80 backdrop-blur-sm text-gray-50">
                      {album.photoCount}
                    </span>
                  </div>
                </div>

                {/* Album Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-50 mb-1 line-clamp-2 group-hover:text-accent-primary transition-colors">
                    {album.name}
                  </h3>
                  {album.description && (
                    <p className="text-sm text-zinc-500 line-clamp-2">{album.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
