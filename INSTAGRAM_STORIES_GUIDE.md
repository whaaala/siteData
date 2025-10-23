# Instagram Stories with Clickable Links

## Overview

Your scraper now posts to **BOTH** Instagram Feed and Instagram Stories for each article:

### Instagram Feed (Permanent)
- ✅ Permanent post on your profile grid
- ✅ Shows full URL in caption
- ❌ URL is NOT clickable (Instagram limitation)
- 📱 Format: Title + Excerpt + URL

### Instagram Stories (24 Hours)
- ✅ 24-hour temporary story
- ✅ **CLICKABLE link sticker** - users can tap to visit your site!
- ✅ Can be saved to Story Highlights for permanent display
- 🔗 Direct traffic to your WordPress articles

---

## How It Works

When your scraper publishes an article to WordPress:

```
WordPress Publish ✅
    ↓
Facebook Post ✅ (excerpt + link + image)
    ↓
Instagram Feed ✅ (title + excerpt + URL - not clickable)
    ↓
Instagram Story ✅ (image + CLICKABLE link sticker)
```

---

## Instagram Feed Post Format

```
Breaking News: Major Announcement Today

Former Vice President makes important decision about
upcoming elections. Full details and analysis available
on our website...

🔗 https://nowahalazone.com/article-slug

[Featured Image Below]
```

**Note:** The URL appears in the caption but is **NOT clickable**. Users must copy/paste or use the Story link.

---

## Instagram Story Format

```
[Full-screen Featured Image]

[Clickable Link Sticker with your URL]
↑ Users tap this to visit your site instantly!
```

**Key Features:**
- Full-screen vertical image (1080x1920 recommended)
- Clickable link sticker at the bottom
- Disappears after 24 hours (unless saved to Highlights)
- Drives immediate traffic to your WordPress site

---

## Benefits of Stories

### Immediate Traffic
Stories appear at the top of followers' feeds and get high visibility for 24 hours.

### Clickable Links
Unlike feed posts, Story links are **actually clickable**, making it easy for users to visit your site.

### Urgency
The 24-hour lifespan creates urgency - users know they need to check it now.

### Story Highlights
You can save stories to "Highlights" on your profile for permanent display.

---

## Database Tracking

Each post now tracks:
- `igPostId` - Instagram feed post ID
- `igStoryId` - Instagram story ID (NEW!)
- `igModerationStatus` - Moderation status for both feed and story

You can query MongoDB to see which articles were posted to Stories:

```javascript
db.posts.find({ igStoryId: { $exists: true } })
```

---

## Testing

### Test Both Feed + Story:
```bash
node testInstagramStory.js
```

This will:
1. ✅ Verify your Instagram token
2. ✅ Post a test to Instagram Feed
3. ✅ Post a test to Instagram Story with clickable link
4. ✅ Show you the Post IDs

### Check Your Instagram:
1. **Feed**: Look for the test post in your grid
2. **Story**: Tap your profile picture - you'll see a story with a clickable link at the bottom!

---

## Story Best Practices

### 1. Image Sizing
- **Feed**: 1080x1080 (square)
- **Story**: 1080x1920 (9:16 vertical) - ideal but our square images work too

### 2. Link Placement
The link sticker automatically appears at the bottom of the story.

### 3. Story Highlights
Consider organizing your stories into Highlights categories:
- "News"
- "Entertainment"
- "Sports"
- etc.

This makes stories permanent and easy to find.

### 4. Analytics
Check Instagram Insights to see:
- Story views
- Link clicks (how many people tapped the link)
- Best-performing content types

---

## API Limits

Instagram Graph API limits:
- **200 media posts per day per user** (includes both feed + stories)
- **25 API calls per hour per user**

Since each article creates 2 posts (feed + story), you're using 2 API calls per article.

With ~12-15 articles per hour, you're well within limits.

---

## Troubleshooting

### Story Post Fails but Feed Succeeds
This is non-critical. The scraper continues even if Story posting fails. Check logs for error details.

### "Link sticker not available" Error
Your account may need to meet minimum requirements:
- Business or Creator account (required)
- Account must be in good standing
- Some regions may have restrictions

### Story Doesn't Show Link
Make sure you're viewing the story on a mobile device. Link stickers may not appear in all preview modes.

### Feed Posts But No Stories
Check the logs - Story posting happens after Feed posting. If Feed fails, Story won't be attempted.

---

## Disabling Stories (Optional)

If you want to disable Story posting but keep Feed posting, comment out the Story block in `publishStage.js` (lines 690-715):

```javascript
// Post to Instagram Story with clickable link
/*
console.log(`[Instagram Story] Posting to Stories with clickable link...`)
try {
  const storyResult = await postStoryToInstagram({
    imageUrl: post.imageLink,
    link: wpResult.link,
  })
  ...
} catch (storyError) {
  ...
}
*/
```

---

## Advanced: Story Highlights

To automatically save Stories to Highlights, you'd need to:
1. Create a Highlight category via Instagram app
2. Get the Highlight ID
3. Use the `/{ig-user-id}/story_media` endpoint with `story_item_id`

This requires additional API setup and is not currently implemented.

---

## Files Modified

- `instagram.js` - Added `postStoryToInstagram()` function
- `publishStage.js` - Added Story posting after Feed post
- `db.js` - Added `igStoryId` field to track stories
- `testInstagramStory.js` - Test script for both Feed + Story

---

## Summary

**Your Instagram posting now includes:**

| Feature | Feed Post | Story Post |
|---------|-----------|------------|
| **Duration** | Permanent | 24 hours |
| **Clickable Link** | ❌ No | ✅ **YES!** |
| **Visibility** | Profile grid | Top of feed |
| **Format** | Title + Excerpt + URL | Image + Link sticker |
| **Purpose** | Brand presence | **Drive traffic** |

Together, they provide:
- ✅ Permanent content on your profile (Feed)
- ✅ Immediate clickable traffic (Story)
- ✅ Maximum reach and engagement

---

## What's Next?

1. **Test it**: `node testInstagramStory.js`
2. **Check Instagram**: Look for both feed post and story
3. **Monitor MongoDB**: Track `igStoryId` field
4. **Check Analytics**: See which stories drive the most traffic
5. **Create Highlights**: Organize your best stories into permanent highlights

Enjoy your clickable Instagram links! 🚀
