import type { Photo } from '@/types/photo';

interface QualityBadgesProps {
  photo: Photo;
}

export function QualityBadges({ photo }: QualityBadgesProps) {
  const { metadata } = photo;
  if (!metadata) return null;

  const badges = [];

  if (metadata.portfolio_worthy) {
    badges.push(
      <span key="portfolio" className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
        ⭐ Portfolio
      </span>
    );
  }

  if (metadata.print_ready) {
    badges.push(
      <span key="print" className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
        🖨️ Print Ready
      </span>
    );
  }

  if (metadata.social_media_optimized) {
    badges.push(
      <span key="social" className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
        📱 Social Optimized
      </span>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {badges}
    </div>
  );
}