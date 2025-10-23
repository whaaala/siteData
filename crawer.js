import preparePuppeteer from './puppeteerPreparation.js'
import siteNames from './websites/sites.js'
import postListing from './postListings.js'
import ScrapeStatus from './scrapeStatus.js'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { scrapeAndSaveRaw } from './scrapeRaw.js'
import { rewriteContentStage } from './rewriteStage.js'
import { postToWordpressStage } from './publishStage.js'
import { loadLastVisit, saveLastVisit } from './scraperUtils.js'
import { Post } from './db.js'
import {
  getCategoryPriorities,
  getWeightedRandomCategory,
  logCategoryStatus
} from './dailyCategoryTracker.js'
import { normalizeCategory } from './normalizeCategory.js'
dotenv.config()

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Guess which category a URL will likely produce
 * Based on URL path and site configuration
 */
function guessUrlCategory(url, site) {
  // Validate URL is a string
  if (!url || typeof url !== 'string') {
    return null
  }

  const urlLower = url.toLowerCase()

  // Check URL path for category hints
  if (urlLower.includes('/sport') || urlLower.includes('/football') || urlLower.includes('/basketball')) {
    return 'Sports'
  }
  if (urlLower.includes('/entertainment') || urlLower.includes('/music') || urlLower.includes('/celebrities')) {
    return 'Entertainment'
  }
  if (urlLower.includes('/news') || urlLower.includes('/politics') || urlLower.includes('/business')) {
    return 'News'
  }
  if (urlLower.includes('/gist') || urlLower.includes('/gossip') || urlLower.includes('/viral')) {
    return 'Gists'
  }
  if (urlLower.includes('/food') || urlLower.includes('/recipe') || urlLower.includes('/cooking')) {
    return 'FoodAndDrink'
  }
  if (urlLower.includes('/car') || urlLower.includes('/auto') || urlLower.includes('/vehicle')) {
    return 'Cars'
  }
  if (urlLower.includes('/health') || urlLower.includes('/fitness') || urlLower.includes('/wellness')) {
    return 'HealthAndFitness'
  }
  if (urlLower.includes('/lifestyle') || urlLower.includes('/fashion') || urlLower.includes('/beauty')) {
    return 'Lifestyle'
  }

  // Check site domain for hints
  const domain = url.match(/https?:\/\/([^\/]+)/)?.[1] || ''

  if (domain.includes('notjustok') || domain.includes('bellanaija')) {
    return 'Entertainment'
  }
  if (domain.includes('yabaleft') || domain.includes('lindaikeji')) {
    return 'Gists'
  }
  if (domain.includes('brila') || domain.includes('completesports')) {
    return 'Sports'
  }
  if (domain.includes('food') || domain.includes('recipe') || domain.includes('allrecipes')) {
    return 'FoodAndDrink'
  }
  if (domain.includes('motor') || domain.includes('car') || domain.includes('girlracer')) {
    return 'Cars'
  }
  if (domain.includes('health') || domain.includes('fitness') || domain.includes('womenshealth')) {
    return 'HealthAndFitness'
  }

  // Default guess based on site type
  if (domain.includes('punch') || domain.includes('guardian') || domain.includes('tribune')) {
    return 'News'
  }

  // Unknown - return null to indicate no strong signal
  return null
}

/**
 * Find next URL to scrape with category-weighted selection
 * Prioritizes URLs that will help meet category distribution targets
 */
