import * as cheerio from 'cheerio'
import {getContent, getAttribute} from "./functions.js";
import * as converter from "./openai.js";
import {isMoreThan24HoursFromNow} from "./timeConverter.js";
import mongoose from 'mongoose';
import fetch from 'node-fetch';

// --- Mongoose Setup ---
const mongoUri = 'mongodb://localhost:27017/sitedata'; // Change to your MongoDB URI
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });



const postSchema = new mongoose.Schema({
  url: String,
  title: String,
  website: String,
  dateRetrieved: String,
  author: String,
  timePosted: String,
  category: String,
  imageLink: String,
  postDetails: mongoose.Schema.Types.Mixed,
  wpPostId: Number,
  wpPostUrl: String,
  wpFeaturedMediaId: Number
});
const Post = mongoose.model('Post', postSchema);

/**
 * Download an image from a URL and upload it to WordPress media library.
 * Returns the WordPress media ID if successful, or null if failed.
 */
async function uploadImageToWordpress(imageUrl, wordpressUrl, username, password) {
  // Download the image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    console.error(`Failed to download image: ${imageResponse.statusText}`);
    return null;
  }
  const imageBuffer = await imageResponse.buffer();
  const fileName = imageUrl.split('/').pop().split('?')[0] || 'image.jpg';
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

  // Upload to WordPress
  const mediaResponse = await fetch(`${wordpressUrl}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': contentType
    },
    body: imageBuffer
  });

  if (!mediaResponse.ok) {
    const errorText = await mediaResponse.text();
    console.error(`Failed to upload image to WordPress: ${mediaResponse.statusText}\n${errorText}`);
    return null;
  }
  const mediaData = await mediaResponse.json();
  return mediaData.id;
}

async function postToWordpress(post, featuredMediaId, imageUrl) {
  const wordpressUrl = 'https://stag-blogsites.itechnolabs.co.in'; // <-- Replace with your site
      const username = 'wahala'; // <-- Replace with your username
      const password = 'vhST ICrX ZT6K Jgq1 TGv0 5uKJ'; // <-- Replace with your app password

  // Add main image to content HTML if available
  let contentHtml = '';
  if (imageUrl) {
    contentHtml += `<img src="${imageUrl}" alt="${post.title}" style="max-width:100%;height:auto;" /><br/>`;
  }
  // post.postDetails is already HTML (may contain images, embeds, etc.)
  contentHtml += Array.isArray(post.postDetails) ? post.postDetails.join('\n') : post.postDetails;

  const body = {
    title: post.title,
    content: contentHtml,
    status: 'publish',
    categories: post.categories || [],
    author: post.author || undefined,
    excerpt:post.excerpt,
    featured_media: featuredMediaId || undefined,
    format: 'standard'
  };

  const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to upload image to WordPress: ${response.statusText}\n${errorText}`);
    return null;
  }
 const postData = await response.json();
  return postData;
}

// Map normalized category names to WordPress category IDs
const wpCategoryMap = {
  News: 35,         
  Entertainment: 21, 
  Sports: 45,        
  Lifestyle: 30,    
  HealthAndFitness: 27,     
  FoodAndDrink: 24,    
  Gists: 1,     
};

// Map category to WordPress author IDs (arrays for random selection)
const wpAuthorMap = {
  News: [5, 3, 4, 6],           
  Entertainment: [7, 8, 9, 10],  
  Sports: [11, 12, 13, 14],         
  Lifestyle: [15, 16, 17],
  HealthAndFitness: [18, 19, 20],
  FoodAndDrink: [21, 22, 23],
  Gists: [24, 25, 26],
};

// Helper to randomly select an author ID from the array
function getRandomAuthorId(category) {
  const authors = wpAuthorMap[category];
  if (!authors || authors.length === 0) return undefined;
  return authors[Math.floor(Math.random() * authors.length)];
}


 // Add a short excerpt/summary for post listing view
