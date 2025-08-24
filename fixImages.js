import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { uploadImageToWordpress } from './wordpress.js';

/**
 * Finds images in the content that do not display (broken), uploads them to WordPress,
 * and replaces their src with the new WordPress URL.
 * @param {string} htmlContent - The HTML content to process.
 * @param {string} wordpressUrl
 * @param {string} username
 * @param {string} password
 * @returns {Promise<string>} - The processed HTML content.
 */
export async function fixAndUploadBrokenImages(htmlContent, wordpressUrl, username, password) {
  const $ = cheerio.load(htmlContent);
  const imgTags = $('img');

  for (let i = 0; i < imgTags.length; i++) {
    const img = imgTags[i];
    const src = $(img).attr('src');
    if (!src) continue;

    // Check if image loads
    let isBroken = false;
    try {
      const res = await fetch(src, { method: 'HEAD' });
      if (!res.ok) isBroken = true;
    } catch {
      isBroken = true;
    }

    if (isBroken) {
      try {
        const newImageUrl = await uploadImageToWordpress(src, wordpressUrl, username, password);
        if (newImageUrl) {
          $(img).attr('src', newImageUrl);
        }
      } catch (e) {
        // Optionally log or handle upload failure
      }
    }
  }

  return $.html();
}