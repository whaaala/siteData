import OpenAI from 'openai'
import dotenv from 'dotenv'
import {
  getModerationConfig,
  isCategoryAllowed,
  isSourceBlocked,
  matchesSkipPattern
} from './moderationConfig.js'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Facebook Content Policy Categories to check
 * Based on Facebook Community Standards
 */
const FACEBOOK_VIOLATION_KEYWORDS = {
  violence: [
    'kill', 'murder', 'assassinate', 'brutal attack', 'graphic violence',
    'beheading', 'torture', 'massacre', 'genocide', 'mass shooting'
  ],
  hate_speech: [
    'racial slur', 'ethnic cleansing', 'hate crime', 'bigotry',
  ],
  adult_content: [
    'pornography', 'xxx', 'explicit nudity', 'sexual intercourse',
  ],
  dangerous_organizations: [
    'terrorist', 'terrorism', 'isis', 'al-qaeda', 'boko haram',
  ],
  // Note: News articles may legitimately discuss these topics
  // This is why we use AI moderation as the primary check
}

/**
 * Categories that require extra scrutiny for Facebook
 */
const SENSITIVE_CATEGORIES = ['Gists', 'Entertainment']

/**
 * Moderate content using OpenAI's Moderation API
 * @param {string} content - The content to moderate
 * @returns {Object} Moderation result with flags
 */
export async function moderateWithOpenAI(content) {
  try {
    const response = await openai.moderations.create({
      input: content,
    })

    const result = response.results[0]

    return {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores,
    }
  } catch (error) {
    console.error('[Moderation] OpenAI moderation error:', error.message)
    // On error, default to safe (don't post)
    return {
      flagged: true,
      categories: { error: true },
      categoryScores: {},
      error: error.message,
    }
  }
}

/**
 * Check if content contains high-risk keywords
 * @param {string} content - The content to check
 * @returns {Object} Result with violations found
 */
function checkKeywords(content) {
  const lowerContent = content.toLowerCase()
  const violations = []

  for (const [category, keywords] of Object.entries(FACEBOOK_VIOLATION_KEYWORDS)) {
    for (const keyword of keywords) {
      // Check for exact phrase match (not just word fragments)
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (regex.test(lowerContent)) {
        violations.push({ category, keyword })
      }
    }
  }

  return {
    hasViolations: violations.length > 0,
    violations,
  }
}

/**
 * Comprehensive check if content is safe for Facebook
 * @param {Object} post - The post object from database
 * @returns {Object} Safety result with recommendation
 */
