/**
 * Delete WordPress Posts from August 9 to September 16, 2025
 * Deletes all posts published on WordPress between Aug 9 - Sept 16, 2025
 */

import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const WORDPRESS_URL = process.env.WORDPRESS_URL
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME
const WORDPRESS_PASSWORD = process.env.WORDPRESS_PASSWORD

/**
 * Fetch posts from WordPress by date range
 */
async function fetchWordPressPosts(startDate, endDate, page = 1, perPage = 100) {
  try {
    const auth = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_PASSWORD}`).toString('base64')

    const url = `${WORDPRESS_URL}/wp-json/wp/v2/posts`
    const response = await axios.get(url, {
      params: {
        after: startDate,
        before: endDate,
        per_page: perPage,
        page: page,
        status: 'any', // Get all post statuses
      },
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })

    const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1')
    const totalPosts = parseInt(response.headers['x-wp-total'] || '0')

    return {
      posts: response.data,
      totalPages,
      totalPosts,
      currentPage: page,
    }
  } catch (error) {
    console.error('Error fetching WordPress posts:', error.message)
    return { posts: [], totalPages: 0, totalPosts: 0, currentPage: page }
  }
}

/**
 * Delete a post from WordPress
 */
async function deleteFromWordPress(wpPostId) {
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
    if (error.response?.status === 404) {
      return { success: true, alreadyDeleted: true }
    }
    return { success: false, reason: error.message }
  }
}

/**
 * Main deletion function
 */
async function deleteAug9ToSept16Posts(dryRun = true) {
  try {
    console.log('\n📅 Searching for WordPress posts from August 9 to September 16, 2025...\n')

    // Date range for August 9 to September 16, 2025
    const startDate = '2025-08-09T00:00:00'
    const endDate = '2025-09-16T23:59:59'

    // Fetch all posts from this date range
    console.log('Fetching posts from WordPress...')
    const allPosts = []
    let currentPage = 1
    let totalPages = 1

    // Fetch first page to get total
    const firstPageResult = await fetchWordPressPosts(startDate, endDate, 1)
    totalPages = firstPageResult.totalPages
    allPosts.push(...firstPageResult.posts)

    console.log(`Found ${firstPageResult.totalPosts} total posts`)
    console.log(`Fetching ${totalPages} pages...\n`)

    // Fetch remaining pages
    for (let page = 2; page <= totalPages; page++) {
      const result = await fetchWordPressPosts(startDate, endDate, page)
      allPosts.push(...result.posts)
      console.log(`Fetched page ${page}/${totalPages}`)
      await new Promise(resolve => setTimeout(resolve, 200)) // Small delay between fetches
    }

    console.log(`\nTotal posts fetched: ${allPosts.length}\n`)

    if (allPosts.length === 0) {
      console.log('✓ No posts found from August 9 to September 16, 2025')
      return
    }

    // Show sample of posts to be deleted
    console.log('Sample of posts to be deleted:')
    console.log('─'.repeat(80))
    allPosts.slice(0, 15).forEach((post, index) => {
      console.log(`${index + 1}. ${post.title.rendered}`)
      console.log(`   Published: ${post.date}`)
      console.log(`   WP Post ID: ${post.id}`)
      console.log(`   Status: ${post.status}`)
      console.log('')
    })

    if (allPosts.length > 15) {
      console.log(`... and ${allPosts.length - 15} more posts\n`)
    }
    console.log('─'.repeat(80))

    if (dryRun) {
      console.log('\n🔍 DRY RUN MODE - No posts were deleted')
      console.log('To actually delete these posts, run with --execute flag')
      return
    }

    // Confirm deletion
    console.log('\n⚠️  DELETION IN PROGRESS...\n')

    let deletedCount = 0
    let failedCount = 0
    let errorDetails = []

    for (let i = 0; i < allPosts.length; i++) {
      const post = allPosts[i]
      const progress = `[${i + 1}/${allPosts.length}]`

      // Log every 50th post to show progress
      if (i % 50 === 0 || i === allPosts.length - 1) {
        console.log(`${progress} Deleting: ${post.title.rendered.substring(0, 60)}...`)
      }

      const result = await deleteFromWordPress(post.id)
      if (result.success) {
        deletedCount++
        if (i % 50 === 0 && result.alreadyDeleted) {
          console.log(`  - Already deleted (404)`)
        } else if (i % 50 === 0) {
          console.log(`  ✓ Deleted: Post ID ${post.id}`)
        }
      } else {
        failedCount++
        errorDetails.push({ id: post.id, reason: result.reason })
        if (failedCount <= 5) {
          console.log(`  ✗ Failed: ${result.reason}`)
        }
      }

      // Add delay every 50 posts
      if ((i + 1) % 50 === 0) {
        console.log(`  Progress: ${i + 1}/${allPosts.length} posts processed...`)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(80))
    console.log('DELETION SUMMARY - WordPress Posts from August 9 to September 16, 2025')
    console.log('═'.repeat(80))
    console.log(`Total posts processed: ${allPosts.length}`)
    console.log('')
    console.log(`✓ Deleted: ${deletedCount}`)
    console.log(`✗ Failed: ${failedCount}`)
    console.log('')

    if (failedCount > 0 && errorDetails.length > 0) {
      console.log(`Failed deletions (first 5):`)
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
  deleteAug9ToSept16Posts(false)
} else {
  console.log('\n🔍 DRY RUN MODE - No posts will be deleted')
  deleteAug9ToSept16Posts(true)
}
