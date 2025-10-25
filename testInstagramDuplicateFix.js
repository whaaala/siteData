/**
 * Test Instagram duplicate URL cleanup
 * Tests the fix for Instagram URLs appearing inside Instagram blockquotes
 */

import { Post } from './db.js'
import { load } from 'cheerio'
import { embedSocialLinksInContent } from './utils.js'

const wpUrl =
  'https://nowahalazone.com/kunle-hamilton-criticizes-bbnaijas-imisi-sends-strong-message-to-celestial-youths/'

console.log('=== Testing Instagram Duplicate URL Cleanup ===\n')

async function testInstagramCleanup() {
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
    const instagramEmbedsBefore = $before('.instagram-media')
    console.log(`Instagram embeds: ${instagramEmbedsBefore.length}`)

    // Check for plain URLs inside Instagram blockquotes
    let urlsInsideBlockquotesBefore = 0
    instagramEmbedsBefore.each((i, el) => {
      const html = $before(el).html() || ''
      const matches = html.match(/https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+/g)
      if (matches) {
        urlsInsideBlockquotesBefore += matches.length
        console.log(
          `  Embed ${i + 1}: Contains ${matches.length} plain URL(s) inside blockquote`
        )
      }
    })

    // Check for plain URLs in the entire content
    const plainUrlMatchesBefore = originalContent.match(
      /https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+/g
    )
    console.log(
      `Total Instagram URLs in content: ${plainUrlMatchesBefore ? plainUrlMatchesBefore.length : 0}`
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
    const instagramEmbedsAfter = $after('.instagram-media')
    console.log(`Instagram embeds: ${instagramEmbedsAfter.length}`)

    // Check for plain URLs inside Instagram blockquotes
    let urlsInsideBlockquotesAfter = 0
    instagramEmbedsAfter.each((i, el) => {
      const html = $after(el).html() || ''
      const matches = html.match(/https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+/g)
      if (matches) {
        urlsInsideBlockquotesAfter += matches.length
        console.log(
          `  Embed ${i + 1}: Contains ${matches.length} plain URL(s) inside blockquote`
        )
      }
    })

    // Check for plain URLs in the entire content
    const plainUrlMatchesAfter = cleanedContent.match(
      /https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+/g
    )
    console.log(
      `Total Instagram URLs in content: ${plainUrlMatchesAfter ? plainUrlMatchesAfter.length : 0}`
    )
    console.log(
      `Plain URLs inside blockquotes: ${urlsInsideBlockquotesAfter} ${urlsInsideBlockquotesAfter === 0 ? '✅' : '❌'} (should be 0)`
    )
    console.log()

    // Verify results
    console.log('=== VERIFICATION ===')
    if (urlsInsideBlockquotesAfter === 0 && instagramEmbedsAfter.length > 0) {
      console.log('✅ TEST PASSED')
      console.log(
        '  - Instagram embeds are present and properly formatted'
      )
      console.log('  - No plain URLs inside Instagram blockquotes')
      console.log(
        '  - Instagram embeds will render correctly without duplicate URLs'
      )
    } else if (urlsInsideBlockquotesAfter === 0 && instagramEmbedsAfter.length === 0) {
      console.log('⚠️  TEST UNCLEAR')
      console.log('  - No Instagram embeds found in content')
    } else {
      console.log('❌ TEST FAILED')
      console.log('  - Plain URLs still present inside Instagram blockquotes')
    }

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

testInstagramCleanup()
