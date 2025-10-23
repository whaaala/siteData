/**
 * Instagram Rate Limit Tracker
 *
 * Tracks when Instagram rate limits are hit and enforces cooldown periods
 * to prevent repeated API calls when rate limited.
 */

import fs from 'fs'
import path from 'path'

const RATE_LIMIT_FILE = 'instagramRateLimit.json'
const DEFAULT_COOLDOWN_HOURS = 2 // Wait 2 hours before retrying after rate limit

/**
 * Load rate limit data from file
 */
function loadRateLimitData() {
  try {
    if (fs.existsSync(RATE_LIMIT_FILE)) {
      const data = fs.readFileSync(RATE_LIMIT_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (err) {
    console.warn('[Instagram Rate Limit] Error loading rate limit file:', err.message)
  }

  return {
    isRateLimited: false,
    rateLimitedUntil: null,
    lastRateLimitError: null,
    totalRateLimitHits: 0
  }
}

/**
 * Save rate limit data to file
 */
function saveRateLimitData(data) {
  try {
    fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('[Instagram Rate Limit] Error saving rate limit file:', err.message)
  }
}

/**
 * Check if Instagram posting is currently allowed
 * @returns {Object} { allowed: boolean, reason: string, cooldownRemaining: number }
 */
export function isInstagramPostingAllowed() {
  const data = loadRateLimitData()

  if (!data.isRateLimited) {
    return { allowed: true }
  }

  const now = new Date()
  const rateLimitedUntil = new Date(data.rateLimitedUntil)

  if (now >= rateLimitedUntil) {
    // Cooldown period is over, reset rate limit
    data.isRateLimited = false
    data.rateLimitedUntil = null
    saveRateLimitData(data)

    console.log('[Instagram Rate Limit] ✅ Cooldown period ended. Instagram posting re-enabled.')
    return { allowed: true }
  }

  // Still in cooldown period
  const cooldownRemaining = Math.ceil((rateLimitedUntil - now) / 1000 / 60) // minutes
  return {
    allowed: false,
    reason: `Rate limited until ${rateLimitedUntil.toLocaleString()}`,
    cooldownRemaining,
    rateLimitedUntil: data.rateLimitedUntil
  }
}

/**
 * Mark Instagram as rate limited and start cooldown period
 * @param {Object} error - The error object from Instagram API
 * @param {number} cooldownHours - Hours to wait before retrying (default: 2)
 */
export function markInstagramRateLimited(error, cooldownHours = DEFAULT_COOLDOWN_HOURS) {
  const data = loadRateLimitData()

  const now = new Date()
  const rateLimitedUntil = new Date(now.getTime() + cooldownHours * 60 * 60 * 1000)

  data.isRateLimited = true
  data.rateLimitedUntil = rateLimitedUntil.toISOString()
  data.lastRateLimitError = {
    message: error.message || error.error?.message,
    code: error.code || error.error?.code,
    subcode: error.error_subcode || error.error?.error_subcode,
    timestamp: now.toISOString()
  }
  data.totalRateLimitHits = (data.totalRateLimitHits || 0) + 1

  saveRateLimitData(data)

  console.log(`[Instagram Rate Limit] 🚫 Instagram posting disabled until ${rateLimitedUntil.toLocaleString()}`)
  console.log(`[Instagram Rate Limit] Cooldown period: ${cooldownHours} hours`)
  console.log(`[Instagram Rate Limit] Total rate limit hits: ${data.totalRateLimitHits}`)
}

/**
 * Check if an error is a rate limit error
 * @param {Object} error - The error object from Instagram API
 * @returns {boolean}
 */
export function isRateLimitError(error) {
  // Check for rate limit error codes
  const errorCode = error.code || error.error?.code
  const errorSubcode = error.error_subcode || error.error?.error_subcode
  const errorMessage = (error.message || error.error?.message || '').toLowerCase()

  // Instagram rate limit error codes
  // Code 4 = Application request limit reached
  // Code 32 = Page request limit reached
  // Subcode 2207051 = Action blocked due to rate limits

  return (
    errorCode === 4 ||
    errorCode === 32 ||
    errorSubcode === 2207051 ||
    errorMessage.includes('request limit reached') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests')
  )
}

/**
 * Get rate limit status for logging
 * @returns {Object} Current rate limit status
 */
export function getRateLimitStatus() {
  return loadRateLimitData()
}

/**
 * Manually reset rate limit (for testing or manual intervention)
 */
export function resetRateLimit() {
  const data = {
    isRateLimited: false,
    rateLimitedUntil: null,
    lastRateLimitError: null,
    totalRateLimitHits: 0
  }
  saveRateLimitData(data)
  console.log('[Instagram Rate Limit] ✅ Rate limit manually reset.')
}
