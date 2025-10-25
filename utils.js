import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import path from 'path'
import sharp from 'sharp'
import { uploadImageToWordpress, uploadBufferToWordpress } from './wordpress.js'

// Excerpt generator
export function getExcerpt(htmlContent, wordCount = 30) {
  const text = htmlContent
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.split(' ').slice(0, wordCount).join(' ') + '...'
}

// Patterns for site name replacement
export const siteNamePatterns = [
  /\bDaily\s*Post\b/gi,
  /\bDAILY\s*POST\b/gi,
  /\bDAILYPOST\b/gi,
  /\bLeadership\b/gi,
  /\bLEADERSHIP\b/gi,
  /\bGistlover\b/gi,
  /\bGISTLOVER\b/gi,
]

// Replace site names in visible text only
export function replaceSiteNamesOutsideTags(html) {
  return html
    .split(/(<[^>]+>)/g)
    .map((part, i) => {
      if (i % 2 === 0) {
        siteNamePatterns.forEach((pattern) => {
          part = part.replace(pattern, 'NOWAHALAZONE')
        })
      }
      return part
    })
    .join('')
}

// Replace site names in an array of HTML contents
export function replaceSiteNamesInPostDetails(postDetails) {
  return postDetails.map((htmlContent) =>
    replaceSiteNamesOutsideTags(htmlContent)
  )
}

// Save new post to MongoDB
export async function saveNewPostToDb(Post, postData) {
  const postDoc = new Post(postData)
  await postDoc.save()
  return postDoc
}

// In utils.js
export function normalizeString(str) {
  return str ? str.trim().toLowerCase() : ''
}

/**
 * Remove <a> tags in the content that link to the source site.
 * @param {string} htmlContent - The post content HTML.
 * @param {string} siteDomain - The domain of the site the post was scraped from (e.g., "notjustok.com").
 * @returns {string} - The cleaned HTML content.
 */
export function removeSourceSiteLinks(htmlContent, siteDomain) {
  const $ = cheerio.load(htmlContent)
  $(`a[href*="${siteDomain}"]`).each(function () {
    // Replace the link with its text content
    $(this).replaceWith($(this).text())
  })
  return $.html()
}

/**
 * Removes the last element in the HTML content that contains a Facebook or X link,
 * but only if the post is from notjustok.com.
 * @param {string} htmlContent
 * @param {string} websiteUrl
 * @returns {string}
 */
export function removeLastSocialElementIfNotJustOk(htmlContent, websiteUrl) {
  const isNotJustOk = /notjustok\.com/i.test(websiteUrl)
  if (!isNotJustOk) return htmlContent

  const $ = cheerio.load(htmlContent)
  let elementsWithSocial = []
  $('*').each(function () {
    const html = $(this).html() || ''
    if (
      /<a[^>]+href=["'][^"']*(facebook\.com|x\.com|twitter\.com)[^"']*["']/i.test(
        html
      )
    ) {
      elementsWithSocial.push(this)
    }
  })

  if (elementsWithSocial.length > 0) {
    $(elementsWithSocial[elementsWithSocial.length - 1]).remove()
  }
  return $.html()
}

export function removeGistreelLinks(htmlContent) {
  const $ = cheerio.load(htmlContent)
  $('a[href*="https://www.gistreel.com/"]').each(function () {
    // Replace the link with its text content
    $(this).replaceWith($(this).text())
  })
  return $.html()
}

