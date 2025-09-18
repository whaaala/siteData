import preparePuppeteer from './puppeteerPreparation.js';
import { postListing } from './postListings.js';
import { scrapeAndSaveRaw } from './scrapeRaw.js';
import { rewriteContentStage } from './rewriteStage.js';
import { postToWordpressStage } from './publishStage.js';
import { Post } from './db.js';

const wordpressUrl = process.env.WORDPRESS_URL;
const username = process.env.WORDPRESS_USERNAME;
const password = process.env.WORDPRESS_PASSWORD;

export async function scrapeUrl(url, category, site) {
  const { browser, page } = await preparePuppeteer();
  let publishedCount = 0;
  try {
    let postListings = await postListing(page, { [site.siteName]: site }, site.siteName, site.siteUrl.indexOf(url));
    const todayStr = new Date().toISOString().slice(0, 10);
    postListings = postListings.filter(post => {
      const postDate = new Date(post.dateRetrieved || post.timePosted);
      const isToday = postDate.toISOString().slice(0, 10) === todayStr;
      return post.category === category && isToday;
    });

    for (const post of postListings) {
      const exists = await Post.findOne({ url: post.url });
      if (exists) continue;

      const savedPost = await scrapeAndSaveRaw(
        [post],
        page,
        site,
        wordpressUrl,
        username,
        password
      );
      const rewrittenPost = await rewriteContentStage(savedPost);
      await postToWordpressStage(
        rewrittenPost,
        wordpressUrl,
        username,
        password
      );
      publishedCount++;
      console.log(`[Scheduler] Scraped and posted: ${post.title} (${post.url})`);
      if (publishedCount >= 10) break; // Stop if we've posted 10 for this category
    }
  } catch (err) {
    console.error(`[Scheduler] Error scraping ${url}:`, err);
  } finally {
    await page.close();
    await browser.close();
  }
  return publishedCount;
}