
import puppeteer from "puppeteer";
import {getElementContent, getElementAttributeValue} from "./functions.js";
// const puppeteer = require("puppeteer")
import * as cheerio from 'cheerio'
// const cheerio = require("cheerio");

const postData = [];

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

  // Select the main container and find the post listings and place them in an array
  const result = $(siteNames[siteName].listings.mainContainerEl)
    .find(siteNames[siteName].listings.postContainerEl)
    .children()
    .map((index, content) => {
      // Extract the title
      const title = getElementContent(
        $,
        content,
        siteNames[siteName].titleEl.tag,
        siteNames[siteName].titleEl.tag
      );

      // Extract the image URL
      const url = getElementAttributeValue(
        $,
        content,
        siteNames[siteName].titleLinkEl.tag,
        siteNames[siteName].titleLinkEl.tag,
        siteNames[siteName].titleLinkEl.source
      );

      //Get the date the posting is retrieved
      const dateRetrieved = new Date().toISOString();

      const postLink = postData.find((data) => data.title === title);

      if (postLink) {
        return;
      } else {
        postData.push({ url, title, website, dateRetrieved });
        return { url, title, website, dateRetrieved };
      }
    })
    .get();

  // console.log(postData);

  // Close the page after processing
  // page.close();

  // Return the result
  return result;
}
