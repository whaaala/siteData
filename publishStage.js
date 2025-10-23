import { load } from 'cheerio'
import { Post } from './db.js'
import {
  postToWordpress,
  wordpressPostExists,
  uploadImageToWordpress,
  uploadBufferToWordpress,
  isTikTokRestricted,
  rehostAllImagesInContent,
} from './wordpress.js'
import {
  getExcerpt,
  processContentImages,
  downloadImageAsJpgOrPngForUpload,
  embedSocialLinksInContent,
  embedTikTokLinks,
} from './utils.js'
import { wpCategoryMap, getRandomAuthorId } from './categoryMap.js'
import { postPhotoToFacebook } from './facebook.js'
import { postPhotoToInstagram, postStoryToInstagram } from './instagram.js'
import { postToX, formatTweetText } from './x.js'
import {
  isContentSafeForFacebook,
  isContentSafeForInstagram,
  getModerationExplanation,
  shouldSkipFacebookPosting
} from './contentModeration.js'
import { prepareImageForInstagram, uploadInstagramImageToWordPress } from './instagramImageUtils.js'

/**
 * Format Facebook post message: Excerpt → Link → Image (below)
 * @param {string} title - Post title (not used in message)
 * @param {string} excerpt - Post excerpt
 * @param {string} wordpressUrl - WordPress post URL
 * @returns {string} Formatted Facebook message
 */
