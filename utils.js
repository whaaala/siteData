import * as cheerio from 'cheerio';

// Excerpt generator
export function getExcerpt(htmlContent, wordCount = 30) {
  const text = htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').slice(0, wordCount).join(' ') + '...';
}

// Patterns for site name replacement
export const siteNamePatterns = [
  /\bDaily\s*Post\b/gi,
  /\bDAILY\s*POST\b/gi,
  /\bDAILYPOST\b/gi,
  /\bLeadership\b/gi,
  /\bLEADERSHIP\b/gi,
  /\bGistlover\b/gi,
  /\bGISTLOVER\b/gi
];

// Replace site names in visible text only
export function replaceSiteNamesOutsideTags(html) {
  return html.split(/(<[^>]+>)/g).map((part, i) => {
    if (i % 2 === 0) {
      siteNamePatterns.forEach(pattern => {
        part = part.replace(pattern, 'NOWAHALAZONE');
      });
    }
    return part;
  }).join('');
}

// Replace site names in an array of HTML contents
export function replaceSiteNamesInPostDetails(postDetails) {
  return postDetails.map(htmlContent => replaceSiteNamesOutsideTags(htmlContent));
}

// Save new post to MongoDB
export async function saveNewPostToDb(Post, postData) {
  const postDoc = new Post(postData);
  await postDoc.save();
  return postDoc;
}

// In utils.js
export function normalizeString(str) {
  return str ? str.trim().toLowerCase() : '';
}

/**
 * Remove <a> tags in the content that link to the source site.
 * @param {string} htmlContent - The post content HTML.
 * @param {string} siteDomain - The domain of the site the post was scraped from (e.g., "notjustok.com").
 * @returns {string} - The cleaned HTML content.
 */
export function removeSourceSiteLinks(htmlContent, siteDomain) {
  const $ = cheerio.load(htmlContent);
  $(`a[href*="${siteDomain}"]`).each(function () {
    // Replace the link with its text content
    $(this).replaceWith($(this).text());
  });
  return $.html();
}

/**
 * Removes the last element in the HTML content that contains a Facebook or X link,
 * but only if the post is from notjustok.com.
 * @param {string} htmlContent
 * @param {string} websiteUrl
 * @returns {string}
 */
export function removeLastSocialElementIfNotJustOk(htmlContent, websiteUrl) {
  const isNotJustOk = /notjustok\.com/i.test(websiteUrl);
  if (!isNotJustOk) return htmlContent;

  const $ = cheerio.load(htmlContent);
  let elementsWithSocial = [];
  $('*').each(function () {
    const html = $(this).html() || '';
    if (/<a[^>]+href=["'][^"']*(facebook\.com|x\.com|twitter\.com)[^"']*["']/i.test(html)) {
      elementsWithSocial.push(this);
    }
  });

  if (elementsWithSocial.length > 0) {
    $(elementsWithSocial[elementsWithSocial.length - 1]).remove();
  }
  return $.html();
}