# Pulse.com.gh Category Fix

## Problem

Pulse.com.gh articles were being assigned incorrect categories. For example, a political article about NPP primaries was categorized as "Health & Fitness" instead of "News".

**Example:**
- URL: `https://www.pulse.com.gh/articles/news/63-npp-mps-declare-support-for-dr-bawumia-ahead-of-january-31-presidential-primaries-2025102316244949388`
- Wrong category: "Health & Fitness"
- Correct category: "News"

## Root Cause

The category selector `.c-breadcrumbs:first-of-type` defined in `sites.js` line 1455 doesn't find any elements on pulse.com.gh pages, so category extraction failed and defaulted to an incorrect value.

Testing revealed:
```
=== Testing Category Selector ===
Selector: .c-breadcrumbs:first-of-type

❌ Category element not found

=== All Breadcrumb Elements ===
Found 0 breadcrumb elements:
```

## Solution

Implemented URL-based category inference in `scrapeRaw.js` lines 355-384.

The fix extracts the category directly from the URL path:
- `/news/` or `/articles/news/` → **News**
- `/entertainment/` → **Entertainment**
- `/lifestyle/` → **Lifestyle**
- `/sports/` → **Sports**
- `/business/` → **News** (business articles map to News category)

### Implementation

```javascript
// Special handling for pulse.com.gh/pulse.ng to infer category from URL
if (
  postListings[listing].website &&
  postListings[listing].website.includes('pulse.') &&
  url
) {
  try {
    const urlPath = new URL(url).pathname.toLowerCase()

    // Extract category from URL path
    if (urlPath.includes('/news/') || urlPath.includes('/articles/news/')) {
      category = 'News'
      console.log(`[Pulse Category Fix] Inferred category "News" from URL path: ${urlPath}`)
    } else if (urlPath.includes('/entertainment/')) {
      category = 'Entertainment'
      console.log(`[Pulse Category Fix] Inferred category "Entertainment" from URL path: ${urlPath}`)
    } else if (urlPath.includes('/lifestyle/')) {
      category = 'Lifestyle'
      console.log(`[Pulse Category Fix] Inferred category "Lifestyle" from URL path: ${urlPath}`)
    } else if (urlPath.includes('/sports/')) {
      category = 'Sports'
      console.log(`[Pulse Category Fix] Inferred category "Sports" from URL path: ${urlPath}`)
    } else if (urlPath.includes('/business/')) {
      category = 'News'  // Business articles go to News category
      console.log(`[Pulse Category Fix] Inferred category "News" (business) from URL path: ${urlPath}`)
    }
  } catch (urlError) {
    console.warn(`[Pulse Category Fix] Failed to parse URL: ${url}`)
  }
}
```

## Testing

Created `testPulseCategoryFix.js` to verify URL parsing logic.

All tests pass:
- ✅ News articles (including `/articles/news/` variant)
- ✅ Entertainment articles
- ✅ Lifestyle articles
- ✅ Sports articles
- ✅ Business articles (mapped to News)
- ✅ Works for both pulse.com.gh and pulse.ng

## Impact

- **Applies to:** pulse.com.gh and pulse.ng only
- **When it runs:** During stage 1 (raw scraping) in `scrapeRaw.js`
- **Fallback:** If URL parsing fails, category extraction continues normally
- **Logging:** Each successful inference logs to console with `[Pulse Category Fix]` prefix

## Monitoring

Watch for these log messages during scraping:
```
[Pulse Category Fix] Inferred category "News" from URL path: /articles/news/...
```

If you see incorrect categories from pulse sites, check:
1. The URL structure matches expected patterns
2. The category is supported (News, Entertainment, Lifestyle, Sports, Business)
3. The URL parsing doesn't throw errors
