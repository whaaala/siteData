
import preparePuppeteer  from "./puppeteerPreparation.js";
import siteNames from "./websites/sites.js";
import postListing  from "./postListings.js";
import getPostCotent from "./postContent.js";

async function main() {
  //loop through each siteName and its URLs
  for (const siteName in siteNames) {
    for (let url = 0; url < siteNames[siteName].siteUrl.length; url++) {
      // Prepare Puppeteer and get a new page instance
      const page = await preparePuppeteer();

      // Call the postListing function with the page, siteNames, siteName, and url
      const postListings = await postListing(page, siteNames, siteName, url);

      // Process the post listings to get the content
      const postContent = await getPostCotent(postListings, page, siteNames[siteName]);
    }
  }
}

main();

