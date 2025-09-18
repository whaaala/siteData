import { scrapeUrl } from './scrapeUrl.js';
import { getCategoryFromUrl } from './websites/sites.js';

async function scrapeOnePostPerSite(siteNames) {
  // Randomly shuffle the siteNames array
  const shuffledSites = siteNames
    .map(site => ({ site, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ site }) => site);

  for (const site of shuffledSites) {
    // For each URL in the site, scrape one post
    for (const url of site.siteUrl) {
      const category = getCategoryFromUrl(url, site.siteName || '');
      await scrapeUrl(url, category, site);
      // Wait 3 minutes before scraping the next post
      await new Promise(res => setTimeout(res, 2 * 60 * 1000));
    }
  }
}

export { scrapeOnePostPerSite };