function formatFacebookPostMessage(title, excerpt, wordpressUrl) {
  let message = ''

  // 1. Add excerpt first (at the top)
  if (excerpt && excerpt.trim()) {
    // Clean excerpt (remove HTML tags if any)
    let cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').trim()

    // Limit excerpt to ~250 characters for optimal readability
    // Keep it concise to avoid "See more" truncation
    if (cleanExcerpt.length > 250) {
      cleanExcerpt = cleanExcerpt.substring(0, 247) + '...'
    }

    message += `${cleanExcerpt}\n\n`
  }

  // 2. Add WordPress link below excerpt
  message += `🔗 ${wordpressUrl}`

  // 4. Image will appear below this caption automatically
  return message
}

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

  // ADD THIS BLOCK to prevent posting if not rewritten
  if (!post.rewrittenDetails || !post.rewrittenDetails.trim()) {
    console.log(
      `[WordPress Stage] Post ID: ${postId} has not been rewritten. Skipping WordPress post.`
    )
    post.processingStage = 'skipped_not_rewritten'
    await post.save()
    return post
  }

  // Upload image to WordPress if not already uploaded
  let featuredMediaId = post.wpFeaturedMediaId || null
  function isWordpressUrl(url) {
    return url && url.includes(process.env.WORDPRESS_URL)
  }
  if (!featuredMediaId && post.imageLink) {
    if (isWordpressUrl(post.imageLink)) {
      // Optionally: fetch media ID from WordPress using the image URL
      // featuredMediaId = await getMediaIdFromUrl(post.imageLink, wordpressUrl, username, password);
      // If you don't need the media ID, just use the URL in your content
      console.log(
        '[WordPress Stage] Image already on WordPress, skipping upload.'
      )
    } else {
      // Not a WordPress image, upload as before
      try {
        const { buffer, filename } = await downloadImageAsJpgOrPngForUpload(
          post.imageLink
        )
        const media = await uploadBufferToWordpress(
          buffer,
          filename,
          wordpressUrl,
          username,
          password
        )
        if (media && media.id) {
          if (typeof media.id === 'number') {
            post.wpFeaturedMediaId = media.id
            console.log(
              'Assigned wpFeaturedMediaId:',
              post.wpFeaturedMediaId,
              typeof post.wpFeaturedMediaId
            )
          } else {
            post.wpFeaturedMediaId = undefined
          }
          await post.save()
          console.log(
            `[WordPress Stage] Uploaded image. Media ID: ${media.id} for post ID: ${postId}`
          )
        } else {
          console.log(
            `[WordPress Stage] Failed to upload image. Skipping post.`
          )
          post.processingStage = 'skipped_image_upload_failed'
          await post.save()
          return post
        }
      } catch (err) {
        console.log(
          `[WordPress Stage] Failed to convert or upload image: ${err.message}`
        )
        post.processingStage = 'skipped_image_upload_failed'
        await post.save()
        return post
      }
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

  // Set the default category ID to "News" if category not found
  const defaultCategoryId = wpCategoryMap.News

  const category = post.category
  const wpCategoryId = wpCategoryMap[category]
    ? [wpCategoryMap[category]]
    : [defaultCategoryId]
  const wpAuthorId = getRandomAuthorId(category)
  const excerpt = getExcerpt(post.rewrittenDetails, 30)

  // Save excerpt to post object for Facebook posting later
  if (!post.excerpt) {
    post.excerpt = excerpt
    await post.save()
  }

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

  const originalContent = post.rewrittenDetails || post.processedContent
  const processedContent = await processContentImages(
    originalContent,
    wordpressUrl,
    username,
    password
  )

  // Embed social links in the processed content
  let contentWithEmbeds = embedSocialLinksInContent(processedContent)

  // Specifically embed TikTok links
  contentWithEmbeds = embedTikTokLinks(contentWithEmbeds)

  // === Rehost all images to WordPress and update their URLs ===
  contentWithEmbeds = await rehostAllImagesInContent(
    contentWithEmbeds,
    wordpressUrl,
    username,
    password
  )

  // Remove width from inline style of all <figure> elements
  let $ = load(contentWithEmbeds)

    const socialSelectors = [
    '.tiktok-embed',
    '.twitter-tweet',
    '.instagram-media',
    '.fb-post',
    '.fb-video',
    '.youtube-player',
    'iframe[src*="tiktok"]',
    'iframe[src*="twitter"]',
    'iframe[src*="instagram"]',
    'iframe[src*="facebook"]',
    'iframe[src*="youtube"]',
  ]

  socialSelectors.forEach((selector) => {
    $(selector).each((_, el) => {
      const parent = $(el).parent()
      if (parent.is('p')) {
        parent.attr('style', 'height: 47rem;')
      }
    })
  })

  // Remove a <strong> element with content if it appears before the first <p>
  const rootChildren = $.root().children().toArray()
  let foundP = false
  for (const el of rootChildren) {
    if (
      el.type === 'tag' &&
      el.name === 'strong' &&
      $(el).text().trim() !== '' &&
      !foundP
    ) {
      $(el).remove()
    }
    if (el.type === 'tag' && el.name === 'p') {
      foundP = true
      break
    }
  }

  // 2. Remove width from inline style of all <figure> elements
  $('figure').each((_, el) => {
    const prevStyle = $(el).attr('style') || ''
    const newStyle = prevStyle.replace(/width\s*:\s*[^;]+;?/gi, '').trim()
    if (newStyle) {
      $(el).attr('style', newStyle)
    } else {
      $(el).removeAttr('style')
    }
  })

  $ = load(contentWithEmbeds)

  const seenTikTokUrls = new Set()
  const tiktokPromises = []
  $('blockquote.tiktok-embed').each((_, el) => {
    const url = $(el).attr('cite') || $(el).data('video-id')
    if (url) {
      let tiktokUrl = url
      if (!/^https?:\/\//.test(tiktokUrl) && $(el).data('video-id')) {
        tiktokUrl = `https://www.tiktok.com/@/video/${$(el).data('video-id')}`
      }
      if (seenTikTokUrls.has(tiktokUrl)) {
        // Remove duplicate embed
        $(el).remove()
        return
      }
      seenTikTokUrls.add(tiktokUrl)
      tiktokPromises.push((async () => {})())
    }
  })
  await Promise.all(tiktokPromises)

  // 4. Assign back to contentWithEmbeds
  contentWithEmbeds = $.root().html()

  // Remove the first element with content if it is an <h2>
  let found = false
  $.root()
    .children()
    .each((_, el) => {
      if (!found && el.type === 'tag') {
        // Skip empty elements (like whitespace)
        if ($(el).is('h2')) {
          $(el).remove()
          found = true
        } else if ($(el).text().trim() !== '') {
          // Stop at the first non-empty, non-h2 element
          found = true
        }
      }
    })

  // Remove any <a> tag whose text or href contains "notjustok" (case-insensitive)
  $('a').each((_, el) => {
    const linkText = $(el).text().toLowerCase()
    const linkHref = ($(el).attr('href') || '').toLowerCase()
    if (linkText.includes('notjustok') || linkHref.includes('notjustok')) {
      $(el).remove()
    }
  })

  contentWithEmbeds = $.root().html()

  // Add inline style margin: 0 auto to all <figcaption> elements within the content
  $ = load(contentWithEmbeds)
  $('figcaption').each((_, el) => {
    // Preserve any existing styles and append margin:0 auto;
    const prevStyle = $(el).attr('style') || ''
    if (!/margin\s*:\s*0\s*auto\s*;?/i.test(prevStyle)) {
      $(el).attr('style', `${prevStyle} margin:0 auto;`.trim())
    }
  })

  // Center all images, make them responsive, and limit height to 25rem if greater
  $('img').each((_, el) => {
    let style = $(el).attr('style') || ''

    // Extract the current height in rem (if any)
    const heightMatch = style.match(/height\s*:\s*([\d.]+)rem\s*;?/i)
    let currentHeight = heightMatch ? parseFloat(heightMatch[1]) : null

    // Remove any existing height property
    style = style.replace(/height\s*:\s*[^;]+;?/i, '')

    // Ensure centering and responsiveness are present
    if (!/display\s*:\s*block/i.test(style)) {
      style = 'display: block; ' + style
    }
    if (!/margin-left\s*:\s*auto/i.test(style)) {
      style = 'margin-left: auto; ' + style
    }
    if (!/margin-right\s*:\s*auto/i.test(style)) {
      style = 'margin-right: auto; ' + style
    }
    if (!/max-width\s*:\s*100%/i.test(style)) {
      style = 'max-width: 100%; ' + style
    }

    // Only set height if currentHeight is greater than 25rem
    if (currentHeight !== null && currentHeight > 30) {
      style = style.trim() + ' max-height: 30rem;'
      $(el).attr('max-height', '30rem')
    } else if (currentHeight !== null) {
      // Keep original height (do not add height)
      style = style.trim()
      if ($(el).attr('max-height')) {
        $(el).attr('max-height', `${currentHeight}rem`)
      }
    }
    // If no height is set, do not add height
    $(el).attr('style', style.trim())
  })

  // For all <img> elements with class containing "wp-image"
  $('img').each((_, el) => {
    const classAttr = $(el).attr('class') || ''
    if (classAttr.includes('wp-image')) {
      let style = $(el).attr('style') || ''
      // Extract the current height in rem (if any)
      const heightMatch = style.match(/height\s*:\s*([\d.]+)rem\s*;?/i)
      let currentHeight = heightMatch ? parseFloat(heightMatch[1]) : null

      // Remove any existing height or margin property
      style = style.replace(/height\s*:\s*[^;]+;?/i, '')
      style = style.replace(/margin\s*:\s*[^;]+;?/i, '')

      // Add the required styles
      style = style.trim() + ' margin: 0 auto;'
      // Only set height if currentHeight is greater than 30rem
      if (currentHeight !== null && currentHeight > 30) {
        style += ' max-height: 30rem;'
        $(el).attr('max-height', '30rem')
      } else if (currentHeight !== null) {
        // Keep original height (do not add height)
        if ($(el).attr('max-height')) {
          $(el).attr('max-height', `${currentHeight}rem`)
        }
      }
      $(el).attr('style', style.trim())

      // Remove width from parent element's style if present
      const parent = $(el).parent()
      if (parent && parent.attr('style')) {
        let parentStyle = parent.attr('style')
        parentStyle = parentStyle.replace(/width\s*:\s*[^;]+;?/gi, '').trim()
        if (parentStyle) {
          parent.attr('style', parentStyle)
        } else {
          parent.removeAttr('style')
        }
      }
    }
  })

  $('img').each((_, el) => {
    const classAttr = $(el).attr('class') || ''
    if (classAttr.includes('article-image')) {
      let style = $(el).attr('style') || ''
      // Remove any existing max-height property
      style = style.replace(/max-height\s*:\s*[^;]+;?/i, '')
      // Add max-height:35rem;
      style = style.trim() + ' max-height:30rem;'
      $(el).attr('style', style.trim())
    }
  })

  $('img').each((_, el) => {
    const classAttr = $(el).attr('class') || ''
    if (classAttr.includes('wp-image')) {
      let style = $(el).attr('style') || ''
      // Remove any existing max-height property
      style = style.replace(/max-height\s*:\s*[^;]+;?/i, '')
      // Add max-height:40rem;
      style = style.trim() + ' max-height:30rem;'
      $(el).attr('style', style.trim())
    }
  })

  // Remove all <amp-video-iframe> elements
  $('amp-video-iframe').remove()

  // Remove all <span> elements that have no content inside
  $('span').each((_, el) => {
    if (!$(el).text().trim() && $(el).children().length === 0) {
      $(el).remove()
    }
  })

  // Remove all <p> elements that have no content inside
  $('p').each((_, el) => {
    if (!$(el).text().trim() && $(el).children().length === 0) {
      $(el).remove()
    }
  })

  // Remove all inline styles from elements with class "fluid-width-video-wrapper"
  $('.fluid-width-video-wrapper').each((_, el) => {
    $(el).removeAttr('style')
    // For any <iframe> inside this wrapper, set width: 50rem; height: 40rem;
    $(el)
      .find('iframe')
      .each((_, iframe) => {
        $(iframe).attr('style', 'width: 55rem; height: 25rem;')
      })
  })

  // For any <iframe> with id or src containing "twitter", set height: 23.5rem; width: 23rem !important;
  // $('iframe').each((_, el) => {
  //   const id = ($(el).attr('id') || '').toLowerCase()
  //   const src = ($(el).attr('src') || '').toLowerCase()
  //   if (id.includes('twitter') || src.includes('twitter')) {
  //     // Remove any existing height or width from the style attribute
  //     let style = $(el).attr('style') || ''
  //     style = style
  //       .replace(/height\s*:\s*[^;]+;?/gi, '')
  //       .replace(/width\s*:\s*[^;]+;?/gi, '')
  //       .trim()
  //     // Add the required styles (without !important, for better browser compatibility)
  //     style = `${style} height: 23.5rem; width: 23rem;`.trim()
  //     $(el).attr('style', style)
  //     // Also set the HTML attributes for fallback
  //     $(el).attr('height', '376') // 23.5rem ≈ 376px
  //     $(el).attr('width', '368') // 23rem ≈ 368px
  //   }
  // })

  // Add inline style "height:30rem; width:50rem;" for any <video> inside a <figure> with class containing "wp-block-video"
  $('figure.wp-block-video video, figure[class*="wp-block-video"] video').each(
    (_, el) => {
      $(el).attr('style', 'height:30rem; width:50rem;')
    }
  )

  // Also add this style for any <video> element in the content
  $('video').each((_, el) => {
    $(el).attr('style', 'max-height:36rem; min-height:30rem; width:50rem;')
  })

  contentWithEmbeds = $.root().html()

  // Remove text-align: justify from all heading elements
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    let style = $(el).attr('style') || ''
    // Remove any text-align: justify from the style attribute
    style = style.replace(/text-align\s*:\s*justify\s*;?/gi, '')
    if (style.trim()) {
      $(el).attr('style', style.trim())
    } else {
      $(el).removeAttr('style')
    }
  })

  // Inject custom CSS for .post-content and embedded social media
  const styledContent = `
  <style>
    .post-content {
      padding: 0 !important;
      text-align: justify !important;
    }
    /* Center all common embedded social media */
    iframe,
    .twitter-tweet,
    .instagram-media,
    .fb-post,
    .fb-video,
    .tiktok-embed,
    .youtube-player {
      display: block !important;
      margin: 0 auto !important;
      // max-width: 100%;
    }
  </style>
  ${contentWithEmbeds}
`
  const instagramScript = `<script async src="https://www.instagram.com/embed.js"></script>`

  const finalContent = styledContent + instagramScript
  try {
    if (typeof post.wpFeaturedMediaId !== 'number') {
      console.log(
        `[WordPress Stage] No valid featured image for post ID: ${postId}. Skipping WordPress post.`
      )
      post.processingStage = 'skipped_no_featured_image'
      await post.save()
      return post
    }
    // Log the content before saving
    // console.log('[DEBUG] Full content to be saved:', finalContent);

    const wpResult = await postToWordpress(
      {
        title: finalTitle,
        postDetails: finalContent,
        categories: wpCategoryId,
        excerpt,
        author: wpAuthorId,
        is_featured: false,
      },
      post.wpFeaturedMediaId,
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

      // Post to Facebook after successful WordPress publish
      try {
        // First, check if content is safe for Facebook
        console.log('[Facebook Stage] Checking content safety for Facebook...')

        // Quick pre-check: Skip certain patterns automatically
        if (shouldSkipFacebookPosting(post)) {
          post.fbModerationStatus = 'skipped_pattern_match'
          post.fbModerationReason = 'Post URL or source matches skip pattern'
          await post.save()
          console.log(
            `[Facebook Stage] ⏭️ Skipping Facebook post - matched skip pattern`
          )
        } else {
          // Perform AI moderation check (includes image analysis)
          const moderationResult = await isContentSafeForFacebook(post)
          const explanation = getModerationExplanation(moderationResult)

          // Save moderation result to database
          post.fbModerationStatus = moderationResult.isSafe ? 'approved' : 'blocked'
          post.fbModerationReason = explanation
          post.fbModerationFlags = moderationResult.moderationFlags
          post.fbImageAnalysis = moderationResult.imageAnalysis || null

          if (moderationResult.isSafe) {
            // Content is safe, proceed with posting
            // Format Facebook post with title, excerpt, and WordPress URL
            const fbMessage = formatFacebookPostMessage(
              post.rewrittenTitle,
              post.excerpt,
              wpResult.link
            )

            const fbResult = await postPhotoToFacebook({
              imageUrl: post.imageLink,
              message: fbMessage,
              link: wpResult.link,
            })

            if (fbResult && fbResult.success) {
              post.fbPostId = fbResult.postId
              post.fbModerationStatus = 'posted'
              await post.save()
              console.log(
                `[Facebook Stage] ✅ Successfully posted to Facebook. Post ID: ${fbResult.postId}`
              )
            } else {
              post.fbModerationStatus = 'failed_to_post'
              await post.save()
              console.log(
                `[Facebook Stage] ❌ Failed to post "${post.rewrittenTitle}" to Facebook (non-critical, continuing...)`
              )
            }
          } else {
            // Content blocked by moderation
            await post.save()
            console.log(
              `[Facebook Stage] 🚫 Post blocked from Facebook: ${explanation}`
            )
          }
        }
      } catch (fbError) {
        console.error(
          `[Facebook Stage] Error in Facebook posting flow (non-critical):`,
          fbError.message
        )
        // Save error to database
        post.fbModerationStatus = 'error'
        post.fbModerationReason = fbError.message
        await post.save()
        // Don't fail the entire process if Facebook posting fails
      }

      // Declare instagramImageUrl at higher scope for use by Instagram and X posting
      let instagramImageUrl = post.imageLink

      // Post to Instagram after Facebook
      try {
        console.log('[Instagram Stage] Checking content safety for Instagram...')

        // Perform AI moderation check for Instagram (stricter than Facebook)
        const igModerationResult = await isContentSafeForInstagram(post)
        const igExplanation = getModerationExplanation(igModerationResult)

        // Save Instagram moderation result to database
        post.igModerationStatus = igModerationResult.isSafe ? 'approved' : 'blocked'
        post.igModerationReason = igExplanation
        post.igModerationFlags = igModerationResult.moderationFlags
        post.igImageAnalysis = igModerationResult.imageAnalysis || null

        if (igModerationResult.isSafe) {
          // Content is safe for Instagram, proceed with posting
          // Format Instagram caption: Title + Excerpt + Full URL
          // Note: Links in feed captions aren't clickable, but we show the URL
          // The clickable link will be in the Story post
          let igCaption = ''
          if (post.rewrittenTitle) {
            igCaption += `${post.rewrittenTitle}\n\n`
          }
          if (post.excerpt) {
            const cleanExcerpt = post.excerpt.replace(/<[^>]*>/g, '').trim()
            const excerptLimit = 2100 - igCaption.length - wpResult.link.length - 50 // Leave room for URL
            if (cleanExcerpt.length > excerptLimit) {
              igCaption += cleanExcerpt.substring(0, excerptLimit - 3) + '...\n\n'
            } else {
              igCaption += `${cleanExcerpt}\n\n`
            }
          }
          igCaption += `🔗 ${wpResult.link}`

          // Prepare image for Instagram (validate aspect ratio and resize if needed)
          console.log('[Instagram Stage] Preparing image for Instagram...')
          instagramImageUrl = post.imageLink

          try {
            const preparedImage = await prepareImageForInstagram(post.imageLink)

            if (preparedImage.wasResized) {
              console.log(
                `[Instagram Stage] Image resized for Instagram compatibility ` +
                `(${preparedImage.width}x${preparedImage.height}, ratio: ${preparedImage.aspectRatio.toFixed(2)})`
              )

              // Upload the Instagram-optimized image to WordPress
              const originalFilename = post.imageLink.split('/').pop().split('?')[0]
              instagramImageUrl = await uploadInstagramImageToWordPress(
                preparedImage.buffer,
                originalFilename,
                wordpressUrl,
                username,
                password
              )

              console.log(`[Instagram Stage] Instagram-optimized image URL: ${instagramImageUrl}`)
            } else {
              console.log(
                `[Instagram Stage] ✅ Image already Instagram-compatible ` +
                `(${preparedImage.width}x${preparedImage.height}, ratio: ${preparedImage.aspectRatio.toFixed(2)})`
              )
            }
          } catch (imageError) {
            console.warn(
              `[Instagram Stage] Image preparation warning: ${imageError.message}. ` +
              `Attempting to post with original image...`
            )
            // Continue with original image if preparation fails
          }

          const igResult = await postPhotoToInstagram({
            imageUrl: instagramImageUrl,
            caption: igCaption,
          })

          if (igResult && igResult.success) {
            post.igPostId = igResult.postId
            post.igModerationStatus = 'posted'
            await post.save()
            console.log(
              `[Instagram Stage] ✅ Successfully posted to Instagram Feed. Post ID: ${igResult.postId}`
            )

            // Post to Instagram Story with clickable link (use Instagram-optimized image)
            console.log(`[Instagram Story] Posting to Stories with clickable link...`)
            try {
              const storyResult = await postStoryToInstagram({
                imageUrl: instagramImageUrl,
                link: wpResult.link, // This will be a clickable link in the story!
              })

              if (storyResult && storyResult.success) {
                post.igStoryId = storyResult.storyId
                await post.save()
                console.log(
                  `[Instagram Story] ✅ Successfully posted to Instagram Story. Story ID: ${storyResult.storyId}`
                )
                console.log(`[Instagram Story] 🔗 Story has clickable link to: ${wpResult.link}`)
              } else {
                console.log(
                  `[Instagram Story] ⚠️ Failed to post story (feed post succeeded, continuing...)`
                )
              }
            } catch (storyError) {
              console.error(
                `[Instagram Story] Error posting story (non-critical):`,
                storyError.message
              )
            }
          } else {
            post.igModerationStatus = 'failed_to_post'
            await post.save()
            console.log(
              `[Instagram Stage] ❌ Failed to post "${post.rewrittenTitle}" to Instagram (non-critical, continuing...)`
            )
          }
        } else {
          // Content blocked by Instagram moderation
          await post.save()
          console.log(
            `[Instagram Stage] 🚫 Post blocked from Instagram: ${igExplanation}`
          )
        }
      } catch (igError) {
        console.error(
          `[Instagram Stage] Error in Instagram posting flow (non-critical):`,
          igError.message
        )
        // Save error to database
        post.igModerationStatus = 'error'
        post.igModerationReason = igError.message
        await post.save()
        // Don't fail the entire process if Instagram posting fails
      }

      // ========== POST TO X (TWITTER) ==========
      // Post to X after Instagram (non-critical - continues even if it fails)
      try {
        console.log('[X Stage] Posting to X (Twitter)...')

        // Format tweet text (title + link, max 280 characters)
        const tweetText = formatTweetText(
          post.rewrittenTitle,
          post.excerpt,
          wpResult.link
        )

        // Use the Instagram-optimized image if available, otherwise use original
        const xImageUrl = instagramImageUrl || post.imageLink

        const xResult = await postToX({
          imageUrl: xImageUrl,
          text: tweetText,
          link: wpResult.link,
        })

        if (xResult && xResult.success) {
          post.xTweetId = xResult.tweetId
          post.xTweetUrl = `https://x.com/i/web/status/${xResult.tweetId}`
          post.xPostStatus = 'posted'
          post.xPostDate = new Date()
          await post.save()

          console.log(
            `[X Stage] ✅ Successfully posted to X. Tweet ID: ${xResult.tweetId}`
          )
          console.log(`[X Stage] 🔗 Tweet URL: ${post.xTweetUrl}`)
        } else {
          post.xPostStatus = 'failed_to_post'
          await post.save()
          console.log(
            `[X Stage] ❌ Failed to post "${post.rewrittenTitle}" to X (non-critical, continuing...)`
          )
        }
      } catch (xError) {
        console.error(
          `[X Stage] Error in X posting flow (non-critical):`,
          xError.message
        )
        // Save error to database
        post.xPostStatus = 'error'
        await post.save()
        // Don't fail the entire process if X posting fails
      }
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
