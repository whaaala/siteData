import * as cheerio from 'cheerio'
import { getContent, getAttribute } from './functions.js'
import * as converter from './openai.js'
import { Post } from './db.js'
import { uploadImageToWordpress, postToWordpress } from './wordpress.js'
import { wpCategoryMap, getRandomAuthorId } from './categoryMap.js'
import { normalizeCategory } from './normalizeCategory.js'
import {
  getExcerpt,
  siteNamePatterns,
  replaceSiteNamesOutsideTags,
  replaceSiteNamesInPostDetails,
  saveNewPostToDb,
  normalizeString,
  removeSourceSiteLinks,
  removeLastSocialElementIfNotJustOk,
  removeGistreelLinks,
} from './utils.js'
import { replaceSocialLinksWithEmbeds } from './embedUtils.js'
import { fixAndUploadBrokenImages } from './fixImages.js'

// Array to store post data
const featuredCountPerCategory = {}

export default async function getPostCotent(postListings, page, postEls) {
  // Loop through each postListing to get the content
  for (let listing = 0; listing < postListings.length; listing++) {
    // Check if the postListing has a URL, if not, skip to the next iteration
    // This is to avoid errors if the URL is undefined or null
    if (postListings[listing].url === undefined) return

    //Go to the post URL
    await page.goto(postListings[listing].url)

    // Wait for the main image to be visible before extracting
    if (postEls.post.imageEl.tag) {
      try {
        await page.waitForSelector(postEls.post.imageEl.tag, {
          visible: true,
          timeout: 10000,
        })
      } catch (e) {
        console.warn(
          `Image selector ${postEls.post.imageEl.tag} not found or not visible.`
        )
      }
    }

    // Wait for the page to load
    const html = await page.content()

    // Load the HTML into cheerio
    const $ = cheerio.load(html)

    //Get the date, author, category and image link of the post
    const timePosted = getContent($, postEls.post.datePostedEl)

    // Get the author and category, normalize category
    // Use getContent to extract text from the specified element
    const author = getContent($, postEls.post.authorEl)
    let category = postListings[listing].category
    if (
      (!category || category === '' || category === 'No content') &&
      postEls.post.categoryEl &&
      postEls.post.categoryEl !== ''
    ) {
      category = getContent($, postEls.post.categoryEl)
    }
    // let category = getContent($, postEls.post.categoryEl);
    category = normalizeCategory(category)
    let imageLink = ''
    if (postListings[listing].website.includes('naijanews')) {
      imageLink = getAttribute(
        $,
        postEls.post.imageEl.tag,
        postEls.post.imageEl.source1
      )
    } else {
      imageLink = getAttribute(
        $,
        postEls.post.imageEl.tag,
        postEls.post.imageEl.source
      )
    }

    // If imageLink contains "Guardian-grey.jpg", try to get the image again using source1
    if (
      imageLink &&
      imageLink.includes('Guardian-grey.jpg') &&
      postEls.post.imageEl.source1
    ) {
      let altImageLink = getAttribute(
        $,
        postEls.post.imageEl.tag,
        postEls.post.imageEl.source1
      )
      if (altImageLink && altImageLink !== 'No attribute') {
        // If there are multiple values separated by space, use the first one
        altImageLink = altImageLink.split(' ')[0]
        imageLink = altImageLink
      }
    }

    // If imageLink is a data URI, try to get a better value from source1
    if (
      imageLink &&
      imageLink.startsWith('data:') &&
      postEls.post.imageEl.source1
    ) {
      const altImageLink = getAttribute(
        $,
        postEls.post.imageEl.tag,
        postEls.post.imageEl.source1
      )
      if (altImageLink && !altImageLink.startsWith('data:')) {
        imageLink = altImageLink
      }
    }

    // Map to WordPress category ID
    const wpCategoryId = wpCategoryMap[category]
      ? [wpCategoryMap[category]]
      : []
    const wpAuthorId = getRandomAuthorId(category)

    //Get the post content
    //Find the main container element that holds the post content
    let postDetails = $(postEls.post.mainContainerEl)
      .find(postEls.post.contentEl)
      .map((_, el) => {
        //Remove the element content from the DOM that is not needed
        for (let i = 0; i < postEls.post.elToReFromPostEl.length; i++) {
          if ($(el).find(postEls.post.elToReFromPostEl[i]) !== 0) {
            $(postEls.post.elToReFromPostEl[i]).remove()
          }
        }

        //Add the content to the postLising Arry for each object
        return $(el).html()
      })
      .get()

    postDetails = replaceSiteNamesInPostDetails(postDetails)
    postDetails = postDetails.map((htmlContent) =>
      replaceSiteNamesOutsideTags(htmlContent)
    )

    // After extracting postDetails but before rewriting:
    postDetails = postDetails.map((htmlContent) =>
      htmlContent
        .split('\n')
        .filter((line) => !/Read the Latest Sports News/i.test(line))
        .join('\n')
    )

    const myXProfile = process.env.MY_X_PROFILE
    const myFacebookProfile = process.env.MY_FACEBOOK_PROFILE
    const myInstagramProfile = process.env.MY_INSTAGRAM_PROFILE
    const myTiktokProfile = process.env.MY_TIKTOK_PROFILE

    const profiles = {
      myXProfile,
      myFacebookProfile,
      myInstagramProfile,
      myTiktokProfile,
    }

    const originalTitle = postListings[listing].title
    const originalDetails = Array.isArray(postDetails)
      ? postDetails.join('\n')
      : postDetails

    // Replace img src with data-lazy-src if it exists, before rewriting
    postDetails = postDetails.map((htmlContent) => {
      const $ = cheerio.load(htmlContent)
      $('img').each((_, img) => {
        const dataLazySrc = $(img).attr('data-lazy-src')
        if (dataLazySrc) {
          $(img).attr('src', dataLazySrc)
        }
      })
      return $.html()
    })

    postDetails = postDetails.map((htmlContent) => {
      const $ = cheerio.load(htmlContent)

      // Remove <figure> blocks with <figcaption> containing "AI-generated image"
      $('figure').each((_, figure) => {
        const figcaption = $(figure).find('figcaption').text().toLowerCase()
        if (figcaption.includes('ai-generated image')) {
          $(figure).remove()
        }
      })

      // Also handle images with captions not wrapped in <figure>
      $('img').each((_, img) => {
        // Check if the next sibling is a caption with the text
        const next = $(img).next()
        if (
          next.is('figcaption') &&
          next.text().toLowerCase().includes('ai-generated image')
        ) {
          $(img).remove()
          next.remove()
        }
      })
      return $.html()
    })

    postDetails = postDetails.map((htmlContent) =>
      htmlContent.replace(/Naija News/gi, 'nowahalazone')
    )

    // Remove Gistreel links before rewriting
    postDetails = postDetails.map((htmlContent) => {
      const $ = cheerio.load(htmlContent)
      $('a').each(function () {
        const href = ($(this).attr('href') || '').toLowerCase()
        if (href.includes('gistreel.com')) {
          $(this).replaceWith($(this).text())
        }
      })
      return $.html()
    })

    // Use ChatGPT to rewrite the title and content
    const rewrittenTitle = await converter.rewriteTitle(
      postListings[listing].title
    )
    let safeTitle = Array.isArray(rewrittenTitle)
      ? rewrittenTitle[0]
      : rewrittenTitle
    const rewrittenDetailsArr = await Promise.all(
      postDetails.map(async (htmlContent) => {
        // Remove all spaces from content before sending to ChatGPT
        const noSpaces = htmlContent.replace(/\s+/g, ' ')
        return await converter.rewriteContent(noSpaces)
      })
    )
    let rewrittenDetails = rewrittenDetailsArr.join('\n')

    rewrittenDetails = removeLastSocialElementIfNotJustOk(
      rewrittenDetails,
      postListings[listing].website
    )
    // Remove the specific text from the content
    rewrittenDetails = rewrittenDetails.replace(/updates as they drop/gi, '')

    // Replace img src with data-src if data-src exists
    {
      const $ = cheerio.load(rewrittenDetails)
      $('img').each((_, img) => {
        const dataSrc = $(img).attr('data-src')
        if (dataSrc) {
          $(img).attr('src', dataSrc)
        }
      })
      rewrittenDetails = $.html()
    }

    if (imageLink) {
      const $ = cheerio.load(rewrittenDetails)
      $(`img[src="${imageLink}"]`).remove()
      rewrittenDetails = $.html()
    }

    let processedContent = await replaceSocialLinksWithEmbeds(rewrittenDetails)

    // Remove the specific text from the content
    rewrittenDetails = rewrittenDetails.replace(/latest Naija/gi, '')

    // Remove only the first <img> tag in the content (keep the rest)
    rewrittenDetails = rewrittenDetails.replace(/<img[^>]*>/i, '')

    // Remove links to the source site from the processed content
    const siteUrl = postListings[listing].website
    processedContent = removeSourceSiteLinks(processedContent, siteUrl)

    const wordpressUrl = process.env.WORDPRESS_URL
    const username = process.env.WORDPRESS_USERNAME
    const password = process.env.WORDPRESS_PASSWORD

    processedContent = await fixAndUploadBrokenImages(
      processedContent,
      wordpressUrl,
      username,
      password
    )

    // Normalize the title and details
    const urlToCheck = normalizeString(postListings[listing].url)
    const titleToCheck = normalizeString(postListings[listing].title)

    {
      const $ = cheerio.load(processedContent)
      await Promise.all(
        $('img')
          .map(async (_, img) => {
            const src = $(img).attr('src')
            if (src && !src.startsWith('data:')) {
              try {
                const newUrl = await uploadImageToWordpress(
                  src,
                  wordpressUrl,
                  username,
                  password
                )
                if (newUrl) {
                  $(img).attr('src', newUrl)
                }
              } catch (e) {
                console.warn(`Failed to upload image: ${src}`)
              }
            }
          })
          .get()
      )
      processedContent = $.html()
    }

    {
      const $ = cheerio.load(processedContent)

      $('img').each((_, img) => {
        let parent = $(img).parent()
        let count = 0
        // Set height for up to two parents
        while (parent.length && parent[0].tagName !== 'body' && count < 2) {
          parent.css({
            width: '50vw',
          })
          parent = parent.parent()
          count++
        }
        // Style the image itself
        $(img)
          .addClass('responsive-img')
          .attr(
            'style',
            'max-width:100%;height:30vw;display:block;margin:auto;object-fit:contain;'
          )
          .removeAttr('width')
          .removeAttr('height')
      })

      processedContent = $.html()
    }
    // Check if post exists in MongoDB by URL or title
    const existing = await Post.findOne({
      $or: [{ url: urlToCheck }, { title: titleToCheck }],
    })

    if (existing) {
      console.log(
        `Post "${postListings[listing].title}" already exists in MongoDB. Skipping.`
      )
      continue
    }
    const excerpt = getExcerpt(rewrittenDetails, 40) // Get first 40 words as excerpt

    // Save to MongoDB
    const postDoc = await saveNewPostToDb(Post, {
      url: urlToCheck,
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
      excerpt,
    })

    await postDoc.save()
    console.log('Saved to MongoDB:', postDoc.title)

    // Upload image and get media ID

    let featuredMediaId = null

    if (imageLink) {
      featuredMediaId = await uploadImageToWordpress(
        imageLink,
        wordpressUrl,
        username,
        password
      )
    }

    if (!featuredCountPerCategory[category])
      featuredCountPerCategory[category] = 0
    let is_featured = false
    if (featuredCountPerCategory[category] < 2) {
      is_featured = true
      featuredCountPerCategory[category]++
    }

    const wpResult = await postToWordpress(
      {
        title: safeTitle, // Only the rewritten title is used
        postDetails: processedContent,
        categories: wpCategoryId,
        excerpt, // <-- add this for WordPress listing
        author: wpAuthorId,
        is_featured,
      },
      featuredMediaId,
      wordpressUrl,
      username,
      password
    )

    // If posting to WordPress was successful, update the post document with WordPress info
    // This will store the WordPress post ID, URL, and featured media ID in Mongo
    if (wpResult) {
      // Update MongoDB with WordPress info
      postDoc.wpPostId = wpResult.id
      postDoc.wpPostUrl = wpResult.link
      postDoc.wpFeaturedMediaId = featuredMediaId
      await postDoc.save()
      console.log(`Posted to WordPress: ${wpResult.link}`)
    } else {
      console.log(
        `Failed to post "${postListings[listing].title}" to WordPress.`
      )
    }
  }
}
