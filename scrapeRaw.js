import * as cheerio from 'cheerio'
import { Post } from './db.js'
import { getContent, getAttribute } from './functions.js'
import { normalizeCategory } from './normalizeCategory.js'
import {
  replaceSiteNamesOutsideTags,
  replaceSiteNamesInPostDetails,
  downloadImageAsJpgOrPngForUpload,
  findLargestImageInContent,
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

  // Go to the post URL with improved loading strategy
  console.log(`[Scrape Stage] Navigating to post URL: ${url}`)

  let pageLoaded = false

  // Try multiple loading strategies with increasing timeouts
  const loadStrategies = [
    { waitUntil: 'domcontentloaded', timeout: 45000, name: 'domcontentloaded (45s)' },
    { waitUntil: 'commit', timeout: 30000, name: 'commit (30s)' },
    { waitUntil: 'load', timeout: 60000, name: 'load (60s)' }
  ]

  for (const strategy of loadStrategies) {
    try {
      console.log(`[Scrape Stage] Attempting to load with ${strategy.name}...`)
      await page.goto(url, {
        waitUntil: strategy.waitUntil,
        timeout: strategy.timeout
      })
      console.log(`[Scrape Stage] ✅ Successfully loaded: ${url} (using ${strategy.name})`)
      pageLoaded = true
      break
    } catch (navError) {
      console.warn(`[Scrape Stage] ⚠️ Failed with ${strategy.name}: ${navError.message}`)

      // If this wasn't the last strategy, continue to next one
      if (strategy !== loadStrategies[loadStrategies.length - 1]) {
        console.log(`[Scrape Stage] Trying alternative loading method...`)
        continue
      }
    }
  }

  // If all strategies failed, skip this post
  if (!pageLoaded) {
    console.error(`[Scrape Stage] ❌ Failed to load page after ${loadStrategies.length} attempts: ${url}`)
    console.log(`[Scrape Stage] Skipping this post and moving to next...`)
    return null
  }

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

  // Special handling for yabaleftonline truncated titles
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('yabaleftonline') &&
    typeof postListings[listing].title === 'string' &&
    postListings[listing].title.trim().endsWith('...')
  ) {
    // Try to extract the full title from the content page
    // Adjust selector as needed for the actual title element
    const fullTitle = $(postEls.post.titleEl?.tag || '.td-post-title')
      .first()
      .text()
      .trim()
    if (fullTitle && fullTitle.length > postListings[listing].title.length) {
      postListings[listing].title = fullTitle
    }
  }

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
  const isNotjustok =
    postListings[listing].website &&
    postListings[listing].website.includes('notjustok')
  if (
    !isPulse &&
    !isBrila &&
    !isHealthsa &&
    !isTheguardian &&
    !isMotorverso &&
    !isGirlracer &&
    !isNotjustok
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
    postEls.post.categoryEl &&
    postEls.post.categoryEl !== ''
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
    postListings[listing].website.includes('bestsellingcarsblog') ||
    postListings[listing].website.includes('girlracer')
  ) {
    category = 'Cars'
  }

  // Special handling for pulse.com.gh/pulse.ng to infer category from URL
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('pulse.') &&
    url
  ) {
    try {
      const urlPath = new URL(url).pathname.toLowerCase()

      // Extract category from URL path
      if (urlPath.includes('/news/') || urlPath.includes('/articles/news/')) {
        category = 'News'
        console.log(`[Pulse Category Fix] Inferred category "News" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/entertainment/')) {
        category = 'Entertainment'
        console.log(`[Pulse Category Fix] Inferred category "Entertainment" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/lifestyle/')) {
        category = 'Lifestyle'
        console.log(`[Pulse Category Fix] Inferred category "Lifestyle" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/sports/')) {
        category = 'Sports'
        console.log(`[Pulse Category Fix] Inferred category "Sports" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/business/')) {
        category = 'News'  // Business articles go to News category
        console.log(`[Pulse Category Fix] Inferred category "News" (business) from URL path: ${urlPath}`)
      }
    } catch (urlError) {
      console.warn(`[Pulse Category Fix] Failed to parse URL: ${url}`)
    }
  }

  // Special handling for legit.ng to infer category from URL
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('legit.ng') &&
    url
  ) {
    try {
      const urlPath = new URL(url).pathname.toLowerCase()

      // Extract category from URL path
      if (urlPath.includes('/politics/') || urlPath.includes('/business-economy/')) {
        category = 'News'
        console.log(`[Legit Category Fix] Inferred category "News" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/entertainment/')) {
        category = 'Entertainment'
        console.log(`[Legit Category Fix] Inferred category "Entertainment" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/people/')) {
        category = 'Lifestyle'
        console.log(`[Legit Category Fix] Inferred category "Lifestyle" (people) from URL path: ${urlPath}`)
      } else if (urlPath.includes('/sports/')) {
        category = 'Sports'
        console.log(`[Legit Category Fix] Inferred category "Sports" from URL path: ${urlPath}`)
      }
    } catch (urlError) {
      console.warn(`[Legit Category Fix] Failed to parse URL: ${url}`)
    }
  }

  // Special handling for naijanews.com to infer category from URL
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('naijanews.com') &&
    url
  ) {
    try {
      const urlPath = new URL(url).pathname.toLowerCase()

      if (urlPath.includes('/entertainment/')) {
        category = 'Entertainment'
        console.log(`[Naijanews Category Fix] Inferred category "Entertainment" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/sports/')) {
        category = 'Sports'
        console.log(`[Naijanews Category Fix] Inferred category "Sports" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/gist/')) {
        category = 'Gists'
        console.log(`[Naijanews Category Fix] Inferred category "Gists" from URL path: ${urlPath}`)
      } else {
        // Default to News for main naijanews.com posts
        category = 'News'
        console.log(`[Naijanews Category Fix] Inferred category "News" (default) from URL path: ${urlPath}`)
      }
    } catch (urlError) {
      console.warn(`[Naijanews Category Fix] Failed to parse URL: ${url}`)
    }
  }

  // Special handling for gistreel.com to infer category from URL
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('gistreel.com') &&
    url
  ) {
    try {
      const urlPath = new URL(url).pathname.toLowerCase()

      if (urlPath.includes('/politics/')) {
        category = 'News'
        console.log(`[Gistreel Category Fix] Inferred category "News" (politics) from URL path: ${urlPath}`)
      } else if (urlPath.includes('/entertainment-news/')) {
        category = 'Entertainment'
        console.log(`[Gistreel Category Fix] Inferred category "Entertainment" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/viral-news/')) {
        category = 'Gists'
        console.log(`[Gistreel Category Fix] Inferred category "Gists" (viral) from URL path: ${urlPath}`)
      } else if (urlPath.includes('/sport/')) {
        category = 'Sports'
        console.log(`[Gistreel Category Fix] Inferred category "Sports" from URL path: ${urlPath}`)
      }
    } catch (urlError) {
      console.warn(`[Gistreel Category Fix] Failed to parse URL: ${url}`)
    }
  }

  // Special handling for guardian.ng to infer category from URL
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('guardian.ng') &&
    url
  ) {
    try {
      const urlPath = new URL(url).pathname.toLowerCase()

      if (urlPath.includes('/category/news/') || urlPath.includes('/politics/')) {
        category = 'News'
        console.log(`[Guardian Category Fix] Inferred category "News" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/category/sport/')) {
        category = 'Sports'
        console.log(`[Guardian Category Fix] Inferred category "Sports" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/category/life/')) {
        category = 'Lifestyle'
        console.log(`[Guardian Category Fix] Inferred category "Lifestyle" from URL path: ${urlPath}`)
      }
    } catch (urlError) {
      console.warn(`[Guardian Category Fix] Failed to parse URL: ${url}`)
    }
  }

  // Special handling for punchng.com to infer category from URL (fallback if listing fails)
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('punchng.com') &&
    url &&
    !category
  ) {
    try {
      const urlPath = new URL(url).pathname.toLowerCase()

      if (urlPath.includes('/topics/sports/') || urlPath.includes('/sports/')) {
        category = 'Sports'
        console.log(`[Punchng Category Fix] Inferred category "Sports" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/punch-lite/') || urlPath.includes('/gist/')) {
        category = 'Gists'
        console.log(`[Punchng Category Fix] Inferred category "Gists" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/entertainment/')) {
        category = 'Entertainment'
        console.log(`[Punchng Category Fix] Inferred category "Entertainment" from URL path: ${urlPath}`)
      }
    } catch (urlError) {
      console.warn(`[Punchng Category Fix] Failed to parse URL: ${url}`)
    }
  }

  // Special handling for premiumtimesng.com to infer category from URL (fallback if listing fails)
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('premiumtimesng.com') &&
    url &&
    !category
  ) {
    try {
      const urlPath = new URL(url).pathname.toLowerCase()

      if (urlPath.includes('/entertainment/')) {
        category = 'Entertainment'
        console.log(`[Premiumtimes Category Fix] Inferred category "Entertainment" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/category/sports/')) {
        category = 'Sports'
        console.log(`[Premiumtimes Category Fix] Inferred category "Sports" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/category/health/')) {
        category = 'HealthAndFitness'
        console.log(`[Premiumtimes Category Fix] Inferred category "HealthAndFitness" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/category/agriculture/') || urlPath.includes('/food/')) {
        category = 'FoodAndDrink'
        console.log(`[Premiumtimes Category Fix] Inferred category "FoodAndDrink" from URL path: ${urlPath}`)
      }
    } catch (urlError) {
      console.warn(`[Premiumtimes Category Fix] Failed to parse URL: ${url}`)
    }
  }

  // Special handling for yabaleftonline.ng to infer category from URL (fallback if listing fails)
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('yabaleftonline.ng') &&
    url &&
    !category
  ) {
    try {
      const urlPath = new URL(url).pathname.toLowerCase()

      if (urlPath.includes('/entertainment/')) {
        category = 'Entertainment'
        console.log(`[Yabaleft Category Fix] Inferred category "Entertainment" from URL path: ${urlPath}`)
      } else if (urlPath.includes('/viral/')) {
        category = 'Gists'
        console.log(`[Yabaleft Category Fix] Inferred category "Gists" (viral) from URL path: ${urlPath}`)
      }
    } catch (urlError) {
      console.warn(`[Yabaleft Category Fix] Failed to parse URL: ${url}`)
    }
  }

  category = normalizeCategory(category)

  // Extract the image link
  // First try source, then source1 if source fails or is a data URI
  // Extract the image link
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

  // If still no imageLink, use the first <img> in the main container
  if (!imageLink) {
    const firstImg = $(postEls.post.mainContainerEl).find('img').first()
    if (firstImg.length) {
      imageLink = firstImg.attr('src') || ''
      console.log('[DEBUG] Used first <img> in <main container:', imageLink)
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
            // Return only the inner HTML, not outerHTML, for clean merging
            return el.innerHTML
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
        // Remove unwanted elements by selector
        for (let i = 0; i < postEls.post.elToReFromPostEl.length; i++) {
          if ($(el).find(postEls.post.elToReFromPostEl[i]).length !== 0) {
            $(el).find(postEls.post.elToReFromPostEl[i]).remove()
          }
        }
        // Return only the inner HTML of the content element
        return $(el).html() || ''
      })
      .get()
  }

  // --- Always upload the image to WordPress, regardless of extension ---
  let finalImageLink = imageLink
  let wpFeaturedMediaId = undefined
  let media

  if (imageLink) {
    try {
      // Always download and convert to buffer for upload
      const { buffer, filename } = await downloadImageAsJpgOrPngForUpload(
        imageLink
      )
      media = await uploadBufferToWordpress(
        buffer,
        filename,
        wordpressUrl,
        username,
        password
      )

      // // Debug log
      // console.log('[DEBUG] media:', media)
      // console.log(
      //   '[DEBUG] media.source_url:',
      //   media && media.source_url,
      //   'type:',
      //   typeof (media && media.source_url)
      // )

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

    // Update all <img> tags with the original imageLink to use the new WordPress URL
    if (media && typeof media.source_url === 'string') {
      postDetails = postDetails.map((htmlContent) => {
        const $ = cheerio.load(htmlContent)
        $(`img[src="${imageLink}"]`).each((_, el) => {
          console.log(
            '[DEBUG] About to set img src to:',
            media && media.source_url,
            'type:',
            typeof (media && media.source_url)
          )
          $(el).attr('src', media.source_url)
        })
        return $.html()
      })
    } else if (media) {
      console.warn('[WARN] media.source_url is not a string:', media.source_url)
    }
  }

  // Remove any image within the content that is the same as the featured image before posting to WordPress
  postDetails = postDetails.map((htmlContent) => {
    const $ = cheerio.load(htmlContent)
    $(`img[src="${finalImageLink}"]`).each((_, el) => {
      // Remove the image or its parent <figure> if present, else just the <img>
      const figure = $(el).closest('figure')
      if (figure.length) {
        figure.remove()
      } else {
        $(el).remove()
      }
    })
    return $.html()
  })

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

  // Fallback: If postDetails is empty, try to get the full main container's HTML
  if (
    !postDetails ||
    postDetails.length === 0 ||
    postDetails.every((d) => !d.trim())
  ) {
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('pulse')
    ) {
      try {
        postDetails = await page.$$eval(postEls.post.mainContainerEl, (nodes) =>
          nodes.map((el) => el.innerHTML)
        )
      } catch (e) {
        postDetails = []
      }
    } else {
      postDetails = [$(postEls.post.mainContainerEl).html() || '']
    }
  }

  // Clean up: Remove empty strings and trim
  postDetails = postDetails.map((d) => (d || '').trim()).filter(Boolean)

  postDetails = replaceSiteNamesInPostDetails(postDetails)
  postDetails = postDetails.map((htmlContent) =>
    replaceSiteNamesOutsideTags(htmlContent)
  )

  // === FEATURE IMAGE OPTIMIZATION ===
  // Find the largest image in content and use it as the feature image if it's larger than the initial one
  try {
    console.log('[Image Optimization] Starting feature image optimization...')
    console.log(`[Image Optimization] Initial feature image: ${imageLink}`)

    const largestImage = await findLargestImageInContent(postDetails, imageLink)

    if (largestImage && largestImage.url !== imageLink) {
      console.log(`[Image Optimization] 🎯 Found larger image in content!`)
      console.log(`[Image Optimization] Switching from: ${imageLink}`)
      console.log(`[Image Optimization] Switching to: ${largestImage.url}`)
      console.log(`[Image Optimization] New dimensions: ${largestImage.width}x${largestImage.height}`)

      // Use the largest image as the feature image
      imageLink = largestImage.url
    } else if (largestImage && largestImage.url === imageLink) {
      console.log(`[Image Optimization] ✓ Initial feature image is already the largest`)
    } else {
      console.log(`[Image Optimization] ⚠️ Could not find any larger images, keeping initial feature image`)
    }
  } catch (error) {
    console.warn(`[Image Optimization] ⚠️ Error during image optimization: ${error.message}`)
    console.log(`[Image Optimization] Falling back to initial feature image`)
  }
  // === END FEATURE IMAGE OPTIMIZATION ===

  // Inside getPostCotent, after loading HTML with Cheerio and before extracting postDetails:
  if (
    postListings[listing].website &&
    postListings[listing].website.includes('yabaleftonline')
  ) {
    // Handle lazy-loaded GIFs with data-src
    $(postEls.post.contentEl)
      .find('img[src$=".gif"]')
      .each(function () {
        const dataSrc = $(this).attr('data-src')
        if (dataSrc) {
          $(this).attr('src', dataSrc)
        }
      })

    // Extract images from noscript tags and replace noscript with actual img tags
    $(postEls.post.contentEl)
      .find('noscript')
      .each(function () {
        const noscriptContent = $(this).html()
        if (noscriptContent && noscriptContent.includes('<img')) {
          // Parse the noscript content to extract the img tag
          const $noscript = cheerio.load(noscriptContent)
          const imgEl = $noscript('img').first()

          if (imgEl.length) {
            // Replace the noscript tag with the actual img tag
            $(this).replaceWith(imgEl.toString())
          }
        }
      })
  }

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

  // Remove any paragraph that contains "ALSO READ" or "Read " (case-insensitive) for all postDetails
  postDetails = postDetails.map((htmlContent) => {
    const $ = cheerio.load(htmlContent)
    $('p')
      .filter((_, el) => {
        const text = $(el).text().toLowerCase()
        return text.includes('also read') || text.includes('read ')
      })
      .remove()
    return $.html()
  })

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

  // Remove any hyperlink (<a>) whose text content contains the website (case-insensitive)
  postDetails = postDetails.map((htmlContent) => {
    const $ = cheerio.load(htmlContent)
    const website = (postListings[listing].website || '').toLowerCase()

    // Remove <a> tags whose text or href contains the website string
    $('a').each((_, el) => {
      const text = $(el).text().toLowerCase()
      const href = ($(el).attr('href') || '').toLowerCase()
      if (text.includes(website) || href.includes(website)) {
        $(el).replaceWith($(el).text()) // Remove the link, keep the text
      }
    })

    // Also remove any <a> tag that is the only child of a parent whose text contains the website
    $('*').each((_, el) => {
      if (
        $(el).children('a').length === 1 &&
        $(el).text().toLowerCase().includes(website)
      ) {
        $(el).find('a').replaceWith($(el).find('a').text())
      }
    })

    return $.html()
  })

  // Remove any element that contains "#Featuredpost" (case-insensitive) in the content
  postDetails = postDetails.map((htmlContent) => {
    const $ = cheerio.load(htmlContent)
    $('*').each((_, el) => {
      if ($(el).text().toLowerCase().includes('#featuredpost')) {
        $(el).remove()
      }
    })
    return $.html()
  })

  // Add CSS inline style to any iframe with id attribute containing "twitter"
  postDetails = postDetails.map((htmlContent) => {
    const $ = cheerio.load(htmlContent)
    $('iframe[id*="twitter"]').each((_, el) => {
      $(el).attr('style', 'height:550px; width:500px;')
    })
    return $.html()
  })

  // Remove any element that contains the text " NotJustOk" (case-insensitive)
  // and any element that has a hyperlink (<a>) containing "notjustok" in text or href (case-insensitive)
  postDetails = postDetails.map((htmlContent) => {
    const $ = cheerio.load(htmlContent)

    // Find the last <p> element
    const lastP = $('p').last()
    let shouldRemove = false

    // Check if any child contains the specified keywords or links
    lastP.children().each((_, child) => {
      const text = $(child).text().toLowerCase()
      const href = ($(child).attr('href') || '').toLowerCase()
      if (
        text.includes('updates') ||
        text.includes('notjustok') ||
        text.includes('facebook') ||
        text.includes('x') ||
        href.includes('facebook.com') ||
        href.includes('x.com')
      ) {
        shouldRemove = true
      }
    })

    // Also check the last <p> itself for direct text (not just children)
    const lastPText = lastP.text().toLowerCase()
    if (
      lastPText.includes('updates') ||
      lastPText.includes('notjustok') ||
      lastPText.includes('facebook') ||
      lastPText.includes('x')
    ) {
      shouldRemove = true
    }

    if (shouldRemove) {
      lastP.remove()
    }

    return $.html()
  })

  // Remove any element that contains the text " NotJustOk" (case-insensitive)
  // and any element that has a hyperlink (<a>) containing "notjustok" in text or href (case-insensitive)
  // Enhanced: Remove last <p> if its child <a> contains facebook/x URL or text contains "Check", "latest", "updates" for notjustok
  postDetails = postDetails.map((htmlContent) => {
    const $ = cheerio.load(htmlContent)

    if (
      postListings[listing].website &&
      postListings[listing].website.includes('notjustok')
    ) {
      const lastP = $('p').last()
      let shouldRemove = false

      // Check child <a> for facebook/x URL
      lastP.children('a').each((_, child) => {
        const href = ($(child).attr('href') || '').toLowerCase()
        const text = $(child).text().toLowerCase()
        if (
          href.includes('facebook.com') ||
          href.includes('x.com') ||
          text.includes('check') ||
          text.includes('latest') ||
          text.includes('updates')
        ) {
          shouldRemove = true
        }
      })

      // Check last <p> itself for keywords
      const lastPText = lastP.text().toLowerCase()
      if (
        lastPText.includes('check') ||
        lastPText.includes('latest') ||
        lastPText.includes('latest') ||
        lastPText.includes('updates')
      ) {
        shouldRemove = true
      }

      if (shouldRemove) {
        lastP.remove()
      }
    }

    return $.html()
  })

  postDetails = postDetails.map((htmlContent) => {
    const $ = cheerio.load(htmlContent)

    if (
      postListings[listing].website &&
      postListings[listing].website.includes('notjustok')
    ) {
      const strongs = $('strong')
      let lastMatch = null
      strongs.each((_, el) => {
        const text = $(el).text().toLowerCase()
        if (
          text.includes('drop') ||
          text.includes('get') ||
          text.includes('fresh')
        ) {
          lastMatch = el
        }
      })
      if (lastMatch) {
        $(lastMatch).remove()
      }
    }

    return $.html()
  })

  postDetails = postDetails.map((htmlContent) => {
    const postUrl = (postListings[listing].url || '').toLowerCase()
    const $ = cheerio.load(htmlContent)

    $('a').each((_, el) => {
      const text = $(el).text().toLowerCase()
      if (text.includes(postUrl)) {
        $(el).replaceWith($(el).text()) // Remove the link, keep the text
      }
    })

    return $.html()
  })

  postDetails = postDetails.map((htmlContent) => {
    const $ = cheerio.load(htmlContent)

    if (
      postListings[listing].website &&
      postListings[listing].website.includes('bestsellingcarsblog')
    ) {
      $('p')
        .filter((_, el) => {
          const text = $(el).text().toLowerCase()
          return (
            text.includes('previous month') || text.includes('one year ago')
          )
        })
        .remove()
    }

    return $.html()
  })

  // After all cleaning:
  const fullContent = postDetails.join('\n')

  // Log the content before saving
  // console.log('[DEBUG] Full content to be saved:', fullContent)

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
