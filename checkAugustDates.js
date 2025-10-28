/**
 * Check August 2025 Post Dates
 * Shows detailed breakdown of posts in August 2025
 */

import { Post } from './db.js'

async function checkAugustDates() {
  try {
    console.log('\n📅 Analyzing August 2025 posts...\n')

    // Get all August posts
    const augustStart = new Date('2025-08-01T00:00:00Z')
    const augustEnd = new Date('2025-08-31T23:59:59Z')

    const augustPosts = await Post.find({
      $or: [
        { dateRetrieved: { $gte: augustStart, $lte: augustEnd } },
        { timePosted: { $gte: augustStart, $lte: augustEnd } },
      ],
    }).select('dateRetrieved timePosted title rewrittenTitle wpPostId')

    console.log(`Total August 2025 posts: ${augustPosts.length}\n`)

    if (augustPosts.length === 0) {
      console.log('✓ No posts from August 2025')
      process.exit(0)
    }

    // Group by date
    const dateGroups = {}

    augustPosts.forEach(post => {
      let dateStr = 'Unknown'

      if (post.dateRetrieved) {
        const date = new Date(post.dateRetrieved)
        if (!isNaN(date.getTime())) {
          dateStr = date.toISOString().split('T')[0]
        }
      } else if (post.timePosted) {
        // Try to parse timePosted (it's in various formats)
        const date = new Date(post.timePosted)
        if (!isNaN(date.getTime())) {
          dateStr = date.toISOString().split('T')[0]
        }
      }

      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = []
      }
      dateGroups[dateStr].push(post)
    })

    // Sort by date
    const sortedDates = Object.keys(dateGroups).sort()

    console.log('Posts by Date:')
    console.log('─'.repeat(80))

    sortedDates.forEach(date => {
      const posts = dateGroups[date]
      console.log(`\n${date}: ${posts.length} posts`)

      // Show first 3 post titles
      posts.slice(0, 3).forEach((post, i) => {
        console.log(`  ${i + 1}. ${post.rewrittenTitle || post.title}`)
        console.log(`     WP ID: ${post.wpPostId || 'Not posted'}`)
      })

      if (posts.length > 3) {
        console.log(`  ... and ${posts.length - 3} more`)
      }
    })

    console.log('\n' + '─'.repeat(80))
    console.log('\n✅ Analysis complete!')

  } catch (error) {
    console.error('\n❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

checkAugustDates()
