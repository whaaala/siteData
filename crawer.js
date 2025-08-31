// import preparePuppeteer  from "./puppeteerPreparation.js";
// import siteNames from "./websites/sites.js";
// import postListing  from "./postListings.js";
// import getPostCotent from "./postContent.js";

// async function main() {
//   //loop through each siteName and its URLs
//   for (const siteName in siteNames) {
//     for (let url = 0; url < siteNames[siteName].siteUrl.length; url++) {
//       // Prepare Puppeteer and get a new page instance
//       const page = await preparePuppeteer();

//       // Call the postListing function with the page, siteNames, siteName, and url
//       const postListings = await postListing(page, siteNames, siteName, url);

//       // console.log(postListings);
      

//       // Process the post listings to get the content
//       const postContent = await getPostCotent(postListings, page, siteNames[siteName]);
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