export function extractImageUrlFromMultipleSelectors(
  $,
  dynamicSelector,
  staticSelector
) {
  // Try dynamic selector first
  const dynamicEl = $(`${dynamicSelector} .tdb-featured-image-bg`).first()
  if (dynamicEl.length) {
    const style = dynamicEl.attr('style')
    if (style) {
      const match = style.match(
        /background(?:-image)?:?\s*url\(['"]?(.*?\.(jpg|png))['"]?\)/i
      )
      if (match && match[1]) {
        return match[1]
      }
    }
  }
  // Fallback to static selector
  const staticEl = $(staticSelector).first()
  if (staticEl.length) {
    const style = staticEl.attr('style')
    if (style) {
      const match = style.match(
        /background(?:-image)?:?\s*url\(['"]?(.*?\.(jpg|png))['"]?\)/i
      )
      if (match && match[1]) {
        return match[1]
      }
    }
  }
  return ''
}

/**
 * Downloads an image from a URL and returns a buffer and filename with the correct extension.
 * If the image is already .jpg, .jpeg, or .png, keep the original extension.
 * Otherwise, convert to .jpg.
 * Includes quality checks and optimization for clean, clear images.
 * @param {string} imageUrl - The image URL (with or without query params).
 * @param {string} [filename] - Optional filename (without extension).
 * @returns {Promise<{buffer: Buffer, filename: string, ext: string}>}
 */
export async function downloadImageAsJpgOrPngForUpload(imageUrl, filename) {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`)

  // Determine extension from URL or content-type
  let ext = '.jpg'
  const urlPath = new URL(imageUrl).pathname
  const urlExtMatch = urlPath.match(/\.(jpg|jpeg|png)$/i)
  if (urlExtMatch) {
    ext = '.' + urlExtMatch[1].toLowerCase()
  } else {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('png')) ext = '.png'
    else if (contentType.includes('jpeg') || contentType.includes('jpg'))
      ext = '.jpg'
  }

  // Always use the base name without extension
  if (!filename) {
    filename = path.basename(urlPath).replace(/\.[^/.]+$/, '') // remove extension
  }
  const finalFilename = filename + ext

  // Convert to buffer and process with Sharp for quality
  const inputBuffer = Buffer.from(await res.arrayBuffer())

  // Load image with Sharp to check dimensions and quality
  let image = sharp(inputBuffer)
  const metadata = await image.metadata()

  // Image quality validation
  const MIN_WIDTH = 400
  const MIN_HEIGHT = 300

  if (metadata.width < MIN_WIDTH || metadata.height < MIN_HEIGHT) {
    console.warn(
      `[Image Quality] Image too small (${metadata.width}x${metadata.height}). ` +
      `Minimum: ${MIN_WIDTH}x${MIN_HEIGHT}. URL: ${imageUrl}`
    )
    // Don't throw error, but log warning - allow post to continue
  }

  // Process and optimize image
  let outputBuffer

  if (ext === '.png') {
    // Optimize PNG: remove metadata, compress
    outputBuffer = await sharp(inputBuffer)
      .png({
        quality: 90,
        compressionLevel: 9,
        adaptiveFiltering: true
      })
      .withMetadata(false) // Remove EXIF/metadata
      .toBuffer()
  } else {
    // Process as JPEG with optimization
    // Auto-enhance: normalize, sharpen slightly
    outputBuffer = await sharp(inputBuffer)
      .jpeg({
        quality: 85,
        progressive: true,
        mozjpeg: true // Better compression
      })
      .normalize() // Auto-adjust brightness/contrast
      .sharpen({ sigma: 0.5 }) // Subtle sharpening for clarity
      .withMetadata(false) // Remove EXIF/metadata for privacy and smaller file size
      .toBuffer()

    ext = '.jpg'
  }

  // Check output file size
  const fileSizeKB = outputBuffer.length / 1024
  console.log(
    `[Image Processing] ${finalFilename}: ${metadata.width}x${metadata.height}, ` +
    `${Math.round(fileSizeKB)}KB`
  )

  return { buffer: outputBuffer, filename: finalFilename, ext }
}

// Process all <img> tags in HTML content: download, upload to WordPress, and replace src
export async function processContentImages(
  html,
  wordpressUrl,
  username,
  password
) {
  const $ = cheerio.load(html)
  const imgTags = $('img')
  for (let i = 0; i < imgTags.length; i++) {
    const img = imgTags[i]
    let src = $(img).attr('src')

    // If src is a data URI, placeholder, or missing, try data-src or data-lazy-src
    const isPlaceholder = src && (
      src.includes('lazy_placeholder') ||
      src.includes('placeholder.gif') ||
      src.includes('placeholder.png') ||
      src.includes('lazy-load') ||
      src.startsWith('data:image/svg')
    )

    if (!src || src.startsWith('data:') || isPlaceholder) {
      const lazySrc = $(img).attr('data-src') || $(img).attr('data-lazy-src')
      if (lazySrc) {
        console.log(`[Image Processing] Detected lazy-loaded image, using data-src: ${lazySrc}`)
        src = lazySrc
      }
    }
    if (!src) continue

    try {
      // Upload to WordPress
      const { buffer, filename } = await downloadImageAsJpgOrPngForUpload(src)
      const wpUrl = await uploadBufferToWordpress(
        buffer,
        filename,
        wordpressUrl,
        username,
        password
      )
      const finalUrl = typeof wpUrl === 'string' ? wpUrl : wpUrl?.source_url
      if (finalUrl) {
        $(img).attr('src', finalUrl)
        $(img)
          .attr('width', 600)
          .attr('height', 'auto')
          .attr(
            'style',
            'display: block; margin-left: auto; margin-right: auto;'
          )
        // Optionally remove data-src and data-lazy-src
        $(img).removeAttr('data-src').removeAttr('data-lazy-src')
      }
    } catch (e) {
      console.warn('[WARN] Failed to process content image:', src, e.message)
    }
  }
  return $.html()
}

/**
 * Finds social media links in the content, replaces them with embed HTML,
 * and returns the processed HTML.
 * Supported: Twitter, Instagram, YouTube, Facebook, TikTok
 */
export function embedSocialLinksInContent(html) {
  const $ = cheerio.load(html)

  // Clean up TikTok blockquotes: Remove plain URLs and links inside them
  $('.tiktok-embed section').each((i, section) => {
    let sectionHtml = $(section).html() || ''

    // Remove TikTok URLs (creator, tags, music) - they're not needed for the embed
    sectionHtml = sectionHtml.replace(/https?:\/\/www\.tiktok\.com\/[@\w/-]+\?refer=\w+/g, '')
    sectionHtml = sectionHtml.replace(/https?:\/\/www\.tiktok\.com\/tag\/[\w-]+\?refer=\w+/g, '')
    sectionHtml = sectionHtml.replace(/https?:\/\/www\.tiktok\.com\/music\/[\w-]+\?refer=\w+/g, '')

    // Remove empty paragraphs and extra whitespace
    sectionHtml = sectionHtml.replace(/<p[^>]*>\s*<\/p>/g, '')
    sectionHtml = sectionHtml.trim()

    $(section).html(sectionHtml)
  })

  // Clean up Instagram blockquotes: Remove plain URLs inside them
  $('.instagram-media').each((i, blockquote) => {
    let blockquoteHtml = $(blockquote).html() || ''

    // Remove Instagram post URLs - they're not needed inside the embed
    blockquoteHtml = blockquoteHtml.replace(/https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+[^\s<]*/g, '')

    // Remove empty paragraphs and extra whitespace
    blockquoteHtml = blockquoteHtml.replace(/<p[^>]*>\s*<\/p>/g, '')
    blockquoteHtml = blockquoteHtml.trim()

    $(blockquote).html(blockquoteHtml)
  })

  // Clean up Twitter/X blockquotes: Remove plain URLs inside them
  $('.twitter-tweet').each((i, blockquote) => {
    let blockquoteHtml = $(blockquote).html() || ''

    // Remove Twitter/X status URLs - they're not needed inside the embed
    blockquoteHtml = blockquoteHtml.replace(/https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^/]+\/status\/\d+[^\s<]*/g, '')

    // Remove empty paragraphs and extra whitespace
    blockquoteHtml = blockquoteHtml.replace(/<p[^>]*>\s*<\/p>/g, '')
    blockquoteHtml = blockquoteHtml.trim()

    $(blockquote).html(blockquoteHtml)
  })

  $('a').each((i, el) => {
    const href = $(el).attr('href')
    if (!href) return

    // Skip links that are already inside social media embeds (blockquote, iframe, etc.)
    if ($(el).closest('blockquote, iframe, .tiktok-embed, .instagram-media, .twitter-tweet, .fb-post').length > 0) {
      return
    }

    // Twitter
    if (/twitter\.com\/[^/]+\/status\/\d+/.test(href)) {
      $(el).replaceWith(`
        <blockquote class="twitter-tweet">
          <a href="${href}"></a>
        </blockquote>
        <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
      `)
      return
    }

    // Instagram
    if (/instagram\.com\/p\//.test(href)) {
      $(el).replaceWith(`
        <blockquote class="instagram-media" data-instgrm-permalink="${href}" data-instgrm-version="14"></blockquote>
        <script async src="//www.instagram.com/embed.js"></script>
      `)
      return
    }

    // YouTube
    const ytMatch = href.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/
    )
    if (ytMatch) {
      const videoId = ytMatch[1]
      $(el).replaceWith(`
        <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
      `)
      return
    }

    // Facebook (posts or videos)
    if (/facebook\.com\/[^/]+\/(posts|videos)\/\d+/.test(href)) {
      $(el).replaceWith(`
        <div class="fb-post" data-href="${href}" data-width="500"></div>
        <script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v12.0"></script>
      `)
      return
    }

    // TikTok
    if (/tiktok\.com\/@[^/]+\/video\/\d+/.test(href)) {
      $(el).replaceWith(`
        <blockquote class="tiktok-embed" cite="${href}" data-video-id="${href
        .split('/')
        .pop()}" style="max-width: 605px;min-width: 325px;">
          <section> </section>
        </blockquote>
        <script async src="https://www.tiktok.com/embed.js"></script>
      `)
      return
    }
  })

  return $.html()
}


export function embedTikTokLinks(html) {
  const $ = cheerio.load(html)

  // Find all TikTok links (plain URLs in <p> or <a>)
  $('p, a, section').each((_, el) => {
    const text = $(el).text().trim()
    // Match TikTok video URLs
    const match = text.match(/https:\/\/www\.tiktok\.com\/@[\w.-]+\/video\/\d+/)
    if (match) {
      // Replace the <p> or <a> with TikTok embed blockquote
      $(el).replaceWith(`
        <blockquote class="tiktok-embed" cite="${match[0]}" data-video-id="${match[0].split('/').pop()}" style="max-width: 605px;min-width: 325px;">
          <section></section>
        </blockquote>
      `)
    }
  })

  // Add TikTok embed script if at least one embed was added
  if ($('.tiktok-embed').length && !$('script[src*="tiktok.com/embed.js"]').length) {
    $.root().append('<script async src="https://www.tiktok.com/embed.js"></script>')
  }

  return $.root().html()
}


