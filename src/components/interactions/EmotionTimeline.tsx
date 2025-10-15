'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { EMOTION_ICONS } from '@/lib/motion-tokens';
import type { Photo } from '@/types/photo';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable);
}

interface EmotionTimelineProps {
  photos: Photo[];
  onPhotoSetChange: (photos: Photo[]) => void;
}

export function EmotionTimeline({ photos, onPhotoSetChange }: EmotionTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [emotionClusters, setEmotionClusters] = useState<Array<{
    emotion: string;
    photos: Photo[];
    position: number;
  }>>([]);

  useEffect(() => {
    // Group photos by emotion
    const clusters = groupByEmotion(photos);
    setEmotionClusters(clusters);

    if (!timelineRef.current || !scrubberRef.current || clusters.length === 0) return;

    // Create GSAP timeline
    const tl = gsap.timeline({ paused: true });

    clusters.forEach((cluster, i) => {
      tl.to('.photo-grid', {
        onStart: () => {
          onPhotoSetChange(cluster.photos);
        },
        duration: 1,
      }, i);
    });

    // Make scrubber draggable
    const draggableInstance = Draggable.create(scrubberRef.current, {
      type: 'x',
      bounds: timelineRef.current,
      onDrag: function() {
        const progress = this.x / (this.maxX || 1);
        tl.progress(progress);
      },
      snap: {
        x: function(value: number) {
          // Snap to emotion boundaries
          const snapInterval = (this.maxX || 1) / clusters.length;
          return Math.round(value / snapInterval) * snapInterval;
        }
      }
    });

    return () => {
      tl.kill();
      if (draggableInstance[0]) {
        draggableInstance[0].kill();
      }
    };
  }, [photos, onPhotoSetChange]);

  if (emotionClusters.length === 0) {
    return (
      <div className="emotion-timeline w-full py-8">
        <div className="text-center text-gray-500">
          No emotion data available for timeline
        </div>
      </div>
    );
  }

  return (
    <div className="emotion-timeline w-full py-8" ref={timelineRef}>
      <div className="relative h-16 bg-gray-100 rounded-full overflow-hidden">
        {/* Emotion markers */}
        <div className="absolute inset-0 flex items-center justify-around px-4">
          {emotionClusters.map((cluster, i) => (
            <div
              key={i}
              className="flex flex-col items-center"
            >
              <span className="text-2xl mb-1">
                {EMOTION_ICONS[cluster.emotion as keyof typeof EMOTION_ICONS] || '📷'}
              </span>
              <span className="text-xs text-gray-600 capitalize">
                {cluster.emotion}
              </span>
              <span className="text-xs text-gray-400">
                {cluster.photos.length}
              </span>
            </div>
          ))}
        </div>

        {/* Draggable scrubber */}
        <div
          ref={scrubberRef}
          className="absolute top-0 left-0 h-full w-1 bg-black cursor-grab active:cursor-grabbing z-10"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs shadow-lg">
            ⇄
          </div>
        </div>
      </div>
    </div>
  );
}

function groupByEmotion(photos: Photo[]) {
  const groups = new Map<string, Photo[]>();

  photos.forEach(photo => {
    const emotion = photo.metadata?.emotion || 'unknown';
    if (!groups.has(emotion)) {
      groups.set(emotion, []);
    }
    groups.get(emotion)!.push(photo);
  });

  return Array.from(groups.entries()).map(([emotion, photos], i, arr) => ({
    emotion,
    photos,
    position: i / (arr.length - 1 || 1),
  }));
}