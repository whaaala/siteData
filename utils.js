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
 * @param {string} imageUrl - The image URL (with or without query params).
 * @param {string} [filename] - Optional filename (without extension).
 * @returns {Promise<{buffer: Buffer, filename: string, ext: string}>}
 */
export async function downloadImageAsJpgOrPngForUpload(imageUrl, filename) {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`)

  let ext = '.jpg'
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('png')) ext = '.png'

  // Always use the base name without extension
  if (!filename) {
    const urlPath = new URL(imageUrl).pathname
    filename = path.basename(urlPath).replace(/\.[^/.]+$/, '') // remove extension
  }
  const finalFilename = filename + ext

  // Convert to jpg/png buffer using sharp
  const inputBuffer = Buffer.from(await res.arrayBuffer())
  let outputBuffer
  if (ext === '.png') {
    outputBuffer = await sharp(inputBuffer).png().toBuffer()
  } else {
    outputBuffer = await sharp(inputBuffer).jpeg().toBuffer()
  }

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
      if (wpUrl) {
        $(img).attr('src', wpUrl)
        $(img).attr('width', 600).attr('height', 'auto').attr('style', 'display: block; margin-left: auto; margin-right: auto;');
      }
    } catch (e) {
      console.warn('[WARN] Failed to process content image:', src, e.message)
    }
  }
  return $.html()
}
