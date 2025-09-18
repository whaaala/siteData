import preparePuppeteer from './puppeteerPreparation.js'
import { postListing } from './postListings.js'
import ScrapeStatus from './scrapeStatus.js'
import { scrapeAndSaveRaw } from './scrapeRaw.js'
import { rewriteContentStage } from './rewriteStage.js'
import { postToWordpressStage } from './publishStage.js'
import { Post } from './db.js'

const categoryPatterns = {
  News: [
    /nigeria/,
    /news/,
    /politics/,
    /domestic/,
    /metro/,
    /metro-plus/,
    /local/,
    /world/,
    /hot-news/,
    /nigeria-news/,
    /education/,
    /business-news/,
    /business/,
    /social-issues/,
    /africa/,
    /technology/,
    /economy/,
    /business-economy/,
    /features/,
    /energy/,
    /capital-market/,
    /europe/,
    /us/,
    /punch-lite/,
    /lagos-state-news-today/,
    /abuja-city-news-today/,
    /rivers-state-news-today/,
    /kano-news-today/,
    /oyo-state-news-today/,
    /anambra-state-news-today/,
    /kwara-state-news-today/,
    /adamawa-state-news-today/,
    /opinion/,
  ],
  Entertainment: [
    /entertainment/,
    /celebrities/,
    /music/,
    /movies/,
    /tv-shows/,
    /nollywood/,
    /entertainment-news/,
    /songs/,
    /lyrics/,
    /film/,
  ],
  Sports: [
    /sport/,
    /sports/,
    /football/,
    /boxing/,
    /basketball/,
    /womens-basketball/,
    /sport-news/,
    /ghana-premier-league/,
    /boxing/,
  ],
  Lifestyle: [
    /lifestyle/,
    /beauty/,
    /relationships/,
    /weddings/,
    /life/,
    /style/,
    /style-beauty/,
    /fashion/,
    /travels/,
    /daily-travel-and-scholarships-tips/,
    /people/,
    /family-relationship/,
    /relationships-and-weddings/,
  ],
  HealthAndFitness: [
    /health/,
    /fitness/,
    /sexual-health/,
    /mental-health/,
    /maternal-health/,
    /enviroment/,
    /general-health/,
    /gender/,
    /beauty-and-health/,
    /life/,
  ],
  FoodAndDrink: [
    /food/,
    /recipes/,
    /nutrition/,
    /food-and-nutrition/,
    /agriculture/,
    /all/,
  ],
  Gists: [/gist/, /viral/, /extra/, /viral-news/],
  cars: [/posts/, /maintenance-diy/, /road-test/],
}

// Helper to determine category for notJustOk posts
function getCategoryForPost(post, site) {
  if (site.siteName && site.siteName.toLowerCase().includes('notjustok')) {
    // If post is sports, keep as sports, else treat as entertainment
    if (post.category && post.category.toLowerCase().includes('sport')) {
      return 'Sports'
    }
    return 'Entertainment'
  }
  return post.category
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function scrapeOnePerCategory(siteNames) {
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    let found = false
    for (const siteVar of Object.keys(siteNames)) {
      const site = siteNames[siteVar]
      for (let urlIdx = 0; urlIdx < site.siteUrl.length; urlIdx++) {
        const url = site.siteUrl[urlIdx]
        if (patterns.some((pattern) => pattern.test(url))) {
          // Check if already scraped
          const alreadyScraped = await ScrapeStatus.findOne({ url })
          if (alreadyScraped) continue

          const { browser, page } = await preparePuppeteer()
          try {
            let postListings = await postListing(
              page,
              siteNames,
              siteVar,
              urlIdx
            )
            const todayStr = new Date().toISOString().slice(0, 10)
            postListings = postListings.filter((post) => {
              const dateStr = post.dateRetrieved || post.timePosted
              if (!dateStr) return false
              const postDate = new Date(dateStr)
              // Use getCategoryForPost to determine category
              return (
                getCategoryForPost(post, site) === category &&
                postDate.toISOString().slice(0, 10) === todayStr
              )
            })

            // Only process the first new post for this URL
            let processed = false
            for (const post of postListings) {
              const exists = await Post.findOne({ url: post.url })
              if (!exists) {
                const savedPost = await scrapeAndSaveRaw(
                  [post],
                  page,
                  site,
                  process.env.WORDPRESS_URL,
                  process.env.WORDPRESS_USERNAME,
                  process.env.WORDPRESS_PASSWORD
                )
                const rewrittenPost = await rewriteContentStage(savedPost)
                await postToWordpressStage(
                  rewrittenPost,
                  process.env.WORDPRESS_URL,
                  process.env.WORDPRESS_USERNAME,
                  process.env.WORDPRESS_PASSWORD
                )
                console.log(
                  `[Category] Scraped and posted for category ${category}: ${post.title}`
                )
                processed = true
                found = true
                break // Stop after one post for this URL
              }
            }
            // Mark URL as scraped if processed
            if (processed) {
              await ScrapeStatus.create({ url, siteVar })
            }
          } catch (err) {
            console.error(`[Category] Error scraping ${url}:`, err)
          } finally {
            await page.close()
            await browser.close()
          }
        }
        if (found) break
      }
      if (found) break
    }
    if (!found) {
      console.log(
        `[Category] No new post found for category ${category} this hour.`
      )
      console.log(`[Category] URLs checked for category ${category}:`)
      for (const siteVar of Object.keys(siteNames)) {
        const site = siteNames[siteVar]
        for (let urlIdx = 0; urlIdx < site.siteUrl.length; urlIdx++) {
          const url = site.siteUrl[urlIdx]
          if (patterns.some((pattern) => pattern.test(url))) {
            console.log(`  - ${url}`)
          }
        }
      }
      // Do NOT wait, move to next category immediately
      continue
    }
    // Wait 7 minutes before starting the next category
    console.log(`[Category] Waiting 7 minutes before next category scrape...`)
    await sleep(7 * 60 * 1000)
  }
}
