/**
 * Replace social links in HTML content with embed codes for X, Facebook, Instagram, and TikTok.
 * @param {string[]} postDetails - Array of HTML content strings.
 * @param {object} profiles - Object with your social profile usernames.
 * @returns {string[]} - Array with embeds replaced.
 */
export function embedSocialLinks(postDetails, profiles) {
  return postDetails.map(htmlContent => {
    // X (Twitter) embed
    htmlContent = htmlContent.replace(
      /https:\/\/x\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/gi,
      `<blockquote class="twitter-tweet"><a href="https://x.com/${profiles.myXProfile}/status/$2"></a></blockquote>`
    );
    // Facebook embed
    htmlContent = htmlContent.replace(
      /https:\/\/facebook\.com\/([^\/]+\/(posts|videos|photos)\/\d+)/gi,
      `<div class="fb-post" data-href="https://facebook.com/${profiles.myFacebookProfile}/$2"></div>`
    );
    // Instagram embed
    htmlContent = htmlContent.replace(
      /https:\/\/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/gi,
      `<blockquote class="instagram-media" data-instgrm-permalink="https://instagram.com/${profiles.myInstagramProfile}/$1/$2/" data-instgrm-version="14"></blockquote>`
    );
    // TikTok embed (optional: add your TikTok profile to .env and profiles)
    if (profiles.myTiktokProfile) {
      htmlContent = htmlContent.replace(
        /https:\/\/www\.tiktok\.com\/@([A-Za-z0-9_.-]+)\/video\/(\d+)/gi,
        `<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@${profiles.myTiktokProfile}/video/$2" data-video-id="$2" style="max-width: 605px;min-width: 325px;"><section></section></blockquote>`
      );
    }
    return htmlContent;
  });
}