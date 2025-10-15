'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { StoryViewer } from '@/components/story/StoryViewer';
import { ShareButton } from '@/components/story/ShareButton';
import { ExportPDFButton } from '@/components/story/ExportPDFButton';
import { LoadingState } from '@/components/common/LoadingState';
import type { NarrativeArc } from '@/lib/story-curation/narrative-arcs';

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) {
    if (r.status === 404) {
      throw new Error('Story not found');
    }
    throw new Error('Failed to fetch story');
  }
  return r.json();
});

interface StoryPageClientProps {
  storyId: string;
}

export function StoryPageClient({ storyId }: StoryPageClientProps) {
  const router = useRouter();
  
  const { data, error, isLoading, mutate } = useSWR(
    `/api/stories/${storyId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes cache
    }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <LoadingState message="Loading your story..." size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !data?.story) {
    const isNotFound = error?.message?.includes('not found');
    
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-6 text-center">
          {isNotFound ? (
            <div className="text-white">
              <div className="text-6xl mb-4">📖</div>
              <h2 className="text-2xl font-bold mb-2">Story Not Found</h2>
              <p className="text-white/80 mb-6">This story doesn't exist or has been deleted.</p>
              <button
                onClick={() => router.push('/browse')}
                className="bg-white/20 backdrop-blur px-6 py-3 rounded-full hover:bg-white/30 transition"
              >
                Back to Browse
              </button>
            </div>
          ) : (
            <div className="text-white">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold mb-2">Oops!</h3>
              <p className="text-white/80 mb-6">Failed to load story. Please check your connection and try again.</p>
              <button
                onClick={() => mutate()}
                className="bg-white/20 backdrop-blur px-6 py-3 rounded-full hover:bg-white/30 transition flex items-center gap-2 mx-auto"
              >
                <span>🔄</span>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const story: NarrativeArc = data.story;

  return (
    <>
      {/* Share and Export Controls */}
      <div className="fixed top-20 right-8 z-50 flex gap-4">
        <ShareButton storyId={storyId} storyTitle={story.title} />
        <ExportPDFButton story={story} />
      </div>

      {/* Story Viewer */}
      <StoryViewer
        story={story}
        autoPlay={true}
        onClose={() => {
          // Try to go back, fallback to browse if no history
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push('/browse');
          }
        }}
      />
    </>
  );
}