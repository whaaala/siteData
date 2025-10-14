import { isContentSafeForFacebook, getModerationExplanation } from './contentModeration.js'
import dotenv from 'dotenv'

dotenv.config()

// Test posts with different content types
const testPosts = [
  {
    name: 'Safe News Article',
    post: {
      rewrittenTitle: 'Nigeria\'s Economy Shows Strong Growth in Q4 2024',
      excerpt: 'The Nigerian economy has demonstrated resilience with a 3.5% growth rate in the fourth quarter, according to the National Bureau of Statistics.',
      category: 'News',
      website: 'premiumtimesng.com',
      url: 'https://premiumtimesng.com/news/economy-growth',
      imageLink: 'https://example.com/image.jpg'
    }
  },
  {
    name: 'Graphic Violence (Should Block)',
    post: {
      rewrittenTitle: 'Brutal Attack Leaves Multiple Dead in Lagos',
      excerpt: 'Warning: Graphic details. Multiple people were killed in a brutal attack with graphic violence and bloodshed.',
      category: 'News',
      website: 'dailypost.ng',
      url: 'https://dailypost.ng/news/violence',
      imageLink: 'https://example.com/image.jpg'
    }
  },
  {
    name: 'Sports Article (Safe)',
    post: {
      rewrittenTitle: 'Super Eagles Advance to AFCON Semi-Finals',
      excerpt: 'Nigeria\'s national team secured their spot in the semi-finals with a convincing 2-0 victory over Cameroon.',
      category: 'Sports',
      website: 'punchng.com',
      url: 'https://punchng.com/sports/super-eagles',
      imageLink: 'https://example.com/image.jpg'
    }
  },
  {
    name: 'Gists Category (Blocked by Default)',
    post: {
      rewrittenTitle: 'Shocking Celebrity Rumor Surfaces Online',
      excerpt: 'Unverified reports suggest a major scandal involving a popular Nigerian celebrity.',
      category: 'Gists',
      website: 'gistlover.com',
      url: 'https://gistlover.com/gist/celebrity-scandal',
      imageLink: 'https://example.com/image.jpg'
    }
  },
  {
    name: 'Obituary (Skip Pattern)',
    post: {
      rewrittenTitle: 'Remembering Chief John Doe: A Life of Service',
      excerpt: 'The community mourns the passing of Chief John Doe, who dedicated his life to public service.',
      category: 'News',
      website: 'guardian.ng',
      url: 'https://guardian.ng/news/obituary/john-doe',
      imageLink: 'https://example.com/image.jpg'
    }
  },
  {
    name: 'No Featured Image (Should Block)',
    post: {
      rewrittenTitle: 'Breaking: Major Announcement Expected',
      excerpt: 'Government officials are expected to make a major announcement this evening.',
      category: 'News',
      website: 'naijanews.com',
      url: 'https://naijanews.com/news/announcement',
      imageLink: '' // No image
    }
  },
  {
    name: 'Entertainment (Safe)',
    post: {
      rewrittenTitle: 'New Nollywood Film Breaks Box Office Records',
      excerpt: 'The latest Nollywood production has shattered box office records in its opening weekend.',
      category: 'Entertainment',
      website: 'legit.ng',
      url: 'https://legit.ng/entertainment/nollywood',
      imageLink: 'https://example.com/image.jpg'
    }
  },
  {
    name: 'Violence Reporting (News Context - Should Pass)',
    post: {
      rewrittenTitle: 'Police Report Increase in Crime Rate',
      excerpt: 'Law enforcement officials report a 10% increase in violent crime in urban areas this year.',
      category: 'News',
      website: 'premiumtimesng.com',
      url: 'https://premiumtimesng.com/news/crime-report',
      imageLink: 'https://example.com/image.jpg'
    }
  }
]

async function runModerationTests() {
  console.log('=' .repeat(80))
  console.log('CONTENT MODERATION TEST SUITE')
  console.log('=' .repeat(80))
  console.log()

  const results = {
    total: testPosts.length,
    passed: 0,
    blocked: 0,
    skipped: 0
  }

  for (let i = 0; i < testPosts.length; i++) {
    const test = testPosts[i]
    console.log(`\n[${ i + 1}/${testPosts.length}] Testing: ${test.name}`)
    console.log('-'.repeat(80))

    try {
      const moderationResult = await isContentSafeForFacebook(test.post)
      const explanation = getModerationExplanation(moderationResult)

      console.log(`Title: "${test.post.rewrittenTitle}"`)
      console.log(`Category: ${test.post.category}`)
      console.log(`Source: ${test.post.website}`)
      console.log()
      console.log(`Result: ${moderationResult.isSafe ? '✅ APPROVED' : '🚫 BLOCKED'}`)
      console.log(`Reason: ${explanation}`)

      if (moderationResult.moderationFlags.flagged) {
        console.log(`AI Flags: ${JSON.stringify(moderationResult.moderationFlags.categories, null, 2)}`)
      }

      if (moderationResult.recommendations && moderationResult.recommendations.length > 0) {
        console.log(`Warnings: ${moderationResult.recommendations.join('; ')}`)
      }

      // Track results
      if (moderationResult.isSafe) {
        results.passed++
      } else {
        results.blocked++
      }

    } catch (error) {
      console.error(`❌ Error testing "${test.name}":`, error.message)
      results.skipped++
    }

    console.log('-'.repeat(80))
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('TEST SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total Tests: ${results.total}`)
  console.log(`✅ Approved: ${results.passed}`)
  console.log(`🚫 Blocked: ${results.blocked}`)
  console.log(`⚠️ Errors: ${results.skipped}`)
  console.log('='.repeat(80))

  console.log('\n💡 Tips:')
  console.log('- Adjust settings in moderationConfig.js to customize behavior')
  console.log('- Review blocked posts to ensure they should be blocked')
  console.log('- Check warnings to understand AI sensitivity')
  console.log('- Run this test after changing moderation rules')
  console.log()
}

// Run tests
runModerationTests().catch(console.error)
