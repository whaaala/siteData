/**
 * Delete April 2025 Posts Script
 * Deletes all posts from April 2025 (2025/04) from both WordPress and MongoDB
 */

import dotenv from 'dotenv'
import axios from 'axios'
import { Post } from './db.js'

dotenv.config()

const WORDPRESS_URL = process.env.WORDPRESS_URL
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME
const WORDPRESS_PASSWORD = process.env.WORDPRESS_PASSWORD

/**
 * Delete a post from WordPress
 */
async function deleteFromWordPress(wpPostId) {
  if (!wpPostId) return { success: false, reason: 'No WordPress post ID' }

  try {
    const url = `${WORDPRESS_URL}/wp-json/wp/v2/posts/${wpPostId}?force=true`
    const auth = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_PASSWORD}`).toString('base64')

    const response = await axios.delete(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.status === 200) {
      console.log(`  ✓ Deleted from WordPress: Post ID ${wpPostId}`)
      return { success: true }
    }

    return { success: false, reason: `Unexpected status: ${response.status}` }
  } catch (error) {
    // 404 means post already deleted or doesn't exist - count as success
    if (error.response?.status === 404) {
      console.log(`  - WordPress post ${wpPostId} already deleted (404)`)
      return { success: true, alreadyDeleted: true }
    }
    console.error(`  ✗ Failed to delete from WordPress: ${error.message}`)
    return { success: false, reason: error.message }
  }
}

/**
 * Main deletion function
 */
async function deleteApril2025Posts(dryRun = true) {
  try {
    console.log('\n📅 Searching for posts from April 2025 (2025/04)...\n')

    // Query for posts from April 2025 (2025-04-01 to 2025-04-30)
    const startDate = new Date('2025-04-01T00:00:00Z')
    const endDate = new Date('2025-04-30T23:59:59Z')

    // Find posts using both dateRetrieved and timePosted fields
    const april2025Posts = await Post.find({
      $or: [
        { dateRetrieved: { $gte: startDate, $lte: endDate } },
        { timePosted: { $gte: startDate, $lte: endDate } },
      ],
    })

    console.log(`Found ${april2025Posts.length} posts from April 2025\n`)

    if (april2025Posts.length === 0) {
      console.log('✓ No posts from April 2025 to delete')
      return
    }

    // Show sample of posts to be deleted
    console.log('Sample of posts to be deleted:')
    console.log('─'.repeat(80))
    april2025Posts.slice(0, 10).forEach((post, index) => {
      const date = post.dateRetrieved || post.timePosted || 'Unknown date'
      console.log(`${index + 1}. ${post.rewrittenTitle || post.title}`)
      console.log(`   Date: ${date}`)
      console.log(`   WP Post ID: ${post.wpPostId || 'Not posted'}`)
      console.log(`   DB ID: ${post._id}`)
      console.log('')
    })

    if (april2025Posts.length > 10) {
      console.log(`... and ${april2025Posts.length - 10} more posts\n`)
    }
    console.log('─'.repeat(80))

    if (dryRun) {
      console.log('\n🔍 DRY RUN MODE - No posts were deleted')
      console.log('To actually delete these posts, run with --execute flag')
      return
    }

    // Confirm deletion
    console.log('\n⚠️  DELETION IN PROGRESS...\n')

    let wpDeletedCount = 0
    let wpSkippedCount = 0
    let wpFailedCount = 0
    let dbDeletedCount = 0

    for (let i = 0; i < april2025Posts.length; i++) {
      const post = april2025Posts[i]
      const progress = `[${i + 1}/${april2025Posts.length}]`

      console.log(`${progress} Processing: ${post.rewrittenTitle || post.title}`)

      // Delete from WordPress if it has a wpPostId
      if (post.wpPostId) {
        const wpResult = await deleteFromWordPress(post.wpPostId)
        if (wpResult.success) {
          wpDeletedCount++
        } else {
          wpFailedCount++
          console.log(`  ! WordPress deletion failed: ${wpResult.reason}`)
        }
      } else {
        wpSkippedCount++
        console.log(`  - Skipped WordPress (not posted)`)
      }

      // Delete from MongoDB
      await Post.deleteOne({ _id: post._id })
      dbDeletedCount++
      console.log(`  ✓ Deleted from MongoDB`)
      console.log('')

      // Add small delay every 50 posts to avoid overwhelming the server
      if ((i + 1) % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(80))
    console.log('DELETION SUMMARY - APRIL 2025 POSTS')
    console.log('═'.repeat(80))
    console.log(`Total posts processed: ${april2025Posts.length}`)
    console.log('')
    console.log(`WordPress:`)
    console.log(`  ✓ Deleted: ${wpDeletedCount}`)
    console.log(`  - Skipped (not posted): ${wpSkippedCount}`)
    console.log(`  ✗ Failed: ${wpFailedCount}`)
    console.log('')
    console.log(`MongoDB:`)
    console.log(`  ✓ Deleted: ${dbDeletedCount}`)
    console.log('')
    console.log('✅ Deletion complete!')
    console.log('═'.repeat(80))

  } catch (error) {
    console.error('\n❌ Error during deletion:', error)
  } finally {
    process.exit(0)
  }
}

// Check command line arguments
const args = process.argv.slice(2)
const executeMode = args.includes('--execute')

if (executeMode) {
  console.log('\n⚠️  EXECUTE MODE - Posts will be permanently deleted!')
  deleteApril2025Posts(false)
} else {
  console.log('\n🔍 DRY RUN MODE - No posts will be deleted')
  deleteApril2025Posts(true)
}
