const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const siteUrl = "https://dailypost.ng/";

const scrapingResult = {
  title: "",
  category: "",
  dateRetrieved: new Date("21-07-2025 12:00:00"),
  datePostedOnSite: "",
  url: "",
  postImage: "",
  mainImage: "",
  content: "",
};

const dailypost = {
  siteUrl: [
    "https://dailypost.ng/2025/07/24/zamfara-govt-slams-factional-lawmakers-denies-neglecting-victims-of-bandits/",
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
    elToReFromPostEl: ["#google_image_div", ".ai-viewport-2", ".heateorSssClear", ".heateor_sss_sharing_container", ".code-block"],
    imageEl: {
      tag: ".attachment-",
      tag1: "",
      source: "src",
      source1: "srcset",
      alt: "",
    }
  }
};

const leadership = {
  siteUrl: [
    "https://leadership.ng/nigeria-news/",
    "https://leadership.ng/politics/",
    "https://leadership.ng/nigeria-news/business-news/",
  ],
  listings: {
    mainContainerEl: ".mvp-main-blog-body",
    postContainerEl: ".mvp-widget-feat2-right-cont",
  },
  titleEl: {
    tag: "h2",
    link: "",
  },
  titleLinkEl: {
    tag: "",
    source: "href",
  },
  imageEl: {
    tag: "img",
    source: "src",
    alt: "",
  },
};

const siteNames = [dailypost];

async function postListing(page) {
  for (const siteName in siteNames) {
    for (let url = 0; url < siteNames[siteName].siteUrl.length; url++) {
      // const browser = await puppeteer.launch({ headless: false });

      // Add the below 1 line of code
      page.setDefaultNavigationTimeout(0);

      const customUserAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36";

      // Set custom user agent
      await page.setUserAgent(customUserAgent);

      await page.goto(siteNames[siteName].siteUrl[url]);

      const html = await page.content();
      const $ = cheerio.load(html);
     
      // const result =  $(siteNames[siteName].listings.mainContainerEl).find(siteNames[siteName].listings.postContainerEl).children()
      //   .map((index, content) => {
      //     const title = getElementContent($, content, siteNames[siteName].titleEl.tag, siteNames[siteName].titleEl.tag);

      //     const url = getElementAttributeValue($, content,siteNames[siteName].titleLinkEl.tag, siteNames[siteName].titleLinkEl.tag, siteNames[siteName].titleLinkEl.source);  
          
      //     const dateRetrieved = new Date().toISOString();

      //     return {title, url, dateRetrieved};
      //   })
      //   .get();

      // const result = $(siteNames[siteName].listings.mainContainerEl)

      
      // const timePosted = $(siteNames[siteName].post.datePostedEl).text().trim() || "No date posted";
      const timePosted = getContent($,siteNames[siteName].post.datePostedEl);
      const author = getContent($, siteNames[siteName].post.authorEl);
      const category = getContent($, siteNames[siteName].post.categoryEl);
      const imageLink = getAttribute($, siteNames[siteName].post.imageEl.tag, siteNames[siteName].post.imageEl.source)

       postDetails = $(siteNames[siteName].post.mainContainerEl).find(siteNames[siteName].post.contentEl).map((_, el) => {

          //Remove the element content from the DOM that is not needed
          for (let i = 0; i < siteNames[siteName].post.elToReFromPostEl.length; i++) {
            if($(el).find(siteNames[siteName].post.elToReFromPostEl[i]) !== 0) {
              $(siteNames[siteName].post.elToReFromPostEl[i]).remove();
            }
          }

        //Add the content to the postLising Arry for each object
        return $(el).html();
       }).get()


      console.log({timePosted, author, category, imageLink, postDetails});
      // console.log(result);
      page.close();
      // return result;
    }
  }


  // $("section").find(siteNames[siteName].listings.postHeadLineContainerEl)
  //   .find(".mvp-widget-feat2-right-cont")
  //   .each((index, content) => {

  //     scrapingResult.title = getElementContent($, content, "h2", "h2");

  //     if(siteUrl.includes('dailypost')){
  //       scrapingResult.url = getAttributeValueFromParentElement($, content, "href");
  //     }
  //     scrapingResult.postImage = getElementAttributeValue($, content,'img', 'img', 'src')
  //     scrapingResult.category = getElementContent($, content, "span", "span");
  //     scrapingResult.dateRetrieved = new Date().toISOString();

  //     console.log(scrapingResult);
  //   });
}

// const getElementText = ($, element, selector) => {
//   if ($(element).find(selector).length !== 0 && selector === "h2") {
//     return $(element).find(selector).text() || "No title";
//   }

//   if ($(element).find(selector).length !== 0 && selector === "a") {
//     return $(element).find(selector).attr("href") || "No title Link";
//   }

//   if ($(element).find(selector).length !== 0 && selector === "img") {
//     return $(element).find(selector).attr("src") || "No image";
//   }

//   if ($(element).find(selector).length !== 0 && selector === ".mvp-cd-cat") {
//     return $(element).find(".mvp-cd-cat").text() || "No category";
//   }
// };

const getElementContent = ($, element, selector, element1) => {
  if ($(element).find(selector).length !== 0 && selector === element1) {
    return $(element).find(selector).text() || "No content";
  }
};

const getContent = ($, element) => {
  if($(element).length !== 0){
     return $(element).text().trim() || "No content";
  }
}

const getAttribute =  ($, element, attr) => {
  if($(element).length !== 0){
     return $(element).attr(attr) || "No attribute";
  }
}
  


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

async function getPostCotent(postListings, page) {
  for(let listing = 0; listing < postListing.length; listing++){
    await page.goto(postListings[listing].url);
  }
}

// postListing();

async function main() {
   const browser = await puppeteer.launch({ headless: false });
   
   const page = await browser.newPage();


   const postListings = await postListing(page);

  //  const postContent = await getPostCotent(postListings, page);
}



main()


// document.querySelectorAll('section').forEach((content, index) => {
//     const post = {
//         title:(content.querySelector('h2') === null) ? 'No title' : content.querySelector('h2').textContent,
//         titleLink:(content.querySelector('a') === null) ? 'No title Link' : content.querySelector('a').getAttribute('href'),
//         img:(content.querySelector('img') === null) ? 'No image' : content.querySelector('img').getAttribute('src'),
//         category:(content.querySelector('.mvp-cd-cat') === null) ? 'No category' :content.querySelector('.mvp-cd-cat').textContent,
//     }
//     console.log(post)
// })
