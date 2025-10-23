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
 * Preserves original dimensions and makes media responsive.
 * @param {string} html - The original HTML content.
 * @returns {{ contentWithPlaceholders: string, embeds: string[] }}
 */
export function extractEmbeds(html) {
  let embedIndex = 0;
  const embeds = [];
  const embedInfo = []; // Track embed types and dimensions for logging

  const contentWithPlaceholders = html.replace(
    /(<img[\s\S]*?>|<iframe[\s\S]*?<\/iframe>|<video[\s\S]*?<\/video>|<blockquote[\s\S]*?<\/blockquote>|<script[\s\S]*?<\/script>)/gi,
    (match) => {
      const placeholder = `[[EMBED_${embedIndex}]]`;

      // Extract dimensions if present
      const widthMatch = match.match(/width\s*=\s*["']?(\d+)/i);
      const heightMatch = match.match(/height\s*=\s*["']?(\d+)/i);
      const width = widthMatch ? widthMatch[1] : null;
      const height = heightMatch ? heightMatch[1] : null;

      // Determine embed type
      let embedType = 'unknown';
      if (match.startsWith('<img')) embedType = 'image';
      else if (match.startsWith('<iframe')) embedType = 'iframe';
      else if (match.startsWith('<video')) embedType = 'video';
      else if (match.startsWith('<blockquote')) embedType = 'social embed';
      else if (match.startsWith('<script')) embedType = 'script';

      // Make media responsive by adding/updating style attributes
      let enhancedEmbed = match;

      if (embedType === 'image') {
        // Preserve original dimensions but make responsive
        // Remove any existing style attribute
        enhancedEmbed = enhancedEmbed.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '');

        // Add responsive styling
        const responsiveStyle = width && height
          ? `style="max-width: 100%; height: auto; width: ${width}px; display: block; margin: 0 auto;"`
          : `style="max-width: 100%; height: auto; display: block; margin: 0 auto;"`;

        // Insert style before the closing >
        enhancedEmbed = enhancedEmbed.replace(/>$/, ` ${responsiveStyle}>`);
      } else if (embedType === 'iframe' || embedType === 'video') {
        // Make iframes and videos responsive with aspect ratio preservation
        enhancedEmbed = enhancedEmbed.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '');

        const responsiveStyle = width && height
          ? `style="max-width: 100%; width: ${width}px; height: ${height}px; display: block; margin: 0 auto;"`
          : `style="max-width: 100%; display: block; margin: 0 auto;"`;

        enhancedEmbed = enhancedEmbed.replace(/>/, ` ${responsiveStyle}>`);
      }

      // Store enhanced embed instead of original
      embeds.push(enhancedEmbed);

      // Log embed info
      const dimensions = width && height ? `${width}x${height}` : 'auto';
      embedInfo.push({ index: embedIndex, type: embedType, dimensions });

      embedIndex++;
      return placeholder;
    }
  );

  // Log extracted embeds
  if (embedInfo.length > 0) {
    console.log(`[Embed Extraction] Extracted ${embedInfo.length} media element(s):`);
    embedInfo.forEach(info => {
      console.log(`  [${info.index}] ${info.type} (${info.dimensions})`);
    });
  }

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
  let reinsertedCount = 0;

  embeds.forEach((embed, i) => {
    const placeholder = `[[EMBED_${i}]]`;
    if (result.includes(placeholder)) {
      result = result.replace(placeholder, embed);
      reinsertedCount++;
    } else {
      console.warn(`[Embed Warning] Placeholder ${placeholder} not found in rewritten content. Media may be lost!`);
    }
  });

  console.log(`[Embed Reinsertion] Successfully reinserted ${reinsertedCount}/${embeds.length} media element(s)`);

  return result;
}