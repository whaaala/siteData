import preparePuppeteer from "./puppeteerPreparation.js";
import siteNames from "./websites/sites.js";
import postListing from "./postListings.js";
import getPostCotent from "./postContent.js";
import ScrapeStatus from "./scrapeStatus.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI);

  let allScraped = false;

  while (!allScraped) {
    allScraped = true; // Assume all are scraped unless we find one not scraped

    const siteKeys = Object.keys(siteNames);
    for (const siteVar of siteKeys) {
      const site = siteNames[siteVar];
      for (let urlIdx = 0; urlIdx < site.siteUrl.length; urlIdx++) {
        const url = site.siteUrl[urlIdx];

        // Check if already scraped
        const alreadyScraped = await ScrapeStatus.findOne({ url });
        if (alreadyScraped) continue;

        allScraped = false; // Found at least one not scraped

        const { browser, page } = await preparePuppeteer();

        try {
          const postListings = await postListing(page, siteNames, siteVar, urlIdx);
          await getPostCotent(postListings, page, site);
          // Mark as scraped
          await ScrapeStatus.create({ url, siteVar });
        } catch (err) {
          console.error(`Error scraping ${url}:`, err);
        } finally {
          await page.close();
          await browser.close(); 
        }
      }
    }

    // If allScraped is true, clear the ScrapeStatus collection to start over
    if (allScraped) {
      console.log("All sites and pages scraped. Starting over...");
      await ScrapeStatus.deleteMany({});
    }
  }

  await mongoose.disconnect();
}

main();