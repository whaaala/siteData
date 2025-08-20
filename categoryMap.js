// Map normalized category names to WordPress category IDs
export const wpCategoryMap = {
  News: 35,         
  Entertainment: 21, 
  Sports: 45,        
  Lifestyle: 30,    
  HealthAndFitness: 27,     
  FoodAndDrink: 24,    
  Gists: 1,     
};

// Map category to WordPress author IDs (arrays for random selection)
const wpAuthorMap = {
  News: [5, 3, 4, 6],           
  Entertainment: [7, 8, 9, 10],  
  Sports: [11, 12, 13, 14],         
  Lifestyle: [15, 16, 17],
  HealthAndFitness: [18, 19, 20],
  FoodAndDrink: [21, 22, 23],
  Gists: [24, 25, 26],
};

// Helper to randomly select an author ID from the array
export function getRandomAuthorId(category) {
  const authors = wpAuthorMap[category];
  if (!authors || authors.length === 0) return undefined;
  return authors[Math.floor(Math.random() * authors.length)];
}