export async function isContentSafeForFacebook(post) {
  console.log(`[Moderation] Checking if post is safe for Facebook: "${post.rewrittenTitle}"`)

  const result = {
    isSafe: true,
    reason: null,
    moderationFlags: {},
    recommendations: [],
  }

  // Combine title and excerpt for comprehensive check
  const contentToCheck = `${post.rewrittenTitle}\n\n${post.excerpt || ''}`

  // 1. OpenAI Moderation (Primary check)
  const aiModeration = await moderateWithOpenAI(contentToCheck)
  result.moderationFlags = aiModeration

  if (aiModeration.flagged) {
    const flaggedCategories = Object.entries(aiModeration.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category)

    // Determine if violations are acceptable for news content
    const criticalCategories = ['violence/graphic', 'sexual', 'sexual/minors', 'hate']
    const hasCriticalViolation = flaggedCategories.some(cat =>
      criticalCategories.some(critical => cat.includes(critical))
    )

    if (hasCriticalViolation) {
      result.isSafe = false
      result.reason = `OpenAI flagged for: ${flaggedCategories.join(', ')}`
      console.log(`[Moderation] ❌ Post BLOCKED - ${result.reason}`)
      return result
    } else {
      // Soft warning for borderline content
      result.recommendations.push(`Flagged but acceptable for news: ${flaggedCategories.join(', ')}`)
      console.log(`[Moderation] ⚠️ Soft warning: ${flaggedCategories.join(', ')}`)
    }
  }

  // 2. Keyword Check (Secondary check)
  const keywordCheck = checkKeywords(contentToCheck)
  if (keywordCheck.hasViolations) {
    const violationSummary = keywordCheck.violations
      .map(v => `${v.category}: "${v.keyword}"`)
      .join(', ')
    result.recommendations.push(`Contains sensitive keywords: ${violationSummary}`)
    console.log(`[Moderation] ⚠️ Contains sensitive keywords: ${violationSummary}`)

    // For now, just log - don't block based on keywords alone
    // (News articles legitimately discuss sensitive topics)
  }

  // 3. Category-based rules
  if (SENSITIVE_CATEGORIES.includes(post.category)) {
    result.recommendations.push(`Category "${post.category}" requires extra review`)
    console.log(`[Moderation] ℹ️ Sensitive category: ${post.category}`)
  }

  // 4. Content quality checks
  if (!post.imageLink || post.imageLink === '') {
    result.isSafe = false
    result.reason = 'No featured image - Facebook posts perform poorly without images'
    console.log(`[Moderation] ❌ Post BLOCKED - No featured image`)
    return result
  }

  if (!post.rewrittenTitle || post.rewrittenTitle.length < 10) {
    result.isSafe = false
    result.reason = 'Title too short or missing'
    console.log(`[Moderation] ❌ Post BLOCKED - Invalid title`)
    return result
  }

  // 5. Facebook-specific restrictions
  if (contentToCheck.includes('clickbait') || /click here|you won't believe/i.test(contentToCheck)) {
    result.recommendations.push('Possible clickbait detected')
    console.log(`[Moderation] ⚠️ Possible clickbait detected`)
  }

  if (result.isSafe) {
    console.log(`[Moderation] ✅ Post is SAFE for Facebook`)
    if (result.recommendations.length > 0) {
      console.log(`[Moderation] Recommendations: ${result.recommendations.join('; ')}`)
    }
  }

  return result
}

/**
 * Get human-readable explanation of moderation flags
 * @param {Object} moderationResult - Result from isContentSafeForFacebook
 * @returns {string} Human-readable explanation
 */
export function getModerationExplanation(moderationResult) {
  if (moderationResult.isSafe) {
    return 'Content passed all safety checks'
  }

  let explanation = `Content blocked: ${moderationResult.reason || 'Unknown reason'}`

  if (moderationResult.recommendations.length > 0) {
    explanation += `\nRecommendations: ${moderationResult.recommendations.join('; ')}`
  }

  return explanation
}

/**
 * Check specific high-risk scenarios
 * @param {Object} post - The post object
 * @returns {boolean} True if post should skip Facebook
 */
export function shouldSkipFacebookPosting(post) {
  const config = getModerationConfig()

  // Check if Facebook posting is globally disabled
  if (!config.facebookPostingEnabled) {
    console.log('[Moderation] Facebook posting is globally disabled')
    return true
  }

  // Check if moderation is disabled (allow all)
  if (!config.moderationEnabled) {
    console.log('[Moderation] Moderation is disabled - allowing all posts')
    return false
  }

  // Check category allowlist
  if (!isCategoryAllowed(post.category)) {
    console.log(`[Moderation] Category "${post.category}" is not in allowed list`)
    return true
  }

  // Check if source is blocked
  if (isSourceBlocked(post.website)) {
    console.log(`[Moderation] Source "${post.website}" is blocked`)
    return true
  }

  // Check URL patterns
  if (matchesSkipPattern(post.url)) {
    console.log(`[Moderation] URL matches skip pattern: ${post.url}`)
    return true
  }

  // Check override - always post sources
  if (config.overrides.alwaysPostSources.some(source => post.website?.includes(source))) {
    console.log(`[Moderation] Source "${post.website}" is in always-post list - skipping all checks`)
    return false // Don't skip - always post
  }

  // Check override - never post sources
  if (config.overrides.neverPostSources.some(source => post.website?.includes(source))) {
    console.log(`[Moderation] Source "${post.website}" is in never-post list`)
    return true
  }

  return false
}
