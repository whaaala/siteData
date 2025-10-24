# YabaLeft Image Extraction Fix

## Problem

Images from yabaleftonline.ng articles were not displaying correctly on WordPress posts. The scraped content contained `<noscript>` tags with images inside them, but these weren't being converted to actual `<img>` tags for display.

### Example Issue

**WordPress post:** https://nowahalazone.com/businesswoman-shares-alleged-chat-with-nigerian-man-claims-gold-digging-tactics/

**Source:** https://www.yabaleftonline.ng/nobody-digs-gold-nigerian-men-businesswoman-leaks-chat-man-wooing/

**Before fix:**
```html
<noscript>
  <img src="https://www.yabaleftonline.ng/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-16-at-10.30.42-AM.jpeg" />
</noscript>
```

Images inside `<noscript>` tags don't display - they're only fallbacks for when JavaScript is disabled.

## Root Cause

Yabaleftonline uses **lazy loading** for images:
- Actual images are loaded by JavaScript
- `<noscript>` tags contain fallback images for non-JavaScript browsers
- When Playwright scrapes the page, it captures the `<noscript>` fallbacks
- These fallback images don't display on WordPress

## Solution

Modified `scrapeRaw.js` to extract images from `<noscript>` tags for yabaleft:

```javascript
// Extract images from noscript tags and replace noscript with actual img tags
$(postEls.post.contentEl)
  .find('noscript')
  .each(function () {
    const noscriptContent = $(this).html()
    if (noscriptContent && noscriptContent.includes('<img')) {
      // Parse the noscript content to extract the img tag
      const $noscript = cheerio.load(noscriptContent)
      const imgEl = $noscript('img').first()

      if (imgEl.length) {
        // Replace the noscript tag with the actual img tag
        $(this).replaceWith(imgEl.toString())
      }
    }
  })
```

## After Fix

```html
<img fetchpriority="high" decoding="async" class="alignnone size-full wp-image-896757"
     src="https://www.yabaleftonline.ng/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-16-at-10.30.42-AM.jpeg"
     alt="" width="715" height="717" />
```

Images now display correctly as standard `<img>` tags.

## Testing

Run the test to verify the fix:

```bash
node testNoscriptImageExtraction.js
```

**Expected output:**
```
✅ Noscript tags remaining: 0 (should be 0)
✅ Image tags found: 2 (should be 2)
✅ TEST PASSED - All noscript images extracted successfully!
```

## Impact

This fix ensures that:
- ✅ Images from yabaleft articles now display on WordPress
- ✅ All images wrapped in `<noscript>` tags are extracted
- ✅ Works for all future yabaleft scrapes

## Note: Missing Third Image

In the specific article mentioned, the source page had **3 images**:
1. WhatsApp-Image-2025-10-16-at-10.30.42-AM.jpeg ✅ (extracted)
2. Screenshot-2025-10-16-102058.jpg ✅ (extracted)
3. WhatsApp-Image-2025-10-16-at-10.12.14-AM.jpeg ❌ (missing from scraped content)

The third image appears to be **missing from the scraped raw content entirely**. At the end of the scraped content, it says "See the screenshot of the chat below," but no image follows.

**Possible reasons:**
- The third image may have been added after the initial scrape
- It may have been in a different section that wasn't captured by the content selector
- It may have been lazy-loaded even later than the initial page load

**To investigate:** Check if the image exists in the current source page and whether it's within the `.td-post-content` selector used for scraping.

## Files Modified

1. **scrapeRaw.js** (lines 855-870)
   - Added noscript image extraction for yabaleft
   - Replaces `<noscript>` with actual `<img>` tags

## Related Configuration

Yabaleft scraping configuration in `sites.js`:
- Content selector: `.td-post-content`
- Image selector: `.td-post-featured-image img`

The fix applies to ALL images within the content area, not just the featured image.
