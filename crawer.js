import siteNames from './websites/sites.js';
import preparePuppeteer from './puppeteerPreparation.js';
import postListing from './postListings.js';
import getPostCotent from './postContent.js';

async function main() {
  // Get the keys of siteNames and limit to first 1
  const limitedSiteKeys = Object.keys(siteNames).slice(0, 1);

  for (const siteKey of limitedSiteKeys) {
    const site = siteNames[siteKey];
    // Limit to one URL per site
    for (let urlIdx = 0; urlIdx < Math.min(1, site.siteUrl.length); urlIdx++) {
      const url = site.siteUrl[urlIdx];
      console.log('Memory usage before scrape:', process.memoryUsage());

      const { browser, page } = await preparePuppeteer();

      try {
        const postListings = await postListing(page, siteNames, siteKey, urlIdx);
        await getPostCotent(postListings, page, site);
      } catch (err) {
        console.error(`Error scraping ${url}:`, err);
      } finally {
        await browser.close();
        console.log('Memory usage after scrape:', process.memoryUsage());
      }
    }
  }
}

main();