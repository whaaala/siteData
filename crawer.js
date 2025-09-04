import preparePuppeteer from './puppeteerPreparation.js'
import siteNames from './websites/sites.js'
import postListing from './postListings.js'
import getPostCotent from './postContent.js'
import ScrapeStatus from './scrapeStatus.js'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI)

  // Find the next unscraped URL
  let nextToScrape = null
  outer: for (const siteVar of Object.keys(siteNames)) {
    const site = siteNames[siteVar]
    for (let urlIdx = 0; urlIdx < site.siteUrl.length; urlIdx++) {
      const url = site.siteUrl[urlIdx]
      const alreadyScraped = await ScrapeStatus.findOne({ url })
      if (!alreadyScraped) {
        nextToScrape = { siteVar, urlIdx, url }
        break outer
      }
    }
  }

  if (!nextToScrape) {
    // All URLs scraped, reset and start over next run
    console.log('All sites and pages scraped. Starting over...')
    await ScrapeStatus.deleteMany({})
    await mongoose.disconnect()
    return
  }

  const { siteVar, urlIdx, url } = nextToScrape
  const site = siteNames[siteVar]
  const { browser, page } = await preparePuppeteer()

  try {
    console.log('Memory usage before scrape:', process.memoryUsage())

    const postListings = await postListing(page, siteNames, siteVar, urlIdx)
    // Only process the first post in postListings
    if (postListings.length > 0) {
      await getPostCotent([postListings[0]], page, site)
      global.gc?.()
    }
    await ScrapeStatus.create({ url, siteVar })

    // Set large variables to null after use
    postListings = null

    console.log('Memory usage after scrape:', process.memoryUsage())
  } catch (err) {
    console.error(`Error scraping ${url}:`, err)
  } finally {
    await page.close()
    await browser.close()
    global.gc?.()
    await sleep(60000) // Wait 1 minute before process exit
    await mongoose.disconnect()
  }
}

main()