// // You can use the first 30 words of the rewritten content as an excerpt
function getExcerpt(htmlContent, wordCount = 30) {
  // Remove HTML tags and get plain text
  const text = htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').slice(0, wordCount).join(' ') + '...';
}
      



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
   
    // Check if the post is more than 24 hours old
    // If it is, skip this post and continue to the next one
    // if (isMoreThan24HoursFromNow(timePosted)) {
    //   console.log(`Skipping post "${postListings[listing].title}" from "${postListings[listing].website}" it was posted at ${timePosted} and it is more than 20 hours old.`);
    //   return; // Skip this post if it's older than 24 hours
    // }
    const author = getContent($, postEls.post.authorEl);
    let category = getContent($, postEls.post.categoryEl);
    const imageLink = getAttribute($,postEls.post.imageEl.tag, postEls.post.imageEl.source);
    

    // Normalize category for WordPress
    if (category) {
      const cat = category.trim().toLowerCase();
      if (cat === 'news' || cat === 'hot-news'  || cat === 'politics' || cat === 'metro' || cat === 'nigeria-news' || cat === 'business-news') {
        category = 'News';
      } else if (
        cat === 'entertainment' ||
        cat === 'movies & tv' ||
        cat === 'bn tv' ||
        cat === 'extra' ||
        cat === 'events'
      ) {
        category = 'Entertainment';
      } else if (cat === 'sports' || cat === 'sport-news' || cat === 'Sport') {
        category = 'Sports';
      } else if (
        cat === 'relationships' ||
        cat === 'beauty' ||
        cat === 'scoop'
      ) {
        category = 'Lifestyle';
      }
    }

     // Map to WordPress category ID
    const wpCategoryId = wpCategoryMap[category] ? [wpCategoryMap[category]] : [];
    const wpAuthorId = getRandomAuthorId(category);

    //Get the post content
    //Find the main container element that holds the post content
    let postDetails = $(postEls.post.mainContainerEl)
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

       // --- Custom embed handling for X, Facebook, Instagram ---
    // Replace links with your own embed code using your profile
    const myXProfile = "wahaala2"; // Replace with your X (Twitter) username
    const myFacebookProfile = "Wahaala"; // Replace with your Facebook username
    const myInstagramProfile = "wahaalawahala"; // Replace with your Instagram username

    postDetails = postDetails.map(htmlContent => {
      // X (Twitter) embed
      htmlContent = htmlContent.replace(
        /https:\/\/x\.com\/([A-Za-z0-9_]+)/g,
        `<blockquote class="twitter-tweet"><a href="https://x.com/$1">View on X</a> by <a href="https://x.com/${myXProfile}">@${myXProfile}</a></blockquote>`
      );
      // Facebook embed
      htmlContent = htmlContent.replace(
        /https:\/\/facebook\.com\/([A-Za-z0-9_.]+)/g,
        `<div class="fb-post" data-href="https://facebook.com/$1"><a href="https://facebook.com/${myFacebookProfile}">My Facebook Profile</a></div>`
      );
      // Instagram embed
      htmlContent = htmlContent.replace(
        /https:\/\/instagram\.com\/([A-Za-z0-9_.]+)/g,
        `<blockquote class="instagram-media"><a href="https://instagram.com/$1">View on Instagram</a> by <a href="https://instagram.com/${myInstagramProfile}">@${myInstagramProfile}</a></blockquote>`
      );
      return htmlContent;
    });

    // Save original title/content
    // console.log(`Processing post: ${postListings[listing].title}`);
    
    const originalTitle = postListings[listing].title;
    const originalDetails = Array.isArray(postDetails) ? postDetails.join('\n') : postDetails;

    // Use ChatGPT to rewrite the title and content
    const rewrittenTitle = await converter.rewriteTitle(postListings[listing].title);
    let safeTitle = Array.isArray(rewrittenTitle) ? rewrittenTitle[0] : rewrittenTitle;
    const rewrittenDetailsArr = await Promise.all(
      postDetails.map(async htmlContent => {
        // Remove all spaces from content before sending to ChatGPT
        const noSpaces = htmlContent.replace(/\s+/g, ' ');
        return await converter.rewriteContent(noSpaces);
      })
    );
    let rewrittenDetails = rewrittenDetailsArr.join('\n');

     // Remove only the first <img> tag in the content (keep the rest)
     rewrittenDetails = rewrittenDetails.replace(/<img[^>]*>/i, '');

    // Remove featured image from post content if it matches the main image
    if (imageLink) {
      rewrittenDetails = rewrittenDetails.replace(
        new RegExp(`<img[^>]+src=["']${imageLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'gi'),
        ''
      );
    }

    // Convert the post title and content using the contentConverter function
      // const convertedTitle = await converter.contentConverter(postListings[listing].title);
      // const convertedDetails = await converter.contentConverter(postDetails);

      // Check if post exists in MongoDB by URL or title
    const existing = await Post.findOne({ $or: [{ url: postListings[listing].url }, { title: postListings[listing].title }] });
    if (existing) {
      console.log(`Post "${ postListings[listing].title}" already exists in MongoDB. Skipping.`);
      continue;
    }

     
      // ...inside your main loop, after rewrittenDetails is created:
      const excerpt = getExcerpt(rewrittenDetails, 40); // Get first 40 words as excerpt
      console.log(excerpt);
      

      // Save to MongoDB
      const postDoc = new Post({
         url: postListings[listing].url,
         title: safeTitle,
         originalTitle: originalTitle,
         rewrittenTitle: rewrittenTitle,
         website: postListings[listing].website,
         dateRetrieved: postListings[listing].dateRetrieved,
         author: wpAuthorId,
         timePosted,
         category,
         imageLink,
         postDetails: originalDetails,
         rewrittenDetails: rewrittenDetails,
         excerpt // <-- add this field
      });
      
      await postDoc.save();
      console.log('Saved to MongoDB:', postDoc.title);

      // Upload image and get media ID
      const wordpressUrl = 'https://stag-blogsites.itechnolabs.co.in'; // <-- Replace with your site
      const username = 'wahala'; // <-- Replace with your username
      const password = 'vhST ICrX ZT6K Jgq1 TGv0 5uKJ'; // <-- Replace with your app password
      let featuredMediaId = null;
      if (imageLink) {
        featuredMediaId = await uploadImageToWordpress(imageLink, wordpressUrl, username, password);
      }

      // Send to WordPress with featured image and HTML content (image at top, HTML content may contain images/embeds)
      // const wpResult = await postToWordpress({
      //   // ...postDoc.toObject(),
      //   title:  postListings[listing].title,
      //   postDetails: Array.isArray(postDetails) ? postDetails.join('\n') : postDetails,
      //   categories: wpCategoryId,
      //   // author: wpAuthorId
      // }, featuredMediaId);

      const wpResult = await postToWordpress({
      title: safeTitle, // Only the rewritten title is used
      postDetails: rewrittenDetails,
      categories: wpCategoryId,
      excerpt, // <-- add this for WordPress listing
      author: wpAuthorId
    }, featuredMediaId);

        if (wpResult) {
          // Update MongoDB with WordPress info
          postDoc.wpPostId = wpResult.id;
          postDoc.wpPostUrl = wpResult.link;
          postDoc.wpFeaturedMediaId = featuredMediaId;
          await postDoc.save();
          console.log(`Posted to WordPress: ${wpResult.link}`);
        } else {
          console.log(`Failed to post "${postListings[listing].title}" to WordPress.`);
        }


    //Add the post details to the postListings array
    // postListings[listing].author = author;
    // postListings[listing].timePosted = timePosted;
    // postListings[listing].category = category;
    // postListings[listing].imageLink = imageLink;
    // postListings[listing].postDetails = postDetails;

    // // Convert the post title and content using the contentConverter function
    // postListings[listing].title = await converter.contentConverter(postListings[listing].title);
    // postListings[listing].postDetails = await converter.contentConverter(postDetails);

    // // Log the postListings for debugging
    //  console.log(postListings[listing]);
  }
}
