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
    cat === 'metro plus' ||
    cat === 'nigeria' ||
    cat === 'technology' ||
    cat === 'maritime' ||
    cat === 'world' ||
    cat === 'us' ||
    cat === 'europe' ||
    cat === 'industry' ||
    cat === 'money' ||
    cat === 'energy' ||
    cat === 'capital market' ||
    cat === 'economy' ||
    cat === 'education' ||
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
    cat === 'nigeria entertainment news' ||
    cat === 'celebrities' ||
    cat === 'movies' ||
    cat === 'tv shows' ||
    cat === 'nollywood' ||
    cat === 'entertainment news' ||
    cat === 'events'
  ) {
    return 'Entertainment';
  } else if (
    cat === 'sports' ||
    cat === 'sport-news' ||
    cat === 'football' ||
    cat === 'boxing' ||
    cat === 'sport'
  ) {
    return 'Sports';
  } else if (
    cat === 'relationships' ||
    cat === 'wedding' ||
    cat === 'people' ||
    cat === 'family and relationships' ||
    cat === 'fashion' ||
    cat === 'scoop'
  ) {
    return 'Lifestyle';
  } else if (
    cat === 'extra' || 
    cat === 'religion' || 
    cat === 'gist' ||
    cat === 'opinion' ||
    cat === 'features' ||
    cat === 'punch lite' ||
    cat === 'people' ||
    cat === 'celebrity biographies' ||
    cat === 'viral gist'
) {
    return 'Gists';
  } else if (
    cat === 'beauty' ||
    cat === 'impact stories' ||
    cat === 'maternal health' ||
    cat === 'gender' ||
    cat === 'sexual health' ||
    cat === 'mental health' ||
    cat === 'environment' ||
    cat === 'general health'
) {
    return 'HealthAndFitness';
  }
  return '';
}