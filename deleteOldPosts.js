/**
 * Delete Old Posts Script
 * Deletes all posts from 2025-08-27 and older from both WordPress and MongoDB
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
    console.error(`  ✗ Failed to delete from WordPress: ${error.message}`)
    return { success: false, reason: error.message }
  }
}

/**
 * Main deletion function
 */
async function deleteOldPosts(dryRun = true) {
  try {
    console.log('\n📅 Searching for posts from 2025-08-27 and older...\n')

    // Query for posts with dateRetrieved or timePosted <= 2025-08-27
    const cutoffDate = new Date('2025-08-27T23:59:59Z')

    // Find posts using both dateRetrieved and timePosted fields
    // Note: Removed .sort() to avoid MongoDB memory limit errors with large datasets
    const oldPosts = await Post.find({
      $or: [
        { dateRetrieved: { $lte: cutoffDate } },
        { timePosted: { $lte: cutoffDate } },
      ],
    })

    console.log(`Found ${oldPosts.length} posts from 2025-08-27 and older\n`)

    if (oldPosts.length === 0) {
      console.log('✓ No old posts to delete')
      return
    }

    // Show sample of posts to be deleted
    console.log('Sample of posts to be deleted:')
    console.log('─'.repeat(80))
    oldPosts.slice(0, 10).forEach((post, index) => {
      const date = post.dateRetrieved || post.timePosted || 'Unknown date'
      console.log(`${index + 1}. ${post.rewrittenTitle || post.title}`)
      console.log(`   Date: ${date}`)
      console.log(`   WP Post ID: ${post.wpPostId || 'Not posted'}`)
      console.log(`   DB ID: ${post._id}`)
      console.log('')
    })

    if (oldPosts.length > 10) {
      console.log(`... and ${oldPosts.length - 10} more posts\n`)
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

    for (let i = 0; i < oldPosts.length; i++) {
      const post = oldPosts[i]
      const progress = `[${i + 1}/${oldPosts.length}]`

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
    }

    // Summary
    console.log('\n' + '═'.repeat(80))
    console.log('DELETION SUMMARY')
    console.log('═'.repeat(80))
    console.log(`Total posts processed: ${oldPosts.length}`)
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
  deleteOldPosts(false)
} else {
  console.log('\n🔍 DRY RUN MODE - No posts will be deleted')
  deleteOldPosts(true)
}
