# Facebook Multi-Page Posting Setup

## Overview

The system now automatically posts to multiple Facebook pages based on content category:

- **Entertainment & Gists** → Posted to **BOTH** Nigeriacelebrities AND No Wahala Zone
- **All Other Categories** (News, Sports, Lifestyle, etc.) → Posted to **No Wahala Zone only**

## Facebook Pages Configuration

### 1. No Wahala Zone (Default Page)
- **Page ID:** 794703240393538
- **Token:** PERMANENT (never expires)
- **Receives:** All posts

### 2. Nigeriacelebrities (Entertainment Page)
- **Page ID:** 2243952629209691
- **Token:** PERMANENT (never expires)
- **Receives:** Entertainment and Gists only

## How It Works

### Category-Based Routing

The system uses `facebookPageRouter.js` to determine which pages receive each post:

```javascript
// Example: Entertainment post
Category: "Entertainment"
  → Posts to:
     • Nigeriacelebrities (2243952629209691)
     • No Wahala Zone (794703240393538)

// Example: News post
Category: "News"
  → Posts to:
     • No Wahala Zone (794703240393538)
```

### Implementation Files

1. **facebookPageRouter.js** - Page routing configuration
   - Stores page credentials
   - `getFacebookPagesForCategory()` - Returns pages for a category

2. **facebook.js** - Updated posting function
   - Now accepts custom `pageId`, `accessToken`, `pageName` parameters
   - Falls back to environment variables if not provided

3. **publishStage.js** - Multi-page posting logic
   - Gets pages for category: `getFacebookPagesForCategory(post.category)`
   - Loops through pages and posts to each
   - Stores results as JSON array in database

### Database Storage

Facebook post IDs are now stored as JSON arrays in the `fbPostId` field:

```json
[
  {
    "pageName": "Nigeriacelebrities",
    "pageId": "2243952629209691",
    "postId": "122109589539043918"
  },
  {
    "pageName": "No Wahala Zone",
    "pageId": "794703240393538",
    "postId": "122109589539043919"
  }
]
```

### Moderation Status

- `posted` - All pages posted successfully
- `partially_posted` - Some pages succeeded, some failed
- `failed_to_post` - All pages failed

## Testing

Test the routing configuration:

```bash
node testFacebookRouting.js
```

This will show which pages each category routes to.

## Categories Breakdown

| Category | Posts to Nigeriacelebrities? | Posts to No Wahala Zone? |
|----------|------------------------------|--------------------------|
| Entertainment | ✅ Yes | ✅ Yes |
| Gists | ✅ Yes | ✅ Yes |
| News | ❌ No | ✅ Yes |
| Sports | ❌ No | ✅ Yes |
| Lifestyle | ❌ No | ✅ Yes |
| HealthAndFitness | ❌ No | ✅ Yes |
| FoodAndDrink | ❌ No | ✅ Yes |
| Cars | ❌ No | ✅ Yes |

## Modifying Routing Rules

To change which categories go to which pages, edit `facebookPageRouter.js`:

```javascript
export function getFacebookPagesForCategory(category) {
  const pages = []

  // Entertainment and Gists go to BOTH pages
  if (category === 'Entertainment' || category === 'Gists') {
    pages.push(FACEBOOK_PAGES.NIGERIACELEBRITIES)
    pages.push(FACEBOOK_PAGES.NO_WAHALA_ZONE)
  } else {
    // All other categories go to No Wahala Zone only
    pages.push(FACEBOOK_PAGES.NO_WAHALA_ZONE)
  }

  return pages
}
```

### Example Customizations

**Add Sports to Nigeriacelebrities:**
```javascript
if (category === 'Entertainment' || category === 'Gists' || category === 'Sports') {
  pages.push(FACEBOOK_PAGES.NIGERIACELEBRITIES)
  pages.push(FACEBOOK_PAGES.NO_WAHALA_ZONE)
}
```

**Remove category from all pages:**
```javascript
if (category === 'Obituary') {
  // Return empty array - no posting
  return []
}
```

## Token Management

Both pages use **PERMANENT tokens** that never expire:

- ✅ Extracted from long-lived User token
- ✅ Page Access Tokens (not User tokens)
- ✅ Verified to never expire (`expires_at: 0`)
- ✅ All required permissions granted

Tokens are stored directly in `facebookPageRouter.js` (not in `.env`).

## Logging

The system logs each posting step:

```
[Facebook Stage] Category "Entertainment" → Posting to 2 page(s)
[Facebook Stage] Posting to Nigeriacelebrities...
[Facebook] Posting photo to Nigeriacelebrities: https://...
[Facebook] Successfully posted photo to Nigeriacelebrities. Post ID: 122109589539043918
[Facebook Stage] ✅ Successfully posted to Nigeriacelebrities. Post ID: 122109589539043918
[Facebook Stage] Posting to No Wahala Zone...
[Facebook] Posting photo to No Wahala Zone: https://...
[Facebook] Successfully posted photo to No Wahala Zone. Post ID: 122109589539043919
[Facebook Stage] ✅ Successfully posted to No Wahala Zone. Post ID: 122109589539043919
[Facebook Stage] ✅ Posted to 2/2 Facebook page(s)
```

## Summary

✅ **Entertainment & Gists** → Posted to BOTH pages for maximum reach
✅ **All other content** → Posted to No Wahala Zone only
✅ **Permanent tokens** → No expiration, no maintenance needed
✅ **Detailed logging** → Track which pages receive each post
✅ **Flexible routing** → Easy to modify in `facebookPageRouter.js`
