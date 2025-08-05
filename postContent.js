import * as cheerio from 'cheerio'
import {getContent, getAttribute} from "./functions.js";
import * as converter from "./openai.js";
// const converter = require("./openai.js");
export default async function getPostCotent(postListings, page, postEls) {
  // Wait for the main container to load

  for (let listing = 0; listing < postListings.length; listing++) {

    if(postListings[listing].url === undefined){
    return;
  }else {
    //Go to the URL the siteName is pointing to
    await page.goto(postListings[listing].url);
  }
    // await page.goto(postListings[listing].url);

    const html = await page.content();

    // Load the HTML into cheerio
    const $ = cheerio.load(html);

    //await sleep(3000)

    // console.log(siteNames[siteName].post);

    //  console.log(postEls.post.datePostedEl);
    const timePosted = getContent($, postEls.post.datePostedEl);
    // const postedTime = $(timePosted).text()
    const author = getContent($, postEls.post.authorEl);
    const category = getContent($, postEls.post.categoryEl);
    const imageLink = getAttribute(
      $,
      postEls.post.imageEl.tag,
      postEls.post.imageEl.source
    );

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

    postListings[listing].author = author;
    postListings[listing].timePosted = timePosted;
    postListings[listing].category = category;
    postListings[listing].imageLink = imageLink;
    postListings[listing].postDetails = postDetails;

    postListings[listing].title = await converter.contentConverter(postListings[listing].title);
    // sleep(4000);
    postListings[listing].postDetails = await converter.contentConverter(postDetails);

     console.log(postListings[listing]);
  }
}
