import type { Photo } from '@/types/photo';

interface StoryModeProps {
  photos: Photo[];
}

export function StoryMode({ photos }: StoryModeProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg mb-2">No photos for story mode</div>
        <div className="text-sm">Need chronological photos to create a story</div>
      </div>
    );
  }

  // Group photos by month for story timeline
  const photosByMonth = photos.reduce((acc, photo) => {
    const date = new Date(photo.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(photo);

    return acc;
  }, {} as Record<string, Photo[]>);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="story-mode">
      <div className="space-y-8">
        {Object.entries(photosByMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([monthKey, monthPhotos]) => {
            const [year, month] = monthKey.split('-');
            const monthName = monthNames[parseInt(month) - 1];

            // Get top photos for this month (highest quality)
            const topPhotos = monthPhotos
              .sort((a, b) => (b.metadata?.emotional_impact || 0) - (a.metadata?.emotional_impact || 0))
              .slice(0, 4);

            return (
              <div key={monthKey} className="story-month bg-white rounded-lg border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {monthName} {year}
                  </div>
                  <div className="text-sm text-gray-600">
                    {monthPhotos.length} photos • {topPhotos.length} highlights
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {topPhotos.map(photo => (
                    <div key={photo.id} className="story-photo group cursor-pointer">
                      <div className="relative overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={photo.image_url}
                          alt={photo.title}
                          className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                        />

                        {/* Quality indicator */}
                        <div className="absolute top-1 right-1">
                          {photo.metadata?.portfolio_worthy && (
                            <span className="bg-yellow-500 text-white text-xs px-1 py-0.5 rounded">
                              ⭐
                            </span>
                          )}
                        </div>

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-end">
                          <div className="p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="text-xs font-medium truncate">{photo.title}</div>
                            <div className="text-xs">
                              {photo.metadata?.emotion} • {photo.metadata?.play_type}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {monthPhotos.length > topPhotos.length && (
                  <div className="mt-3 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      View all {monthPhotos.length} photos from {monthName}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Story generation button */}
      <div className="mt-8 text-center">
        <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium">
          🎬 Generate Season Story Video
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Create an emotional journey video with music and transitions
        </p>
      </div>
    </div>
  );
}