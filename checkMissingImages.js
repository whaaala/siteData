/**
 * Check what images were scraped for the yabaleft post
 */

import { Post } from './db.js'

const wpUrl = 'https://nowahalazone.com/businesswoman-shares-alleged-chat-with-nigerian-man-claims-gold-digging-tactics/'

console.log('=== Checking Post for Missing Images ===\n')

async function checkPost() {
  try {
    const post = await Post.findOne({ wpPostUrl: wpUrl }).lean()

    if (!post) {
      console.log('❌ Post not found in database')
      process.exit(0)
    }

    console.log('Title:', post.rewrittenTitle || post.title)
    console.log('Source Website:', post.website)
    console.log('Source URL:', post.url)
    console.log('Featured Image:', post.imageLink)
    console.log()

    console.log('=== RAW CONTENT (first 4000 chars) ===')
    console.log(post.postDetails?.substring(0, 4000) || 'No raw content')
    console.log()

    console.log('=== REWRITTEN CONTENT (first 4000 chars) ===')
    console.log(post.rewrittenDetails?.substring(0, 4000) || 'No rewritten content')

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkPost()
