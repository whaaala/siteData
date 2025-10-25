/**
 * Check and manage X (Twitter) rate limit status
 *
 * Usage:
 *   node checkXRateLimit.js                  - Check current status
 *   node checkXRateLimit.js reset           - Reset rate limit
 */

import {
  getXRateLimitStatus,
  resetXRateLimit,
  isXPostingAllowed
} from './xRateLimitTracker.js'

const command = process.argv[2]

console.log('=== X (Twitter) Rate Limit Manager ===\n')

if (command === 'reset') {
  console.log('🔄 Resetting X rate limit...\n')
  resetXRateLimit()
  console.log('\n✅ Rate limit has been reset. X posting is now enabled.')
  console.log('\n⚠️  WARNING: Only reset if you are sure the rate limit period is over!')
  console.log('X typically has daily limits. Resetting too early may result in API errors.\n')
} else {
  // Check status
  const status = getXRateLimitStatus()
  const allowed = isXPostingAllowed()

  console.log('📊 CURRENT STATUS\n')
  console.log('─'.repeat(80))

  if (allowed.allowed) {
    console.log('✅ X Posting Status: ENABLED')
    console.log('   You can post to X (Twitter) now.')
  } else {
    console.log('🚫 X Posting Status: DISABLED (Rate Limited)')
    console.log(`   Reason: ${allowed.reason}`)
    console.log(`   Cooldown remaining: ${allowed.cooldownRemaining} minutes (${Math.ceil(allowed.cooldownRemaining / 60)} hours)`)
    console.log(`   Rate limited until: ${new Date(allowed.rateLimitedUntil).toLocaleString()}`)
  }

  console.log()
  console.log('─'.repeat(80))
  console.log('📈 STATISTICS\n')
  console.log(`Total rate limit hits: ${status.totalRateLimitHits || 0}`)

  if (status.lastRateLimitError) {
    console.log(`\nLast rate limit error:`)
    console.log(`  Time: ${new Date(status.lastRateLimitError.timestamp).toLocaleString()}`)
    console.log(`  Code: ${status.lastRateLimitError.code}`)
    console.log(`  Message: ${status.lastRateLimitError.message}`)
    if (status.lastRateLimitError.title) {
      console.log(`  Title: ${status.lastRateLimitError.title}`)
    }
    if (status.lastRateLimitError.detail) {
      console.log(`  Detail: ${status.lastRateLimitError.detail}`)
    }
  }

  console.log()
  console.log('─'.repeat(80))
  console.log('💡 TIPS\n')
  console.log('X (Twitter) Rate Limits:')
  console.log('  • Free tier: ~300 posts per 3 hours, ~1500 per 24 hours')
  console.log('  • Basic tier ($100/mo): Higher limits')
  console.log('  • If rate limited, wait 24 hours before posting again')
  console.log()
  console.log('Commands:')
  console.log('  node checkXRateLimit.js         - Check status (what you just did)')
  console.log('  node checkXRateLimit.js reset   - Manually reset rate limit')
  console.log()
  console.log('What happens during rate limit:')
  console.log('  • System automatically skips X posting for 24 hours')
  console.log('  • WordPress and Facebook/Instagram posting continues normally')
  console.log('  • After cooldown, X posting resumes automatically')
  console.log()
}

process.exit(0)
