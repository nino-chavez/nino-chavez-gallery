import { PlayTypeMorphGrid } from '@/components/gallery/PlayTypeMorphGrid';
import { EmotionTimeline } from '@/components/interactions/EmotionTimeline';
import type { Photo } from '@/types/photo';

interface SeasonHighlightsProps {
  teamId: string;
}

export async function SeasonHighlights({ teamId }: SeasonHighlightsProps) {
  const photos = await getTeamPhotos(teamId);

  const highlights = {
    peakMoments: photos.filter(p => p.metadata?.action_intensity === 'peak'),
    technicalExcellence: photos.filter(p =>
      (p.metadata?.sharpness || 0) >= 9 &&
      (p.metadata?.composition_score || 0) >= 9 &&
      p.metadata?.portfolio_worthy
    ),
    emotionalJourney: photos.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
    triumphMoments: photos.filter(p => p.metadata?.emotion === 'triumph'),
    portfolioWorthy: photos.filter(p => p.metadata?.portfolio_worthy),
  };

  return (
    <div className="season-highlights space-y-16">
      {/* Peak Moments */}
      <section>
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">🏆 Peak Moments</h2>
          <p className="text-gray-600">
            Game-deciding plays with maximum intensity ({highlights.peakMoments.length} photos)
          </p>
        </div>
        <PlayTypeMorphGrid photos={highlights.peakMoments} activePlayType={null} />
      </section>

      {/* Technical Excellence */}
      <section>
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">📸 Technical Excellence</h2>
          <p className="text-gray-600">
            Best-quality shots for program promotion ({highlights.technicalExcellence.length} photos)
          </p>
        </div>
        <PlayTypeMorphGrid photos={highlights.technicalExcellence} activePlayType={null} />
      </section>

      {/* Triumph Moments */}
      <section>
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">🎉 Victory Celebrations</h2>
          <p className="text-gray-600">
            Moments of triumph and celebration ({highlights.triumphMoments.length} photos)
          </p>
        </div>
        <PlayTypeMorphGrid photos={highlights.triumphMoments} activePlayType={null} />
      </section>

      {/* Emotional Journey */}
      <section>
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">📖 Emotional Journey</h2>
          <p className="text-gray-600">
            Season narrative through photos ({highlights.emotionalJourney.length} photos)
          </p>
        </div>
        <EmotionTimeline 
          photos={highlights.emotionalJourney}
          onPhotoSetChange={(filteredPhotos) => {
            // Handle photo set change - could update a state in parent
            console.log('Filtered to', filteredPhotos.length, 'photos');
          }}
        />
      </section>

      {/* Portfolio Collection */}
      <section>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">⭐ Portfolio Collection</h2>
            <p className="text-gray-600">
              Top-quality photos for recruiting and promotion ({highlights.portfolioWorthy.length} photos)
            </p>
          </div>
          <button className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition">
            Download Portfolio Pack
          </button>
        </div>
        <PlayTypeMorphGrid photos={highlights.portfolioWorthy} activePlayType={null} />
      </section>
    </div>
  );
}

async function getTeamPhotos(teamId: string): Promise<Photo[]> {
  // Fetch from API - placeholder implementation
  // In production, would fetch from Supabase filtered by team_id
  return [];
}