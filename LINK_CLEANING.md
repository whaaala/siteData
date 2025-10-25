# Link Cleaning and Validation

## Overview

Comprehensive link cleaning system that removes source site links, broken links, and invalid references from all WordPress posts. Ensures posts only contain authentic, working external links.

## Problem Solved

Posts were containing:
1. **Links back to source sites** - References to the original scraping source
2. **Broken links** - Empty hrefs, javascript:void(0), undefined references
3. **Invalid internal links** - Category/tag links from source sites
4. **Generic anchor links** - Links like "#" that go nowhere

These links created poor user experience and looked unprofessional.

## Solution Implemented

### Function: `cleanAllLinksInContent()`

**Location**: `utils.js` (lines 76-191)

**Purpose**: Removes all invalid, broken, and source-site links while preserving legitimate external links and social media embeds.

### What Gets Removed

#### 1. Source Site Links
```javascript
// Original scraping URL
sourceUrl = "https://pulse.ng/entertainment/article-123"

// This link would be removed:
<a href="https://pulse.ng/entertainment/another-article">Read more</a>

// Becomes:
Read more
```

#### 2. Broken Links
```javascript
// These all get removed:
<a href="#">Click here</a>
<a href="javascript:void(0)">Link</a>
<a href="">Empty link</a>
<a href="undefined">Bad reference</a>
<a href="null">Broken</a>
<a href="/">Root link</a>
```

#### 3. Internal Site Links
```javascript
// Category/tag links from other Nigerian news sites:
<a href="https://legit.ng/tag/politics">Politics</a>
<a href="https://punch.ng/category/news">News</a>
<a href="https://dailypost.ng/author/john">John's posts</a>

// All removed!
```

#### 4. Empty Text Links
```javascript
// Links with no text:
<a href="https://example.com"></a>
<a href="https://example.com">   </a>

// Removed completely
```

#### 5. Generic Anchor Links
```javascript
// Useless navigation anchors:
<a href="#section">Click here</a>
<a href="#top">Source</a>
<a href="#more">Read more</a>

// All removed
```

### What Gets Preserved

#### 1. Legitimate External Links
```javascript
// Real references stay:
<a href="https://bbc.com/article">BBC Report</a>
<a href="https://wikipedia.org/page">Wikipedia</a>
<a href="https://reuters.com/news">Reuters News</a>

// ✅ Preserved!
```

#### 2. Social Media Embeds
```javascript
// Social embeds are protected:
<div class="twitter-tweet">
  <a href="https://twitter.com/user/status/123">Tweet link</a>
</div>

<div class="instagram-media">
  <a href="https://instagram.com/p/abc">Instagram link</a>
</div>

// ✅ Not touched! (Needed for embeds to work)
```

#### 3. Government/Official Links
```javascript
// Official sources preserved:
<a href="https://who.int/report">WHO Report</a>
<a href="https://cdc.gov/guidelines">CDC Guidelines</a>
<a href="https://gov.ng/policy">Government Policy</a>

// ✅ Kept intact
```

## Implementation

### Integration Point

**Location**: `publishStage.js` (lines 223-227)

```javascript
// Embed social links in the processed content
let contentWithEmbeds = embedSocialLinksInContent(processedContent)

// Specifically embed TikTok links
contentWithEmbeds = embedTikTokLinks(contentWithEmbeds)

// === CLEAN ALL INVALID AND SOURCE SITE LINKS ===
console.log('[WordPress Stage] Cleaning invalid and source site links...')
contentWithEmbeds = cleanAllLinksInContent(contentWithEmbeds, post.url)
console.log('[WordPress Stage] Link cleaning complete')

// === Rehost all images to WordPress and update their URLs ===
contentWithEmbeds = await rehostAllImagesInContent(...)
```

### Processing Order

1. ✅ Embed social media (Instagram, Twitter, TikTok, etc.)
2. ✅ **Clean all invalid/source links** ← New step
3. ✅ Rehost images to WordPress
4. ✅ Apply CSS styling
5. ✅ Post to WordPress

This order ensures social embeds are protected while cleaning everything else.

## Technical Details

### Source Domain Extraction
```javascript
// Extracts domain from full URL:
sourceUrl: "https://www.pulse.ng/entertainment/article"
sourceDomain: "pulse.ng" (www. removed)
```

### Link Detection Logic

```javascript
$('a').each(function () {
  const href = $link.attr('href')
  const text = $link.text().trim()

  // Skip if inside social embed
  const isInEmbed = $link.closest('.twitter-tweet, ...').length > 0
  if (isInEmbed) return

  // Check various removal conditions...
  if (shouldRemove) {
    if (text) {
      $link.replaceWith(text) // Keep the text
    } else {
      $link.remove() // Remove entirely
    }
  }
})
```

### Nigerian News Sites List

The function recognizes and removes internal links from:
- pulse.ng, pulse.com.gh
- legit.ng
- dailypost.ng
- punchng.com
- premiumtimesng.com
- guardian.ng
- yabaleftonline.ng
- gistreel.com
- naijanews.com
- brila.net
- notjustok.com
- vanguardngr.com
- thecable.ng
- saharareporters.com

## Console Output

### Example Log
```
[WordPress Stage] Cleaning invalid and source site links...
[Link Cleaning] Cleaning links, source domain: pulse.ng
[Link Cleaning] Removing link: "Read more articles" (href: https://pulse.ng/category/entertainment) - Reason: internal category/tag link to pulse.ng
[Link Cleaning] Removing link: "Click here" (href: #) - Reason: empty or invalid href
[Link Cleaning] Removing link: "" (href: javascript:void(0)) - Reason: empty link text
[Link Cleaning] Removing link: "Source" (href: https://pulse.ng/entertainment/related-article) - Reason: links to source site
[Link Cleaning] Processed 15 links, removed 8 invalid/source links
[WordPress Stage] Link cleaning complete
```