async function findWeightedToScrape() {
  // Get all unscraped URLs
  const unscraped = []
  for (const siteVar of Object.keys(siteNames)) {
    const site = siteNames[siteVar]

    // Validate site has siteUrl array
    if (!site.siteUrl || !Array.isArray(site.siteUrl)) {
      console.warn(`[Weighted Selection] Site "${siteVar}" has no valid siteUrl array, skipping`)
      continue
    }

    for (let urlIdx = 0; urlIdx < site.siteUrl.length; urlIdx++) {
      const url = site.siteUrl[urlIdx]

      // Skip invalid URLs
      if (!url || typeof url !== 'string') {
        console.warn(`[Weighted Selection] Invalid URL at ${siteVar}[${urlIdx}], skipping`)
        continue
      }

      const alreadyScraped = await ScrapeStatus.findOne({ url })
      if (!alreadyScraped) {
        const guessedCategory = guessUrlCategory(url, site)
        unscraped.push({ siteVar, urlIdx, url, guessedCategory })
      }
    }
  }

  if (unscraped.length === 0) return null

  // Get most needed category
  const neededCategory = await getWeightedRandomCategory()

  if (!neededCategory) {
    // All targets met, pick randomly
    const randomIdx = Math.floor(Math.random() * unscraped.length)
    return unscraped[randomIdx]
  }

  // Filter URLs that match needed category
  const matchingUrls = unscraped.filter(item => item.guessedCategory === neededCategory)

  if (matchingUrls.length > 0) {
    // Pick randomly from matching URLs
    const randomIdx = Math.floor(Math.random() * matchingUrls.length)
    console.log(`[Weighted Selection] 🎯 Targeting "${neededCategory}" content (${matchingUrls.length} matching URLs)`)
    return matchingUrls[randomIdx]
  }

  // No exact matches, pick from all unscraped
  const randomIdx = Math.floor(Math.random() * unscraped.length)
  console.log(`[Weighted Selection] ⚠️ No URLs found for "${neededCategory}", selecting randomly`)
  return unscraped[randomIdx]
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI)

  // Log category distribution status
  await logCategoryStatus()

  const nextToScrape = await findWeightedToScrape()

  if (!nextToScrape) {
    console.log(
      '✅ [Main] All URLs for all sites have been visited. All sites completed. Starting over...'
    )
    await ScrapeStatus.deleteMany({})
    await mongoose.disconnect()
    return
  }

  const { siteVar, urlIdx, url } = nextToScrape
  const site = siteNames[siteVar]
  const { browser, page } = await preparePuppeteer()

  // Block images, stylesheets, and fonts to save memory
  await page.route('**/*', (route) => {
    const type = route.request().resourceType()
    if (['stylesheet', 'font'].includes(type)) {
      route.abort()
    } else {
      route.continue()
    }
  })

  // Move these outside the try block so they're always defined
  const lastVisit = loadLastVisit()
  const now = new Date()
  const lastVisitTime = lastVisit[url] ? new Date(lastVisit[url]) : null
  const todayStr = now.toISOString().slice(0, 10)

  // Track whether we successfully published a post
  let postPublishedSuccessfully = false

  try {
    console.log(`[Main] Memory usage before scrape:`, process.memoryUsage())
    console.log(
      `[Main] Scraping site: ${
        site.siteName || site.domain || siteVar
      }, URL: ${url}`
    )

    let postListings = await postListing(page, siteNames, siteVar, urlIdx)
    console.log(`[Main] Found ${postListings.length} post(s) on this page.`)

    // If we got here without error, we can proceed with filtering

    postListings = postListings.filter((post) => {
      const dateStr = post.dateRetrieved || post.timePosted
      if (!dateStr) return false
      const postDate = new Date(dateStr)
      const isToday = postDate.toISOString().slice(0, 10) === todayStr
      const isAfterLastVisit = !lastVisitTime || postDate > lastVisitTime

      if (isToday && isAfterLastVisit) {
        console.log(
          `[LOG] Post "${post.title}" is from today AND new since last visit.`
        )
      }
      return isToday && isAfterLastVisit
    })

    if (postListings.length === 0) {
      console.log(
        `[LOG] No new posts from today and since last visit for URL: ${url}`
      )
    }
    // Find the first post in postListings that has not been processed
    let postToProcess = null
    for (const post of postListings) {
      // Custom category logic for notjustok

      if (post.url && post.url.toLowerCase().includes('notjustok')) {
        if (post.category && post.category.toLowerCase().includes('sports')) {
          post.category = 'Sports'
        } else {
          post.category = 'Entertainment'
        }
      }
      const exists = await Post.findOne({ url: post.url })
      if (!exists) {
        postToProcess = post
        break
      }
    }

    if (postToProcess) {
      console.log(
        `[Main] Processing post: ${postToProcess.title} (${postToProcess.url})`
      )
      // Stage 1: Scrape and save raw post for this URL
      const savedPost = await scrapeAndSaveRaw(
        [postToProcess],
        page,
        site,
        process.env.WORDPRESS_URL,
        process.env.WORDPRESS_USERNAME,
        process.env.WORDPRESS_PASSWORD
      )
      // Stage 2: Rewrite the raw post (pass the post or its ID)
      const rewrittenPost = await rewriteContentStage(savedPost)
      // Stage 3: Publish the rewritten post (pass the post or its ID)
      const publishedPost = await postToWordpressStage(
        rewrittenPost,
        process.env.WORDPRESS_URL,
        process.env.WORDPRESS_USERNAME,
        process.env.WORDPRESS_PASSWORD
      )

      // Check if post was successfully published to WordPress
      if (publishedPost && publishedPost.wpPostId) {
        postPublishedSuccessfully = true
        console.log(`[Main] ✅ Post successfully published to WordPress (ID: ${publishedPost.wpPostId})`)
      }

      console.log(`[Main] Finished processing post: ${postToProcess.title}`)
    } else {
      console.log(
        `[Main] All posts for this URL have already been processed. Marking URL as scraped.`
      )
      await ScrapeStatus.create({ url, siteVar })
    }

    // Check if all URLs for this site have been scraped
    const allSiteUrls = site.siteUrl
    let allScraped = true
    for (const siteUrl of allSiteUrls) {
      const scraped = await ScrapeStatus.findOne({ url: siteUrl })
      if (!scraped) {
        allScraped = false
        break
      }
    }
    if (allScraped) {
      console.log(
        `✅ [Main] All URLs for site "${
          site.siteName || site.domain || siteVar
        }" have been visited. Site "${
          site.siteName || site.domain || siteVar
        }" completed.`
      )
    }

    postListings = null
    postToProcess = null

    console.log('[Main] Memory usage after scrape:', process.memoryUsage())
  } catch (err) {
    console.error(`[Main] Error scraping ${url}:`, err)

    // If there's a critical error (like invalid site config), mark URL as scraped to skip it
    if (err.message && err.message.includes('[postListing]')) {
      console.error(`[Main] Critical configuration error. Marking URL as scraped to skip it.`)
      await ScrapeStatus.create({ url, siteVar })
    }
  } finally {
    await page.close()
    await browser.close()
    global.gc?.()
    await sleep(5000)
    lastVisit[url] = now.toISOString()
    saveLastVisit(lastVisit)
    await mongoose.disconnect()

    // Exit with code 1 if no post was published successfully
    // This makes scheduler retry after 1 minute instead of 8 minutes
    if (!postPublishedSuccessfully) {
      console.log('[Main] ⚠️ No post published successfully. Exiting with code 1 for fast retry...')
      process.exit(1)
    }
  }
}

main()

// "start": "npx playwright install && node crawer.js",
