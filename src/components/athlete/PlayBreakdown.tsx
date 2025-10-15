import type { Photo } from '@/types/photo';

interface PlayBreakdownProps {
  photos: Photo[];
}

export function PlayBreakdown({ photos }: PlayBreakdownProps) {
  // Analyze photos by play type
  const playTypeStats = photos.reduce((acc, photo) => {
    if (!photo.metadata?.play_type) return acc;

    const playType = photo.metadata.play_type;
    if (!acc[playType]) {
      acc[playType] = { count: 0, totalQuality: 0, photos: [] };
    }

    acc[playType].count++;
    acc[playType].totalQuality += photo.metadata.composition_score || 0;
    acc[playType].photos.push(photo);

    return acc;
  }, {} as Record<string, { count: number; totalQuality: number; photos: Photo[] }>);

  // Calculate averages and sort by frequency
  const playTypeData = Object.entries(playTypeStats)
    .map(([playType, stats]) => ({
      playType,
      count: stats.count,
      averageQuality: Math.round(stats.totalQuality / stats.count),
      photos: stats.photos
    }))
    .sort((a, b) => b.count - a.count);

  // Analyze by action intensity
  const intensityStats = photos.reduce((acc, photo) => {
    if (!photo.metadata?.action_intensity) return acc;

    const intensity = photo.metadata.action_intensity;
    if (!acc[intensity]) {
      acc[intensity] = { count: 0, photos: [] };
    }

    acc[intensity].count++;
    acc[intensity].photos.push(photo);

    return acc;
  }, {} as Record<string, { count: number; photos: Photo[] }>);

  const intensityData = Object.entries(intensityStats)
    .map(([intensity, stats]) => ({
      intensity,
      count: stats.count,
      percentage: Math.round((stats.count / photos.length) * 100)
    }))
    .sort((a, b) => {
      const order = ['low', 'medium', 'high', 'peak'];
      return order.indexOf(b.intensity) - order.indexOf(a.intensity);
    });

  // Analyze by emotion
  const emotionStats = photos.reduce((acc, photo) => {
    if (!photo.metadata?.emotion) return acc;

    const emotion = photo.metadata.emotion;
    if (!acc[emotion]) {
      acc[emotion] = { count: 0, photos: [] };
    }

    acc[emotion].count++;
    acc[emotion].photos.push(photo);

    return acc;
  }, {} as Record<string, { count: number; photos: Photo[] }>);

  const emotionData = Object.entries(emotionStats)
    .map(([emotion, stats]) => ({
      emotion,
      count: stats.count,
      percentage: Math.round((stats.count / photos.length) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="play-breakdown bg-white rounded-lg border p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Play Type Analysis */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Play Distribution</h3>

          <div className="space-y-3">
            {playTypeData.map(({ playType, count, averageQuality }) => (
              <div key={playType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 capitalize">
                    {playType.replace('-', ' ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {count} shots • Avg Quality: {averageQuality}/10
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{count}</div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    averageQuality >= 8 ? 'bg-green-100 text-green-800' :
                    averageQuality >= 6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {averageQuality}/10
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Intensity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Action Intensity</h3>

          <div className="space-y-3">
            {intensityData.map(({ intensity, count, percentage }) => (
              <div key={intensity} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium capitalize">{intensity}</span>
                  <span className="text-gray-600">{count} ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      intensity === 'peak' ? 'bg-red-500' :
                      intensity === 'high' ? 'bg-orange-500' :
                      intensity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emotion Analysis */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Emotional Impact</h3>

          <div className="space-y-3">
            {emotionData.slice(0, 5).map(({ emotion, count, percentage }) => (
              <div key={emotion} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium capitalize">{emotion}</div>
                  <div className="text-sm text-gray-600">{percentage}% of shots</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">{count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{photos.length}</div>
            <div className="text-sm text-gray-600">Total Photos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(photos.filter(p => p.metadata?.portfolio_worthy).length / photos.length * 100)}%
            </div>
            <div className="text-sm text-gray-600">Portfolio Quality</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(playTypeStats).length}
            </div>
            <div className="text-sm text-gray-600">Play Types</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(photos.reduce((sum, p) => sum + (p.metadata?.composition_score || 0), 0) / photos.length)}
            </div>
            <div className="text-sm text-gray-600">Avg Quality</div>
          </div>
        </div>
      </div>
    </div>
  );
}