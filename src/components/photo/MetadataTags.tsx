import type { Photo } from '@/types/photo';

interface MetadataTagsProps {
  photo: Photo;
}

export function MetadataTags({ photo }: MetadataTagsProps) {
  const { metadata } = photo;
  if (!metadata) return null;

  const tags = [];

  // Emotion tag
  if (metadata.emotion) {
    tags.push(
      <Tag key="emotion" label={metadata.emotion} type="emotion" />
    );
  }

  // Composition tag
  if (metadata.composition) {
    tags.push(
      <Tag key="composition" label={metadata.composition.replace('-', ' ')} type="composition" />
    );
  }

  // Time of day tag
  if (metadata.time_of_day) {
    tags.push(
      <Tag key="time" label={metadata.time_of_day.replace('-', ' ')} type="time" />
    );
  }

  // Play type tag
  if (metadata.play_type) {
    tags.push(
      <Tag key="play" label={metadata.play_type} type="play" />
    );
  }

  // Action intensity tag
  if (metadata.action_intensity) {
    tags.push(
      <Tag key="intensity" label={metadata.action_intensity} type="intensity" />
    );
  }

  // Use cases
  if (metadata.use_cases?.length) {
    metadata.use_cases.forEach(useCase => {
      tags.push(
        <Tag key={`usecase-${useCase}`} label={useCase.replace('-', ' ')} type="usecase" />
      );
    });
  }

  if (tags.length === 0) return null;

  return (
    <div className="metadata-tags">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span>🏷️</span>
        Photo Analysis
      </h3>

      <div className="flex flex-wrap gap-2">
        {tags}
      </div>
    </div>
  );
}

interface TagProps {
  label: string;
  type: 'emotion' | 'composition' | 'time' | 'play' | 'intensity' | 'usecase';
}

function Tag({ label, type }: TagProps) {
  const getTagStyles = () => {
    switch (type) {
      case 'emotion':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'composition':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'time':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'play':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intensity':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'usecase':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getTagStyles()}`}>
      {label}
    </span>
  );
}