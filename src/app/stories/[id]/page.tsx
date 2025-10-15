import type { Metadata } from 'next';
import { StoryPageClient } from './StoryPageClient';

interface Props {
  params: Promise<{ id: string }>;
}

// Server-side metadata generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    // Fetch story data server-side for metadata
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/stories/${id}`, {
      cache: 'no-store', // Always fetch fresh for metadata
    });
    
    if (!res.ok) {
      throw new Error('Story not found');
    }
    
    const { story } = await res.json();
    
    // Use first photo as social preview image
    const firstPhotoUrl = story.photos[0]?.image_url || '';
    
    return {
      title: `${story.title} | Nino Chavez Gallery`,
      description: story.description,
      openGraph: {
        title: story.title,
        description: story.description,
        images: [
          {
            url: firstPhotoUrl,
            width: 1200,
            height: 630,
            alt: story.title,
          },
        ],
        type: 'article',
        siteName: 'Nino Chavez Gallery',
      },
      twitter: {
        card: 'summary_large_image',
        title: story.title,
        description: story.description,
        images: [firstPhotoUrl],
      },
    };
  } catch (error) {
    // Fallback metadata for errors or 404
    return {
      title: 'Story Not Found | Nino Chavez Gallery',
      description: 'This story could not be found or has been removed.',
      openGraph: {
        title: 'Story Not Found',
        description: 'This story could not be found or has been removed.',
        siteName: 'Nino Chavez Gallery',
      },
    };
  }
}

// Server component that renders the client component
export default async function StoryPage({ params }: Props) {
  const { id } = await params;
  
  return <StoryPageClient storyId={id} />;
}