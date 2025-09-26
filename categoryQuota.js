const CATEGORY_PERCENTAGES = {
  news: 0.15,
  entertainment: 0.30,
  sport: 0.13,
  health: 0.07,
  lifestyle: 0.08,
  gist: 0.27,
}

// Categories to redistribute unused quotas to
const REDISTRIBUTE_TO = ['news', 'entertainment', 'gist']

// Calculate category quotas based on available posts and desired total
function calculateCategoryQuotas(availablePosts, dailyTotal) {
  // Initialize quotas based on percentages
  let quotas = {}

  // Assign initial quotas
  for (const [cat, pct] of Object.entries(CATEGORY_PERCENTAGES)) {
    quotas[cat] = Math.floor(dailyTotal * pct)
  }

  // Adjust for rounding errors
  let assigned = Object.values(quotas).reduce((a, b) => a + b, 0)

  // Add to 'news' until we reach dailyTotal
  while (assigned < dailyTotal) {
    quotas.news++
    assigned++
  }
  // Redistribute unused quotas
  let unused = 0
  // First, collect unused quotas from categories with no available posts
  for (const cat in quotas) {
    // If no posts are available in this category, reclaim its quota
    if (!availablePosts[cat] || availablePosts[cat] === 0) {
      unused += quotas[cat]
      quotas[cat] = 0
    }
  }
  // Then, redistribute the unused quota to specified categories
  // based on their original percentages
  const totalPct = REDISTRIBUTE_TO.reduce(
    (sum, cat) => sum + CATEGORY_PERCENTAGES[cat],
    0
  )
  // Distribute unused quota proportionally
  for (const cat of REDISTRIBUTE_TO) {
    quotas[cat] += Math.floor(unused * (CATEGORY_PERCENTAGES[cat] / totalPct))
  }
  // Final adjustment in case of rounding issues
  assigned = Object.values(quotas).reduce((a, b) => a + b, 0)
  // Add to 'news' until we reach dailyTotal
  while (assigned < dailyTotal) {
    quotas.news++
    assigned++
  }
  // Ensure quotas do not exceed available posts
  for (const cat in quotas) {
    if (
      availablePosts[cat] !== undefined &&
      quotas[cat] > availablePosts[cat]
    ) {
      quotas[cat] = availablePosts[cat]
    }
  }
  return quotas
}

export default calculateCategoryQuotas
