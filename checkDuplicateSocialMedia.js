/**
 * Check for duplicate social media embeds in a post
 */

import { Post } from './db.js'
import { load } from 'cheerio'

const wpUrl = 'https://nowahalazone.com/kunle-hamilton-criticizes-bbnaijas-imisi-sends-strong-message-to-celestial-youths/'

console.log('=== Checking for Duplicate Social Media Embeds ===\n')

async function checkPost() {
  try {
    const post = await Post.findOne({ wpPostUrl: wpUrl }).lean()

    if (!post) {
      console.log('❌ Post not found in database')
      process.exit(0)
    }

    console.log('Title:', post.rewrittenTitle || post.title)
    console.log('Source URL:', post.url)
    console.log()

    const content = post.rewrittenDetails || post.postDetails || ''
    const $ = load(content)

    // Check for Instagram embeds
    const instagramEmbeds = $('.instagram-media')
    console.log(`Instagram embeds found: ${instagramEmbeds.length}`)

    if (instagramEmbeds.length > 0) {
      const instagramUrls = []
      instagramEmbeds.each((i, el) => {
        const permalink = $(el).attr('data-instgrm-permalink') || $(el).attr('cite') || 'unknown'
        instagramUrls.push(permalink)
        console.log(`  ${i + 1}. ${permalink}`)
      })

      // Check for duplicates
      const uniqueUrls = [...new Set(instagramUrls)]
      if (uniqueUrls.length < instagramUrls.length) {
        console.log('\n⚠️ DUPLICATES FOUND!')
        console.log(`  Total embeds: ${instagramUrls.length}`)
        console.log(`  Unique embeds: ${uniqueUrls.length}`)
        console.log(`  Duplicates: ${instagramUrls.length - uniqueUrls.length}`)
      } else {
        console.log('\n✅ No duplicates - all Instagram embeds are unique')
      }
    }
    console.log()

    // Check for Twitter embeds
    const twitterEmbeds = $('.twitter-tweet')
    console.log(`Twitter embeds found: ${twitterEmbeds.length}`)

    if (twitterEmbeds.length > 0) {
      twitterEmbeds.each((i, el) => {
        const link = $(el).find('a').attr('href') || 'unknown'
        console.log(`  ${i + 1}. ${link}`)
      })
    }
    console.log()

    // Check for TikTok embeds
    const tiktokEmbeds = $('.tiktok-embed')
    console.log(`TikTok embeds found: ${tiktokEmbeds.length}`)

    if (tiktokEmbeds.length > 0) {
      tiktokEmbeds.each((i, el) => {
        const cite = $(el).attr('cite') || 'unknown'
        console.log(`  ${i + 1}. ${cite}`)
      })
    }
    console.log()

    // Check for plain Instagram URLs in text
    const instagramUrlMatches = content.match(/https:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+/g)
    if (instagramUrlMatches) {
      console.log(`Plain Instagram URLs in text: ${instagramUrlMatches.length}`)
      instagramUrlMatches.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`)
      })
    }

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkPost()
