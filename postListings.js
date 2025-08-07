
import {getElementContent, getElementAttributeValue} from "./functions.js";
import * as cheerio from 'cheerio'
import {isMoreThan24HoursAgo} from "./timeConverter.js";
import fs from 'fs';


// Helper function to write array to file as JSON
function writeArrayToFile(array, filename) {
  fs.writeFileSync(filename, JSON.stringify(array, null, 2), 'utf-8');
}

// Array to store post data
// This will hold the post listings with their details
const postData = [];

// Remove objects from postData if their 'time' property is more than 24 hours ago
for (let i = postData.length - 1; i >= 0; i--) {
  if (postData[i].dateRetrieved && isMoreThan24HoursAgo(postData[i].dateRetrieved)) {
    postData.splice(i, 1);
  }
}

// Function to fetch post listings from a site
 export default async function postListing(page, siteNames, siteName, url) {
  //Get the website name from the siteNames array
  const website = siteNames[siteName].siteUrl[url].split("/")[2];

  //Go to the URL the siteName is pointing to
  await page.goto(siteNames[siteName].siteUrl[url]);

  // Wait for the main container to load
  const html = await page.content();

  // Load the HTML into cheerio
  const $ = cheerio.load(html);

  // Get the post listings from the main container element
  // This will find the elements that match the post container and extract their content
  const result = $(siteNames[siteName].listings.mainContainerEl)
    .find(siteNames[siteName].listings.postContainerEl)
    .children()
    .map((index, content) => {
      // Extract the title
      const title = getElementContent($, content, siteNames[siteName].titleEl.tag, siteNames[siteName].titleEl.tag);

      // Extract the image URL
      const url = getElementAttributeValue($, content, siteNames[siteName].titleLinkEl.tag, siteNames[siteName].titleLinkEl.tag, siteNames[siteName].titleLinkEl.source);

      //Get the date the posting is retrieved
      const dateRetrieved = new Date().toISOString();

      // Find if the postLink already exists in the postData array
      // This prevents adding duplicate posts to the postData array
      const postLink = postData.find((data) => data.title === title);
      
      // If the postLink already exists, skip adding it to avoid duplicates
      // This prevents adding the same post multiple times
      if (postLink) return;
      
      // Add the post data to the postData array
      // This will store the URL, title, website name, and date retrieved for each post
      postData.push({ url, title, website, dateRetrieved });

      // Return the post data object
      // This will be used to create the post listings
      return { url, title, website, dateRetrieved };
      
    })
    .get();
    
    //return the result array containing post listings
    // This will be used in the main function to process each post listing
    return result;
}
