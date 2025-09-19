import {
  getElementContent,
  getElementAttributeValue,
  getContent,
} from './functions.js'
import * as cheerio from 'cheerio'
import { isMoreThan24HoursAgo } from './timeConverter.js'
import fs from 'fs'

// Array to store post data
// This will hold the post listings with their details
let postData = []

// File to store post objects
const postDataFile = 'postData.json'

// Load existing data from file if it exists
if (fs.existsSync(postDataFile)) {
  try {
    const fileContent = fs.readFileSync(postDataFile, 'utf-8')
    const loaded = JSON.parse(fileContent)
    if (Array.isArray(loaded)) {
      postData = loaded
    }
  } catch (e) {
    postData = []
  }
}

// Remove objects from postData if their 'time' property is more than 24 hours ago
for (let i = postData.length - 1; i >= 0; i--) {
  if (
    postData[i].dateRetrieved &&
    isMoreThan24HoursAgo(postData[i].dateRetrieved)
  ) {
    postData.splice(i, 1)
  }
}

// Helper function to write array to file as JSON
function writeArrayToFile(array, filename) {
  fs.writeFileSync(filename, JSON.stringify(array, null, 2), 'utf-8')
}

// Function to fetch post listings from a site
export default async function postListing(page, siteNames, siteName, url) {
  //Get the website name from the siteNames array
  const website = siteNames[siteName].siteUrl[url].split('/')[2]

  //Go to the URL the siteName is pointing to
  await page.goto(siteNames[siteName].siteUrl[url])

  // Wait for the main container to load
  const html = await page.content()

  // Load the HTML into cheerio
  const $ = cheerio.load(html)

  // Get the post listings from the main container element
  // This will find the elements that match the post container and extract their content
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
      )

      // Skip the first object if its title is longer than 100 characters
      if (index === 0 && typeof title === 'string' && title.length > 100) {
        return
      }

      // Extract the image URL
      let url = getElementAttributeValue(
        $,
        content,
        siteNames[siteName].titleLinkEl.tag,
        siteNames[siteName].titleLinkEl.tag,
        siteNames[siteName].titleLinkEl.source
      )

       // Ensure absolute URL for pulse.ng
      if (website.includes('pulse.ng') && url && !/^https?:\/\//i.test(url)) {
        // Ensure url starts with a slash
        const path = url.startsWith('/') ? url : '/' + url
        url = 'https://www.pulse.ng' + path
      }else if (website.includes('pulse.com.gh') && url && !/^https?:\/\//i.test(url)) {
        // Ensure url starts with a slash
        const path = url.startsWith('/') ? url : '/' + url
        url = 'https://www.pulse.com.gh' + path
      }  // Ensure absolute URL for theguardian
      else if (website.includes('theguardian') && url && !/^https?:\/\//i.test(url)) {
        // Ensure url starts with a slash
        const path = url.startsWith('/') ? url : '/' + url
        url = 'https://www.theguardian.com' + path
      } // Ensure absolute URL for motortrend.com
      else if (website.includes('motortrend') && url && !/^https?:\/\//i.test(url)) {
        // Ensure url starts with a slash
        const path = url.startsWith('/') ? url : '/' + url
        url = 'https://www.motortrend.com' + path
      }

      // Extract the category if available  
      let category = ''
      if (
        siteNames[siteName].categoryEl &&
        siteNames[siteName].categoryEl !== ''
      ) {
        category = getContent($, siteNames[siteName].categoryEl)
      }

       let imageLink = ''
      if (website.includes('healthwise')) {
        imageLink = getElementAttributeValue(
          $,
          content,
          siteNames[siteName].imageEl.tag,
          siteNames[siteName].imageEl.tag,
          siteNames[siteName].imageEl.source
        )
        // If imageLink is a style string, extract the URL
        if (
          typeof imageLink === 'string' &&
          imageLink.includes('background-image')
        ) {
          const match = imageLink.match(
            /background(?:-image)?:?\s*url\(['"]?(.*?)['"]?\)/i
          )
          if (match && match[1]) {
            imageLink = match[1]
          }
        }
      }

      //Get the date the posting is retrieved
      const dateRetrieved = new Date().toISOString()

      // Find if the postLink already exists in the postData array
      // This prevents adding duplicate posts to the postData array
      const postLink = postData.find((data) => data.title === title)

      // If the postLink already exists, skip adding it to avoid duplicates
      // This prevents adding the same post multiple times
      if (postLink) return

      // Add the post data to the postData array
      // This will store the URL, title, website name, and date retrieved for each post
      // postData.push({ url, title, website, dateRetrieved });
      const postObj = { url, title, website, category, dateRetrieved, imageLink }
      postData.push(postObj)

      // Write updated postData array to file after every addition
      // writeArrayToFile(postData, postDataFile);

      // Return the post data object
      // This will be used to create the post listings
      return { url, title, website, category, dateRetrieved, imageLink }
    })
    .get()

  // Filter out posts with invalid or missing URLs
  const filteredResult = result.filter(
    post => typeof post?.url === 'string' && post.url.trim() !== ''
  )

  //return the result array containing post listings
  // This will be used in the main function to process each post listing
  return filteredResult
}
