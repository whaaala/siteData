import preparePuppeteer from "./puppeteerPreparation.js";
import siteNames from "./websites/sites.js";
import postListing from "./postListings.js";
import getPostCotent from "./postContent.js";
import runRandomUrls from "./randomRunner.js"; // Import your random logic

async function main() {
  // Sequentially process sites to reduce memory usage
  for (let i = 0; i < 10; i++) {
    // Get a random site variable and two random URLs
    const { siteVar, selectedUrls } = await runRandomUrls();

    for (const url of selectedUrls) {
      // Prepare browser and page
      const { browser, page } = await preparePuppeteer(); // Update preparePuppeteer to return both

      try {
        const postListings = await postListing(page, siteNames, siteVar, url);
        await getPostCotent(postListings, page, siteNames[siteVar]);
      } catch (err) {
        console.error(`Error scraping ${url}:`, err);
      } finally {
        // Always close browser after scraping
        await browser.close();
      }
    }
  }
}

main();