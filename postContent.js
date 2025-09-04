import * as cheerio from 'cheerio'
import he from 'he'
import { getContent, getAttribute } from './functions.js'
import * as converter from './openai.js'
import { Post } from './db.js'
import fs from 'fs/promises'
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
} from './utils.js'
import { replaceSocialLinksWithEmbeds } from './embedUtils.js'
import {
  fixAndUploadBrokenImages,
  downloadAndConvertToJpg,
} from './fixImages.js'

// Array to store post data
const featuredCountPerCategory = {}

export default async function getPostCotent(postListings, page, postEls) {
  // Loop through each postListing to get the content
  for (let listing = 0; listing < postListings.length; listing++) {
    // Check if the postListing has a URL, if not, skip to the next iteration
    // This is to avoid errors if the URL is undefined or null
    if (postListings[listing].url === undefined) continue

    // Normalize the title and details
    const urlToCheck = normalizeString(postListings[listing].url)
    const titleToCheck = normalizeString(postListings[listing].title)

    // Check if post exists in MongoDB by URL or title BEFORE rewriting
    // Check for existing post by normalized URL
    console.log('Checking for existing post:', urlToCheck)
    const existing = await Post.findOne({
      $or: [{ url: urlToCheck }, { title: titleToCheck }],
    })

    if (existing) {
      console.log(
        `Post "${postListings[listing].title}" already exists in MongoDB. Skipping.`
      )
      continue
    }

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

    // Determine if the site is pulse or brila for special handling
    const isPulse =
      postListings[listing].website &&
      postListings[listing].website.includes('pulse')
    const isBrila =
      postListings[listing].website &&
      postListings[listing].website.includes('brila')
    const isHealthsa =
      postListings[listing].website &&
      postListings[listing].website.includes('healthsa.co.za')
    const isTheguardian =
      postListings[listing].website &&
      postListings[listing].website.includes('theguardian.com')
    const isMotorverso =
      postListings[listing].website &&
      postListings[listing].website.includes('motorverso.com')
    const isGirlracer =
      postListings[listing].website &&
      postListings[listing].website.includes('girlracer.co.uk')
    if (
      !isPulse &&
      !isBrila &&
      !isHealthsa &&
      !isTheguardian &&
      !isMotorverso &&
      !isGirlracer
    ) {
      // Remove all <strong> elements from the content for non-pulse and non-brila sites
      $(postEls.post.mainContainerEl).find('strong').remove()
    }

    // Remove any <p> element containing "Source: Legit.ng"
    $('p')
      .filter((_, el) => $(el).text().includes('Source: Legit.ng'))
      .remove()

    if (
      postListings[listing].website &&
      postListings[listing].website.includes('legit')
    ) {
      // Remove any element containing "Read more stories Read more:"
      $('*')
        .filter((_, el) =>
          $(el).text().includes('Read more stories Read more:')
        )
        .remove()
    }

    // Remove <a> tags with href containing www.legit.ng, except those inside <figure> if pulse
    $(postEls.post.mainContainerEl)
      .find('a[href*="www.legit.ng"]')
      .each(function () {
        const isPulse =
          postListings[listing].website &&
          postListings[listing].website.includes('pulse')
        const insideFigure = $(this).closest('figure').length > 0
        if (!(isPulse && insideFigure)) {
          $(this).replaceWith($(this).text())
        }
      })

    // Remove <a> tags with href containing pulse, except those inside <figure> if pulse
    $('a[href*="pulse"]').each(function () {
      const isPulse =
        postListings[listing].website &&
        postListings[listing].website.includes('pulse')
      const insideFigure = $(this).closest('figure').length > 0
      if (!(isPulse && insideFigure)) {
        $(this).replaceWith($(this).text())
      }
    })

    // // Preserve social embeds for pulse
    // if (
    //   postListings[listing].website &&
    //   postListings[listing].website.includes('pulse')
    // ) {
    //   // List of common social embed selectors
    //   const socialSelectors = [
    //     'iframe[class*="instagram-media"]',
    //     'iframe[class*="twitter-tweet"]',
    //     'iframe[src*="facebook.com"]',
    //     'iframe[src*="youtube.com"]',
    //     // Add more as needed
    //   ]

    //   // Mark social embeds so they are not removed by later cleaning
    //   socialSelectors.forEach((selector) => {
    //     $(selector).addClass('keep-social-embed')
    //   })
    // }

    if (
      postListings[listing].url &&
      postListings[listing].url.includes('healthwise')
    ) {
      // Log the selector and how many <p> are found
      const mainContent = $(postEls.post.mainContainerEl)
      const firstP = mainContent.find('p').first()
      firstP.remove()
    }

    if (
      postListings[listing].website &&
      postListings[listing].website.includes('healthwise')
    ) {
      // Remove <p> containing "Copyright PUNCH"
      $('p')
        .filter((_, el) => $(el).text().includes('Copyright PUNCH'))
        .remove()
      // Remove <p> starting with "All rights reserved"
      $('p')
        .filter((_, el) =>
          $(el).text().trim().startsWith('All rights reserved')
        )
        .remove()
      // Remove <p> containing "health_wise@punchng.com"
      $('p')
        .filter((_, el) => $(el).text().includes('health_wise@punchng.com'))
        .remove()
    }

    // Special handling for pulse to remove "Read also" paragraphs
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('pulse')
    ) {
      $(postEls.post.mainContainerEl)
        .find('*')
        .filter((_, el) =>
          /also read|read also|read more|related|#featuredpost/i.test(
            $(el).text()
          )
        )
        .remove()
    }

    // Remove parent containing "Related News" and all its children
    $('*').each(function () {
      if ($(this).clone().children().remove().end().text().trim() === '(NAN)') {
        $(this).remove()
      }
    })

    // Special handling for thenewsguru to remove elements with text 'NAN'
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('thenewsguru')
    ) {
      $(postEls.post.mainContainerEl)
        .find('*')
        .filter((_, el) => $(el).text().trim() === 'NAN')
        .remove()
    }

    // Special handling for pulse.ng to unwrap <section> elements
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('pulse.ng')
    ) {
      // Unwrap all <section> elements, keeping their children
      $(postEls.post.mainContainerEl)
        .find('section')
        .each(function () {
          $(this).replaceWith($(this).html())
        })
    }

    // Special handling for pulse.com.gh to add <br> after each <section>
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('pulse')
    ) {
      $(postEls.post.mainContainerEl)
        .find('section')
        .each(function () {
          $(this).after('<br>')
        })
    }

    // Special handling for healthsa.co.za to remove "**WH Partnership"
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('healthsa.co.za')
    ) {
      $(postEls.post.mainContainerEl)
        .find('p')
        .filter((_, el) => {
          const text = $(el).text().trim()
          return (
            text.includes('**WH Partnership') ||
            /affiliate programs|participates|earn a commission/i.test(text) ||
            text.includes('Women’s Health')
          )
        })
        .remove()
    }

    // Special handling for healthsa.co.za to adjust video wrapper styles
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('healthsa.co.za')
    ) {
      // Remove inline style from elements with class "fluid-width-video-wrapper"
      $('.fluid-width-video-wrapper').removeAttr('style')

      // Add inline style to iframe inside .fluid-width-video-wrapper
      $('.fluid-width-video-wrapper iframe').attr(
        'style',
        'width: 60rem; height: 30rem;'
      )
    }
    // // Special handling for healthsa.co.za to adjust post content styles
    // if (
    //   postListings[listing].website &&
    //   postListings[listing].website.includes('healthsa.co.za')
    // ) {
    //   // Remove inline style from elements with class "et_pb_post_content"
    //   $('.et_pb_post_content').removeAttr('style')
    // }

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
    // Special handling for legit.ng categories with \n
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('legit') &&
      typeof category === 'string' &&
      category.includes('\n')
    ) {
      // Split by \n, trim each part, and take the last non-empty one
      const parts = category
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      if (parts.length > 0) {
        category = parts[parts.length - 1]
      }
    }

    // Special handling for theguardian to set category to "Recipes"
    if (postListings[listing].website.includes('theguardian')) {
      category = 'Recipes'
    }

    // Special handling for motorverso to set category to "Cars"
    if (
      postListings[listing].website.includes('motorverso') ||
      postListings[listing].website.includes('girlracer')
    ) {
      category = 'Cars'
    }

    // let category = getContent($, postEls.post.categoryEl);
    category = normalizeCategory(category)

    // Extract the image link
    // First try source, then source1 if source fails or is a data URI
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

    // Special handling for healthwise to get imageLink from postListing
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('healthwise')
    ) {
      // Use the imageLink from postListing
      imageLink = postListings[listing].imageLink
    } else {
      // For other sites, extract as usual
      imageLink = getAttribute(
        $,
        postEls.post.imageEl.tag,
        postEls.post.imageEl.source
      )
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

    // Special handling for legit.ng to remove image and caption containing the same imageLink
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('legit.ng') &&
      imageLink
    ) {
      $(`img[src="${imageLink}"]`).each(function () {
        // Remove <figcaption> in parent if present
        $(this).parent().find('figcaption').remove()
        // Remove closest <figure> ancestor if present, else remove parent
        const figure = $(this).closest('figure')
        if (figure.length) {
          figure.remove()
        } else {
          $(this).parent().remove()
        }
      })
    }

    // // Special handling for pulse to remove all <figure> and <figcaption> elements
    // if (
    //   postListings[listing].website &&
    //   postListings[listing].website.includes('pulse')
    // ) {
    //   $(postEls.post.mainContainerEl).find('figure').remove()
    //   $(postEls.post.mainContainerEl).find('figcaption').remove()
    // }

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
        // return $(el).html()
        return $.html(el)
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

    // Before rewriting the content, keep only the <iframe>, <embed>, and <object> elements and their src/data attributes for all iframes/embeds/objects if the website contains "gistreel"
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('gistreel')
    ) {
      postDetails = postDetails.map((htmlContent) => {
        const $ = cheerio.load(htmlContent)

        // Handle <iframe>
        $('iframe').each(function () {
          const src = $(this).attr('src')
          Object.keys(this.attribs).forEach((attr) => {
            $(this).removeAttr(attr)
          })
          if (src) {
            $(this).attr('src', src)
          }
          $(this).empty()
        })

        // Handle <embed>
        $('embed').each(function () {
          const src = $(this).attr('src')
          Object.keys(this.attribs).forEach((attr) => {
            $(this).removeAttr(attr)
          })
          if (src) {
            $(this).attr('src', src)
          }
          $(this).empty()
        })

        // Handle <object>
        $('object').each(function () {
          const data = $(this).attr('data')
          Object.keys(this.attribs).forEach((attr) => {
            $(this).removeAttr(attr)
          })
          if (data) {
            $(this).attr('data', data)
          }
          $(this).empty()
        })

        return $.html()
      })
    }

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

    // Ensure rewrittenTitle is a string, not an array
    let safeTitle = Array.isArray(rewrittenTitle)
      ? rewrittenTitle[0]
      : rewrittenTitle

    const rawCategory = category // before normalization

    // Prepend category to title if not already present
    // Add "Ghana -" prefix for pulse.com.gh articles, except if category contains "health" or "lifestyle"
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('pulse.com.gh') &&
      !/health|lifestyle/i.test(rawCategory)
    ) {
      safeTitle = `Ghana - ${safeTitle}`
    }

    // Rewrite each part of postDetails array in parallel
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

    // Style images and their parents for responsiveness
    {
      const $ = cheerio.load(processedContent)

      // Add a <style> tag for responsive image CSS if not already present
      const styleTag = `
    <style>
      @media (min-width: 900px) {
        img.responsive-img {
          max-width: 80% !important;
        }
      }
    </style>
  `

      // Prepend the style tag to the body (if not already present)
      if ($('style').text().indexOf('img.responsive-img') === -1) {
        $('body').prepend(styleTag)
      }

      $('img').each((_, img) => {
        let parent = $(img).parent()
        let count = 0
        // Set width for up to two parents
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
            'max-width:100%;display:block;margin:auto;object-fit:contain;'
          )
          .removeAttr('width')
          .removeAttr('height')
      })

      processedContent = $.html()
    }

    // Special handling for pulse to remove first two <p> and first <section>
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('pulse')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove the first and second <p> elements
      $('p').eq(0).remove()
      $('p').eq(0).remove() // After removing the first, the second becomes the first

      // // Remove the first <section> element
      // $('section').eq(0).remove()

      processedContent = $.html()
    }

    // Special handling for pulse to convert <figure><a><img></a></figure> to just <img> after uploading
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('pulse')
    ) {
      const $ = cheerio.load(processedContent)

      const figureLinks = $('figure a')
      await Promise.all(
        figureLinks
          .map(async (_, a) => {
            const href = $(a).attr('href')
            if (href) {
              // Download and convert if needed
              const result = await downloadAndConvertToJpg(href)
              if (result) {
                // Save to a temp file for upload
                const tempPath = `./temp_upload_${Date.now()}${result.ext}`
                await fs.writeFile(tempPath, result.buffer)

                try {
                  // Upload using your uploadImageToWordpress that accepts a file path
                  const newUrl = await uploadImageToWordpress(
                    tempPath,
                    wordpressUrl,
                    username,
                    password
                  )
                  if (newUrl) {
                    $(a).replaceWith(`<img src="${newUrl}" alt="" />`)
                  }
                } catch (e) {
                  // console.warn(
                  //   `Failed to upload image from <a> in <figure>: ${href}`
                  // )
                } finally {
                  try {
                    await fs.unlink(tempPath)
                  } catch (e) {
                    if (e.code !== 'ENOENT') {
                      console.warn(
                        `Failed to delete temp file: ${tempPath}`,
                        e.message
                      )
                    }
                    // If ENOENT, ignore (file already deleted or never created)
                  }
                }
              }
            }
          })
          .get()
      )

      processedContent = $.html()
    }

    // Special handling for brila to adjust .entry-content and remove inline styles
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('brila')
    ) {
      const $ = cheerio.load(processedContent)

      // For .post-content: remove any inline width, add margin-top: -3rem (preserve other styles)
      $('.post-content').attr('style', function (i, s) {
        s = s || ''
        // Remove any width property
        s = s.replace(/width\s*:\s*[^;]+;?/gi, '')
        // Remove any existing margin-top to avoid duplicates
        s = s.replace(/margin-top\s*:\s*[^;]+;?/i, '')
        // Add margin-top: -3rem at the start
        return `margin-top: -3rem;${s}`
      })

      // Remove all inline styles from elements with class "wp-caption"
      $('.wp-caption').removeAttr('style')

      processedContent = $.html()
    }

    // Special handling for legit.ng to remove all <a> tags with href or text containing "legit.ng"
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('legit.ng')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove all <a> tags with href or text containing "legit.ng", keep the text content
      $('a').each(function () {
        const href = ($(this).attr('href') || '').toLowerCase()
        const linkText = $(this).text().toLowerCase()
        if (href.includes('legit.ng') || linkText.includes('legit.ng')) {
          $(this).replaceWith($(this).text())
        }
      })

      processedContent = $.html()
    }

    // Special handling for healthsa.co.za to remove inline styles from .wp-block-image
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('healthsa.co.za')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove all inline styles from elements with class "wp-block-image"
      $('.wp-block-image').removeAttr('style')

      processedContent = $.html()
    }

    // Special handling for healthsa.co.za to remove inline styles from .et_pb_post_content
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('healthsa.co.za')
    ) {
      const $ = cheerio.load(processedContent)
      $('.et_pb_post_content').removeAttr('style')
      processedContent = $.html()
    }

    // Special handling for mh.co.za to remove certain elements and styles
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('mh.co.za')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove inline style from elements with class "et_pb_post_content"
      $('.et_pb_post_content').removeAttr('style')

      $('.wp-block-image').removeAttr('style')

      $('.wp-block-column').removeAttr('style')

      // Remove "display: flex" from inline style of elements with class "wp-block-columns"
      $('.wp-block-columns').each(function () {
        let style = $(this).attr('style') || ''
        style = style.replace(/display\s*:\s*flex\s*;?/i, '')
        $(this).attr('style', style.trim())
      })

      // Remove "display: flex" from inline style of elements with class "wp-block-column"
      $('.wp-block-column').each(function () {
        let style = $(this).attr('style') || ''
        style = style.replace(/display\s*:\s*flex\s*;?/i, '')
        $(this).attr('style', style.trim())
      })

      // Remove "display: flex" from inline style of elements with class "wp-block-column"
      $(
        '.wp-block-columns:not(.is-not-stacked-on-mobile)>.wp-block-column'
      ).each(function () {
        let style = $(this).attr('style') || ''
        style = style.replace(/flex-basis\s*:\s*0\s*;?/i, '')
        $(this).attr('style', style.trim())
      })

      // Remove any element that contains a hyperlink with text "menshealth.com.au"
      $('p').each(function () {
        if ($(this).text().includes('menshealth.com.au')) {
          $(this).closest('*').remove()
        }
      })

      // Remove any element that contains a hyperlink with text "menshealth.com.au"
      $('p').each(function () {
        if ($(this).text().includes('MH')) {
          $(this).closest('*').remove()
        }
      })

      // Remove any element that contains a hyperlink with text "menshealth.com.au"
      $('p').each(function () {
        if ($(this).text().includes('Partnership')) {
          $(this).closest('*').remove()
        }
      })

      // Remove any element that contains a hyperlink with text "menshealth.com/au"
      $('p').each(function () {
        if ($(this).text().includes('menshealth.com/au')) {
          $(this).closest('*').remove()
        }
      })
      // Remove any element that contains a hyperlink with text "menshealth.com/au"
      $('p').each(function () {
        if ($(this).text().includes('Men’s Health US')) {
          $(this).closest('*').remove()
        }
      })

      // Remove any element that contains a hyperlink with text "article"
      $('a').each(function () {
        if ($(this).text().toLowerCase().includes('article')) {
          $(this).closest('*').remove()
        }
      })

      // Inject a style tag to ensure proper flex layout and prevent overlay
      const overrideStyle = `
    <style>
      .wp-block-columns {
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: flex-start;
        gap: 1.5rem;
      }
      .wp-block-column {
        min-width: 250px;
        flex: 1 1 300px;
        box-sizing: border-box;
      }
      img {
        max-width: 100%;
        height: auto;
        display: block;
      }
    </style>
  `
      if ($('body').length) {
        $('body').prepend(overrideStyle)
      } else {
        $.root().prepend(overrideStyle)
      }

      processedContent = $.html()
    }

    // Special handling for mh.co.za to adjust video wrapper styles
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('mh.co.za')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove inline style from elements with class "fluid-width-video-wrapper"
      $('.fluid-width-video-wrapper').removeAttr('style')

      // Add inline style to all iframe elements within .fluid-width-video-wrapper
      $('.fluid-width-video-wrapper iframe').attr(
        'style',
        'width:50rem; height:30rem;'
      )

      processedContent = $.html()
    }

    // Special handling for womenshealthsa.co.za to adjust video wrapper styles
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('womenshealthsa.co.za')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove inline style from elements with class "fluid-width-video-wrapper"
      $('.fluid-width-video-wrapper').removeAttr('style')

      // Add inline style to all iframe elements within .fluid-width-video-wrapper
      $('.fluid-width-video-wrapper iframe').attr(
        'style',
        'width:50rem; height:30rem;'
      )

      processedContent = $.html()

      // Remove inline style from elements with class "fluid-width-video-wrapper"
      $('.fluid-width-video-wrapper').removeAttr('style')

      // Add inline style to all iframe elements within .fluid-width-video-wrapper
      $('.fluid-width-video-wrapper iframe').attr(
        'style',
        'width:50rem; height:30rem;'
      )

      processedContent = $.html()
    }
    // Special handling for theguardian to remove width styles from ids containing "img"
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('theguardian')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove the CSS width from any element whose id contains "img"
      $('[id*="img"]').each(function () {
        let style = $(this).attr('style') || ''
        // Remove any width property from the style attribute
        style = style.replace(/width\s*:\s*[^;]+;?/gi, '')
        $(this).attr('style', style.trim())
      })

      processedContent = $.html()
    }

    //Special handling for theguardian to remove parent of "View image in fullscreen"
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('theguardian')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove any parent element whose child contains the text "View image in fullscreen"
      $('button').each(function () {
        const hasChildWithText = $(this)
          .children()
          .toArray()
          .some((child) =>
            $(child).text().toLowerCase().includes('view image in fullscreen')
          )
        if (hasChildWithText) {
          $(this).remove()
        }
      })

      processedContent = $.html()
    }

    // Special handling for motorverso to remove width styles from .entry-content
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('motorverso')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove the CSS width from any element with class "entry-content"
      $('.entry-content').each(function () {
        let style = $(this).attr('style') || ''
        // Remove any width property from the style attribute
        style = style.replace(/width\s*:\s*[^;]+;?/gi, '')
        $(this).attr('style', style.trim())
      })

      processedContent = $.html()
    }
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('motorverso')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove the CSS width from any element with class "entry-content"
      $('p').each(function () {
        let style = $(this).attr('style') || ''
        // Remove any width property from the style attribute
        style = style.replace(/width\s*:\s*[^;]+;?/gi, '')
        $(this).attr('style', style.trim())
      })

      processedContent = $.html()
    }

    // Special handling for motorverso to set specific size for images with sizes="auto" or sizes starting with "auto,"
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('motorverso')
    ) {
      const $ = cheerio.load(processedContent)

      // Inject a style tag to override external CSS for the target selector
      const overrideStyle = `
    <style>
      img:is([sizes="auto" i], [sizes^="auto," i]) {
        contain-intrinsic-size: unset !important;
        width: 50rem !important;
        height: 20rem !important;
      }
    </style>
  `

      if ($('body').length) {
        $('body').prepend(overrideStyle)
      } else {
        $.root().prepend(overrideStyle)
      }

      processedContent = $.html()
    }
    // Special handling for motorverso to set specific size for images with sizes="auto" or sizes starting with "auto,"
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('guardian.ng')
    ) {
      const $ = cheerio.load(processedContent)

      // Inject a style tag to override external CSS for the target selector
      const overrideStyle = `
    <style>
      img:is([sizes="auto" i], [sizes^="auto," i]) {
        contain-intrinsic-size: unset !important;
      }
    </style>
  `

      if ($('body').length) {
        $('body').prepend(overrideStyle)
      } else {
        $.root().prepend(overrideStyle)
      }

      // Add CSS inline style "width:50rem; height:30rem" for any img within the element
      $('img').attr('style', 'width:50rem; height:30rem;')

      processedContent = $.html()
    }

    // Special handling for motorverso to remove inline styles from .fluid-width-video-wrapper
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('motorverso')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove inline style from elements with class "fluid-width-video-wrapper"
      $('.fluid-width-video-wrapper').removeAttr('style')

      processedContent = $.html()
    }

    // Special handling for motorverso to set specific size for iframes
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('motorverso')
    ) {
      const $ = cheerio.load(processedContent)

      // Add inline style to all iframe elements
      $('iframe').attr('style', 'width:50rem; height:30rem;')

      processedContent = $.html()
    }

    // Special handling for motorverso to remove elements containing "paypal" links
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('motorverso')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove any element that contains a hyperlink with "paypal" in the href, including its children
      $('a[href*="paypal"]').each(function () {
        $(this).closest('*').remove()
      })

      processedContent = $.html()
    }

    // Create excerpt from the rewritten details
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

    {
      const $ = cheerio.load(processedContent)
      $('p').each((_, p) => {
        $(p).css('text-align', 'justify')
      })
      processedContent = $.html()
    }

    if (!featuredMediaId) {
      console.log(
        `Skipping post "${postListings[listing].title}" because the feature image was not uploaded to WordPress.`
      )
      continue // Skip this post and do not upload to WordPress
    }

    if (
      postListings[listing].website &&
      postListings[listing].website.includes('pulse')
    ) {
      const $ = cheerio.load(processedContent)

      // Replace <section data-html="..."> with the actual decoded HTML content
      $('section[data-html]').each(function () {
        const html = $(this).attr('data-html')
        if (html) {
          // Decode HTML entities
          const decodedHtml = he.decode(html)
          // Insert the decoded HTML after the section, wrapped in a Custom HTML block
          $(this).after(`<div class="wp-block-html">${decodedHtml}</div>`)
          // Remove the original section
          $(this).remove()
        }
      })

      // Wrap direct social embeds in a Custom HTML block for WordPress
      const socialSelectors = [
        'iframe[src*="twitter.com"]',
        'iframe[src*="instagram.com"]',
        'iframe[src*="facebook.com"]',
        'iframe[src*="youtube.com"]',
        'blockquote.twitter-tweet',
        'blockquote.instagram-media',
        'div.fb-post',
        'div.fb-video',
        'iframe[src*="tiktok.com"]',
        'blockquote.tiktok-embed',
        // Add more as needed
      ]

      socialSelectors.forEach((selector) => {
        $(selector).each(function () {
          if (!$(this).parent().hasClass('wp-block-html')) {
            $(this).wrap('<div class="wp-block-html"></div>')
          }
        })
      })

      processedContent = $.html()
    }

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

    // Special handling for girlracer to remove all links to girlracer, keep the text content
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('girlracer')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove all <a> tags with href or text containing "girlracer", keep the text content
      $('a').each(function () {
        const href = ($(this).attr('href') || '').toLowerCase()
        const linkText = $(this).text().toLowerCase()
        if (href.includes('girlracer') || linkText.includes('girlracer')) {
          $(this).replaceWith($(this).text())
        }
      })

      processedContent = $.html()
    }

    // Special handling to remove width: 50vw from inline styles
    {
      const $ = cheerio.load(processedContent)

      // Remove any inline style that contains "width: 50vw"
      $('[style*="width: 50vw"]').each(function () {
        let style = $(this).attr('style') || ''
        // Remove the width: 50vw rule from the style attribute
        style = style.replace(/width\s*:\s*50vw\s*;?/gi, '')
        $(this).attr('style', style.trim())
        // If style is now empty, remove the attribute
        if (!$(this).attr('style')) {
          $(this).removeAttr('style')
        }
      })

      processedContent = $.html()
    }

    {
      const $ = cheerio.load(processedContent)

      // Add CSS "margin-top: -2rem;" to elements with the class "entry-content"
      $('.entry-content').each(function () {
        let style = $(this).attr('style') || ''
        // Remove any existing margin-top to avoid duplicates
        style = style.replace(/margin-top\s*:\s*[^;]+;?/i, '')
        // Add margin-top: -2rem at the start
        style = `margin-top: -2rem;${style}`
        $(this).attr('style', style.trim())
      })

      processedContent = $.html()
    }

    // Special handling for leadership.ng to remove elements containing "ADVERTISEMENT"
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('leadership.ng')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove any element that contains the text "ADVERTISEMENT"
      $('.ads-text').each(function () {
        if ($(this).text().toUpperCase().includes('ADVERTISEMENT')) {
          $(this).remove()
        }
      })

      processedContent = $.html()
    }

    // Special handling for leadership.ng to remove <p> elements containing "RELATED"
    if (
      postListings[listing].website &&
      postListings[listing].website.includes('leadership.ng')
    ) {
      const $ = cheerio.load(processedContent)

      // Remove any <p> element that contains the text "RELATED" (case-insensitive)
      $('p').each(function () {
        if ($(this).text().toUpperCase().includes('RELATED')) {
          $(this).remove()
        }
      })

      processedContent = $.html()
    }

    // Remove <p> elements containing "Recommended read" (case-insensitive)
    {
      const $ = cheerio.load(processedContent)
      $('p').each(function () {
        if ($(this).text().toLowerCase().includes('recommended read')) {
          $(this).remove()
        }
      })
      processedContent = $.html()
    }

    // Remove <a> links that contain the source website domain
    {
      const $ = cheerio.load(processedContent)
      const websiteDomain = (postListings[listing].website || '')
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
      $('a').each(function () {
        const href = ($(this).attr('href') || '').toLowerCase()
        if (websiteDomain && href.includes(websiteDomain)) {
          $(this).replaceWith($(this).text())
        }
      })
      processedContent = $.html()
    }

    {
      const $ = cheerio.load(processedContent)
      $('img').each(function () {
        const src = $(this).attr('src') || ''
        const dataLazySrc = $(this).attr('data-lazy-src')
        // If src is just a number or not a valid URL, but data-lazy-src exists, use it
        if (
          (!src.startsWith('http') && dataLazySrc) ||
          (/^\d+$/.test(src) && dataLazySrc)
        ) {
          $(this).attr('src', dataLazySrc)
        }
        // Optionally, remove images with invalid src and no data-lazy-src
        if (!src.startsWith('http') && !dataLazySrc) {
          $(this).remove()
        }
      })
      processedContent = $.html()
    }

    // Replace social media <a> links with their URLs on their own line for WordPress oEmbed
    {
      const $ = cheerio.load(processedContent)

      // List of social media domains to auto-embed
      const socialDomains = [
        'instagram.com',
        'twitter.com',
        'x.com',
        'facebook.com',
        'tiktok.com',
        'youtube.com',
        'youtu.be',
      ]

      $('a').each(function () {
        const href = $(this).attr('href')
        if (href && socialDomains.some((domain) => href.includes(domain))) {
          // Replace the <a> tag with the URL on its own line
          $(this).replaceWith('\n' + href + '\n')
        }
      })

      processedContent = $.html()
    }

    // Post to WordPress
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

  await page.close()

  // Place this after the for-loop:
  if (postListings.length > 0 && postListings[0].website) {
    console.log(`✅ Completed scraping for: ${postListings[0].website}`)
  } else {
    console.log('✅ Completed scraping for this website.')
  }
}
