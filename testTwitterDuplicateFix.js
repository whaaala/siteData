/**
 * Test Twitter/X duplicate URL cleanup
 * Tests the fix for Twitter/X URLs appearing inside Twitter blockquotes
 */

import { Post } from './db.js'
import { load } from 'cheerio'
import { embedSocialLinksInContent } from './utils.js'

const wpUrl =
  'https://nowahalazone.com/video-reportedly-shows-single-mother-in-tears-after-selling-phone-to-feed-child/'

console.log('=== Testing Twitter/X Duplicate URL Cleanup ===\n')

async function testTwitterCleanup() {
  try {
    const post = await Post.findOne({ wpPostUrl: wpUrl }).lean()

    if (!post) {
      console.log('❌ Post not found in database')
      process.exit(0)
    }

    console.log('Title:', post.rewrittenTitle || post.title)
    console.log('Source URL:', post.url)
    console.log()

    const originalContent = post.rewrittenDetails || post.postDetails || ''

    // Count BEFORE cleanup
    console.log('=== BEFORE CLEANUP ===')
    const $before = load(originalContent)
    const twitterEmbedsBefore = $before('.twitter-tweet')
    console.log(`Twitter embeds: ${twitterEmbedsBefore.length}`)

    // Check for plain URLs inside Twitter blockquotes
    let urlsInsideBlockquotesBefore = 0
    twitterEmbedsBefore.each((i, el) => {
      const html = $before(el).html() || ''
      const matches = html.match(/https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^/]+\/status\/\d+/g)
      if (matches) {
        urlsInsideBlockquotesBefore += matches.length
        console.log(
          `  Embed ${i + 1}: Contains ${matches.length} plain URL(s) inside blockquote`
        )
        matches.forEach((url) => {
          console.log(`    - ${url}`)
        })
      }
    })

    // Check for plain URLs in the entire content
    const plainUrlMatchesBefore = originalContent.match(
      /https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^/]+\/status\/\d+/g
    )
    console.log(
      `Total Twitter URLs in content: ${plainUrlMatchesBefore ? plainUrlMatchesBefore.length : 0}`
    )
    console.log(
      `Plain URLs inside blockquotes: ${urlsInsideBlockquotesBefore} ⚠️ (should be 0)`
    )
    console.log()

    // Apply the cleanup
    console.log('=== APPLYING CLEANUP ===')
    const cleanedContent = embedSocialLinksInContent(originalContent)
    console.log('✓ embedSocialLinksInContent() executed')
    console.log()

    // Count AFTER cleanup
    console.log('=== AFTER CLEANUP ===')
    const $after = load(cleanedContent)
    const twitterEmbedsAfter = $after('.twitter-tweet')
    console.log(`Twitter embeds: ${twitterEmbedsAfter.length}`)

    // Check for plain URLs inside Twitter blockquotes
    let urlsInsideBlockquotesAfter = 0
    twitterEmbedsAfter.each((i, el) => {
      const html = $after(el).html() || ''
      const matches = html.match(/https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^/]+\/status\/\d+/g)
      if (matches) {
        urlsInsideBlockquotesAfter += matches.length
        console.log(
          `  Embed ${i + 1}: Contains ${matches.length} plain URL(s) inside blockquote`
        )
        matches.forEach((url) => {
          console.log(`    - ${url}`)
        })
      }
    })

    // Check for plain URLs in the entire content
    const plainUrlMatchesAfter = cleanedContent.match(
      /https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^/]+\/status\/\d+/g
    )
    console.log(
      `Total Twitter URLs in content: ${plainUrlMatchesAfter ? plainUrlMatchesAfter.length : 0}`
    )
    console.log(
      `Plain URLs inside blockquotes: ${urlsInsideBlockquotesAfter} ${urlsInsideBlockquotesAfter === 0 ? '✅' : '❌'} (should be 0)`
    )
    console.log()

    // Verify results
    console.log('=== VERIFICATION ===')
    if (urlsInsideBlockquotesAfter === 0 && twitterEmbedsAfter.length > 0) {
      console.log('✅ TEST PASSED')
      console.log(
        '  - Twitter embeds are present and properly formatted'
      )
      console.log('  - No plain URLs inside Twitter blockquotes')
      console.log(
        '  - Twitter embeds will render correctly without duplicate URLs'
      )
    } else if (urlsInsideBlockquotesAfter === 0 && twitterEmbedsAfter.length === 0) {
      console.log('⚠️  TEST UNCLEAR')
      console.log('  - No Twitter embeds found in content')
    } else {
      console.log('❌ TEST FAILED')
      console.log('  - Plain URLs still present inside Twitter blockquotes')
    }

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

testTwitterCleanup()
