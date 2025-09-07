import * as cheerio from 'cheerio'
import { Post } from './db.js'
import { getContent, getAttribute } from './functions.js'
import { normalizeCategory } from './normalizeCategory.js'
import {
  replaceSiteNamesOutsideTags,
  replaceSiteNamesInPostDetails,
  downloadImageAsJpgOrPngForUpload,
} from './utils.js'
import { uploadBufferToWordpress } from './wordpress.js'

export async function scrapeAndSaveRaw(
  postListings,
  page,
  postEls,
  wordpressUrl,
  username,
  password
) {
  if (postListings.length === 0) return
  const listing = 0
  const url = postListings[listing].url
  const title = postListings[listing].title

  // Check if already scraped
  console.log(`[Scrape Stage] Checking for existing post: ${url}`)
  const existing = await Post.findOne({ url })
  if (existing) {
    console.log(
      `Post "${postListings[listing].title}" already exists in MongoDB. Skipping.`
    )
    return
  }

  // Go to the post URL
  console.log(`[Scrape Stage] Navigating to post URL: ${url}`)
  await page.goto(url)

  // Wait for the main image to be visible before extracting
  if (postEls.post.imageEl.tag) {
    try {
      await page.waitForSelector(postEls.post.imageEl.tag, {
        visible: true,
        timeout: 10000,
      })
      console.log('[Scrape Stage] Main image selector found and visible.')
    } catch (e) {
      console.warn(
        console.warn(
          `[Scrape Stage] Image selector ${postEls.post.imageEl.tag} not found or not visible.`
        )
      )
    }
  }

  // Get the HTML content
  const html = await page.content()

  // Load the HTML into cheerio
  const $ = cheerio.load(html)

  // Determine if the site is pulse or brila for special handling
  const isPulse =
    postListings[listing].website &&
    postListings[listing].website.includes('pulse')
  const isBrila =
    postListings[listing].website &&
    postListings[listing].website.includes('brila')
  const isHealthsa =
    postListings[listing].website &&
    postListings[listing].website.includes('healthsa.co.za')
  const isTheguardian =
    postListings[listing].website &&
    postListings[listing].website.includes('theguardian.com')
  const isMotorverso =
    postListings[listing].website &&
    postListings[listing].website.includes('motorverso.com')
  const isGirlracer =
    postListings[listing].website &&
    postListings[listing].website.includes('girlracer.co.uk')
  if (
    !isPulse &&
    !isBrila &&
    !isHealthsa &&
    !isTheguardian &&
    !isMotorverso &&
    !isGirlracer
  ) {
    // Remove all <strong> elements from the content for non-pulse and non-brila sites
    $(postEls.post.mainContainerEl).find('strong').remove()
  }

  // Remove any <p> element containing "Source: Legit.ng"
  $('p')
    .filter((_, el) => $(el).text().includes('Source: Legit.ng'))
    .remove()

  // Remove any element containing "Read more stories Read more:"
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('legit')
  ) {
    // Remove any element containing "Read more stories Read more:"
    $('*')
      .filter((_, el) => $(el).text().includes('Read more stories Read more:'))
      .remove()
  }

  // Remove <a> tags with href containing www.legit.ng, except those inside <figure> if pulse
  $(postEls.post.mainContainerEl)
    .find('a[href*="www.legit.ng"]')
    .each(function () {
      const isPulse =
        postListings[listing].website &&
        postListings[listing].website.includes('pulse')
      const insideFigure = $(this).closest('figure').length > 0
      if (!(isPulse && insideFigure)) {
        $(this).replaceWith($(this).text())
      }
    })

  // Remove <a> tags with href containing healthwise, except those inside <figure> if pulse
  if (
    postListings[listing].url &&
    postListings[listing].url.includes('healthwise')
  ) {
    // Log the selector and how many <p> are found
    const mainContent = $(postEls.post.mainContainerEl)
    const firstP = mainContent.find('p').first()
    firstP.remove()
  }

  // Remove <a> tags with href containing pulse, except those inside <figure> if pulse
  $('a[href*="pulse"]').each(function () {
    const isPulse =
      postListings[listing].website &&
      postListings[listing].website.includes('pulse')
    const insideFigure = $(this).closest('figure').length > 0
    if (!(isPulse && insideFigure)) {
      $(this).replaceWith($(this).text())
    }
  })

  // Remove <a> tags with href containing healthwise, except those inside <figure> if pulse
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('healthwise')
  ) {
    // Remove <p> containing "Copyright PUNCH"
    $('p')
      .filter((_, el) => $(el).text().includes('Copyright PUNCH'))
      .remove()
    // Remove <p> starting with "All rights reserved"
    $('p')
      .filter((_, el) => $(el).text().trim().startsWith('All rights reserved'))
      .remove()
    // Remove <p> containing "health_wise@punchng.com"
    $('p')
      .filter((_, el) => $(el).text().includes('health_wise@punchng.com'))
      .remove()
  }

  // Special handling for pulse to remove "Read also" paragraphs
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('pulse')
  ) {
    $(postEls.post.mainContainerEl)
      .find('*')
      .filter((_, el) =>
        /also read|read also|read more|related|#featuredpost/i.test(
          $(el).text()
        )
      )
      .remove()
  }

  // Special handling for theguardian to remove "Related News" sections
  // Remove parent containing "Related News" and all its children
  $('*').each(function () {
    if ($(this).clone().children().remove().end().text().trim() === '(NAN)') {
      $(this).remove()
    }
  })

  // Special handling for thenewsguru to remove elements with text 'NAN'
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('thenewsguru')
  ) {
    $(postEls.post.mainContainerEl)
      .find('*')
      .filter((_, el) => $(el).text().trim() === 'NAN')
      .remove()
  }

  // Special handling for pulse.ng to unwrap <section> elements
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('pulse.ng')
  ) {
    // Unwrap all <section> elements, keeping their children
    $(postEls.post.mainContainerEl)
      .find('section')
      .each(function () {
        $(this).replaceWith($(this).html())
      })
  }

  // Special handling for pulse.com.gh to add <br> after each <section>
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('pulse')
  ) {
    $(postEls.post.mainContainerEl)
      .find('section')
      .each(function () {
        $(this).after('<br>')
      })
  }

  // Special handling for healthsa.co.za to remove "**WH Partnership"
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('healthsa.co.za')
  ) {
    $(postEls.post.mainContainerEl)
      .find('p')
      .filter((_, el) => {
        const text = $(el).text().trim()
        return (
          text.includes('**WH Partnership') ||
          /affiliate programs|participates|earn a commission/i.test(text) ||
          text.includes('Women’s Health')
        )
      })
      .remove()
  }

  // Special handling for healthsa.co.za to adjust video wrapper styles
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('healthsa.co.za')
  ) {
    // Remove inline style from elements with class "fluid-width-video-wrapper"
    $('.fluid-width-video-wrapper').removeAttr('style')

    // Add inline style to iframe inside .fluid-width-video-wrapper
    $('.fluid-width-video-wrapper iframe').attr(
      'style',
      'width: 60rem; height: 30rem;'
    )
  }

  const timePosted = getContent($, postEls.post.datePostedEl)
  const author = getContent($, postEls.post.authorEl)
  let category = postListings[listing].category
  if (
    (!category || category === '' || category === 'No content') &&
    postEls.post.categoryEl
  ) {
    category = getContent($, postEls.post.categoryEl)
  }

  // Special handling for legit.ng categories with \n
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('legit') &&
    typeof category === 'string' &&
    category.includes('\n')
  ) {
    // Split by \n, trim each part, and take the last non-empty one
    const parts = category
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length > 0) {
      category = parts[parts.length - 1]
    }
  }

  // Special handling for theguardian to set category to "Recipes"
  if (postListings[listing].website.includes('theguardian')) {
    category = 'Recipes'
  }

  // Special handling for motorverso to set category to "Cars"
  if (
    postListings[listing].website.includes('motorverso') ||
    postListings[listing].website.includes('girlracer')
  ) {
    category = 'Cars'
  }

  category = normalizeCategory(category)

  // Extract the image link
  // First try source, then source1 if source fails or is a data URI
  let imageLink = ''

  // 1. Try Puppeteer extraction first
  try {
    imageLink = await page.$eval(postEls.post.imageEl.tag, (el) => el.src)
    console.log('[DEBUG] Puppeteer img src:', imageLink)
  } catch (e) {
    console.warn('[DEBUG] Puppeteer could not extract image src:', e.message)
  }

  // 2. Fallbacks and special cases
  const website = postListings[listing].website || ''

  // If Puppeteer failed, try Cheerio
  if (!imageLink) {
    imageLink = getAttribute(
      $,
      postEls.post.imageEl.tag,
      postEls.post.imageEl.source
    )
    console.log('[DEBUG] Cheerio fallback img src:', imageLink)
  }

  // Special: naijanews always uses source1
  if (website.includes('naijanews')) {
    imageLink = getAttribute(
      $,
      postEls.post.imageEl.tag,
      postEls.post.imageEl.source1
    )
  }

  // Special: healthwise uses imageLink from postListing
  if (website.includes('healthwise')) {
    imageLink = postListings[listing].imageLink
  }

  // If imageLink contains "Guardian-grey.jpg", try source1
  if (
    imageLink &&
    imageLink.includes('Guardian-grey.jpg') &&
    postEls.post.imageEl.source1
  ) {
    let altImageLink = getAttribute(
      $,
      postEls.post.imageEl.tag,
      postEls.post.imageEl.source1
    )
    if (altImageLink && altImageLink !== 'No attribute') {
      imageLink = altImageLink.split(' ')[0]
    }
  }

  // If imageLink is a data URI, try source1
  if (
    imageLink &&
    imageLink.startsWith('data:') &&
    postEls.post.imageEl.source1
  ) {
    const altImageLink = getAttribute(
      $,
      postEls.post.imageEl.tag,
      postEls.post.imageEl.source1
    )
    if (altImageLink && !altImageLink.startsWith('data:')) {
      imageLink = altImageLink
    }
  }

  const img = $(postEls.post.imageEl.tag)
  console.log('[DEBUG] Found image count:', img.length)
  if (img.length > 0) {
    console.log('[DEBUG] First image src:', img.attr('src'))
  }
  console.log('[DEBUG] Extracted imageLink:', imageLink)

  // Special: Remove legit.ng duplicate image/caption
  if (website.includes('legit.ng') && imageLink) {
    $(`img[src="${imageLink}"]`).each(function () {
      $(this).parent().find('figcaption').remove()
      const figure = $(this).closest('figure')
      if (figure.length) {
        figure.remove()
      } else {
        $(this).parent().remove()
      }
    })
  }

  // --- Upload/convert if needed ---
  let finalImageLink = imageLink
  let wpFeaturedMediaId = undefined
  if (imageLink && !imageLink.match(/\.(jpg|jpeg|png)(\?|$)/i)) {
    try {
      const { buffer, filename } = await downloadImageAsJpgOrPngForUpload(
        imageLink
      )
      const media = await uploadBufferToWordpress(
        buffer,
        filename,
        wordpressUrl,
        username,
        password
      )

      wpFeaturedMediaId = media.id

      finalImageLink = media.source_url
      console.log(
        '[DEBUG] Uploaded image and got WordPress URL:',
        finalImageLink
      )
    } catch (e) {
      console.warn('[WARN] Failed to convert/upload image:', e.message)
      // fallback: keep original imageLink
      wpFeaturedMediaId = undefined
    }
  }

  if (isPulse && postEls.post.contentEl) {
    try {
      await page.waitForSelector(postEls.post.contentEl, {
        visible: true,
        timeout: 10000,
      })
      console.log('[Scrape Stage] Content selector found and visible.')
    } catch (e) {
      console.warn(
        `[Scrape Stage] Content selector ${postEls.post.contentEl} not found or not visible.`
      )
    }
  }

  const pulseContentExists = await page.$(postEls.post.contentEl)
  console.log('[DEBUG] Puppeteer found contentEl:', !!pulseContentExists)

  //Get the post content
  //Find the main container element that holds the post content
  let postDetails
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('pulse')
  ) {
    // For Pulse, use Playwright to get the HTML of the content element(s)
    try {
      postDetails = await page.$$eval(
        postEls.post.contentEl,
        (nodes, removeSelectors) =>
          nodes.map((el) => {
            // Remove unwanted elements by selector
            removeSelectors.forEach((selector) => {
              el.querySelectorAll(selector).forEach((child) => child.remove())
            })
            return el.outerHTML
          }),
        postEls.post.elToReFromPostEl // <-- this is passed as removeSelectors
      )
    } catch (e) {
      console.warn(
        '[WARN] Playwright could not extract postDetails:',
        e.message
      )
      postDetails = []
    }
  } else {
    // For other sites, use mainContainerEl + contentEl with Cheerio
    postDetails = $(postEls.post.mainContainerEl)
      .find(postEls.post.contentEl)
      .map((_, el) => {
        for (let i = 0; i < postEls.post.elToReFromPostEl.length; i++) {
          if ($(el).find(postEls.post.elToReFromPostEl[i]).length !== 0) {
            $(postEls.post.elToReFromPostEl[i]).remove()
          }
        }
        return $.html(el)
      })
      .get()
  }

  postDetails = replaceSiteNamesInPostDetails(postDetails)
  postDetails = postDetails.map((htmlContent) =>
    replaceSiteNamesOutsideTags(htmlContent)
  )

  // After extracting postDetails but before rewriting:
  postDetails = postDetails.map((htmlContent) =>
    htmlContent
      .split('\n')
      .filter((line) => !/Read the Latest Sports News/i.test(line))
      .join('\n')
  )

  // After cleaning, but before saving postDetails:
  postDetails = postDetails.map((htmlContent) => {
    const $ = cheerio.load(htmlContent)

    // List of social domains for oEmbed
    const socialDomains = [
      'instagram.com',
      'twitter.com',
      'x.com',
      'facebook.com',
      'tiktok.com',
      'youtube.com',
      'youtu.be',
    ]

    // Replace <a> tags to social links with the URL on its own line
    $('a').each(function () {
      const href = $(this).attr('href')
      if (href && socialDomains.some((domain) => href.includes(domain))) {
        $(this).replaceWith('\n' + href + '\n')
      }
    })

    // --- Place this block here ---
    $('[data-html]').each((i, el) => {
      const rawHtml = $(el).attr('data-html')
      if (rawHtml) {
        // Unescape HTML entities
        const unescaped = rawHtml
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&')
        // Replace the wrapper with the real HTML
        $(el).replaceWith(unescaped)
      }
    })

    return $.html()
  })

  // After all extraction and cleaning:
  console.log('[Scrape Stage] Extracted post details and meta.')

  // After all cleaning, but before joining postDetails:
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('pulse.com.gh')
  ) {
    postDetails = postDetails.map((htmlContent) => {
      const $ = cheerio.load(htmlContent)

      $('*')
        .filter((_, el) => $(el).text().toLowerCase().includes('advertisement'))
        .remove()

      // Remove any paragraph that contains "Read more" (case-insensitive)
      $('p')
        .filter((_, el) => $(el).text().toLowerCase().includes('read more'))
        .remove()

      return $.html()
    })
  }

  // Add top and bottom margin (newlines) within header elements (h1-h6) for all postDetails
  postDetails = postDetails.map((htmlContent) => {
    const $ = cheerio.load(htmlContent)
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const text = $(el).text().trim()
      // Add a blank line before and after the header text
      $(el).text(`\n\n${text}\n\n`)
    })
    return $.html()
  })

  // Add CSS margin-bottom to every <p> element for all postDetails
  postDetails = postDetails.map((htmlContent) => {
    const $ = cheerio.load(htmlContent)
    $('p').each((_, el) => {
      $(el).attr('style', 'margin-bottom:0.5rem;')
    })
    return $.html()
  })

  // After all cleaning:
  const fullContent = postDetails.join('\n')

  const savedPost = await Post.create({
    url,
    title,
    website: postListings[listing].website,
    dateRetrieved: new Date(),
    author,
    timePosted,
    category,
    imageLink: finalImageLink,
    postDetails: fullContent,
    processingStage: 'raw',
    wpFeaturedMediaId,
  })

  console.log(
    `[Scrape Stage] Post "${title}" saved to MongoDB with ID: ${savedPost._id}`
  )

  return savedPost
}
