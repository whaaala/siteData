import * as cheerio from 'cheerio'
import {getContent, getAttribute} from "./functions.js";
import * as converter from "./openai.js";


export default async function getPostCotent(postListings, page, postEls) {
  // Loop through each postListing to get the content
  for (let listing = 0; listing < postListings.length; listing++) {

    // Check if the postListing has a URL, if not, skip to the next iteration
    // This is to avoid errors if the URL is undefined or null
    if(postListings[listing].url === undefined) return;
  
    //Go to the post URL
    await page.goto(postListings[listing].url);
  
  // Wait for the page to load
    const html = await page.content();

    // Load the HTML into cheerio
    const $ = cheerio.load(html);

    //Get the date, author, category and image link of the post
    const timePosted = getContent($, postEls.post.datePostedEl);
    const author = getContent($, postEls.post.authorEl);
    const category = getContent($, postEls.post.categoryEl);
    const imageLink = getAttribute($,postEls.post.imageEl.tag, postEls.post.imageEl.source);

    //Get the post content
    //Find the main container element that holds the post content
    const postDetails = $(postEls.post.mainContainerEl)
      .find(postEls.post.contentEl)
      .map((_, el) => {
        //Remove the element content from the DOM that is not needed
        for (let i = 0; i < postEls.post.elToReFromPostEl.length; i++) {
          if ($(el).find(postEls.post.elToReFromPostEl[i]) !== 0) {
            $(postEls.post.elToReFromPostEl[i]).remove();
          }
        }

        //Add the content to the postLising Arry for each object
        return $(el).html();
      })
      .get();

    //Add the post details to the postListings array
    postListings[listing].author = author;
    postListings[listing].timePosted = timePosted;
    postListings[listing].category = category;
    postListings[listing].imageLink = imageLink;
    postListings[listing].postDetails = postDetails;

    // Convert the post title and content using the contentConverter function
    // postListings[listing].title = await converter.contentConverter(postListings[listing].title);
    // postListings[listing].postDetails = await converter.contentConverter(postDetails);

    // Log the postListings for debugging
     console.log(postListings[listing]);
  }
}
