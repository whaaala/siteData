# Instagram Auto-Posting Setup Guide

This guide will help you set up automatic Instagram posting for your WordPress published articles.

## ⚠️ Important: Stricter Content Moderation

**Instagram has STRICTER content policies than Facebook!**

The system uses AI-powered moderation that follows Instagram Community Guidelines:
- **Stricter on nudity** - Even partial nudity or suggestive content is blocked
- **Stricter on violence** - Graphic content is more likely to be blocked
- **Image required** - Instagram posts MUST have an image
- **Caption limit** - 2200 characters max

📖 **All content is automatically moderated before posting.**

## Prerequisites

- An Instagram Business or Creator account
- Instagram account linked to a Facebook Page
- Facebook Page access (see FACEBOOK_SETUP.md first)
- Admin access to both Facebook Page and Instagram account

## Setup Steps

### Step 1: Convert to Instagram Business Account

1. Open Instagram app on your phone
2. Go to Settings → Account
3. Select "Switch to Professional Account"
4. Choose "Business"
5. Connect to your Facebook Page when prompted

**Important:** Your Instagram account MUST be a Business or Creator account to use the Graph API.

### Step 2: Link Instagram to Facebook Page

1. Go to your Facebook Page settings
2. Click "Instagram" in the left sidebar
3. Click "Connect Account"
4. Log in to your Instagram account
5. Verify the connection is successful

### Step 3: Get Your Instagram Account ID

Use the Facebook Graph API Explorer:

1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Make sure you have a valid Page Access Token (from FACEBOOK_SETUP.md)
4. In the query field, enter:
   ```
   me/accounts
   ```
