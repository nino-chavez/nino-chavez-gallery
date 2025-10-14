/**
 * Gallery Browse Layout Types
 *
 * Provides multiple ways to discover and browse photos,
 * similar to portfolio site's canvas/traditional layouts
 */

export type BrowseLayout =
  | 'sport-first'    // Group by sport (basketball, bmx, etc.)
  | 'timeline'       // Chronological by event date
  | 'action-type'    // Group by action/emotion (jump, dunk, celebrate)
  | 'collections'    // Curated collections (editor's picks, best of, etc.)
  | 'grid';          // Simple paginated grid (default)

export interface LayoutConfig {
  id: BrowseLayout;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  badge?: string; // Optional badge (e.g., "Default", "New")
}

export const BROWSE_LAYOUTS: LayoutConfig[] = [
  {
    id: 'grid',
    name: 'Grid View',
    description: 'Simple paginated album grid',
    icon: 'LayoutGrid',
    badge: 'Default',
  },
  {
    id: 'sport-first',
    name: 'By Sport',
    description: 'Browse basketball, BMX, volleyball, etc.',
    icon: 'Trophy',
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Chronological event timeline',
    icon: 'Calendar',
  },
  {
    id: 'action-type',
    name: 'By Action',
    description: 'Browse by peak action, emotion, moments',
    icon: 'Zap',
  },
  {
    id: 'collections',
    name: 'Collections',
    description: "Editor's picks, best of, highlights",
    icon: 'Star',
  },
];

/**
 * Layout preference storage key
 */
export const LAYOUT_STORAGE_KEY = 'gallery-browse-layout';

/**
 * Default layout
 */
export const DEFAULT_LAYOUT: BrowseLayout = 'grid';
