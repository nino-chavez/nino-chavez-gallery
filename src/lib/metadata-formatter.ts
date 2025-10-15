/**
 * Metadata Formatter for AI-Enriched Photo Data
 *
 * Transforms colon-separated AI keywords into human-readable displays
 * while preserving rich semantic information for search.
 */

export interface EnrichedMetadata {
  title?: string;
  caption?: string;
  keywords?: string;
}

export interface FormattedMetadata {
  displayTitle: string;
  displayCaption: string;
  primaryTags: string[];
  categoryTags: CategoryTags;
  allKeywords: string[];
}

export interface CategoryTags {
  sport?: string;
  action?: string;
  emotion?: string;
  composition?: string;
  time?: string;
  phase?: string;
  location?: string;
  equipment?: string;
}

/**
 * Parse colon-separated keywords into categories
 */
export function parseEnrichedKeywords(keywordsString: string): {
  categories: CategoryTags;
  primary: string[];
  all: string[];
} {
  if (!keywordsString) {
    return { categories: {}, primary: [], all: [] };
  }

  const keywords = keywordsString
    .split(/[;,]/)
    .map(k => k.trim())
    .filter(Boolean);

  const categories: CategoryTags = {};
  const primary: string[] = [];

  keywords.forEach(keyword => {
    if (keyword.includes(':')) {
      const [category, value] = keyword.split(':').map(s => s.trim());

      // Store in categories object
      if (category && value) {
        categories[category as keyof CategoryTags] = value;
      }
    } else {
      // Non-categorized keywords are "primary" tags
      primary.push(keyword);
    }
  });

  return {
    categories,
    primary,
    all: keywords,
  };
}

/**
 * Format metadata for display with intelligent fallbacks
 */
export function formatMetadata(metadata: EnrichedMetadata): FormattedMetadata {
  const { title, caption, keywords } = metadata;
  const parsed = parseEnrichedKeywords(keywords || '');

  // Generate human-readable display title from AI metadata
  let displayTitle = generateDisplayTitle(title, parsed);

  // Generate human-readable caption from AI metadata
  let displayCaption = generateDisplayCaption(caption, parsed);

  // Primary tags: Show most important non-categorized keywords
  const primaryTags = parsed.primary.slice(0, 5).map(capitalize);

  return {
    displayTitle,
    displayCaption,
    primaryTags,
    categoryTags: parsed.categories,
    allKeywords: parsed.all,
  };
}

/**
 * Generate human-readable display title from AI metadata
 * AI titles are too verbose/technical - generate natural ones
 */
function generateDisplayTitle(
  aiTitle: string | undefined,
  parsed: ReturnType<typeof parseEnrichedKeywords>
): string {
  // If we have a short, natural title, use it
  if (aiTitle && aiTitle.length < 50 && !aiTitle.includes('executes') && !aiTitle.includes('performs')) {
    return aiTitle;
  }

  // Otherwise generate from metadata
  const parts: string[] = [];

  // Start with primary subject
  if (parsed.primary[0]) {
    parts.push(capitalize(parsed.primary[0]));
  } else if (parsed.categories.sport) {
    parts.push(capitalize(parsed.categories.sport));
  }

  // Add action if available
  if (parsed.categories.action) {
    parts.push(formatAction(parsed.categories.action));
  } else if (parsed.primary[1]) {
    parts.push(parsed.primary[1]);
  }

  // Fallback
  if (parts.length === 0) {
    return 'Creative Action Photo';
  }

  return parts.join(' - ');
}

/**
 * Generate human-readable caption from AI metadata
 * AI captions are technical - create natural descriptions
 */
function generateDisplayCaption(
  aiCaption: string | undefined,
  parsed: ReturnType<typeof parseEnrichedKeywords>
): string {
  // If we have a natural caption (not too technical), use it
  if (aiCaption && aiCaption.length < 100 && !aiCaption.toLowerCase().includes('executes')) {
    return aiCaption;
  }

  // Generate natural caption from metadata
  const parts: string[] = [];

  // Build a natural sentence
  if (parsed.categories.sport && parsed.categories.action) {
    const sport = capitalize(parsed.categories.sport);
    const action = formatAction(parsed.categories.action).toLowerCase();
    parts.push(`${sport} ${action}`);
  } else if (parsed.primary[0] && parsed.primary[1]) {
    parts.push(`${capitalize(parsed.primary[0])} ${parsed.primary[1]}`);
  }

  // Add context
  if (parsed.categories.phase) {
    parts.push(`during ${parsed.categories.phase}`);
  } else if (parsed.categories.emotion) {
    parts.push(`with ${parsed.categories.emotion} energy`);
  }

  // Add setting if available
  if (parsed.categories.time && parsed.categories.time !== 'unknown') {
    parts.push(`captured in ${parsed.categories.time} light`);
  }

  // Return sentence or fallback
  if (parts.length > 0) {
    return parts.join(' ');
  }

  // Minimal fallback
  if (parsed.primary[0]) {
    return `Creative action: ${parsed.primary[0]}`;
  }

  return '';
}

