// import preparePuppeteer from './puppeteerPreparation.js'
// import siteNames from './websites/sites.js'
// import postListing from './postListings.js'
// import getPostCotent from './postContent.js'
// import ScrapeStatus from './scrapeStatus.js'
// import mongoose from 'mongoose'
// import dotenv from 'dotenv'
// dotenv.config()

// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms))
// }

// async function main() {
//   await mongoose.connect(process.env.MONGO_URI)

//   // Find the next unscraped URL
//   let nextToScrape = null
//   outer: for (const siteVar of Object.keys(siteNames)) {
//     const site = siteNames[siteVar]
//     for (let urlIdx = 0; urlIdx < site.siteUrl.length; urlIdx++) {
//       const url = site.siteUrl[urlIdx]
//       const alreadyScraped = await ScrapeStatus.findOne({ url })
//       if (!alreadyScraped) {
//         nextToScrape = { siteVar, urlIdx, url }
//         break outer
//       }
//     }
//   }

//   if (!nextToScrape) {
//     // All URLs scraped, reset and start over next run
//     console.log('All sites and pages scraped. Starting over...')
//     await ScrapeStatus.deleteMany({})
//     await mongoose.disconnect()
//     return
//   }

//   const { siteVar, urlIdx, url } = nextToScrape
//   const site = siteNames[siteVar]
//   const { browser, page } = await preparePuppeteer()

//   try {
//     console.log('Memory usage before scrape:', process.memoryUsage())

//     let postListings = await postListing(page, siteNames, siteVar, urlIdx)
//     // Only process the first post in postListings
//     if (postListings.length > 0) {
//       await getPostCotent([postListings[0]], page, site)
//       global.gc?.()
//     }
//     await ScrapeStatus.create({ url, siteVar })

//     // Set large variables to null after use
//     postListings = null

//     console.log('Memory usage after scrape:', process.memoryUsage())
//   } catch (err) {
//     console.error(`Error scraping ${url}:`, err)
//   } finally {
//     await page.close()
//     await browser.close()
//     global.gc?.()
//     await sleep(60000) // Wait 1 minute before process exit
//     await mongoose.disconnect()
//   }
// }

// main()
import preparePuppeteer from './puppeteerPreparation.js'
import siteNames from './websites/sites.js'
import postListing from './postListings.js'
import ScrapeStatus from './scrapeStatus.js'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { scrapeAndSaveRaw } from './scrapeRaw.js'
import { rewriteContentStage } from './rewriteStage.js'
import { postToWordpressStage } from './publishStage.js'
import { Post } from './db.js'
dotenv.config()

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function findRandomToScrape() {
  const unscraped = []
  for (const siteVar of Object.keys(siteNames)) {
    const site = siteNames[siteVar]
    for (let urlIdx = 0; urlIdx < site.siteUrl.length; urlIdx++) {
      const url = site.siteUrl[urlIdx]
      const alreadyScraped = await ScrapeStatus.findOne({ url })
      if (!alreadyScraped) {
        unscraped.push({ siteVar, urlIdx, url })
      }
    }
  }
  if (unscraped.length === 0) return null
  const randomIdx = Math.floor(Math.random() * unscraped.length)
  return unscraped[randomIdx]
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI)

  const nextToScrape = await findRandomToScrape()

  if (!nextToScrape) {
    console.log('✅ [Main] All URLs for all sites have been visited. All sites completed. Starting over...')
    await ScrapeStatus.deleteMany({})
    await mongoose.disconnect()
    return
  }

  const { siteVar, urlIdx, url } = nextToScrape
  const site = siteNames[siteVar]
  const { browser, page } = await preparePuppeteer()

  try {
    console.log(`[Main] Memory usage before scrape:`, process.memoryUsage())
    console.log(`[Main] Scraping site: ${site.siteName || site.domain || siteVar}, URL: ${url}`)

    let postListings = await postListing(page, siteNames, siteVar, urlIdx)
    console.log(`[Main] Found ${postListings.length} post(s) on this page.`)

    // Find the first post in postListings that has not been processed
    let postToProcess = null
    for (const post of postListings) {
      const exists = await Post.findOne({ url: post.url })
      if (!exists) {
        postToProcess = post
        break
      }
    }

    if (postToProcess) {
      console.log(`[Main] Processing post: ${postToProcess.title} (${postToProcess.url})`)
      // Stage 1: Scrape and save raw post for this URL
      const savedPost = await scrapeAndSaveRaw([postToProcess], page, site, process.env.WORDPRESS_URL, process.env.WORDPRESS_USERNAME, process.env.WORDPRESS_PASSWORD)
      // Stage 2: Rewrite the raw post (pass the post or its ID)
      const rewrittenPost = await rewriteContentStage(savedPost)
      // Stage 3: Publish the rewritten post (pass the post or its ID)
      await postToWordpressStage(
        rewrittenPost,
        process.env.WORDPRESS_URL,
        process.env.WORDPRESS_USERNAME,
        process.env.WORDPRESS_PASSWORD
      )
      console.log(`[Main] Finished processing post: ${postToProcess.title}`)
    } else {
      console.log(`[Main] All posts for this URL have already been processed. Marking URL as scraped.`)
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
        `✅ [Main] All URLs for site "${site.siteName || site.domain || siteVar}" have been visited. Site "${site.siteName || site.domain || siteVar}" completed.`
      )
    }

    postListings = null

    console.log('[Main] Memory usage after scrape:', process.memoryUsage())
  } catch (err) {
    console.error(`[Main] Error scraping ${url}:`, err)
  } finally {
    await page.close()
    await browser.close()
    global.gc?.()
    await sleep(30000)
    await mongoose.disconnect()
  }
}

main()

// "start": "npx playwright install && node crawer.js",
