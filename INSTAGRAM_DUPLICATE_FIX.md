# Instagram Duplicate Display Fix

## Problem

Instagram embeds were displaying duplicate URLs on WordPress posts, with plain text Instagram URLs visible inside the Instagram blockquote embeds.

**Example:** https://nowahalazone.com/kunle-hamilton-criticizes-bbnaijas-imisi-sends-strong-message-to-celestial-youths/

### Before Fix

The Instagram embed HTML contained plain text URLs inside the blockquote:

```html
<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/DPvlWkbjEiE/...">
  <p style="margin-bottom:0.5rem;">
    https://www.instagram.com/p/DPvlWkbjEiE/?igsh=cXg0Njlzd2NibW52&img_index=2
  </p>
</blockquote>
```

**Issues:**
- Plain text URLs visible inside Instagram embeds
- Duplicate content (same URL appears in data attribute AND as plain text)
- Poor user experience - URLs shouldn't be visible in properly rendered embeds

## Root Cause

When Instagram embeds were created (either from scraped content or during processing), some included paragraph tags with plain text URLs inside the blockquote element. Instagram's embed.js script doesn't automatically hide these URLs, so they remained visible on the WordPress page.

This is similar to the TikTok embed issue that was previously fixed.

## Solution

Added Instagram blockquote cleanup code in `utils.js` (lines 325-337) to remove plain text URLs from inside Instagram embeds:

```javascript
// Clean up Instagram blockquotes: Remove plain URLs inside them
$('.instagram-media').each((i, blockquote) => {
  let blockquoteHtml = $(blockquote).html() || ''

  // Remove Instagram post URLs - they're not needed inside the embed
  blockquoteHtml = blockquoteHtml.replace(/https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+[^\s<]*/g, '')

  // Remove empty paragraphs and extra whitespace
  blockquoteHtml = blockquoteHtml.replace(/<p[^>]*>\s*<\/p>/g, '')
  blockquoteHtml = blockquoteHtml.trim()

  $(blockquote).html(blockquoteHtml)
})
```

### How It Works

1. **Finds all Instagram blockquotes**: Selects elements with class `.instagram-media`
2. **Removes plain URLs**: Uses regex to remove Instagram post URLs from inside the blockquote HTML
3. **Cleans up empty elements**: Removes empty `<p>` tags left after URL removal
4. **Preserves data attributes**: The `data-instgrm-permalink` attribute remains intact (required for Instagram's embed script)

## After Fix

```html
<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/DPvlWkbjEiE/...">
</blockquote>
<script async src="//www.instagram.com/embed.js"></script>
```

The blockquote is now clean with no visible URLs inside. Instagram's embed.js script will render the full post using the `data-instgrm-permalink` attribute.

## Benefits

✅ **Clean Instagram Embeds**
- No duplicate URLs visible to users
- Professional-looking embeds
- Proper Instagram native rendering

✅ **Consistent with Other Social Media**
- Same cleanup approach as TikTok embeds
- All social media embeds now properly formatted

✅ **Better User Experience**
- Users see the Instagram post content, not raw URLs
- Embeds render exactly as intended by Instagram

## Impact

- ✅ **All future posts** with Instagram embeds will use the cleaned format
- ✅ **Existing posts** will not change (already published with old format)
- ✅ **Applies to all Instagram embeds**, not just posts from specific sources

## Testing

To test the fix with the specific post that had the issue:

```bash
node testInstagramDuplicateFix.js
```

**Expected output:**
```
=== BEFORE CLEANUP ===
Instagram embeds: 1
Plain URLs inside blockquotes: 1 ⚠️ (should be 0)

=== AFTER CLEANUP ===
Instagram embeds: 2
Plain URLs inside blockquotes: 0 ✅ (should be 0)

=== VERIFICATION ===
✅ TEST PASSED
  - Instagram embeds are present and properly formatted
  - No plain URLs inside Instagram blockquotes
  - Instagram embeds will render correctly without duplicate URLs
```

**Note:** The test shows 2 embeds after cleanup because the cleanup function also converts contextual Instagram links into proper embeds.

## Files Modified

**utils.js** (lines 325-337)
- Added Instagram blockquote cleanup code
- Removes plain text URLs from inside `.instagram-media` elements
- Cleans up empty paragraphs after URL removal

## Related Fixes

This fix follows the same pattern as:
- **TikTok Embed Fix** (`TIKTOK_EMBED_FIX.md`) - Removes unwanted URLs from TikTok blockquotes
- Both fixes run in `embedSocialLinksInContent()` before link processing

## Technical Details

### Regex Pattern Used

```javascript
/https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+[^\s<]*/g
```

This pattern matches:
- HTTP or HTTPS protocol
- Optional `www.` subdomain
- `instagram.com/p/` path
- Post ID (alphanumeric, underscore, hyphen)
- Any query parameters (until whitespace or `<`)

### Processing Order

The cleanup happens in `embedSocialLinksInContent()`:
1. TikTok blockquote cleanup (lines 309-323)
2. **Instagram blockquote cleanup (lines 325-337)** ← This fix
3. Link-to-embed conversion (lines 339+)

This order ensures that existing embeds are cleaned up before new embeds are created from links.

## Future Considerations

If Instagram changes their embed format or if plain URLs still appear in some edge cases, the regex pattern may need adjustment. The current pattern handles:
- Standard Instagram post URLs
- URLs with query parameters (`?igsh=...`)
- URLs with index parameters (`&img_index=2`)

## Note About Existing Posts

This fix only affects **new posts** created after the change and posts that are re-processed through the pipeline. Existing WordPress posts retain their original embed formatting.

To update an existing post like the example mentioned:
1. Delete the WordPress post
2. Delete the database entry in the `posts` collection
3. Re-scrape and re-publish the article

However, this is generally not necessary unless the duplicate URLs are causing significant user experience issues.
