/**
 * Check Post Dates Script
 * Shows what date ranges currently exist in the database
 */

import { Post } from './db.js'

async function checkPostDates() {
  try {
    console.log('\n📊 Analyzing posts in database...\n')

    // Get total count
    const totalPosts = await Post.countDocuments()
    console.log(`Total posts in database: ${totalPosts}\n`)

    if (totalPosts === 0) {
      console.log('✓ Database is empty')
      process.exit(0)
    }

    // Get earliest and latest posts
    const earliestPost = await Post.findOne()
      .sort({ dateRetrieved: 1 })
      .select('dateRetrieved timePosted title rewrittenTitle')

    const latestPost = await Post.findOne()
      .sort({ dateRetrieved: -1 })
      .select('dateRetrieved timePosted title rewrittenTitle')

    console.log('Date Range:')
    console.log('─'.repeat(80))
    console.log('Earliest Post:')
    console.log(`  Title: ${earliestPost?.rewrittenTitle || earliestPost?.title}`)
    console.log(`  Date Retrieved: ${earliestPost?.dateRetrieved}`)
    console.log(`  Time Posted: ${earliestPost?.timePosted}`)
    console.log('')
    console.log('Latest Post:')
    console.log(`  Title: ${latestPost?.rewrittenTitle || latestPost?.title}`)
    console.log(`  Date Retrieved: ${latestPost?.dateRetrieved}`)
    console.log(`  Time Posted: ${latestPost?.timePosted}`)
    console.log('─'.repeat(80))

    // Get count by month for 2025
    console.log('\n📅 Posts by Month (2025):\n')

    const months = [
      { name: 'January', start: '2025-01-01', end: '2025-01-31' },
      { name: 'February', start: '2025-02-01', end: '2025-02-28' },
      { name: 'March', start: '2025-03-01', end: '2025-03-31' },
      { name: 'April', start: '2025-04-01', end: '2025-04-30' },
      { name: 'May', start: '2025-05-01', end: '2025-05-31' },
      { name: 'June', start: '2025-06-01', end: '2025-06-30' },
      { name: 'July', start: '2025-07-01', end: '2025-07-31' },
      { name: 'August', start: '2025-08-01', end: '2025-08-31' },
      { name: 'September', start: '2025-09-01', end: '2025-09-30' },
      { name: 'October', start: '2025-10-01', end: '2025-10-31' },
    ]

    for (const month of months) {
      const count = await Post.countDocuments({
        $or: [
          {
            dateRetrieved: {
              $gte: new Date(month.start),
              $lte: new Date(month.end + 'T23:59:59Z'),
            },
          },
          {
            timePosted: {
              $gte: new Date(month.start),
              $lte: new Date(month.end + 'T23:59:59Z'),
            },
          },
        ],
      })

      if (count > 0) {
        console.log(`  ${month.name} 2025: ${count} posts`)
      }
    }

    console.log('\n✅ Analysis complete!')
  } catch (error) {
    console.error('\n❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

checkPostDates()
