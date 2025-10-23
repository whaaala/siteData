/**
 * Utility script to manually reset Instagram rate limit
 *
 * Usage: node resetInstagramRateLimit.js
 */

import { resetRateLimit, getRateLimitStatus } from './instagramRateLimitTracker.js'

console.log('=== Instagram Rate Limit Reset Tool ===\n')

// Show current status
console.log('Current rate limit status:')
const status = getRateLimitStatus()
console.log(JSON.stringify(status, null, 2))
console.log()

// Reset rate limit
console.log('Resetting rate limit...')
resetRateLimit()

// Show new status
console.log('\nNew rate limit status:')
const newStatus = getRateLimitStatus()
console.log(JSON.stringify(newStatus, null, 2))

console.log('\n✅ Instagram rate limit has been reset!')
console.log('Instagram posting will resume on the next post.')
