# Feature Image Optimization

## Overview

The system now automatically finds and uses the **largest/highest quality image** from scraped post content as the WordPress featured image. This ensures that all published posts have the best possible visual presentation across WordPress, Facebook, Instagram, and X (Twitter).

## How It Works

### 1. Image Collection
After extracting post content, the system:
- Collects the initially scraped featured image
- Scans all `<img>` tags in the post content
- Extracts all unique image URLs (ignoring placeholders and data URIs)

### 2. Image Comparison
For each image found:
- Fetches the image from its URL
- Uses Sharp library to get precise dimensions (width × height)
- Calculates total pixels (width × height)
- Tracks the largest image by pixel count

### 3. Feature Image Selection
- If a content image is larger than the initial featured image → Uses the larger one
- If the initial featured image is already the largest → Keeps it
- If no images can be fetched → Falls back to initial featured image
- All errors are handled gracefully with fallback to initial image

## Implementation Details

### Files Modified

#### `utils.js`
New function added: `findLargestImageInContent(postDetails, initialImageUrl)`

```javascript
/**
 * Finds the largest/best quality image from post content.
 * Compares all images in the content with the initial feature image.
 * Returns the URL and dimensions of the largest image.
 * @param {Array<string>} postDetails - Array of HTML content strings
 * @param {string} initialImageUrl - The initially extracted feature image URL
 * @returns {Promise<{url: string, width: number, height: number, pixels: number}>}
 */
export async function findLargestImageInContent(postDetails, initialImageUrl)
```

**Features:**
- Extracts all unique image URLs from HTML content
- Handles lazy-loaded images (data-src, data-lazy-src)
- Skips placeholders and invalid images
- Returns dimensions and pixel count
- Comprehensive error handling

#### `scrapeRaw.js`
Integration added after content extraction (line 841-866):

```javascript
// === FEATURE IMAGE OPTIMIZATION ===
// Find the largest image in content and use it as the feature image if it's larger than the initial one
try {
  console.log('[Image Optimization] Starting feature image optimization...')
  console.log(`[Image Optimization] Initial feature image: ${imageLink}`)

  const largestImage = await findLargestImageInContent(postDetails, imageLink)

  if (largestImage && largestImage.url !== imageLink) {
    console.log(`[Image Optimization] 🎯 Found larger image in content!`)
    console.log(`[Image Optimization] Switching from: ${imageLink}`)
    console.log(`[Image Optimization] Switching to: ${largestImage.url}`)
    console.log(`[Image Optimization] New dimensions: ${largestImage.width}x${largestImage.height}`)

    // Use the largest image as the feature image
    imageLink = largestImage.url
  } else if (largestImage && largestImage.url === imageLink) {
    console.log(`[Image Optimization] ✓ Initial feature image is already the largest`)
  } else {
    console.log(`[Image Optimization] ⚠️ Could not find any larger images, keeping initial feature image`)
  }
} catch (error) {
  console.warn(`[Image Optimization] ⚠️ Error during image optimization: ${error.message}`)
  console.log(`[Image Optimization] Falling back to initial feature image`)
}
// === END FEATURE IMAGE OPTIMIZATION ===
```

**Placement:**
- Runs after content extraction and cleaning
- Runs before WordPress image upload
- Applies to ALL sites (no site-specific configuration needed)

## Benefits

### 1. Better Visual Quality
- WordPress featured images are now the largest/highest quality available
- No more small or low-resolution feature images
- Improved visual appeal across the site

### 2. Enhanced Social Media Presence
- **Facebook**: Better quality post images, more engagement
- **Instagram**: Sharper, clearer images in feeds and stories
- **X (Twitter)**: Better preview cards with larger images
- Higher click-through rates from better visuals

### 3. SEO Benefits
- Larger, higher quality images improve user engagement signals
- Better visual content leads to longer page visits
- Improved social sharing metrics

### 4. Automated Optimization
- No manual intervention required
- Works automatically for all scraped posts
- Universal implementation across all news sources

## Console Output Examples

