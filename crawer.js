import preparePuppeteer from "./puppeteerPreparation.js";
import siteNames from "./websites/sites.js";
import postListing from "./postListings.js";
import getPostCotent from "./postContent.js";
import ScrapeStatus from "./scrapeStatus.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  let allScraped = false;

  while (!allScraped) {
    allScraped = true;

    const siteKeys = Object.keys(siteNames);
    for (const siteVar of siteKeys) {
      const site = siteNames[siteVar];
      for (let urlIdx = 0; urlIdx < site.siteUrl.length; urlIdx++) {
        const url = site.siteUrl[urlIdx];

        const alreadyScraped = await ScrapeStatus.findOne({ url });
        if (alreadyScraped) continue;

        allScraped = false;

        const { browser, page } = await preparePuppeteer();

        try {
          const postListings = await postListing(page, siteNames, siteVar, urlIdx);

          // Visit each item in postListings array
          for (let i = 0; i < postListings.length; i++) {
            await getPostCotent([postListings[i]], page, site);
            // Clean up memory for each item
            global.gc?.();
          }
        } catch (err) {
          console.error(`Error scraping ${url}:`, err);
        } finally {
          await page.close();
          await browser.close();
          // Wait for 1 minute before moving to the next URL
          await sleep(60000);
          // Clean up memory after each URL
          global.gc?.();
        }

        await ScrapeStatus.create({ url, siteVar });
      }
    }

    if (allScraped) {
      console.log("All sites and pages scraped. Starting over...");
      await ScrapeStatus.deleteMany({});
    }
  }

  await mongoose.disconnect();
}

main();