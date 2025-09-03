import siteNames from './websites/sites.js';
import preparePuppeteer from './puppeteerPreparation.js';
import postListing from './postListings.js';
import getPostCotent from './postContent.js';

async function main() {
  // Get the keys of siteNames and limit to first 3
  const limitedSiteKeys = Object.keys(siteNames).slice(0, 3);

  for (const siteKey of limitedSiteKeys) {
    const site = siteNames[siteKey];
    // Limit to two URLs per site
    for (const url of site.siteUrl.slice(0, 2)) {
      console.log('Memory usage before scrape:', process.memoryUsage());

      const { browser, page } = await preparePuppeteer();

      try {
        const postListings = await postListing(page, siteNames, siteKey, url);
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