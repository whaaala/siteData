/**
 * Normalize a raw category string to your standard category names.
 * @param {string} rawCategory
 * @returns {string} Normalized category
 */
export function normalizeCategory(rawCategory) {
  if (!rawCategory) return '';
  const cat = rawCategory.trim().toLowerCase();
  if (
    cat === 'news' ||
    cat === 'hot-news' ||
    cat === 'politics' ||
    cat === 'metro' ||
    cat === 'nigeria-news' ||
    cat === 'africa' ||
    cat === 'business-news' ||
    cat === 'nigeria news' ||
    cat === 'technology' ||
    cat === 'europe' ||
    cat === 'dollar to naira exchange rates' ||
    cat === 'business'
  ) {
    return 'News';
  } else if (
    cat === 'entertainment' ||
    cat === 'movies & tv' ||
    cat === 'bn tv' ||
    cat === 'songs' ||
    cat === 'lyrics' ||
    cat === 'music' ||
    cat === 'film' ||
    cat === 'opinion' ||
    cat === 'nigeria entertainment news' ||
    cat === 'entertainment news' ||
    cat === 'events'
  ) {
    return 'Entertainment';
  } else if (
    cat === 'sports' ||
    cat === 'sport-news' ||
    cat === 'sport'
  ) {
    return 'Sports';
  } else if (
    cat === 'relationships' ||
    cat === 'beauty' ||
    cat === 'scoop'
  ) {
    return 'Lifestyle';
  } else if (
    cat === 'extra' || 
    cat === 'religion' || 
    cat === 'gist' ||
    cat === 'features' ||
    cat === 'viral gist' 
) {
    return 'Gists';
  } else if (
    cat === 'beauty' 
) {
    return 'HealthAndFitness';
  }
  return '';
}