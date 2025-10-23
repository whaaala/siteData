/**
 * Utility script to manually reset X (Twitter) rate limit
 *
 * Usage: node resetXRateLimit.js
 */

import { resetXRateLimit, getXRateLimitStatus } from './xRateLimitTracker.js'

console.log('=== X (Twitter) Rate Limit Reset Tool ===\n')

// Show current status
console.log('Current rate limit status:')
const status = getXRateLimitStatus()
console.log(JSON.stringify(status, null, 2))
console.log()

// Reset rate limit
console.log('Resetting rate limit...')
resetXRateLimit()

// Show new status
console.log('\nNew rate limit status:')
const newStatus = getXRateLimitStatus()
console.log(JSON.stringify(newStatus, null, 2))

console.log('\n✅ X (Twitter) rate limit has been reset!')
console.log('X posting will resume on the next post.')