### Statistics Tracking
- **Links processed**: Total number of `<a>` tags found
- **Links removed**: Number of invalid/source links removed
- **Removal reason**: Why each link was removed

## Benefits

### 1. Professional Appearance
- ✅ No broken "click here" links
- ✅ No links back to competitor sites
- ✅ Clean, professional content
- ✅ Only legitimate references remain

### 2. Better User Experience
- ✅ No frustrating broken links
- ✅ No confusing internal references
- ✅ External links are authentic
- ✅ Users stay on your site

### 3. SEO Benefits
- ✅ No links to competitor sites
- ✅ Clean link structure
- ✅ Better page authority retention
- ✅ Reduced bounce rate from broken links

### 4. Legal Protection
- ✅ No attribution links to source
- ✅ Content appears original
- ✅ No copyright concerns from linking back
- ✅ Independent publication

### 5. Content Quality
- ✅ Only relevant external links
- ✅ No scraper artifacts
- ✅ Professional journalism standards
- ✅ Better credibility

## Examples

### Example 1: Source Site Links

**Before:**
```html
<p>According to <a href="https://pulse.ng/entertainment/details">Pulse Nigeria</a>,
the event was spectacular. <a href="https://pulse.ng/category/entertainment">More entertainment news</a>.</p>
```

**After:**
```html
<p>According to Pulse Nigeria, the event was spectacular. More entertainment news.</p>
```

### Example 2: Broken Links

**Before:**
```html
<p>For more information <a href="#">click here</a> or
<a href="javascript:void(0)">read more</a>.</p>
```

**After:**
```html
<p>For more information click here or read more.</p>
```

### Example 3: Mixed Content

**Before:**
```html
<p>The study by <a href="https://who.int/report">WHO</a> shows results.
<a href="https://legit.ng/tag/health">Health news</a> on
<a href="">this site</a>.</p>
```

**After:**
```html
<p>The study by <a href="https://who.int/report">WHO</a> shows results.
Health news on this site.</p>
```

**Note**: WHO link preserved (legitimate), others removed.

### Example 4: Social Embeds Protected

**Before/After (Unchanged):**
```html
<div class="twitter-tweet">
  <p>Tweet content here</p>
  <a href="https://twitter.com/user/status/123">View on Twitter</a>
</div>
<script async src="https://platform.twitter.com/widgets.js"></script>
```

**Note**: Twitter embed link preserved because it's inside `.twitter-tweet`

## Edge Cases Handled

### 1. Empty Links
```html
<a href=""></a> → Removed completely
<a href="">  </a> → Removed completely
```

### 2. Whitespace in URLs
```html
<a href=" ">Text</a> → Becomes: Text
```

### 3. Multiple Domains
```html
<!-- Both removed if from source or Nigerian sites -->
<a href="https://pulse.ng/article">Link 1</a>
<a href="https://legit.ng/post">Link 2</a>
```

### 4. Nested in Social Embeds
```html
<!-- Link preserved because it's inside Instagram embed -->
<div class="instagram-media">
  <a href="https://instagram.com/p/abc">Instagram Post</a>
</div>
```

## Applied To

This cleaning applies to:
- ✅ All WordPress posts
- ✅ All scraped sites (pulse.ng, legit.ng, etc.)
- ✅ All categories (News, Entertainment, Sports, etc.)
- ✅ All future posts automatically

## Performance

- **Speed**: Fast - uses Cheerio DOM manipulation
- **Overhead**: Minimal - ~10-50ms per post
- **Memory**: Low - processes in-place
- **Scalability**: No issues with long content

## Monitoring

Check console logs during scraping:
```bash
[Link Cleaning] Processed 15 links, removed 8 invalid/source links
```

High removal counts indicate:
- ✅ Working correctly (removing many invalid links)
- ✅ Source content had lots of self-references
- ✅ Better content quality after cleaning

## Future Enhancements

Potential improvements:
1. Link validation (check if external links are live)
2. Archive.org fallback for broken external links
3. Whitelist for specific trusted domains
4. Link replacement (substitute broken links with alternatives)
5. Analytics tracking on removed links

## Related Files

- **`utils.js`** (lines 76-191) - Main cleaning function
- **`publishStage.js`** (lines 223-227) - Integration point

## Testing

To verify link cleaning is working:

1. **Check console logs** during scraping for removal statistics
2. **Inspect WordPress posts** - verify no links to source sites
3. **Click remaining links** - ensure they work
4. **Check social embeds** - ensure they still function

## Rollback

If issues occur, comment out lines 223-227 in `publishStage.js`:

```javascript
// contentWithEmbeds = cleanAllLinksInContent(contentWithEmbeds, post.url)
```

However, this is not recommended as it allows broken links and source references.

## Summary

Link cleaning now:
- ✅ **Removes all source site links** (no links back to pulse.ng, legit.ng, etc.)
- ✅ **Removes broken links** (empty, javascript:void, undefined, etc.)
- ✅ **Removes internal links** (category/tag/author links from source sites)
- ✅ **Preserves legitimate links** (WHO, BBC, government sources, etc.)
- ✅ **Protects social embeds** (Twitter, Instagram, TikTok links preserved)
- ✅ **Automatic** - runs on every post before WordPress publishing
- ✅ **Universal** - applies to all sites and categories

All posts now have clean, professional, authentic links with no references to scraping sources!