5. Click "Submit"
6. Find your Facebook Page in the results
7. Copy the Page `id` (you'll need this in the next step)
8. Now query for the Instagram account:
   ```
   {PAGE_ID}?fields=instagram_business_account
   ```
   Replace `{PAGE_ID}` with the Page ID from step 7
9. Click "Submit"
10. Copy the `instagram_business_account.id` value - **This is your Instagram Account ID**

### Step 4: Verify Your Access Token Has Required Permissions

Your Facebook Page Access Token needs these permissions:
- `instagram_basic`
- `instagram_content_publish`
- `pages_show_list`
- `pages_read_engagement`

The Page Access Token from Facebook setup should already have these.

### Step 5: Update Your .env File

Add these variables to your `.env` file:

```env
# Instagram Configuration
INSTAGRAM_ACCOUNT_ID=your_instagram_account_id_here
INSTAGRAM_ACCESS_TOKEN=your_page_access_token_here
```

**Note:** The `INSTAGRAM_ACCESS_TOKEN` is the **same** Page Access Token you used for Facebook.

Example:
```env
INSTAGRAM_ACCOUNT_ID=17841405793187218
INSTAGRAM_ACCESS_TOKEN=EAABsbCS1iHgBO7ZCqxqVWcOE3ZBvOZBKLHzFghijk...
```

### Step 6: Test the Integration

Run the test script to verify everything works:

```bash
node testInstagram.js
```

Expected output:
```
=== Testing Instagram Integration ===

Step 1: Verifying Instagram access token...
[Instagram] Token is valid. Connected as: @yourinstagramhandle
✅ Instagram token is valid!

Step 2: Testing photo post to Instagram...
[Instagram] Creating media container for image: https://picsum.photos/1080/1080
[Instagram] Media container created: 18012345678901234
[Instagram] Publishing media container...
[Instagram] Successfully posted to Instagram. Post ID: 17895551234567890
✅ Successfully posted to Instagram!
Post ID: 17895551234567890

=== Test Complete ===
```

If you see any errors, check:
- Your Instagram account is a Business/Creator account
- Your Instagram is linked to your Facebook Page
- Your access token has the required permissions
- Your `INSTAGRAM_ACCOUNT_ID` is correct

## How It Works

### Automatic Posting Flow

```
Article Scraped → Rewritten → Published to WordPress →
→ Posted to Facebook → ✓ Posted to Instagram
```

After an article is successfully published to WordPress and Facebook:

1. The system performs **Instagram-specific moderation**:
   - Stricter image analysis (nudity, violence, etc.)
   - Text content moderation
   - Image requirement check

2. If approved, posts to Instagram:
   - Image as a photo post
   - Caption with title, excerpt, and WordPress link

3. Saves Instagram post ID to MongoDB

### Instagram Post Format

Your Instagram posts will look like this:

```
Article Title Goes Here

The article excerpt provides readers with a preview of the content,
giving them context about what they'll find when they click through.

🔗 Read more: https://nowahalazone.com/article-slug
```

**Format includes:**
- Featured image (1080x1080 works best)
- Post title
- Excerpt (truncated to fit 2200 char limit)
- WordPress URL with emoji

## Instagram vs Facebook Differences

| Feature | Facebook | Instagram |
|---------|----------|-----------|
| **Nudity policy** | Moderate | **Very strict** |
| **Violence policy** | Moderate for news | **Stricter** |
| **Image required** | No | **Yes** |
| **Caption limit** | ~63,206 chars | **2200 chars** |
| **Moderation** | Standard | **Enhanced** |
| **Posting method** | Direct API | **2-step (container → publish)** |

## Database Schema

The `Post` schema includes Instagram-specific fields:
- `igPostId` - Instagram post ID
- `igPostUrl` - Instagram post URL (for future use)
- `igModerationStatus` - Moderation status (pending/approved/blocked/posted/etc.)
- `igModerationReason` - Why post was approved/blocked
- `igModerationFlags` - OpenAI moderation API response
- `igImageAnalysis` - AI image analysis results
- `igModerationDate` - When moderation was performed

## Troubleshooting

### Error: "Invalid user ID"
- Your `INSTAGRAM_ACCOUNT_ID` is incorrect
- Make sure you're using the **Instagram Business Account ID**, not your Facebook Page ID
- Re-run Step 3 to get the correct ID

### Error: "The Instagram account is not linked to the page"
- Your Instagram account is not connected to your Facebook Page
- Go to Facebook Page Settings → Instagram → Connect Account

### Error: "This endpoint requires the 'instagram_basic' permission"
- Your access token doesn't have the required permissions
- Regenerate your Page Access Token with the permissions listed in Step 4

### Error: "Unsupported image file"
- The image format is not supported (must be JPG or PNG)
- The image is too large (Instagram max: 8MB)
- The image URL is not publicly accessible

### Error: "Media container creation failed"
- The image URL might not be reachable
- Instagram may be rate-limiting your requests
- Check that the image meets Instagram's requirements (min 320px)

### Post not showing on Instagram
- Instagram API posts may take a few seconds to appear
- Check your Instagram Business account (not personal profile)
- Refresh the app

### Content keeps getting blocked
- Instagram is stricter than Facebook
- Review the `igModerationReason` in your MongoDB database
- Check `igImageAnalysis` field for AI's assessment
- Consider adjusting categories to post (e.g., skip "Gists")

## Advanced Configuration

### Disable Instagram Posting Temporarily

Comment out the Instagram block in `publishStage.js` (lines 648-716):

```javascript
// Post to Instagram after Facebook
/*
try {
  const igModerationResult = await isContentSafeForInstagram(post)
  ...
} catch (igError) {
  ...
}
*/
```

### Post Only Certain Categories to Instagram

Add a category filter before moderation:

```javascript
// Only post News and Entertainment to Instagram
if (!['News', 'Entertainment'].includes(post.category)) {
  post.igModerationStatus = 'skipped_category'
  post.igModerationReason = 'Category not in allowed list for Instagram'
  await post.save()
  console.log(`[Instagram Stage] ⏭️ Skipping - Category not allowed`)
} else {
  const igModerationResult = await isContentSafeForInstagram(post)
  ...
}
```

### Adjust Image Requirements

Instagram prefers square images (1:1 ratio), but also accepts:
- Portrait: 4:5 ratio
- Landscape: 1.91:1 ratio
- Minimum resolution: 320px width

## Best Practices

1. **Use high-quality images** - Instagram is a visual platform
2. **Square images work best** - 1080x1080 is ideal
3. **Keep captions concise** - Instagram truncates long captions with "...more"
4. **Monitor blocked posts** - Check MongoDB for moderation reasons
5. **Review Instagram Insights** - Track which posts perform best
6. **Follow Instagram policies strictly** - Account suspension is more common than Facebook

## API Rate Limits

Instagram Graph API limits:
- **200 media posts per day per user**
- **25 API calls per hour per user** (for posting)

Your scraper posts ~12-15 articles per hour, well under the limit.

## Security Notes

1. **Never commit your .env file** - Contains sensitive tokens
2. **Use Page Access Tokens** - They don't expire
3. **Keep Instagram Business Account secure** - Enable 2FA
4. **Regenerate tokens if compromised** - Revoke and create new ones

## Support & Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [Instagram Community Guidelines](https://help.instagram.com/477434105621119)
- [Content Publishing Guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)

## Files Modified

- `instagram.js` - New Instagram API integration module
- `contentModeration.js` - Added `isContentSafeForInstagram()` and `analyzeImageForInstagram()`
- `publishStage.js` - Added Instagram posting after Facebook
- `db.js` - Added Instagram-specific fields
- `.env` - Added `INSTAGRAM_ACCOUNT_ID` and `INSTAGRAM_ACCESS_TOKEN`
- `testInstagram.js` - Test script for Instagram integration

## What's Next?

After setup:
1. Run `node testInstagram.js` to verify
2. Restart your scraper: `npm start`
3. Monitor MongoDB for moderation results
4. Check your Instagram Business account for posts
5. Review Instagram Insights for performance metrics

Your scraper will now automatically post to both Facebook and Instagram with AI-powered content moderation! 🎉
