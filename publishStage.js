import { load } from 'cheerio'
import { Post } from './db.js'
import {
  postToWordpress,
  wordpressPostExists,
  uploadImageToWordpress,
  uploadBufferToWordpress,
  isTikTokRestricted,
} from './wordpress.js'
import {
  getExcerpt,
  processContentImages,
  downloadImageAsJpgOrPngForUpload,
  embedSocialLinksInContent,
  embedTikTokLinks,
} from './utils.js'
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

  // Remove width from inline style of all <figure> elements
  let $ = load(contentWithEmbeds)

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
      tiktokPromises.push(
        (async () => {
          // const restricted = await isTikTokRestricted(tiktokUrl)
          // if (restricted) {
          //   $(el).replaceWith(
          //     `<div style="color:red;font-weight:bold;text-align:center;margin:2em 0;">TikTok video unavailable: Profile restricted by creator</div>`
          //   )
          // } else {
          //   $(el).replaceWith(`\n${tiktokUrl}\n`)
          // }
        })()
      )
    }
  })
  await Promise.all(tiktokPromises)

  // 4. Assign back to contentWithEmbeds
  contentWithEmbeds = $.root().html()

  // === REMOVE elements containing "NotJustOk" and <a> with "notjustok" in text or href ===

  // // Remove any element whose text contains "notjustok" (case-insensitive, with or without space)
  // $('p').each((_, el) => {
  //   if ($(el).text().toLowerCase().includes('notjustok')) {
  //     $(el).remove()
  //   }
  // })

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

  // Center all images, make them responsive, and set height to 30rem
  $('img').each((_, el) => {
    let style = $(el).attr('style') || ''
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
    // Always add height: 23rem;
    style = style.trim() + ' height: 23rem;'
    $(el).attr('style', style.trim())

    // Also handle height attribute if present
    if ($(el).attr('height')) {
      $(el).attr('height', 'auto')
    }
  })

  // For all <img> elements with class containing "wp-image"
  $('img').each((_, el) => {
    const classAttr = $(el).attr('class') || ''
    if (classAttr.includes('wp-image')) {
      // Add/replace inline style
      let style = $(el).attr('style') || ''
      // Remove any existing height or margin property
      style = style.replace(/height\s*:\s*[^;]+;?/i, '')
      style = style.replace(/margin\s*:\s*[^;]+;?/i, '')
      // Add the required styles
      style = style.trim() + ' height: auto; margin: 0 auto;'
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
  $('iframe').each((_, el) => {
    const id = ($(el).attr('id') || '').toLowerCase()
    const src = ($(el).attr('src') || '').toLowerCase()
    if (id.includes('twitter') || src.includes('twitter')) {
      let style = $(el).attr('style') || ''
      // Remove any existing height or width
      style = style.replace(/height\s*:\s*[^;]+;?/i, '')
      style = style.replace(/width\s*:\s*[^;]+;?/i, '')
      // Add the required styles with !important
      style = (
        style + ' height: 23.5rem !important; width: 23rem !important;'
      ).trim()
      $(el).attr('style', style)
    }
  })

  contentWithEmbeds = $.root().html()

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
      max-width: 100%;
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
