import * as cheerio from 'cheerio';
import { getContent, getAttribute } from "./functions.js";
import * as converter from "./openai.js";
import { Post } from './db.js';
import { uploadImageToWordpress, postToWordpress } from './wordpress.js';
// import { wpCategoryMap, getRandomAuthorId } from './categoryMap.js';
import { getExcerpt, replaceSiteNamesOutsideTags, handleEmbeds } from './utils.js';


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
/**
 * Main function to scrape, process, and post content.
 * - Scrapes post details
 * - Cleans and rewrites content
 * - Handles embeds and site name replacement
 * - Saves to MongoDB
 * - Publishes to WordPress
 */

export default async function getPostCotent(postListings, page, postEls) {
  for (let listing = 0; listing < postListings.length; listing++) {
    if (!postListings[listing].url) continue;
    await page.goto(postListings[listing].url);
    const html = await page.content();
    const $ = cheerio.load(html);

    // Extract meta info
    const timePosted = getContent($, postEls.post.datePostedEl);
    const author = getContent($, postEls.post.authorEl);
    let category = getContent($, postEls.post.categoryEl);
    const imageLink = getAttribute($, postEls.post.imageEl.tag, postEls.post.imageEl.source);

    // Normalize category
  // Normalize category for WordPress
    if (category) {
      const cat = category.trim().toLowerCase();
      if (cat === 'news' || cat === 'hot-news'  || cat === 'politics' || cat === 'metro' || cat === 'nigeria-news' || cat === 'business-news'  || cat === 'business') {
        category = 'News';
      } else if (
        cat === 'entertainment' ||
        cat === 'movies & tv' ||
        cat === 'bn tv' ||
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
      } else if (
        cat === 'extra'
      ) {
        category = 'Gists';
      }
    }
    const wpCategoryId = wpCategoryMap[category] ? [wpCategoryMap[category]] : [];
    const wpAuthorId = getRandomAuthorId(category);
    console.log('Normalized category:', wpCategoryId);
    console.log('Mapped category ID:', wpCategoryId);

    // Scrape and clean post content
    let postDetails = $(postEls.post.mainContainerEl)
      .find(postEls.post.contentEl)
      .map((_, el) => {
        for (let i = 0; i < postEls.post.elToReFromPostEl.length; i++) {
          if ($(el).find(postEls.post.elToReFromPostEl[i]) !== 0) {
            $(postEls.post.elToReFromPostEl[i]).remove();
          }
        }
        return $(el).html();
      })
      .get();

    // Replace site names in visible text
    postDetails = postDetails.map(htmlContent => replaceSiteNamesOutsideTags(htmlContent));
    // Handle social embeds
    postDetails = postDetails.map(htmlContent => handleEmbeds(htmlContent));

    // Save original title/content
    const originalTitle = postListings[listing].title;
    const originalDetails = Array.isArray(postDetails) ? postDetails.join('\n') : postDetails;

    // Rewrite title and content using AI
    const rewrittenTitle = await converter.rewriteTitle(postListings[listing].title);
    let safeTitle = Array.isArray(rewrittenTitle) ? rewrittenTitle[0] : rewrittenTitle;
    const rewrittenDetailsArr = await Promise.all(
      postDetails.map(async htmlContent => {
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

    // Generate excerpt for listing
    const excerpt = getExcerpt(rewrittenDetails, 40);

    // Check if post exists in MongoDB by URL or title
    const existing = await Post.findOne({ $or: [{ url: postListings[listing].url }, { title: postListings[listing].title }] });
    if (existing) {
      console.log(`Post "${ postListings[listing].title}" already exists in MongoDB. Skipping.`);
      continue;
    }

    // Save to MongoDB
    const postDoc = new Post({
      url: postListings[listing].url,
      title: safeTitle,
      originalTitle,
      rewrittenTitle,
      website: postListings[listing].website,
      dateRetrieved: postListings[listing].dateRetrieved,
      author: wpAuthorId,
      timePosted,
      category,
      imageLink,
      postDetails: originalDetails,
      rewrittenDetails,
      excerpt
    });
    await postDoc.save();
    console.log('Saved to MongoDB:', postDoc.title);


    // Upload image and post to WordPress
    const wordpressUrl = 'https://stag-blogsites.itechnolabs.co.in';
    const username = 'wahala';
    const password = 'vhST ICrX ZT6K Jgq1 TGv0 5uKJ';
    let featuredMediaId = null;
    if (imageLink) {
      featuredMediaId = await uploadImageToWordpress(imageLink, wordpressUrl, username, password);
    }

    console.log('Preparing to post to WordPress with:');
    console.log('  Title:', safeTitle);
    console.log('  Categories:', wpCategoryId);
    console.log('  Author:', wpAuthorId);




    
    const wpResult = await postToWordpress({
        title: safeTitle, // Only the rewritten title is used
        postDetails: rewrittenDetails,
        categories: wpCategoryId,
        excerpt, // <-- add this for WordPress listing
        author: wpAuthorId
    }, featuredMediaId, wordpressUrl, username, password);

    if (wpResult) {
      postDoc.wpPostId = wpResult.id;
      postDoc.wpPostUrl = wpResult.link;
      postDoc.wpFeaturedMediaId = featuredMediaId;
      await postDoc.save();
      console.log(`Posted to WordPress: ${wpResult.link}`);
    } else {
      console.log(`Failed to post "${postListings[listing].title}" to WordPress.`);
    }

    
  }

}