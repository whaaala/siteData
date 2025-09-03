import siteNames from './websites/sites.js';
import preparePuppeteer from './puppeteerPreparation.js';
import postListing from './postListings.js';
import getPostCotent from './postContent.js';

async function main() {
  // Limit to first 3 sites
  const limitedSites = siteNames.slice(0, 3);

  for (const site of limitedSites) {
    // Limit to two URL per site
    for (const url of site.siteUrl.slice(0, 2)) {
      console.log('Memory usage before scrape:', process.memoryUsage());

      const { browser, page } = await preparePuppeteer();

      try {
        const postListings = await postListing(page, site, url);
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