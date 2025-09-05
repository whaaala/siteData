import * as converter from './openai.js'
import { Post } from './db.js'
import { areContentsSimilar } from './wordpress.js'

/**
 * Rewrites a specific post (by post object or ID) and returns the updated post.
 * Only rewrites the given post, not the next eligible in the DB.
 */
export async function rewriteContentStage(postOrId) {
  const postId = postOrId?._id ? postOrId._id : postOrId
  const post = await Post.findById(postId)
  if (!post) return null

  // Check for similar rewrittenTitle and rewrittenDetails in the DB
  const existingPosts = await Post.find({ processingStage: 'rewritten' })
  for (const existing of existingPosts) {
    if (
      existing.rewrittenTitle &&
      areContentsSimilar(post.title, existing.rewrittenTitle)
    ) {
      console.log('A similar rewritten title already exists. Skipping rewrite.')
      post.processingStage = 'skipped_due_to_duplicate'
      await post.save()
      return post
    }
    if (
      existing.rewrittenDetails &&
      areContentsSimilar(post.postDetails, existing.rewrittenDetails)
    ) {
      console.log('A similar rewritten content already exists. Skipping rewrite.')
      post.processingStage = 'skipped_due_to_duplicate'
      await post.save()
      return post
    }
  }

  const rewrittenTitle = await converter.rewriteTitle(post.title)
  const rewrittenDetails = await converter.rewriteContent(post.postDetails)

  post.rewrittenTitle = Array.isArray(rewrittenTitle) ? rewrittenTitle[0] : rewrittenTitle
  post.rewrittenDetails = rewrittenDetails
  post.processingStage = 'rewritten'
  await post.save()
  return post
}