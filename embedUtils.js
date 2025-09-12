export async function replaceSocialLinksWithEmbeds(htmlContent) {
  const instagramToken = process.env.INSTAGRAM_OEMBED_TOKEN;
  const facebookToken = process.env.FACEBOOK_OEMBED_TOKEN;
  const myInstagramProfile = process.env.MY_INSTAGRAM_PROFILE;

  // Instagram
  htmlContent = await replaceAsync(
    htmlContent,
    /https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/gi,
    async (match, www, type, postId) => {
      // Build the post URL using your profile
      const postUrl = `https://www.instagram.com/${myInstagramProfile}/${type}/${postId}/`;
      const apiUrl = `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(postUrl)}&access_token=${instagramToken}`;
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) return match;
        const data = await response.json();
        if (data.html) {
          return `<!-- wp:html -->${data.html}<!-- /wp:html -->`;
        }
      } catch (e) {}
      return match;
    }
  );

  // Facebook
  htmlContent = await replaceAsync(
    htmlContent,
    /https:\/\/(www\.)?facebook\.com\/[^\/]+\/(posts|videos|photos)\/(\d+)/gi,
    async (match) => {
      const apiUrl = `https://graph.facebook.com/v19.0/oembed_post?url=${encodeURIComponent(match)}&access_token=${facebookToken}`;
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) return match;
        const data = await response.json();
        if (data.html) {
          return `<!-- wp:html -->${data.html}<!-- /wp:html -->`;
        }
      } catch (e) {}
      return match;
    }
  );

  // TikTok
  htmlContent = await replaceAsync(
    htmlContent,
    /https:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.-]+\/video\/(\d+)/gi,
    async (match) => {
      const apiUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(match)}`;
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) return match;
        const data = await response.json();
        if (data.html) {
          return `<!-- wp:html -->${data.html}<!-- /wp:html -->`;
        }
      } catch (e) {}
      return match;
    }
  );

  // X (Twitter) - use blockquote
  htmlContent = htmlContent.replace(
    /https:\/\/x\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/gi,
    (match) =>
      `<!-- wp:html --><blockquote class="twitter-tweet"><a href="${match}"></a></blockquote><!-- /wp:html -->`
  );

  return htmlContent;
}

// Helper for async replace
async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    promises.push(asyncFn(match, ...args));
    return match;
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}

/**
 * Extracts all non-text HTML embeds (img, iframe, video, blockquote, script) and replaces them with placeholders.
 * @param {string} html - The original HTML content.
 * @returns {{ contentWithPlaceholders: string, embeds: string[] }}
 */
export function extractEmbeds(html) {
  let embedIndex = 0;
  const embeds = [];
  const contentWithPlaceholders = html.replace(
    /(<img[\s\S]*?>|<iframe[\s\S]*?<\/iframe>|<video[\s\S]*?<\/video>|<blockquote[\s\S]*?<\/blockquote>|<script[\s\S]*?<\/script>)/gi,
    (match) => {
      const placeholder = `[[EMBED_${embedIndex}]]`;
      embeds.push(match);
      embedIndex++;
      return placeholder;
    }
  );
  return { contentWithPlaceholders, embeds };
}

/**
 * Reinserts embeds into the rewritten text at their original placeholder positions.
 * @param {string} text - The rewritten text with placeholders.
 * @param {string[]} embeds - The array of original embed HTML.
 * @returns {string}
 */
export function reinsertEmbeds(text, embeds) {
  let result = text;
  embeds.forEach((embed, i) => {
    result = result.replace(`[[EMBED_${i}]]`, embed);
  });
  return result;
}