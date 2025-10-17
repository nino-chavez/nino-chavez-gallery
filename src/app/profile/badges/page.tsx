'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Heading, Text } from '@/components/ui';
import {
  loadUnlockedBadges,
  loadBadgeProgress,
  calculateBadgeProgress,
  type DiscoveryProgress
} from '@/lib/badge-storage';
import { BadgeCollection } from '@/components/delight/DiscoveryBadges';

export default function BadgesPage() {
  const [unlockedBadges, setUnlockedBadges] = useState<Set<string>>(new Set());
  const [discoveryProgress, setDiscoveryProgress] = useState<DiscoveryProgress | null>(null);

  // Calculate badge progress for display
  const badgeProgress = useMemo(() => {
    if (!discoveryProgress) return undefined;
    return calculateBadgeProgress(discoveryProgress);
  }, [discoveryProgress]);

  useEffect(() => {
    // Load badge data from localStorage on mount
    try {
      const badges = loadUnlockedBadges();
      const progress = loadBadgeProgress();

      setUnlockedBadges(badges);
      setDiscoveryProgress(progress);
    } catch (error) {
      console.error('Error loading badge data:', error);
      // Set default empty states on error
      setUnlockedBadges(new Set());
      setDiscoveryProgress({
        emotionsSeen: [],
        playTypesSeen: [],
        portfolioPhotosSeen: 0,
        peakMomentsSeen: 0,
        goldenHourPhotosSeen: 0,
        printReadyPhotosSeen: 0,
        totalPhotosViewed: 0,
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="container mx-auto px-6 py-12">
        <Heading level={1} className="text-center mb-4">
          Your Badge Collection
        </Heading>

        <div className="text-center text-white/60 max-w-2xl mx-auto">
          <Text variant="body">
            Unlock badges by exploring different emotions, play types, and discovering high-quality photos throughout the gallery.
          </Text>
        </div>
      </header>

      <main className="container mx-auto px-6 pb-20">
        {/* Stats Bar */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm px-8 py-4 rounded-2xl border border-white/10">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-yellow-400">{unlockedBadges.size}</span>
              <span className="text-2xl text-white/60">/</span>
              <span className="text-2xl text-white/60">6</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white/80">Badges Unlocked</div>
              <div className="text-xs text-white/50">
                {discoveryProgress?.totalPhotosViewed || 0} photos explored
              </div>
            </div>
          </div>
        </div>

        {/* Badge Collection */}
        <BadgeCollection badges={unlockedBadges} progress={badgeProgress} />

        {/* Keep Exploring Button */}
        <div className="mt-16 text-center">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold rounded-full hover:scale-105 transition-transform duration-200"
          >
            <span>Keep Exploring</span>
            <span className="text-lg">→</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
