import { Post } from './db.js'
import {
  postToWordpress,
  wordpressPostExists,
  uploadImageToWordpress,
} from './wordpress.js'
import { getExcerpt, processContentImages } from './utils.js'
import { wpCategoryMap, getRandomAuthorId } from './categoryMap.js'

export async function postToWordpressStage(
  postOrId,
  wordpressUrl,
  username,
  password
) {
  const postId = postOrId?._id ? postOrId._id : postOrId
  const post = await Post.findById(postId)
  if (!post) {
    console.log(`[WordPress Stage] Post not found for ID: ${postId}`)
    return null
  }

  // Ensure post has a featured image URL
  if (!post.imageLink && !post.wpFeaturedMediaId) {
    console.log(
      `[WordPress Stage] Skipping post "${post.rewrittenTitle}" (ID: ${postId}) because it has no featured image.`
    )
    post.processingStage = 'skipped_no_featured_image'
    await post.save()
    return post
  }

  // Upload image to WordPress if not already uploaded
  let featuredMediaId = post.wpFeaturedMediaId || null
  if (!featuredMediaId && post.imageLink) {
    console.log(
      `[WordPress Stage] Uploading featured image for post "${post.rewrittenTitle}"...`
    )
    featuredMediaId = await uploadImageToWordpress(
      post.imageLink,
      wordpressUrl,
      username,
      password
    )
    if (featuredMediaId) {
      post.wpFeaturedMediaId = featuredMediaId
      await post.save()
      console.log(
        `[WordPress Stage] Uploaded image. Media ID: ${featuredMediaId}`
      )
    } else {
      console.log(`[WordPress Stage] Failed to upload image. Skipping post.`)
      post.processingStage = 'skipped_image_upload_failed'
      await post.save()
      return post
    }
  }

  if (
    await wordpressPostExists(
      post.rewrittenTitle,
      post.imageLink,
      wordpressUrl,
      username,
      password
    )
  ) {
    console.log(
      `[WordPress Stage] Post "${post.rewrittenTitle}" already exists on WordPress. Marking as posted.`
    )
    post.processingStage = 'posted'
    await post.save()
    return post
  }

  const category = post.category
  const wpCategoryId = wpCategoryMap[category] ? [wpCategoryMap[category]] : []
  const wpAuthorId = getRandomAuthorId(category)
  const excerpt = getExcerpt(post.rewrittenDetails, 30)

  // Special handling for Ghana sites
  let finalTitle = post.rewrittenTitle
  const website = post.website || ''
  const categoryLower = (category || '').toLowerCase()

  // If the site is a .gh domain and category is not Health or Lifestyle, prefix title with "Ghana - "
  if (
    website.includes('.gh') &&
    !categoryLower.includes('health') &&
    !categoryLower.includes('lifestyle') &&
    !finalTitle.startsWith('Ghana - ')
  ) {
    finalTitle = `Ghana - ${finalTitle}`
  }

  const originalContent = post.processedContent || post.rewrittenDetails
  const processedContent = await processContentImages(
    originalContent,
    wordpressUrl,
    username,
    password
  )

  // Inject custom CSS for .post-content
  const styledContent = `
  <style>
    .post-content {
      padding: 0 !important;
      text-align: justify !important;
    }
  </style>
  ${processedContent}
`

  try {
    const wpResult = await postToWordpress(
      {
        title: finalTitle,
        postDetails: processedContent,
        categories: wpCategoryId,
        excerpt,
        author: wpAuthorId,
        is_featured: false,
        featured_media: featuredMediaId, // <-- Attach the image
      },
      featuredMediaId,
      wordpressUrl,
      username,
      password
    )

    if (wpResult) {
      post.wpPostId = wpResult.id
      post.wpPostUrl = wpResult.link
      post.processingStage = 'posted'
      await post.save()
      console.log(
        `[WordPress Stage] Successfully posted "${post.rewrittenTitle}" (ID: ${postId}) to WordPress: ${wpResult.link}`
      )
    } else {
      console.log(
        `[WordPress Stage] Failed to post "${post.rewrittenTitle}" (ID: ${postId}) to WordPress.`
      )
    }
    return post
  } catch (err) {
    console.error(
      `[WordPress Stage] Error posting "${post.rewrittenTitle}" (ID: ${postId}) to WordPress:`,
      err
    )
    return null
  }
}
