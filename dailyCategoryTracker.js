import { Post } from './db.js'
import { CATEGORY_TARGETS, getRedistributedTargets } from './categoryTargets.js'

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getTodayString() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Get count of posts published to WordPress today by category
 * Only counts posts with wpPostId (successfully posted to WordPress)
 */
export async function getTodayCategoryCounts() {
  const todayStr = getTodayString()

  // Only count posts successfully posted to WordPress
  const posts = await Post.find({
    wpPostId: { $exists: true, $ne: null },
    timePosted: { $exists: true },
  }).select('category timePosted')

  const counts = {}

  posts.forEach((post) => {
    if (!post.timePosted) return

    // Validate date before using it
    const dateObj = new Date(post.timePosted)
    if (isNaN(dateObj.getTime())) {
      // Invalid date, skip this post
      return
    }

    const postDate = dateObj.toISOString().slice(0, 10)
    if (postDate !== todayStr) return

    const cat = post.category || 'Unknown'
    counts[cat] = (counts[cat] || 0) + 1
  })

  return counts
}

/**
 * Get total number of posts published to WordPress today
 */
export async function getTodayTotalPosts() {
  const counts = await getTodayCategoryCounts()
  return Object.values(counts).reduce((sum, count) => sum + count, 0)
}

/**
 * Calculate current percentage for each category
 */
export async function getTodayCategoryPercentages() {
  const counts = await getTodayCategoryCounts()
  const total = await getTodayTotalPosts()

  if (total === 0) {
    return {}
  }

  const percentages = {}
  for (const [category, count] of Object.entries(counts)) {
    percentages[category] = (count / total) * 100
  }

  return percentages
}

/**
 * Calculate category priorities (which categories need more content)
 * Returns categories sorted by deficit (most needed first)
 *
 * @param {Array<string>} unavailableCategories - Categories with no content available for redistribution
 */
export async function getCategoryPriorities(unavailableCategories = []) {
  const currentPercentages = await getTodayCategoryPercentages()
  const total = await getTodayTotalPosts()

  // Get adjusted targets (with redistribution if needed)
  const adjustedTargets = getRedistributedTargets(unavailableCategories)

  const priorities = []

  for (const [category, targetPct] of Object.entries(adjustedTargets)) {
    // Skip categories marked as unavailable
    if (unavailableCategories.includes(category)) {
      continue
    }

    const currentPct = currentPercentages[category] || 0
    const deficit = targetPct - currentPct

    // Calculate priority score
    // Higher deficit = higher priority
    let priority = deficit

    // Early in the day, boost priority for categories with 0 posts
    if (total < 10 && currentPct === 0 && targetPct > 0) {
      priority = targetPct + 10
    }

    priorities.push({
      category,
      targetPct,
      currentPct,
      deficit,
      priority,
      count: currentPercentages[category] ? Math.round((currentPct / 100) * total) : 0,
    })
  }

  // Sort by priority (highest deficit first)
  priorities.sort((a, b) => b.priority - a.priority)

  return priorities
}

/**
 * Get the most needed category right now
 */
export async function getMostNeededCategory(unavailableCategories = []) {
  const priorities = await getCategoryPriorities(unavailableCategories)

  if (priorities.length === 0) {
    return null
  }

  // Return category with highest positive deficit
  if (priorities[0].deficit > 0) {
    return priorities[0].category
  }

  return null
}

/**
 * Get a weighted random category based on deficits
 * Categories with higher deficits have higher probability
 */
export async function getWeightedRandomCategory(unavailableCategories = []) {
  const priorities = await getCategoryPriorities(unavailableCategories)

  // Filter to only categories with positive deficit
  const neededCategories = priorities.filter((p) => p.deficit > 0)

  if (neededCategories.length === 0) {
    // All targets met, return null
    return null
  }

  // Calculate weights (use max(0, deficit) to avoid negative weights)
  const totalWeight = neededCategories.reduce((sum, p) => sum + Math.max(0, p.deficit), 0)

  if (totalWeight === 0) {
    return null
  }

  // Weighted random selection
  const randomPoint = Math.random() * totalWeight
  let currentWeight = 0

  for (const priority of neededCategories) {
    currentWeight += Math.max(0, priority.deficit)
    if (randomPoint <= currentWeight) {
      return priority.category
    }
  }

  // Fallback
  return neededCategories[0].category
}

/**
 * Check if a category should be prioritized
 * Returns true if category has a deficit > 2%
 */
export async function shouldPrioritizeCategory(category, unavailableCategories = []) {
  const priorities = await getCategoryPriorities(unavailableCategories)
  const categoryPriority = priorities.find((p) => p.category === category)

  if (!categoryPriority) {
    return false
  }

  return categoryPriority.deficit > 2
}

/**
 * Log current category distribution status
 */
export async function logCategoryStatus(unavailableCategories = []) {
  const total = await getTodayTotalPosts()
  const priorities = await getCategoryPriorities(unavailableCategories)

  console.log('\n' + '='.repeat(70))
  console.log('📊 Daily Category Distribution Status')
  console.log('='.repeat(70))
  console.log(`Total WordPress posts today: ${total}`)

  if (unavailableCategories.length > 0) {
    console.log(`⚠️  Unavailable categories: ${unavailableCategories.join(', ')}`)
    console.log(`   (Redistributed to Entertainment, Gists, News)`)
  }

  console.log('\nCategory          | Posts | Current% | Target% | Deficit  | Status')
  console.log('-'.repeat(70))

  for (const priority of priorities) {
    const { category, targetPct, currentPct, deficit, count } = priority

    let status
    if (deficit > 5) {
      status = '🔴 High need'
    } else if (deficit > 2) {
      status = '🟡 Need more'
    } else if (deficit > -2) {
      status = '✅ On track'
    } else {
      status = '🔵 Excess'
    }

    const deficitStr = deficit > 0 ? `+${deficit.toFixed(1)}` : deficit.toFixed(1)

    console.log(
      `${category.padEnd(17)} | ${String(count).padStart(5)} | ${currentPct.toFixed(1).padStart(7)}% | ${targetPct.toFixed(1).padStart(7)}% | ${deficitStr.padStart(7)}% | ${status}`
    )
  }

  console.log('='.repeat(70))

  const mostNeeded = await getMostNeededCategory(unavailableCategories)
  if (mostNeeded) {
    console.log(`🎯 Priority: Focus on "${mostNeeded}" content`)
  } else {
    console.log(`✅ All category targets achieved!`)
  }

  console.log('='.repeat(70) + '\n')
}
