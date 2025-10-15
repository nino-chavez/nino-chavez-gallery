'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { EMOTION_ICONS, PLAY_TYPE_ICONS } from '@/lib/motion-tokens';
import type { Photo } from '@/types/photo';

interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'emotion-explorer',
    icon: '🎭',
    title: 'Emotion Explorer',
    description: 'Discovered all emotion types',
  },
  {
    id: 'volleyball-connoisseur',
    icon: '🏐',
    title: 'Volleyball Connoisseur',
    description: 'Viewed all play types',
  },
  {
    id: 'quality-hunter',
    icon: '⭐',
    title: 'Quality Hunter',
    description: 'Found 10 portfolio-worthy photos',
  },
  {
    id: 'peak-seeker',
    icon: '⚡',
    title: 'Peak Seeker',
    description: 'Discovered 5 peak moment photos',
  },
  {
    id: 'golden-hour-enthusiast',
    icon: '🌅',
    title: 'Golden Hour Enthusiast',
    description: 'Viewed 5 golden hour photos',
  },
  {
    id: 'print-collector',
    icon: '🖼️',
    title: 'Print Collector',
    description: 'Found 10 print-ready photos',
  },
];

interface DiscoveryTrackerProps {
  viewedPhoto: Photo | null;
}

export function DiscoveryTracker({ viewedPhoto }: DiscoveryTrackerProps) {
  const [discoveries, setDiscoveries] = useState({
    emotions: new Set<string>(),
    playTypes: new Set<string>(),
    portfolioCount: 0,
    peakCount: 0,
    goldenHourCount: 0,
    printReadyCount: 0,
  });
  const [unlockedBadges, setUnlockedBadges] = useState<Set<string>>(new Set());
  const [showBadge, setShowBadge] = useState<Badge | null>(null);

  useEffect(() => {
    if (!viewedPhoto) return;

    const newDiscoveries = { ...discoveries };
    let newBadge: Badge | null = null;

    // Track emotions
    if (viewedPhoto.metadata?.emotion) {
      newDiscoveries.emotions.add(viewedPhoto.metadata.emotion);

      if (
        newDiscoveries.emotions.size === Object.keys(EMOTION_ICONS).length &&
        !unlockedBadges.has('emotion-explorer')
      ) {
        newBadge = AVAILABLE_BADGES.find(b => b.id === 'emotion-explorer')!;
      }
    }

    // Track play types
    if (viewedPhoto.metadata?.play_type) {
      newDiscoveries.playTypes.add(viewedPhoto.metadata.play_type);

      if (
        newDiscoveries.playTypes.size === Object.keys(PLAY_TYPE_ICONS).length &&
        !unlockedBadges.has('volleyball-connoisseur')
      ) {
        newBadge = AVAILABLE_BADGES.find(b => b.id === 'volleyball-connoisseur')!;
      }
    }

    // Track portfolio photos
    if (viewedPhoto.metadata?.portfolio_worthy) {
      newDiscoveries.portfolioCount++;

      if (newDiscoveries.portfolioCount >= 10 && !unlockedBadges.has('quality-hunter')) {
        newBadge = AVAILABLE_BADGES.find(b => b.id === 'quality-hunter')!;
      }
    }

    // Track peak moments
    if (viewedPhoto.metadata?.action_intensity === 'peak') {
      newDiscoveries.peakCount++;

      if (newDiscoveries.peakCount >= 5 && !unlockedBadges.has('peak-seeker')) {
        newBadge = AVAILABLE_BADGES.find(b => b.id === 'peak-seeker')!;
      }
    }

    // Track golden hour
    if (viewedPhoto.metadata?.time_of_day === 'golden-hour') {
      newDiscoveries.goldenHourCount++;

      if (newDiscoveries.goldenHourCount >= 5 && !unlockedBadges.has('golden-hour-enthusiast')) {
        newBadge = AVAILABLE_BADGES.find(b => b.id === 'golden-hour-enthusiast')!;
      }
    }

    // Track print ready
    if (viewedPhoto.metadata?.print_ready) {
      newDiscoveries.printReadyCount++;

      if (newDiscoveries.printReadyCount >= 10 && !unlockedBadges.has('print-collector')) {
        newBadge = AVAILABLE_BADGES.find(b => b.id === 'print-collector')!;
      }
    }

    setDiscoveries(newDiscoveries);

    if (newBadge) {
      setUnlockedBadges(prev => new Set([...prev, newBadge!.id]));
      setShowBadge(newBadge);

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF69B4'],
      });

      // Auto-hide after 5 seconds
      setTimeout(() => setShowBadge(null), 5000);
    }
  }, [viewedPhoto]);

  return (
    <AnimatePresence>
      {showBadge && (
        <motion.div
          className="fixed bottom-8 right-8 bg-black text-white p-6 rounded-2xl shadow-2xl max-w-sm z-50"
          initial={{ y: 100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center gap-4">
            <div className="text-6xl">{showBadge.icon}</div>
            <div>
              <h3 className="text-xl font-bold mb-1">Badge Unlocked!</h3>
              <p className="text-lg font-medium mb-1">{showBadge.title}</p>
              <p className="text-sm text-gray-300">{showBadge.description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function BadgeCollection({ badges }: { badges: Set<string> }) {
  return (
    <div className="badge-collection">
      <h3 className="text-xl font-bold mb-4">Your Badges</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {AVAILABLE_BADGES.map(badge => {
          const isUnlocked = badges.has(badge.id);
          return (
            <motion.div
              key={badge.id}
              className={`p-4 rounded-lg text-center ${
                isUnlocked ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}
              whileHover={isUnlocked ? { scale: 1.05 } : {}}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className={`text-4xl mb-2 ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                {badge.icon}
              </div>
              <div className="text-sm font-medium mb-1">{badge.title}</div>
              <div className="text-xs opacity-80">{badge.description}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}