// Map normalized category names to WordPress category IDs
export const wpCategoryMap = {
  News: 35,
  Entertainment: 21,
  Sports: 45,
  Lifestyle: 30,
  HealthAndFitness: 27,
  FoodAndDrink: 24,
  Gists: 1,
  Cars: 30,  // Maps to Lifestyle (no separate Cars category in WordPress)
};

// Map category to WordPress author IDs (arrays for random selection)
const wpAuthorMap = {
  News: [5, 3, 4, 6, 27, 28, 29, 30, 31, 32, 33],
  Entertainment: [7, 8, 9, 10, 34, 35, 36, 37, 38, 39],
  Sports: [11, 12, 13, 14, 40, 41, 42, 43, 44, 45],
  Lifestyle: [15, 16, 17, 46, 47, 48, 49, 50, 51, 52],
  HealthAndFitness: [18, 19, 20, 53, 54, 55, 56, 57, 58, 59],
  FoodAndDrink: [21, 22, 23, 24, 60, 61, 62, 63, 64, 65],
  Gists: [24, 25, 26, 66, 67, 68, 69, 70, 71, 72],
  Cars: [15, 16, 17, 46, 47, 48, 49, 50, 51, 52],  // Same as Lifestyle authors
};

// Helper to randomly select an author ID from the array
export function getRandomAuthorId(category) {
  const authors = wpAuthorMap[category];
  if (!authors || authors.length === 0) return undefined;
  return authors[Math.floor(Math.random() * authors.length)];
}