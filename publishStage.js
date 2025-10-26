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
  cleanAllLinksInContent,
} from './utils.js'
import { wpCategoryMap, getRandomAuthorId } from './categoryMap.js'
import { postPhotoToFacebook } from './facebook.js'
import { getFacebookPagesForCategory } from './facebookPageRouter.js'
import { postPhotoToInstagram, postStoryToInstagram } from './instagram.js'
import { postToX, formatTweetText } from './x.js'
import {
  isContentSafeForFacebook,
  isContentSafeForInstagram,
  getModerationExplanation,
  shouldSkipFacebookPosting
} from './contentModeration.js'
import { prepareImageForInstagram, uploadInstagramImageToWordPress } from './instagramImageUtils.js'
import {
  isInstagramPostingAllowed,
  markInstagramRateLimited,
  isRateLimitError
} from './instagramRateLimitTracker.js'
import {
  isXPostingAllowed,
  markXRateLimited,
  isXRateLimitError
} from './xRateLimitTracker.js'
import {
  formatEngagingFacebookPost,
  formatEngagingInstagramPost,
  formatEngagingTwitterPost,
} from './socialMediaCaptionGenerator.js'

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

  // === CLEAN ALL INVALID AND SOURCE SITE LINKS ===
  // Remove links to source site, broken links, and invalid references
  console.log('[WordPress Stage] Cleaning invalid and source site links...')
  contentWithEmbeds = cleanAllLinksInContent(contentWithEmbeds, post.url)
  console.log('[WordPress Stage] Link cleaning complete')

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

  // Deduplicate TikTok embeds by video ID
  const seenTikTokVideoIds = new Set()
  const tiktokPromises = []
  $('blockquote.tiktok-embed').each((_, el) => {
    const cite = $(el).attr('cite')
    const dataVideoId = $(el).attr('data-video-id')

    // Extract video ID from cite URL or use data-video-id
    let videoId = dataVideoId
    if (cite) {
      const match = cite.match(/\/video\/(\d+)/)
      if (match) {
        videoId = match[1]
      }
    }

    if (videoId) {
      if (seenTikTokVideoIds.has(videoId)) {
        // Remove duplicate embed - same video ID already embedded
        console.log(`[TikTok Dedup] Removing duplicate TikTok video: ${videoId}`)
        $(el).remove()
        return
      }
      seenTikTokVideoIds.add(videoId)
      tiktokPromises.push((async () => {})())
    }
  })
  await Promise.all(tiktokPromises)

  // Deduplicate Instagram embeds by post ID
  const seenInstagramPostIds = new Set()
  $('blockquote.instagram-media').each((_, el) => {
    const permalink = $(el).attr('data-instgrm-permalink')

    // Extract post ID from permalink URL (format: /p/ABC123/)
    let postId = null
    if (permalink) {
      const match = permalink.match(/\/p\/([A-Za-z0-9_-]+)/)
      if (match) {
        postId = match[1]
      }
    }

    if (postId) {
      if (seenInstagramPostIds.has(postId)) {
        console.log(`[Instagram Dedup] Removing duplicate Instagram post: ${postId}`)
        $(el).remove()
        return
      }
      seenInstagramPostIds.add(postId)
    }
  })

  // Deduplicate YouTube embeds by video ID
  const seenYouTubeVideoIds = new Set()
  $('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').each((_, el) => {
    const src = $(el).attr('src')

    // Extract video ID from src URL (format: /embed/ABC123 or /watch?v=ABC123)
    let videoId = null
    if (src) {
      const embedMatch = src.match(/\/embed\/([A-Za-z0-9_-]+)/)
      const watchMatch = src.match(/[?&]v=([A-Za-z0-9_-]+)/)
      if (embedMatch) {
        videoId = embedMatch[1]
      } else if (watchMatch) {
        videoId = watchMatch[1]
      }
    }

    if (videoId) {
      if (seenYouTubeVideoIds.has(videoId)) {
        console.log(`[YouTube Dedup] Removing duplicate YouTube video: ${videoId}`)
        $(el).remove()
        return
      }
      seenYouTubeVideoIds.add(videoId)
    }
  })

  // Deduplicate Twitter/X embeds by status ID
  const seenTwitterStatusIds = new Set()
  $('blockquote.twitter-tweet').each((_, el) => {
    const link = $(el).find('a').attr('href')

    // Extract status ID from link URL (format: /status/123456789)
    let statusId = null
    if (link) {
      const match = link.match(/\/status\/(\d+)/)
      if (match) {
        statusId = match[1]
      }
    }

    if (statusId) {
      if (seenTwitterStatusIds.has(statusId)) {
        console.log(`[Twitter Dedup] Removing duplicate Twitter status: ${statusId}`)
        $(el).remove()
        return
      }
      seenTwitterStatusIds.add(statusId)
    }
  })

  // Deduplicate Facebook embeds by post ID
  const seenFacebookPostIds = new Set()
  $('.fb-post, .fb-video').each((_, el) => {
    const dataHref = $(el).attr('data-href')

    // Extract post/video ID from data-href (format: /posts/123456/ or /videos/123456/)
    let postId = null
    if (dataHref) {
      const postsMatch = dataHref.match(/\/posts\/(\d+)/)
      const videosMatch = dataHref.match(/\/videos\/(\d+)/)
      if (postsMatch) {
        postId = postsMatch[1]
      } else if (videosMatch) {
        postId = videosMatch[1]
      }
    }

    if (postId) {
      if (seenFacebookPostIds.has(postId)) {
        console.log(`[Facebook Dedup] Removing duplicate Facebook post: ${postId}`)
        $(el).remove()
        return
      }
      seenFacebookPostIds.add(postId)
    }
  })

  // Deduplicate Spotify embeds by content ID
  const seenSpotifyContentIds = new Set()
  $('iframe[src*="spotify.com"]').each((_, el) => {
    const src = $(el).attr('src')

    // Extract content ID from src (format: /embed/track/ABC123 or /embed/album/ABC123, etc.)
    let contentId = null
    if (src) {
      const match = src.match(/\/embed\/(?:track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/)
      if (match) {
        contentId = match[1]
      }
    }

    if (contentId) {
      if (seenSpotifyContentIds.has(contentId)) {
        console.log(`[Spotify Dedup] Removing duplicate Spotify content: ${contentId}`)
        $(el).remove()
        return
      }
      seenSpotifyContentIds.add(contentId)
    }
  })

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

  // For any <iframe> with id or src containing "twitter" or "x.com", set proper video dimensions
  $('iframe').each((_, el) => {
    const id = ($(el).attr('id') || '').toLowerCase()
    const src = ($(el).attr('src') || '').toLowerCase()
    if (id.includes('twitter') || src.includes('twitter') || src.includes('x.com/')) {
      // Remove any existing height or width from the style attribute
      let style = $(el).attr('style') || ''
      style = style
        .replace(/height\s*:\s*[^;]+;?/gi, '')
        .replace(/width\s*:\s*[^;]+;?/gi, '')
        .trim()
      // Add better dimensions for Twitter/X video embeds
      // Twitter's default embed width is ~550px, use 35rem width and 45rem height for better video display
      style = `${style} width: 35rem; height: 45rem;`.trim()
      $(el).attr('style', style)
      // Also set the HTML attributes for fallback
      $(el).attr('height', '720') // 45rem ≈ 720px
      $(el).attr('width', '560') // 35rem ≈ 560px
    }
  })

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
    /* Main content container with proper margins and padding */
    .post-content, .entry-content, article .content, .article-content {
      max-width: 100% !important; /* Full width, theme handles container */
      padding: 0 !important; /* No padding - let theme handle spacing */
      margin-top: 0 !important; /* No top margin - consistent spacing after featured image */
      text-align: justify !important;
      text-justify: inter-word !important; /* Better justification */
      font-size: 1.125rem !important; /* 18px - comfortable reading size */
      line-height: 1.7 !important; /* Spacious line height for readability */
      color: #333 !important; /* Slightly softer than pure black */
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" !important; /* Modern system font stack */
      -webkit-font-smoothing: antialiased !important; /* Smooth font rendering on macOS */
      -moz-osx-font-smoothing: grayscale !important; /* Smooth font rendering on Firefox macOS */
      box-sizing: border-box !important; /* Include padding in width calculations */
    }

    /* Remove top margin from first element to ensure consistent spacing after featured image across all posts */
    .post-content > *:first-child,
    .entry-content > *:first-child,
    article .content > *:first-child,
    .article-content > *:first-child {
      margin-top: 0 !important;
      padding-top: 0 !important; /* Also remove any top padding */
    }

    /* Paragraph styling for better readability */
    .post-content p, .entry-content p, article .content p, .article-content p {
      margin-bottom: 1.5rem !important;
      margin-top: 0 !important;
      font-size: 1.125rem !important;
      line-height: 1.7 !important;
      text-align: justify !important;
      text-justify: inter-word !important;
      font-family: inherit !important;
    }

    /* Heading sizes and spacing for hierarchy */
    .post-content h1, .post-content h2, .post-content h3, .post-content h4, .post-content h5, .post-content h6,
    .entry-content h1, .entry-content h2, .entry-content h3, .entry-content h4, .entry-content h5, .entry-content h6,
    article .content h1, article .content h2, article .content h3, article .content h4, article .content h5, article .content h6,
    .article-content h1, .article-content h2, .article-content h3, .article-content h4, .article-content h5, .article-content h6 {
      line-height: 1.3 !important;
      margin-top: 2rem !important;
      margin-bottom: 1rem !important;
      text-align: left !important;  /* Headings left-aligned, not justified */
      font-weight: 700 !important;
      color: #222 !important;
      font-family: inherit !important;
    }

    .post-content h1, .entry-content h1, article .content h1, .article-content h1 {
      font-size: 2rem !important; /* 32px */
      margin-top: 2.5rem !important;
    }

    .post-content h2, .entry-content h2, article .content h2, .article-content h2 {
      font-size: 1.75rem !important; /* 28px */
    }

    .post-content h3, .entry-content h3, article .content h3, .article-content h3 {
      font-size: 1.5rem !important; /* 24px */
    }

    .post-content h4, .entry-content h4, article .content h4, .article-content h4 {
      font-size: 1.25rem !important; /* 20px */
    }

    /* Bullet points and lists - proper indentation and spacing */
    .post-content ul, .post-content ol,
    .entry-content ul, .entry-content ol,
    article .content ul, article .content ol,
    .article-content ul, .article-content ol {
      margin: 1.5rem 0 1.5rem 2rem !important; /* Left margin for proper indentation */
      padding: 0 !important;
      text-align: left !important; /* Lists should be left-aligned, not justified */
      font-family: inherit !important; /* Inherit from parent */
    }

    .post-content ul li, .post-content ol li,
    .entry-content ul li, .entry-content ol li,
    article .content ul li, article .content ol li,
    .article-content ul li, .article-content ol li {
      margin-bottom: 0.75rem !important;
      line-height: 1.7 !important;
      padding-left: 0.5rem !important; /* Extra space after bullet */
      text-align: left !important;
      font-family: inherit !important; /* Inherit from parent */
    }

    .post-content ul, .entry-content ul, article .content ul, .article-content ul {
      list-style-type: disc !important; /* Proper bullet points */
      list-style-position: outside !important; /* Bullets hang outside */
    }

    .post-content ol, .entry-content ol, article .content ol, .article-content ol {
      list-style-type: decimal !important; /* Numbered lists */
      list-style-position: outside !important;
    }

    /* Nested lists */
    .post-content ul ul, .post-content ol ul,
    .entry-content ul ul, .entry-content ol ul,
    article .content ul ul, article .content ol ul,
    .article-content ul ul, .article-content ol ul {
      margin-top: 0.5rem !important;
      margin-bottom: 0.5rem !important;
      margin-left: 1.5rem !important;
    }

    .post-content ul ul, .entry-content ul ul, article .content ul ul, .article-content ul ul {
      list-style-type: circle !important; /* Hollow circles for nested */
    }

    .post-content ul ul ul, .entry-content ul ul ul, article .content ul ul ul, .article-content ul ul ul {
      list-style-type: square !important; /* Squares for deeply nested */
    }

    /* Blockquotes - proper styling and indentation */
    .post-content blockquote,
    .entry-content blockquote,
    article .content blockquote,
    .article-content blockquote {
      margin: 1.5rem 0 1.5rem 2rem !important;
      padding: 1rem 1.5rem !important;
      border-left: 4px solid #ddd !important;
      background: #f9f9f9 !important;
      font-style: italic !important;
      color: #555 !important;
      font-family: inherit !important; /* Inherit from parent */
    }

    /* Links - proper styling */
    .post-content a,
    .entry-content a,
    article .content a,
    .article-content a {
      color: #0066cc !important;
      text-decoration: underline !important;
      word-wrap: break-word !important; /* Prevent long URLs from breaking layout */
    }

    .post-content a:hover,
    .entry-content a:hover,
    article .content a:hover,
    .article-content a:hover {
      color: #0052a3 !important;
    }

    /* Images - proper spacing */
    .post-content img,
    .entry-content img,
    article .content img,
    .article-content img {
      margin: 1.5rem auto !important;
      max-width: 100% !important;
      height: auto !important;
    }

    /* Tables - proper styling if present */
    .post-content table,
    .entry-content table,
    article .content table,
    .article-content table {
      width: 100% !important;
      margin: 1.5rem 0 !important;
      border-collapse: collapse !important;
    }

    .post-content table td, .post-content table th,
    .entry-content table td, .entry-content table th,
    article .content table td, article .content table th,
    .article-content table td, .article-content table th {
      padding: 0.75rem !important;
      border: 1px solid #ddd !important;
      text-align: left !important;
    }

    .post-content table th,
    .entry-content table th,
    article .content table th,
    .article-content table th {
      background: #f5f5f5 !important;
      font-weight: 700 !important;
    }

    /* Responsive design for tablets */
    @media (max-width: 1024px) {
      .post-content, .entry-content, article .content, .article-content {
        max-width: 100% !important;
      }
    }

    /* Responsive design for mobile */
    @media (max-width: 768px) {
      .post-content, .entry-content, article .content, .article-content {
        max-width: 100% !important;
        font-size: 1.0625rem !important; /* 17px on mobile */
        line-height: 1.65 !important;
      }

      .post-content p, .entry-content p, article .content p, .article-content p {
        font-size: 1.0625rem !important;
        margin-bottom: 1.25rem !important;
      }

      .post-content h1, .entry-content h1, article .content h1, .article-content h1 {
        font-size: 1.625rem !important; /* 26px */
        margin-top: 2rem !important;
      }

      .post-content h2, .entry-content h2, article .content h2, .article-content h2 {
        font-size: 1.5rem !important; /* 24px */
        margin-top: 1.75rem !important;
      }

      .post-content h3, .entry-content h3, article .content h3, .article-content h3 {
        font-size: 1.25rem !important; /* 20px */
        margin-top: 1.5rem !important;
      }

      .post-content h4, .entry-content h4, article .content h4, .article-content h4 {
        font-size: 1.125rem !important; /* 18px */
      }

      /* Adjust list indentation for mobile */
      .post-content ul, .post-content ol,
      .entry-content ul, .entry-content ol,
      article .content ul, article .content ol,
      .article-content ul, .article-content ol {
        margin-left: 1.25rem !important;
      }

      /* Adjust blockquote margins for mobile */
      .post-content blockquote,
      .entry-content blockquote,
      article .content blockquote,
      .article-content blockquote {
        margin-left: 1rem !important;
        padding: 0.75rem 1rem !important;
      }
    }

    /* Extra small mobile devices */
    @media (max-width: 480px) {
      .post-content ul, .post-content ol,
      .entry-content ul, .entry-content ol,
      article .content ul, article .content ol,
      .article-content ul, .article-content ol {
        margin-left: 1rem !important;
      }
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
      margin: 1.5rem auto !important;
      max-width: 100% !important;
    }

    /* Specific iframe sizing for better display */
    iframe {
      width: 100% !important;
      min-height: 400px !important;
      border: none !important;
    }

    /* YouTube and video iframes */
    iframe[src*="youtube.com"],
    iframe[src*="youtu.be"] {
      width: 100% !important;
      max-width: 800px !important;  /* Prevent too wide on large screens */
      aspect-ratio: 16 / 9 !important;  /* Maintain proper video proportions */
      min-height: 315px !important;
      height: auto !important;
      margin-left: auto !important;  /* Center horizontally */
      margin-right: auto !important;
      border: none !important;
      border-radius: 8px !important;  /* Rounded corners for modern look */
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;  /* Subtle shadow */
    }

    /* Twitter embeds (blockquote and iframe) */
    .twitter-tweet {
      max-width: 550px !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    iframe[src*="twitter.com"],
    iframe[src*="x.com"] {
      max-width: 550px !important;
      min-height: 200px !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    /* Instagram embeds (blockquote and iframe) */
    .instagram-media {
      max-width: 540px !important;
      min-width: 326px !important;
      width: calc(100% - 2px) !important;
      background: #FFF !important;
      border: 0 !important;
      border-radius: 3px !important;
      box-shadow: 0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15) !important;
      padding: 0 !important;
    }

    iframe[src*="instagram.com"] {
      max-width: 540px !important;
      min-height: 600px !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    /* TikTok embeds (blockquote and iframe) */
    .tiktok-embed {
      max-width: 605px !important;
      min-width: 325px !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    iframe[src*="tiktok.com"] {
      max-width: 605px !important;
      min-height: 700px !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    /* Facebook embeds (div and iframe) */
    .fb-post,
    .fb-video {
      max-width: 560px !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    iframe[src*="facebook.com"],
    iframe[src*="fb.com"] {
      max-width: 560px !important;
      min-height: 400px !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    /* Spotify iframes */
    iframe[src*="spotify.com"] {
      width: 100% !important;
      max-width: 100% !important;
      height: 352px !important;
      min-height: 352px !important;
      border-radius: 12px !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    /* Responsive iframe sizing for tablets and mobile */
    @media (max-width: 1024px) {
      iframe[src*="youtube.com"],
      iframe[src*="youtu.be"] {
        max-width: 100% !important;
        min-height: 280px !important;
        border-radius: 6px !important;
      }
    }

    @media (max-width: 768px) {
      iframe {
        min-height: 300px !important;
      }

      iframe[src*="youtube.com"],
      iframe[src*="youtu.be"] {
        min-height: 200px !important;
        border-radius: 4px !important;
        box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important;  /* Lighter shadow on mobile */
      }

      iframe[src*="tiktok.com"] {
        min-height: 500px !important;
      }

      iframe[src*="instagram.com"] {
        min-height: 400px !important;
      }

      iframe[src*="spotify.com"] {
        height: 352px !important;
        min-height: 352px !important;
      }
    }

    /* Extra small mobile devices */
    @media (max-width: 480px) {
      iframe[src*="youtube.com"],
      iframe[src*="youtu.be"] {
        min-height: 180px !important;
        margin-bottom: 1rem !important;
      }
    }

    /* Figcaption styling - centered and responsive */
    figcaption {
      display: block !important;
      text-align: center !important;
      margin: 0.5rem auto 1rem auto !important;
      padding: 0.5rem 1rem !important;
      max-width: 100% !important;
      font-size: 0.9rem !important;
      font-style: italic !important;
      color: #666 !important;
      line-height: 1.4 !important;
    }

    /* Responsive figcaptions for mobile */
    @media (max-width: 768px) {
      figcaption {
        font-size: 0.85rem !important;
        padding: 0.4rem 0.5rem !important;
      }
    }

    /* Figure container styling */
    figure {
      margin: 1.5rem auto !important;
      text-align: center !important;
      max-width: 100% !important;
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
            // Generate engaging AI-powered Facebook caption
            console.log('[Facebook Stage] Generating engaging caption...')
            const fbMessage = await formatEngagingFacebookPost(
              post.rewrittenTitle,
              post.excerpt,
              post.category,
              wpResult.link
            )
            console.log('[Facebook Stage] Engaging caption generated ✓')

            // Get Facebook pages to post to based on category
            const facebookPages = getFacebookPagesForCategory(post.category)
            console.log(`[Facebook Stage] Category "${post.category}" → Posting to ${facebookPages.length} page(s)`)

            // Post to each configured page
            const fbResults = []
            let allPostsSuccessful = true

            for (const page of facebookPages) {
              console.log(`[Facebook Stage] Posting to ${page.name}...`)

              const fbResult = await postPhotoToFacebook({
                imageUrl: post.imageLink,
                message: fbMessage,
                link: wpResult.link,
                pageId: page.pageId,
                accessToken: page.accessToken,
                pageName: page.name,
              })

              if (fbResult && fbResult.success) {
                fbResults.push({
                  pageName: page.name,
                  pageId: page.pageId,
                  postId: fbResult.postId,
                })
                console.log(
                  `[Facebook Stage] ✅ Successfully posted to ${page.name}. Post ID: ${fbResult.postId}`
                )
              } else {
                allPostsSuccessful = false
                console.log(
                  `[Facebook Stage] ❌ Failed to post to ${page.name} (non-critical, continuing...)`
                )
              }
            }

            // Store results in database
            if (fbResults.length > 0) {
              // Store as JSON array with all successful posts
              post.fbPostId = JSON.stringify(fbResults)
              post.fbModerationStatus = allPostsSuccessful ? 'posted' : 'partially_posted'
              await post.save()
              console.log(
                `[Facebook Stage] ✅ Posted to ${fbResults.length}/${facebookPages.length} Facebook page(s)`
              )
            } else {
              post.fbModerationStatus = 'failed_to_post'
              await post.save()
              console.log(
                `[Facebook Stage] ❌ Failed to post "${post.rewrittenTitle}" to any Facebook page (non-critical, continuing...)`
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
        // ========== CATEGORY FILTER FOR INSTAGRAM ==========
        // Only post Entertainment and Gists to Instagram
        const instagramAllowedCategories = ['Entertainment', 'Gists']

        if (!instagramAllowedCategories.includes(post.category)) {
          console.log(`[Instagram Stage] ⏭️ Skipping Instagram - Category "${post.category}" not in allowed list`)
          console.log(`[Instagram Stage] Allowed categories: ${instagramAllowedCategories.join(', ')}`)
          post.igModerationStatus = 'skipped_pattern_match'
          post.igModerationReason = `Category "${post.category}" not allowed for Instagram`
          await post.save()
          // Skip Instagram posting but continue with rest of flow
        } else if (!isInstagramPostingAllowed().allowed) {
          // Check if Instagram posting is rate limited
          const rateLimitCheck = isInstagramPostingAllowed()
          console.log(`[Instagram Stage] ⏸️ Instagram posting temporarily disabled (rate limited)`)
          console.log(`[Instagram Stage] Reason: ${rateLimitCheck.reason}`)
          console.log(`[Instagram Stage] Cooldown remaining: ${rateLimitCheck.cooldownRemaining} minutes`)
          post.igModerationStatus = 'error'
          post.igModerationReason = `Rate limited: ${rateLimitCheck.reason}`
          await post.save()
          // Skip Instagram posting but continue with rest of flow
        } else {
          console.log('[Instagram Stage] Checking content safety for Instagram...')
          console.log(`[Instagram Stage] ✅ Category "${post.category}" is allowed`)

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
          // Generate engaging AI-powered Instagram caption
          console.log('[Instagram Stage] Generating engaging caption...')
          let igCaption = await formatEngagingInstagramPost(
            post.rewrittenTitle,
            post.excerpt,
            post.category
          )
          // Add link at the end (not clickable in feed, but users can copy it)
          igCaption += `\n\n🔗 ${wpResult.link}`
          console.log('[Instagram Stage] Engaging caption generated ✓')

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
        }
      } catch (igError) {
        console.error(
          `[Instagram Stage] Error in Instagram posting flow (non-critical):`,
          igError.message
        )

        // Check if this is a rate limit error
        if (isRateLimitError(igError)) {
          console.log('[Instagram Stage] 🚫 Rate limit error detected. Marking Instagram as rate limited...')
          markInstagramRateLimited(igError, 2) // 2 hour cooldown
        }

        // Save error to database
        post.igModerationStatus = 'error'
        post.igModerationReason = igError.message
        await post.save()
        // Don't fail the entire process if Instagram posting fails
      }

      // ========== POST TO X (TWITTER) ==========
      // Post to X after Instagram (non-critical - continues even if it fails)
      try {
        // ========== CATEGORY FILTER FOR X ==========
        // Only post Entertainment and Gists to X
        const xAllowedCategories = ['Entertainment', 'Gists']

        if (!xAllowedCategories.includes(post.category)) {
          console.log(`[X Stage] ⏭️ Skipping X - Category "${post.category}" not in allowed list`)
          console.log(`[X Stage] Allowed categories: ${xAllowedCategories.join(', ')}`)
          post.xPostStatus = 'error'
          await post.save()
          // Skip X posting but continue with rest of flow
        } else if (!isXPostingAllowed().allowed) {
          // Check if X posting is rate limited
          const xRateLimitCheck = isXPostingAllowed()
          console.log(`[X Stage] ⏸️ X posting temporarily disabled (rate limited)`)
          console.log(`[X Stage] Reason: ${xRateLimitCheck.reason}`)
          console.log(`[X Stage] Cooldown remaining: ${xRateLimitCheck.cooldownRemaining} minutes`)
          post.xPostStatus = 'error'
          await post.save()
          // Skip X posting but continue with rest of flow
        } else {
          console.log('[X Stage] Posting to X (Twitter)...')
          console.log(`[X Stage] ✅ Category "${post.category}" is allowed`)

          // Generate engaging AI-powered tweet
          console.log('[X Stage] Generating engaging tweet...')
          const tweetText = await formatEngagingTwitterPost(
            post.rewrittenTitle,
            post.excerpt,
            post.category,
            wpResult.link
          )
          console.log('[X Stage] Engaging tweet generated ✓')

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
        }
      } catch (xError) {
        console.error(
          `[X Stage] Error in X posting flow (non-critical):`,
          xError.message
        )

        // Check if this is a rate limit error
        if (isXRateLimitError(xError)) {
          console.log('[X Stage] 🚫 Rate limit error detected. Marking X as rate limited...')
          markXRateLimited(xError, 24) // 24 hour cooldown (X has daily limits)
        }

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
