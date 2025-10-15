import { PhotoGrid } from '@/components/athlete/PhotoGrid';
import { StoryGallery } from '@/components/story/StoryGallery';
import { DownloadPackButton } from '@/components/athlete/DownloadPackButton';
import { PlayBreakdown } from '@/components/athlete/PlayBreakdown';
import type { Photo } from '@/types/photo';

interface AthletePageProps {
  params: Promise<{ id: string }>;
}

export default async function AthleteDashboard({ params }: AthletePageProps) {
  const { id } = await params;
  
  // Fetch athlete data (placeholder - implement actual API call)
  const athlete = await getAthlete(id);
  const photos = await getAthletePhotos(id);
  const stories = await getAthleteStories(id);

  // Curate photo collections
  const bestShots = photos.filter(p => p.metadata?.portfolio_worthy);
  const socialMediaPack = photos.filter(p => p.metadata?.social_media_optimized);
  const printReady = photos.filter(p => p.metadata?.print_ready);
  const peakMoments = photos.filter(p => p.metadata?.action_intensity === 'peak');

  return (
    <div className="athlete-dashboard min-h-screen bg-gray-50 py-12 px-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-2">{athlete.name}</h1>
        <p className="text-gray-600">{photos.length} photos available</p>
      </header>

      {/* AI-Generated Stories Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">📖 Your Stories</h2>
            <p className="text-gray-600">AI-generated highlight reels</p>
          </div>
          <button
            onClick={() => {
              // Trigger story generation modal
              window.dispatchEvent(new CustomEvent('generate-story', {
                detail: { type: 'player-highlight', playerId: id, playerName: athlete.name }
              }));
            }}
            className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition"
          >
            Generate Highlight Reel
          </button>
        </div>
        <StoryGallery 
          stories={stories}
          onGenerateNew={() => {
            window.dispatchEvent(new CustomEvent('generate-story', {
              detail: { type: 'player-highlight', playerId: id, playerName: athlete.name }
            }));
          }}
        />
      </section>

      {/* Best Shots Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">⭐ Your Best Shots</h2>
            <p className="text-gray-600">{bestShots.length} portfolio-quality photos</p>
          </div>
          <DownloadPackButton photos={bestShots} packType="portfolio" />
        </div>
        <PhotoGrid photos={bestShots} />
      </section>

      {/* Peak Moments Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">⚡ Peak Moments</h2>
            <p className="text-gray-600">{peakMoments.length} game-deciding plays</p>
          </div>
        </div>
        <PhotoGrid photos={peakMoments} />
      </section>

      {/* Social Media Pack */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">📱 Social Media Pack</h2>
            <p className="text-gray-600">{socialMediaPack.length} optimized for social sharing</p>
          </div>
          <DownloadPackButton photos={socialMediaPack} packType="social" />
        </div>
        <PhotoGrid photos={socialMediaPack} aspectRatio="square" />
      </section>

      {/* Print Recommendations */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">🖼️ Print Recommendations</h2>
            <p className="text-gray-600">{printReady.length} photos perfect for printing</p>
          </div>
          <button className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition">
            Order Prints
          </button>
        </div>
        <PhotoGrid photos={printReady} />
      </section>

      {/* Play Analysis */}
      <section>
        <h2 className="text-2xl font-bold mb-6">📊 Play Analysis</h2>
        <PlayBreakdown photos={photos} />
      </section>
    </div>
  );
}

async function getAthlete(id: string) {
  // Fetch from API - placeholder implementation
  return { 
    id,
    name: 'Athlete Name',
    number: 0,
    position: 'Unknown'
  };
}

async function getAthletePhotos(id: string): Promise<Photo[]> {
  // Fetch from API - placeholder implementation
  return [];
}

async function getAthleteStories(id: string) {
  // Fetch from API - placeholder implementation
  return [];
}