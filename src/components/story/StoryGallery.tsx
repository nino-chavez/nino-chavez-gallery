'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { StoryViewer } from './StoryViewer';
import type { NarrativeArc } from '@/lib/story-curation/narrative-arcs';

interface Story {
  id: string;
  type: string;
  title: string;
  description: string;
  photo_count: number;
  thumbnail_url: string;
  created_at: string;
}

interface StoryGalleryProps {
  stories: Story[];
  onGenerateNew?: () => void;
}

export function StoryGallery({ stories, onGenerateNew }: StoryGalleryProps) {
  const [selectedStory, setSelectedStory] = useState<NarrativeArc | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const loadStory = async (storyId: string) => {
    setIsLoading(storyId);
    try {
      const response = await fetch(`/api/stories/${storyId}`);
      const { story } = await response.json();
      setSelectedStory(story);
    } catch (error) {
      console.error('Error loading story:', error);
    } finally {
      setIsLoading(null);
    }
  };

  if (stories.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📖</div>
        <h3 className="text-2xl font-bold mb-2">No Stories Yet</h3>
        <p className="text-gray-600 mb-6">
          Generate your first AI-powered highlight reel
        </p>
        {onGenerateNew && (
          <button
            onClick={onGenerateNew}
            className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition"
          >
            + Generate Story
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="story-gallery">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Stories</h2>
            <p className="text-gray-600">
              {stories.length} auto-generated highlight reels
            </p>
          </div>
          {onGenerateNew && (
            <button
              onClick={onGenerateNew}
              className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition"
            >
              + Generate New Story
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <motion.button
              key={story.id}
              className="story-card group relative overflow-hidden rounded-2xl bg-gray-100 aspect-video cursor-pointer"
              onClick={() => loadStory(story.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Thumbnail */}
              <img
                src={story.thumbnail_url}
                alt={story.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-2">{story.title}</h3>
                <p className="text-sm opacity-80 mb-3 line-clamp-2">{story.description}</p>
                <div className="flex gap-4 text-xs opacity-60">
                  <span>📸 {story.photo_count} photos</span>
                  <span>🕒 {new Date(story.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  {isLoading === story.id ? (
                    <div className="animate-spin text-4xl">⏳</div>
                  ) : (
                    <span className="text-4xl">▶️</span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Story viewer modal */}
      {selectedStory && (
        <StoryViewer
          story={selectedStory}
          autoPlay
          onClose={() => setSelectedStory(null)}
        />
      )}
    </>
  );
}