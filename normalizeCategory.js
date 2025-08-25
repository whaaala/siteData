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
    cat === 'business-news' ||
    cat === 'nigeria news' ||
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
    cat === 'viral gist' 
) {
    return 'Gists';
  }
  return '';
}