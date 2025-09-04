// import siteNames from './websites/sites.js';
// import preparePuppeteer from './puppeteerPreparation.js';
// import postListing from './postListings.js';
// import getPostCotent from './postContent.js';

// async function main() {
//   // Get the keys of siteNames and limit to first 2
//   const limitedSiteKeys = Object.keys(siteNames).slice(0, 2);

//   for (const siteKey of limitedSiteKeys) {
//     const site = siteNames[siteKey];
//     // Limit to one URL per site
//     for (let urlIdx = 0; urlIdx < Math.min(2, site.siteUrl.length); urlIdx++) {
//       const url = site.siteUrl[urlIdx];
//       console.log('Memory usage before scrape:', process.memoryUsage());

//       const { browser, page } = await preparePuppeteer();

//       try {
//         const postListings = await postListing(page, siteNames, siteKey, urlIdx);
//         await getPostCotent(postListings, page, site);
//       } catch (err) {
//         console.error(`Error scraping ${url}:`, err);
//       } finally {
//         await browser.close();
//         console.log('Memory usage after scrape:', process.memoryUsage());
//       }
//     }
//   }
// }

// main();


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