import preparePuppeteer  from "./puppeteerPreparation.js";
import * as cheerio from 'cheerio'
// const converter = require("./openai.js");
// const OpenAI = require("openai");

// require("dotenv").config

// const openAIClient = new OpenAI({
//   apikey: process.env['OPENAI_API_KEY']
// })

// const chatCompletion = await openAIClient.chat.completions.create({
//   model:"gpt-3.5.turbo",
//   messages: [
//     {
//       role: "system",
//       content: "You are a helpful assistant."
//     },
//     {
//       role: "user",
//       constent: "what is the meaning of life"
//     }

//   ]

// })

const dailypost = {
  siteUrl: [
    "https://dailypost.ng/hot-news/",
    // 'https://dailypost.ng/politics/',
    // 'https://dailypost.ng/metro/',
    // 'https://dailypost.ng/entertainment/',
    // 'https://dailypost.ng/sport-news/',
  ],
  listings: {
    mainContainerEl: ".mvp-main-blog-body",
    postHeadLineContainerEl: "#mvp-cat-feat-wrap",
    postContainerEl: "ul",
  },
  titleEl: {
    tag: "h2",
    link: "",
  },
  titleLinkEl: {
    tag: "a",
    source: "href",
  },
  imageEl: {
    tag: "img",
    source: "src",
    alt: "",
  },
  post: {
    categoryEl: ".mvp-post-cat span",
    authorEl: ".author-name a",
    datePostedEl: ".post-date",
    mainContainerEl: "#mvp-content-wrap",
    contentEl: "#mvp-content-main",
    elToReFromPostEl: [
      "#google_image_div",
      ".ai-viewport-2",
      ".heateorSssClear",
      ".heateor_sss_sharing_container",
      ".code-block",
    ],
    imageEl: {
      tag: ".attachment-",
      tag1: "",
      source: "src",
      source1: "srcset",
      alt: "",
    },
  },
};

const leadership = {
  siteUrl: [
    // 'https://healthwise.punchng.com/category/general-health/',
    // 'https://punchng.com/topics/news/',
    'https://punchng.com/topics/punch-lite/',
  ],
  listings: {
    mainContainerEl: '.row',
    postHeadLineContainerEl: '',
    postContainerEl: '.mobile-only',
  },
  titleEl: {
    tag: '.post-title a',
    link: '',
  },
  titleLinkEl: {
    tag: '.post-title a',
    source: 'href',
  },
  imageEl: {
    tag: '',
    source: '',
    alt: '',
  },
  categoryEl: 'header .section-title .header-title',
  post: {
    categoryEl: '',
    authorEl: '.post-author a',
    datePostedEl: '.post-date',
    mainContainerEl: '.col-lg-8',
    contentEl: '.post-content',
    elToReFromPostEl: [
      '.ad-container',
      '#show360playvid',
      "[dock^='#pv-dock-slot']",
      "[style^='left']",
      '.post-title',
    ],
    imageEl: {
      tag: '.post-image',
      tag1: '',
      source: 'src',
      source1: '',
      alt: '',
    },
  },
}


// const siteNames = [dailypost];
const siteNames = [leadership];

const postData = [];

// Function to fetch post listings from a site
async function postListing(page, siteNames, siteName, url) {
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
      let category = "";
      if (siteNames[siteName].categoryEl && siteNames[siteName].categoryEl !== "") {
        category = getContent($, siteNames[siteName].categoryEl);
    }


      //Get the date the posting is retrieved
      const dateRetrieved = new Date().toISOString();

      const postLink = postData.find((data) => data.title === title);

      if (postLink) {
        return;
      } else {
        postData.push({ url, title, website, category, dateRetrieved });
        return { url, title, website, category, dateRetrieved };
      }
    })
    .get();

  // console.log(postData);

  // Close the page after processing
  // page.close();

  // Return the result
  return result;
}

// Function to prepare Puppeteer and set up the page
// async function preparePuppeteer() {
//   const browser = await puppeteer.launch({
//     headless: false,
//     args: ["javascript:close()"],
//     protocolTimeout: 1000000,
//   });
//   // Create a new page
//   const page = await browser.newPage();

//   // Add the below 1 line of code
//   page.setDefaultNavigationTimeout(0);

//   const customUserAgent =
//     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36";

//   // Set custom user agent
//   await page.setUserAgent(customUserAgent);

//   return page;
// }

async function getPostCotent(postListings, page, postEls) {
  // Wait for the main container to load
 
  
  for (let listing = 0; listing < postListings.length; listing++) {
    
    if(postListings[listing].url === undefined){
    continue;
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

    let category = postListings[listing].category;
    if ((!category || category === "" || category === "No content") && postEls.post.categoryEl && postEls.post.categoryEl !== "") {
        category = getContent($, postEls.post.categoryEl);
    }
    // const category = getContent($, postEls.post.categoryEl);
    let imageLink = getAttribute(
      $,
      postEls.post.imageEl.tag,
      postEls.post.imageEl.source
    );

if (imageLink && imageLink.includes('Guardian-grey.jpg')) {
  // Try to get the image again, for example using source1 if available
  if (postEls.post.imageEl.source1) {
    let altImageLink = getAttribute($, postEls.post.imageEl.tag, postEls.post.imageEl.source1);
    if (altImageLink && altImageLink !== "No attribute") {
      // If there are multiple values separated by space, use the first one
      altImageLink = altImageLink.split(' ')[0];
      imageLink = altImageLink;
    }
  }
  // If you want to try another fallback, add it here
}
    // // If imageLink does not start with http, prepend the website domain
    // if (imageLink && !/^https?:\/\//i.test(imageLink)) {
    //     // Ensure website does not end with '/' and imageLink does not start with '/'
    //     const website = postListings[listing].website.replace(/\/$/, '');
    //     imageLink = website + (imageLink.startsWith('/') ? '' : '/') + imageLink;
    // }

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

    // postListings[listing].title = await converter.contentConverter(postListings[listing].title);
    // // sleep(4000);
    // postListings[listing].postDetails = await converter.contentConverter(postDetails);

     console.log(postListings[listing]);
  }
}


async function main() {
  //loop through each siteName and its URLs
  for (const siteName in siteNames) {
    for (let url = 0; url < siteNames[siteName].siteUrl.length; url++) {
      // Prepare Puppeteer and get a new page instance
      const page = await preparePuppeteer();

      // Call the postListing function with the page, siteNames, siteName, and url
      const postListings = await postListing(page, siteNames, siteName, url);

      console.log(postListings);

      //Process the post listings to get the content
      const postContent = await getPostCotent(
        postListings,
        page,
        siteNames[siteName]
      );

      console.log(postContent);
    }
  }
}

const getElementContent = ($, element, selector, element1) => {
  if ($(element).find(selector).length !== 0 && selector === element1) {
    return $(element).find(selector).text() || "No content";
  }
};

const getAttributeValueFromParentElement = ($, element, attribute) => {
  return $(element).parent().attr(attribute) || "No attribute";
};

const getElementAttributeValue = (
  $,
  element,
  selector,
  element1,
  attribute
) => {
  if ($(element).find(selector).length !== 0 && selector === element1) {
    return $(element).find(selector).attr(attribute) || "No attribute";
  }
};

const getContent = ($, element) => {
  if ($(element).length !== 0) {
    return $(element).text().trim() || "No content";
  }
};

const getAttribute = ($, element, attr) => {
  if ($(element).length !== 0) {
    return $(element).attr(attr) || "No attribute";
  }
};

async function sleep(millseconds) {
  return new Promise((resolve) => setTimeout(resolve, millseconds));
}

main();