### When Larger Image Found:
```
[Image Optimization] Starting feature image optimization...
[Image Optimization] Initial feature image: https://example.com/images/640/image.jpg
[Image Optimization] Finding largest image in content...
[Image Optimization] Found 3 unique images to compare
[Image Optimization] Checking: https://example.com/images/640/image.jpg...
[Image Optimization] Dimensions: 640x480 (307,200 pixels)
[Image Optimization] ✓ New largest image found: 640x480
[Image Optimization] Checking: https://example.com/images/1120/image.jpg...
[Image Optimization] Dimensions: 1120x630 (705,600 pixels)
[Image Optimization] ✓ New largest image found: 1120x630
[Image Optimization] ✅ Largest image selected: 1120x630 (705,600 pixels)
[Image Optimization] 🎯 Found larger image in content!
[Image Optimization] Switching from: https://example.com/images/640/image.jpg
[Image Optimization] Switching to: https://example.com/images/1120/image.jpg
[Image Optimization] New dimensions: 1120x630
```

### When Initial Image Is Already Largest:
```
[Image Optimization] Starting feature image optimization...
[Image Optimization] Initial feature image: https://example.com/images/1120/image.jpg
[Image Optimization] Finding largest image in content...
[Image Optimization] Found 2 unique images to compare
[Image Optimization] Checking: https://example.com/images/1120/image.jpg...
[Image Optimization] Dimensions: 1120x630 (705,600 pixels)
[Image Optimization] ✓ New largest image found: 1120x630
[Image Optimization] Checking: https://example.com/images/320/image.jpg...
[Image Optimization] Dimensions: 320x180 (57,600 pixels)
[Image Optimization] ✅ Largest image selected: 1120x630 (705,600 pixels)
[Image Optimization] ✓ Initial feature image is already the largest
```

## Error Handling

The system gracefully handles all errors:

### Network Errors
```
[Image Optimization] Failed to fetch: Not Found
```
- Continues checking other images
- Falls back to initial feature image if all fail

### Invalid Images
```
[Image Optimization] Error checking image: Invalid image format
```
- Skips invalid images
- Continues with other images

### Timeout Errors
- Fetches have 10-second timeout
- Prevents hanging on slow image servers
- Falls back gracefully

## Testing

Run the test suite to verify functionality:

```bash
node testFeatureImageOptimization.js
```

This will test:
1. Multiple images with larger one in content
2. Initial image already being the largest
3. Content with no images (fallback)

## Expected Results

### Before Implementation
- Featured images were whatever the site listed as the main image
- Often small thumbnails or low-resolution versions
- Inconsistent quality across posts
- Poor social media previews

### After Implementation
- Featured images are now the largest available from the post
- Consistently high quality across all posts
- Better engagement on social media platforms
- Professional visual presentation

## Performance Impact

### Minimal Performance Cost
- Image dimension checks are fast (uses Sharp, not full download)
- Only runs during scraping (not on every page load)
- Cached by WordPress after first upload
- Errors are handled quickly with fallbacks

### Network Impact
- Fetches images only during scraping
- Uses existing network requests (images already being downloaded)
- No additional bandwidth for end users

## Compatibility

### Works With All Sites
- Universal implementation across all scraped sites
- No site-specific configuration needed
- Handles all image formats (JPG, PNG, WebP, etc.)
- Supports lazy-loaded images

### WordPress Compatibility
- Integrates seamlessly with existing WordPress upload flow
- Uses standard WordPress featured image system
- No WordPress plugin modifications needed

## Future Enhancements

Potential improvements:
1. Image quality scoring (not just size)
2. Aspect ratio preferences (e.g., prefer 16:9 for social media)
3. Face detection to prioritize images with people
4. Minimum quality thresholds
5. Cache successful image comparisons

## Troubleshooting

### Issue: No larger image found when one exists
**Solution:** Check console logs for fetch errors. Image may be blocked or invalid.

### Issue: Wrong image selected
**Solution:** Review pixel count comparisons in console. System always selects by total pixels (width × height).

### Issue: Slow scraping
**Solution:** Check network connectivity. Image fetches have 10-second timeout.

## Related Files

- `utils.js` - Core optimization function
- `scrapeRaw.js` - Integration point
- `testFeatureImageOptimization.js` - Test suite
- `wordpress.js` - WordPress upload functions

## Monitoring

Track these metrics to measure success:
- Average featured image dimensions (should increase)
- Social media engagement rates (should improve)
- User time on page (should increase with better visuals)
- Click-through rates from social media (should improve)

## Conclusion

This feature ensures that every post published to WordPress uses the highest quality featured image available, resulting in better visual presentation, improved social media engagement, and a more professional appearance across all platforms.
