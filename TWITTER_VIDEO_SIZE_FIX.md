# Twitter/X Video Size Fix

## Problem

Twitter/X video embeds were displaying too small on WordPress posts, making them hard to watch.

**Example:** https://nowahalazone.com/video-reportedly-shows-single-mother-in-tears-after-selling-phone-to-feed-child/

### Before Fix

Twitter videos had inconsistent sizing:
- Sometimes wrapped in `.fluid-width-video-wrapper` with `width: 55rem; height: 25rem;`
- Height of 25rem (400px) was too small for video content
- Videos appeared cramped and difficult to view

## Root Cause

There was commented-out code in `publishStage.js` (lines 476-494) that was meant to handle Twitter iframe sizing, but it was disabled. This meant:

1. Twitter embeds start as `<blockquote class="twitter-tweet">`
2. Twitter's widgets.js script converts them to iframes
3. These iframes either got default sizing or got caught by other CSS rules
4. The resulting size was too small for comfortable video viewing

The commented code also had very small dimensions:
- Width: 23rem (368px)
- Height: 23.5rem (376px)

## Solution

Uncommented and updated the Twitter iframe sizing code with better dimensions optimized for video content:

```javascript
// For any <iframe> with id or src containing "twitter" or "x.com", set proper video dimensions
$('iframe').each((_, el) => {
  const id = ($(el).attr('id') || '').toLowerCase()
  const src = ($(el).attr('src') || '').toLowerCase()
  if (id.includes('twitter') || src.includes('twitter') || src.includes('x.com/')) {
    // Remove any existing height or width from the style attribute
    let style = $(el).attr('style') || ''
    style = style
      .replace(/height\s*:\s*[^;]+;?/gi, '')
      .replace(/width\s*:\s*[^;]+;?/gi, '')
      .trim()
    // Add better dimensions for Twitter/X video embeds
    style = `${style} width: 35rem; height: 45rem;`.trim()
    $(el).attr('style', style)
    // Also set the HTML attributes for fallback
    $(el).attr('height', '720') // 45rem ≈ 720px
    $(el).attr('width', '560') // 35rem ≈ 560px
  }
})
```

### New Dimensions

- **Width:** 35rem (560px) - Standard video player width
- **Height:** 45rem (720px) - Comfortable height for video viewing
- **Aspect Ratio:** ~9:14 - Good for vertical and square videos

## Benefits

✅ **Better Video Visibility**
- Much larger display area for videos
- Easier to see details and read captions
- Professional-looking embeds

✅ **Consistent Sizing**
- All Twitter/X embeds now have uniform dimensions
- Overrides any conflicting CSS from themes or plugins
- Works for both twitter.com and x.com URLs

✅ **Optimized for Video Content**
- Height increased from 25rem to 45rem (80% larger)
- Width optimized at 35rem for good proportions
- Handles both landscape and portrait videos well

## Impact

- ✅ **All future posts** with Twitter/X videos will use the new larger size
- ✅ **Existing posts** will not change (already published with old size)
- ✅ **Applies to all Twitter/X embeds**, not just videos

## Testing

To test the fix with a new post:

1. Scrape a post containing a Twitter/X video
2. Check the published WordPress post
3. The Twitter embed should display at 35rem × 45rem (560px × 720px)

## Note About Existing Posts

This fix only affects **new posts** created after the change. Existing WordPress posts (like the example mentioned) retain their original embed sizes.

To update existing posts, you would need to:
1. Re-scrape the source article
2. Re-publish to WordPress (overwriting the old post)

However, this is generally not necessary unless the video visibility is critical.

## Files Modified

**publishStage.js** (lines 476-495)
- Uncommented Twitter iframe sizing code
- Updated dimensions from 23rem × 23.5rem to 35rem × 45rem
- Added support for x.com URLs (Twitter's new domain)

## Related Code

The fix works alongside existing social media embed styling:

```css
iframe,
.twitter-tweet,
.instagram-media,
.fb-post,
.fb-video,
.tiktok-embed,
.youtube-player {
  display: block !important;
  margin: 0 auto !important;
}
```

This centers all embeds while maintaining the new size dimensions.
