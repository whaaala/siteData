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
    cat === 'local' ||
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
    cat === 'domestic' ||
    cat === 'international' ||
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
    cat === 'ghana premier league' ||
    cat === 'nigerian football' ||
    cat === 'basketball' ||
    cat === "women's sports" ||
    cat === "super falcons" ||
    cat === "international football" ||
    cat === "other sports" ||
    cat === 'boxing' ||
    cat === 'sport'
  ) {
    return 'Sports';
  } else if (
    cat === 'relationships' ||
    cat === 'wedding' ||
    cat === 'people' ||
    cat === 'family and relationships' ||
    cat === 'relationships & weddings' ||
    cat === 'skincare' ||
    cat === 'style' ||
    cat === 'fragrance' ||
    cat === 'partnerships' ||
    cat === 'cover star' ||
    cat === 'hair' ||
    cat === 'make-up' ||
    cat === 'nails' ||
    cat === 'career & money' ||
    cat === 'gear-tech' ||
    cat === 'motoring' ||
    cat === 'travel' ||
    cat === 'gifts' ||
    cat === 'life' ||
    cat === 'grooming' ||
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
    cat === 'beauty & health' ||
    cat === 'nutrition' ||
    cat === 'physical health' ||
    cat === 'fitmama' ||
    cat === 'mental health' ||
    cat === 'wellness' ||
    cat === 'workouts' ||
    cat === 'partnerships' ||
    cat === 'fitness' ||
    cat === 'health' ||
    cat === 'weight loss' ||
    cat === 'tech & gear' ||
    cat === 'general health'
) {
    return 'HealthAndFitness';
  } else if (
    cat === 'recipes' ||
    cat === 'food & nutrition' ||
    cat === 'drinks'
) {
    return 'FoodAndDrink';
  }
  return '';
}