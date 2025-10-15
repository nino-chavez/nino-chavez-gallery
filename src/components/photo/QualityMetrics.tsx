import type { Photo } from '@/types/photo';

interface QualityMetricsProps {
  photo: Photo;
}

export function QualityMetrics({ photo }: QualityMetricsProps) {
  const { metadata } = photo;
  if (!metadata) return null;

  const calculateOverallQuality = (meta: typeof metadata) => {
    return Math.round((
      (meta.sharpness || 0) +
      (meta.exposure_accuracy || 0) +
      (meta.composition_score || 0) +
      (meta.emotional_impact || 0)
    ) / 4);
  };

  const overallQuality = calculateOverallQuality(metadata);

  return (
    <div className="quality-metrics bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>📊</span>
        Quality Scores
      </h3>

      <div className="space-y-3">
        <MetricBar
          label="Sharpness"
          value={metadata.sharpness}
          max={10}
          icon="🎯"
          description="Focus clarity and detail resolution"
        />

        <MetricBar
          label="Exposure"
          value={metadata.exposure_accuracy}
          max={10}
          icon="💡"
          description="Lighting and brightness accuracy"
        />

        <MetricBar
          label="Composition"
          value={metadata.composition_score}
          max={10}
          icon="📐"
          description="Framing and visual structure"
        />

        <MetricBar
          label="Emotional Impact"
          value={metadata.emotional_impact}
          max={10}
          icon="⚡"
          description="Ability to evoke emotion"
        />

        {/* Overall quality */}
        <div className="overall-quality pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Overall Quality</span>
            <span className={`text-lg font-bold ${
              overallQuality >= 8 ? 'text-green-600' :
              overallQuality >= 6 ? 'text-yellow-600' : 'text-orange-600'
            }`}>
              {overallQuality}/10
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all ${
                overallQuality >= 8 ? 'bg-green-500' :
                overallQuality >= 6 ? 'bg-yellow-500' : 'bg-orange-500'
              }`}
              style={{ width: `${(overallQuality / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricBarProps {
  label: string;
  value: number;
  max: number;
  icon: string;
  description?: string;
}

function MetricBar({ label, value, max, icon, description }: MetricBarProps) {
  const percentage = (value / max) * 100;
  const color = value >= 8 ? 'green' : value >= 6 ? 'yellow' : 'orange';

  return (
    <div className="metric-bar">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm font-semibold text-gray-600">{value}/{max}</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
        <div
          className={`h-2 rounded-full transition-all bg-${color}-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {description && (
        <div className="text-xs text-gray-500">{description}</div>
      )}
    </div>
  );
}