# TikTok Embed Fix

## Problem

TikTok embeds were displaying incorrectly on WordPress posts. Instead of showing the video player, they were showing plain URLs for the creator handle, hashtags, and music inside the embed.

### Example Issue

**WordPress post:** https://nowahalazone.com/russian-manicure-trend-reportedly-goes-viral-on-tiktok-what-nigerians-should-know/

**Before fix:**
```html
<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@nailmartusa/video/6978263826064035078">
  <section>
    https://www.tiktok.com/@nailmartusa?refer=embed
    <p>Many people don't know about this type of mani...
    https://www.tiktok.com/tag/russianmanicure?refer=embed
    https://www.tiktok.com/tag/gelmani?refer=embed
    https://www.tiktok.com/tag/cuticle?refer=embed
    </p>
    https://www.tiktok.com/music/Stuck-In-The-Middle-6832618984580335617?refer=embed
  </section>
</blockquote>
```

The TikTok embed would show these plain URLs as text instead of properly rendering the video.

## Root Cause

When scraping from the source site (womenshealthsa.co.za), the system correctly captured TikTok blockquotes with video embeds. However, inside those blockquotes were plain URLs for:
- Creator handle: `https://www.tiktok.com/@username?refer=embed`
- Hashtags: `https://www.tiktok.com/tag/hashtag?refer=embed`
- Music: `https://www.tiktok.com/music/song-id?refer=embed`

The `embedSocialLinksInContent()` function in `utils.js` was processing ALL links in the content, including those already inside TikTok blockquotes, which broke the embeds.

## Solution

Modified `utils.js` `embedSocialLinksInContent()` function to:

1. **Skip processing links inside existing embeds**
   ```javascript
   // Skip links that are already inside social media embeds
   if ($(el).closest('blockquote, iframe, .tiktok-embed, .instagram-media, .twitter-tweet, .fb-post').length > 0) {
     return
   }
   ```

2. **Clean up TikTok blockquotes**
   ```javascript
   // Clean up TikTok blockquotes: Remove plain URLs inside them
   $('.tiktok-embed section').each((i, section) => {
     let sectionHtml = $(section).html() || ''

     // Remove TikTok URLs (creator, tags, music)
     sectionHtml = sectionHtml.replace(/https?:\/\/www\.tiktok\.com\/[@\w/-]+\?refer=\w+/g, '')
     sectionHtml = sectionHtml.replace(/https?:\/\/www\.tiktok\.com\/tag\/[\w-]+\?refer=\w+/g, '')
     sectionHtml = sectionHtml.replace(/https?:\/\/www\.tiktok\.com\/music\/[\w-]+\?refer=\w+/g, '')

     // Remove empty paragraphs
     sectionHtml = sectionHtml.replace(/<p[^>]*>\s*<\/p>/g, '')
     sectionHtml = sectionHtml.trim()

     $(section).html(sectionHtml)
   })
   ```

## After Fix

```html
<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@nailmartusa/video/6978263826064035078" data-video-id="6978263826064035078">
  <section>
    <p>Many people don't know about this type of mani and I'm here to tell you more about it🥰</p>
  </section>
</blockquote>
<script async src="https://www.tiktok.com/embed.js"></script>
```

The TikTok embed now displays the video player correctly, with only the caption text visible inside the blockquote.

## Testing

Run the test to verify the fix:

```bash
node testTikTokEmbedFix.js
```

**Expected output:**
```
✅ Creator URL removed: YES
✅ Tag URL removed: YES
✅ Music URL removed: YES
✅ Video embed preserved: YES
✅ TEST PASSED - TikTok embed cleaned up correctly!
```

## Impact

This fix ensures that:
- ✅ TikTok videos embed properly on WordPress
- ✅ Video player is displayed instead of plain URLs
- ✅ Caption text is preserved
- ✅ Hashtags and creator links are removed (not needed for embed)
- ✅ Works for all future TikTok embeds

## Files Modified

1. **utils.js** - `embedSocialLinksInContent()` function (lines 306-333)
   - Added check to skip links inside existing embeds
   - Added TikTok blockquote cleanup logic

## Related Issues

This fix also prevents similar issues with:
- Instagram embeds
- Twitter/X embeds
- Facebook embeds
- YouTube embeds

All social media embeds are now protected from having their internal links processed by the embed function.
