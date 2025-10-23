/**
 * X (Twitter) Rate Limit Tracker
 *
 * Tracks when X rate limits are hit and enforces cooldown periods
 * to prevent repeated API calls when rate limited.
 */

import fs from 'fs'

const RATE_LIMIT_FILE = 'xRateLimit.json'
const DEFAULT_COOLDOWN_HOURS = 24 // Wait 24 hours before retrying (X has daily limits)

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
    console.warn('[X Rate Limit] Error loading rate limit file:', err.message)
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
    console.error('[X Rate Limit] Error saving rate limit file:', err.message)
  }
}

/**
 * Check if X posting is currently allowed
 * @returns {Object} { allowed: boolean, reason: string, cooldownRemaining: number }
 */
export function isXPostingAllowed() {
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

    console.log('[X Rate Limit] ✅ Cooldown period ended. X posting re-enabled.')
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
 * Mark X as rate limited and start cooldown period
 * @param {Object} error - The error object from X API
 * @param {number} cooldownHours - Hours to wait before retrying (default: 24)
 */
export function markXRateLimited(error, cooldownHours = DEFAULT_COOLDOWN_HOURS) {
  const data = loadRateLimitData()

  const now = new Date()
  const rateLimitedUntil = new Date(now.getTime() + cooldownHours * 60 * 60 * 1000)

  data.isRateLimited = true
  data.rateLimitedUntil = rateLimitedUntil.toISOString()
  data.lastRateLimitError = {
    message: error.message || 'Too Many Requests',
    code: error.code || error.status || 429,
    title: error.title,
    detail: error.detail,
    timestamp: now.toISOString()
  }
  data.totalRateLimitHits = (data.totalRateLimitHits || 0) + 1

  saveRateLimitData(data)

  console.log(`[X Rate Limit] 🚫 X posting disabled until ${rateLimitedUntil.toLocaleString()}`)
  console.log(`[X Rate Limit] Cooldown period: ${cooldownHours} hours`)
  console.log(`[X Rate Limit] Total rate limit hits: ${data.totalRateLimitHits}`)
}

/**
 * Check if an error is a rate limit error
 * @param {Object} error - The error object from X API
 * @returns {boolean}
 */
export function isXRateLimitError(error) {
  // Check for rate limit error codes
  const errorCode = error.code || error.status || error.statusCode
  const errorMessage = (error.message || error.detail || '').toLowerCase()

  // X (Twitter) rate limit indicators
  // HTTP 429 = Too Many Requests
  // Code 88 = Rate limit exceeded
  // Code 420 = Rate limit (deprecated but still used)

  return (
    errorCode === 429 ||
    errorCode === 88 ||
    errorCode === 420 ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('rate_limit')
  )
}

/**
 * Get rate limit status for logging
 * @returns {Object} Current rate limit status
 */
export function getXRateLimitStatus() {
  return loadRateLimitData()
}

/**
 * Manually reset rate limit (for testing or manual intervention)
 */
export function resetXRateLimit() {
  const data = {
    isRateLimited: false,
    rateLimitedUntil: null,
    lastRateLimitError: null,
    totalRateLimitHits: 0
  }
  saveRateLimitData(data)
  console.log('[X Rate Limit] ✅ Rate limit manually reset.')
}
