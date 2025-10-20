/**
 * Daily Category Distribution Targets
 *
 * Percentages based on WordPress posting (wpPostId exists)
 * Total: 100%
 */

export const CATEGORY_TARGETS = {
  'News': 10,               // 10% news content
  'Entertainment': 30,      // 30% entertainment content
  'Gists': 25,              // 25% gists content
  'Sports': 5,              // 5% sports content
  'FoodAndDrink': 5,        // 5% food content
  'Cars': 5,                // 5% car/vehicle content
  'HealthAndFitness': 5,    // 5% health and fitness
  'Lifestyle': 15,          // 15% lifestyle content
}

/**
 * Redistribution weights when a category has no content
 * Entertainment gets the most, News gets the least
 */
export const REDISTRIBUTION_WEIGHTS = {
  'Entertainment': 0.60,    // 60% of orphaned percentage
  'Gists': 0.30,            // 30% of orphaned percentage
  'News': 0.10,             // 10% of orphaned percentage
}

/**
 * Get the target percentage for a category
 */
export function getCategoryTarget(category) {
  return CATEGORY_TARGETS[category] || 0
}

/**
 * Get all target categories
 */
export function getTargetCategories() {
  return Object.keys(CATEGORY_TARGETS)
}

/**
 * Calculate redistributed targets when some categories have no content
 * @param {Array<string>} unavailableCategories - Categories with no content available
 * @returns {Object} Adjusted category targets
 */
export function getRedistributedTargets(unavailableCategories = []) {
  const adjusted = { ...CATEGORY_TARGETS }

  if (unavailableCategories.length === 0) {
    return adjusted
  }

  // Calculate total percentage to redistribute
  let orphanedPercentage = 0
  unavailableCategories.forEach(cat => {
    if (adjusted[cat]) {
      orphanedPercentage += adjusted[cat]
      adjusted[cat] = 0 // Set unavailable categories to 0
    }
  })

  if (orphanedPercentage === 0) {
    return adjusted
  }

  // Redistribute to Entertainment, Gists, and News
  const redistributionTargets = ['Entertainment', 'Gists', 'News']

  redistributionTargets.forEach(cat => {
    if (adjusted[cat] !== undefined && !unavailableCategories.includes(cat)) {
      const additionalPct = orphanedPercentage * REDISTRIBUTION_WEIGHTS[cat]
      adjusted[cat] += additionalPct
    }
  })

  return adjusted
}

/**
 * Format percentage for display
 */
export function formatPercentage(value) {
  return `${value.toFixed(1)}%`
}
