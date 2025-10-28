/**
 * Check Date Format in Database
 * Shows how dateRetrieved is stored
 */

import { Post } from './db.js'

async function checkDateFormat() {
  try {
    console.log('\n📊 Checking date format in database...\n')

    // Get a sample of posts
    const samplePosts = await Post.find().limit(10).select('dateRetrieved timePosted title rewrittenTitle')

    console.log('Sample Posts:')
    console.log('─'.repeat(80))

    samplePosts.forEach((post, i) => {
      console.log(`\n${i + 1}. ${post.rewrittenTitle || post.title}`)
      console.log(`   dateRetrieved: ${post.dateRetrieved}`)
      console.log(`   dateRetrieved type: ${typeof post.dateRetrieved}`)
      console.log(`   dateRetrieved constructor: ${post.dateRetrieved?.constructor?.name}`)
      console.log(`   timePosted: ${post.timePosted}`)
      console.log(`   timePosted type: ${typeof post.timePosted}`)
    })

    console.log('\n' + '─'.repeat(80))

    // Try to parse dateRetrieved as Date
    console.log('\nTrying to find posts with dateRetrieved as Date object...')
    const dateObjectPosts = await Post.countDocuments({
      dateRetrieved: { $type: 'date' }
    })
    console.log(`Posts with dateRetrieved as Date object: ${dateObjectPosts}`)

    console.log('\nTrying to find posts with dateRetrieved as String...')
    const stringPosts = await Post.countDocuments({
      dateRetrieved: { $type: 'string' }
    })
    console.log(`Posts with dateRetrieved as String: ${stringPosts}`)

    console.log('\n✅ Analysis complete!')

  } catch (error) {
    console.error('\n❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

checkDateFormat()
