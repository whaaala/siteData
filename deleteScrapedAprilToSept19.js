/**
 * Delete Posts Scraped from April 1 to September 19, 2025
 * Deletes all posts based on their scraping date (dateRetrieved) from both WordPress and MongoDB
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
      return { success: true }
    }

    return { success: false, reason: `Unexpected status: ${response.status}` }
  } catch (error) {
    // 404 means post already deleted or doesn't exist - count as success
    if (error.response?.status === 404) {
      return { success: true, alreadyDeleted: true }
    }
    return { success: false, reason: error.message }
  }
}

/**
 * Main deletion function
 */
async function deletePosts(dryRun = true) {
  try {
    console.log('\n📅 Searching for posts scraped from April 1, 2025 to September 19, 2025...\n')

    // Query for posts scraped from April 1, 2025 to September 19, 2025
    // dateRetrieved is stored as ISO string, so we can use string comparison
    const startDate = '2025-04-01T00:00:00.000Z'
    const endDate = '2025-09-19T23:59:59.999Z'

    // Find posts using dateRetrieved (when they were scraped)
    const postsToDelete = await Post.find({
      dateRetrieved: { $gte: startDate, $lte: endDate }
    })

    console.log(`Found ${postsToDelete.length} posts scraped between April 1, 2025 and September 19, 2025\n`)

    if (postsToDelete.length === 0) {
      console.log('✓ No posts to delete in this date range')
      return
    }

    // Show sample of posts to be deleted
    console.log('Sample of posts to be deleted:')
    console.log('─'.repeat(80))
    postsToDelete.slice(0, 15).forEach((post, index) => {
      const date = post.dateRetrieved || 'Unknown date'
      console.log(`${index + 1}. ${post.rewrittenTitle || post.title}`)
      console.log(`   Scraped: ${date}`)
      console.log(`   WP Post ID: ${post.wpPostId || 'Not posted'}`)
      console.log(`   DB ID: ${post._id}`)
      console.log('')
    })

    if (postsToDelete.length > 15) {
      console.log(`... and ${postsToDelete.length - 15} more posts\n`)
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
    let errorDetails = []

    for (let i = 0; i < postsToDelete.length; i++) {
      const post = postsToDelete[i]
      const progress = `[${i + 1}/${postsToDelete.length}]`

      // Log every 50th post to show progress without spam
      if (i % 50 === 0 || i === postsToDelete.length - 1) {
        console.log(`${progress} Processing: ${post.rewrittenTitle || post.title}`)
      }

      // Delete from WordPress if it has a wpPostId
      if (post.wpPostId) {
        const wpResult = await deleteFromWordPress(post.wpPostId)
        if (wpResult.success) {
          wpDeletedCount++
          if (i % 50 === 0 && wpResult.alreadyDeleted) {
            console.log(`  - WordPress: Already deleted (404)`)
          } else if (i % 50 === 0) {
            console.log(`  ✓ Deleted from WordPress: Post ID ${post.wpPostId}`)
          }
        } else {
          wpFailedCount++
          errorDetails.push({ id: post.wpPostId, reason: wpResult.reason })
          if (wpFailedCount <= 5) {
            console.log(`  ✗ WordPress deletion failed: ${wpResult.reason}`)
          }
        }
      } else {
        wpSkippedCount++
      }

      // Delete from MongoDB
      await Post.deleteOne({ _id: post._id })
      dbDeletedCount++

      // Add delay every 50 posts to avoid overwhelming the server
      if ((i + 1) % 50 === 0) {
        console.log(`  Progress: ${i + 1}/${postsToDelete.length} posts processed...`)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(80))
    console.log('DELETION SUMMARY - Posts Scraped April 1 to September 19, 2025')
    console.log('═'.repeat(80))
    console.log(`Total posts processed: ${postsToDelete.length}`)
    console.log('')
    console.log(`WordPress:`)
    console.log(`  ✓ Deleted: ${wpDeletedCount}`)
    console.log(`  - Skipped (not posted): ${wpSkippedCount}`)
    console.log(`  ✗ Failed: ${wpFailedCount}`)
    console.log('')
    console.log(`MongoDB:`)
    console.log(`  ✓ Deleted: ${dbDeletedCount}`)
    console.log('')

    if (wpFailedCount > 0 && errorDetails.length > 0) {
      console.log(`Failed WordPress Deletions (first 5):`)
      errorDetails.slice(0, 5).forEach(err => {
        console.log(`  - Post ID ${err.id}: ${err.reason}`)
      })
      console.log('')
    }

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
  deletePosts(false)
} else {
  console.log('\n🔍 DRY RUN MODE - No posts will be deleted')
  deletePosts(true)
}
