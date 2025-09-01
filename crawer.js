import preparePuppeteer from "./puppeteerPreparation.js";
import siteNames from "./websites/sites.js";
import postListing from "./postListings.js";
import getPostCotent from "./postContent.js";
import runRandomUrls from "./randomRunner.js"; // Import your random logic

async function main() {
  // Example: run the random selection 10 times
  for (let i = 0; i < 10; i++) {
    // Get a random site variable and two random URLs
    const { siteVar, selectedUrls } = await runRandomUrls();

    // For each selected URL, run your scraping logic
    for (const url of selectedUrls) {
      const page = await preparePuppeteer();
      const postListings = await postListing(page, siteNames, siteVar, url);
      await getPostCotent(postListings, page, siteNames[siteVar]);
    }
  }
}

main();