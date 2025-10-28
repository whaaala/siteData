/**
 * Delete WordPress Posts from April 2024
 * Deletes all posts published on WordPress between April 1-29, 2024
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
async function deleteApril2024Posts(dryRun = true) {
  try {
    console.log('\n📅 Searching for WordPress posts from April 1-29, 2024...\n')

    // Date range for April 1-29, 2024
    const startDate = '2024-04-01T00:00:00'
    const endDate = '2024-04-29T23:59:59'

    // Fetch all posts from April 2024
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
    }

    console.log(`\nTotal posts fetched: ${allPosts.length}\n`)

    if (allPosts.length === 0) {
      console.log('✓ No posts found from April 1-29, 2024')
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

      // Log every 20th post to show progress
      if (i % 20 === 0 || i === allPosts.length - 1) {
        console.log(`${progress} Deleting: ${post.title.rendered.substring(0, 60)}...`)
      }

      const result = await deleteFromWordPress(post.id)
      if (result.success) {
        deletedCount++
        if (i % 20 === 0 && result.alreadyDeleted) {
          console.log(`  - Already deleted (404)`)
        } else if (i % 20 === 0) {
          console.log(`  ✓ Deleted: Post ID ${post.id}`)
        }
      } else {
        failedCount++
        errorDetails.push({ id: post.id, reason: result.reason })
        if (failedCount <= 5) {
          console.log(`  ✗ Failed: ${result.reason}`)
        }
      }

      // Add delay every 20 posts
      if ((i + 1) % 20 === 0) {
        console.log(`  Progress: ${i + 1}/${allPosts.length} posts processed...`)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(80))
    console.log('DELETION SUMMARY - WordPress Posts from April 1-29, 2024')
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
  deleteApril2024Posts(false)
} else {
  console.log('\n🔍 DRY RUN MODE - No posts will be deleted')
  deleteApril2024Posts(true)
}