/**
 * Get human-readable badge for a category
 */
export function getCategoryBadge(category: keyof CategoryTags, value: string): string {
  const badges: Record<keyof CategoryTags, (v: string) => string> = {
    sport: (v) => capitalize(v),
    action: (v) => formatAction(v),
    emotion: (v) => `${capitalize(v)} Energy`,
    composition: (v) => capitalize(v),
    time: (v) => capitalize(v),
    phase: (v) => capitalize(v),
    location: (v) => capitalize(v),
    equipment: (v) => capitalize(v),
  };

  const formatter = badges[category];
  return formatter ? formatter(value) : capitalize(value);
}

/**
 * Get category icon (emoji or icon name)
 */
export function getCategoryIcon(category: keyof CategoryTags): string {
  const icons: Record<keyof CategoryTags, string> = {
    sport: '🏀',
    action: '⚡',
    emotion: '💥',
    composition: '📸',
    time: '🕐',
    phase: '🎯',
    location: '📍',
    equipment: '🎥',
  };

  return icons[category] || '🏷️';
}

/**
 * Get smart tags for display (mix of primary and important categories)
 */
export function getDisplayTags(
  metadata: EnrichedMetadata,
  maxTags: number = 4
): Array<{ label: string; category?: keyof CategoryTags }> {
  const formatted = formatMetadata(metadata);
  const tags: Array<{ label: string; category?: keyof CategoryTags }> = [];

  // Priority order: sport, action, then primary keywords
  if (formatted.categoryTags.sport && tags.length < maxTags) {
    tags.push({
      label: capitalize(formatted.categoryTags.sport),
      category: 'sport',
    });
  }

  if (formatted.categoryTags.action && tags.length < maxTags) {
    tags.push({
      label: formatAction(formatted.categoryTags.action),
      category: 'action',
    });
  }

  // Fill remaining slots with primary keywords
  for (const keyword of formatted.primaryTags) {
    if (tags.length >= maxTags) break;
    tags.push({ label: keyword });
  }

  return tags;
}

/**
 * Helper: Capitalize first letter
 */
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Helper: Format action keywords (e.g., "explosive-start" → "Explosive Start")
 */
function formatAction(action: string): string {
  return action
    .split('-')
    .map(capitalize)
    .join(' ');
}

/**
 * Generate a readable summary sentence from metadata
 */
export function generateSummary(metadata: EnrichedMetadata): string {
  const formatted = formatMetadata(metadata);
  const { categoryTags } = formatted;

  const parts: string[] = [];

  if (categoryTags.sport) {
    parts.push(capitalize(categoryTags.sport));
  }

  if (categoryTags.action) {
    parts.push(formatAction(categoryTags.action).toLowerCase());
  }

  if (categoryTags.emotion) {
    parts.push(`with ${categoryTags.emotion} energy`);
  }

  if (categoryTags.phase) {
    parts.push(`during ${categoryTags.phase}`);
  }

  if (categoryTags.time && categoryTags.time !== 'unknown') {
    parts.push(`in the ${categoryTags.time}`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Creative action photography';
}

/**
 * Filter keywords for search display (show most relevant)
 */
export function getSearchableKeywords(metadata: EnrichedMetadata): string[] {
  const formatted = formatMetadata(metadata);
  const searchable: string[] = [];

  // Add sport
  if (formatted.categoryTags.sport) {
    searchable.push(capitalize(formatted.categoryTags.sport));
  }

  // Add action
  if (formatted.categoryTags.action) {
    searchable.push(formatAction(formatted.categoryTags.action));
  }

  // Add primary keywords (non-categorized)
  searchable.push(...formatted.primaryTags.slice(0, 3));

  return searchable;
}
