/**
 * Content Moderation Configuration
 *
 * This file contains configuration for Facebook content moderation.
 * Adjust these settings to control what content gets posted to Facebook.
 */

export const moderationConfig = {
  /**
   * Enable/disable Facebook posting globally
   */
  facebookPostingEnabled: true,

  /**
   * Enable/disable content moderation (if disabled, all posts will be sent to Facebook)
   * WARNING: Disabling moderation may result in policy violations
   */
  moderationEnabled: true,

  /**
   * Categories that are ALLOWED to post to Facebook
   * Leave empty array [] to allow all categories
   * Options: 'News', 'Entertainment', 'Sports', 'Lifestyle', 'HealthAndFitness', 'FoodAndDrink', 'Gists'
   */
  allowedCategories: [
    'News',
    'Entertainment',
    'Sports',
    'Lifestyle',
    'HealthAndFitness',
    'FoodAndDrink',
    // 'Gists', // Uncomment to allow Gists category
  ],

  /**
   * Categories that require EXTRA scrutiny
   * These will still be posted if they pass moderation, but will be logged with warnings
   */
  sensitiveCategories: ['Gists', 'Entertainment'],

  /**
   * Source websites to BLOCK from Facebook
   * Posts from these sources will never be posted to Facebook
   */
  blockedSources: [
    // Example: 'problematicsource.com'
  ],

  /**
   * URL patterns to skip
   * Posts with URLs matching these patterns will not be posted to Facebook
   */
  skipUrlPatterns: [
    '/obituary/',
    '/death-notice/',
    // Add more patterns as needed
  ],

  /**
   * OpenAI Moderation thresholds
   * Categories from OpenAI that should BLOCK posts
   * See: https://platform.openai.com/docs/guides/moderation
   */
  blockingModerationCategories: [
    'violence/graphic',  // Graphic violence
    'sexual',            // Sexual content
    'sexual/minors',     // Sexual content involving minors
    'hate',              // Hate speech
    'self-harm',         // Self-harm content
  ],

  /**
   * OpenAI Moderation categories that should only WARN (not block)
   * These are acceptable for news content but should be logged
   */
  warningModerationCategories: [
    'violence',          // Non-graphic violence (acceptable for news)
    'harassment',        // Harassment (context-dependent)
  ],

  /**
   * Minimum content quality requirements
   */
  contentQuality: {
    requireFeaturedImage: true,      // Block posts without featured images
    minimumTitleLength: 10,          // Minimum characters in title
    maximumTitleLength: 300,         // Maximum characters in title (Facebook limit)
    requireExcerpt: false,           // Require excerpt to be generated
  },

  /**
   * Keyword-based filtering
   * Posts containing these exact phrases will be blocked
   * Use with caution - news articles legitimately discuss sensitive topics
   */
  strictBlockKeywords: [
    // Add extremely problematic keywords here
    // Example: 'graphic nudity', 'explicit violence'
  ],

  /**
   * Keyword-based warnings
   * Posts containing these phrases will be logged but not blocked
   */
  warningKeywords: [
    'breaking news',
    'developing story',
    'unconfirmed reports',
  ],

  /**
   * Facebook-specific rules
   */
  facebookRules: {
    blockClickbait: true,            // Block obvious clickbait
    blockSensationalHeadlines: false, // Block sensational headlines
    requireNewsValue: false,         // Require posts to have news value (experimental)
  },

  /**
   * Logging and monitoring
   */
  logging: {
    logAllModerationChecks: true,    // Log every moderation check
    logBlockedContent: true,          // Log all blocked content
    logWarnings: true,                // Log all warnings
  },

  /**
   * Override settings (advanced)
   * Force specific posts to always post or never post
   */
  overrides: {
    // Force posts from these sources to always post (skips moderation)
    alwaysPostSources: [
      // Example: 'trusted-source.com'
    ],

    // Force posts from these sources to never post
    neverPostSources: [
      // Example: 'untrusted-source.com'
    ],
  },
}

/**
 * Get effective configuration (with defaults)
 * @returns {Object} Configuration object
 */
export function getModerationConfig() {
  return moderationConfig
}

/**
 * Check if a category is allowed for Facebook posting
 * @param {string} category - Post category
 * @returns {boolean}
 */
export function isCategoryAllowed(category) {
  const config = getModerationConfig()

  // If allowedCategories is empty, all categories are allowed
  if (config.allowedCategories.length === 0) {
    return true
  }

  return config.allowedCategories.includes(category)
}

/**
 * Check if a source is blocked
 * @param {string} website - Source website
 * @returns {boolean}
 */
export function isSourceBlocked(website) {
  const config = getModerationConfig()
  return config.blockedSources.some(blocked => website?.includes(blocked))
}

/**
 * Check if URL matches skip pattern
 * @param {string} url - Post URL
 * @returns {boolean}
 */
export function matchesSkipPattern(url) {
  const config = getModerationConfig()
  return config.skipUrlPatterns.some(pattern => url?.includes(pattern))
}
