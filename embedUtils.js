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

