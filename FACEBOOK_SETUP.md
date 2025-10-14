# Facebook Auto-Posting Setup Guide

This guide will help you set up automatic Facebook posting for your WordPress published articles.

## ⚠️ Important: Content Moderation

**All posts are automatically moderated before posting to Facebook!**

The system includes built-in content moderation that checks every post for compliance with Facebook's Community Standards. Posts containing violence, hate speech, adult content, or other violations are automatically blocked.

📖 **Read the [Moderation Guide](MODERATION_GUIDE.md) for complete details on how content is filtered.**

## Overview

After each article is successfully published to WordPress, the system will automatically:
1. **Moderate the content** (check for Facebook policy violations)
2. Post the featured image to your Facebook page (if approved)
3. Include the article title as the caption
4. Add a "Read more" link to the WordPress post
5. Track the Facebook post ID and moderation status in the database

## Prerequisites

- A Facebook Page (not a personal profile)
- Facebook Developer account
- Admin access to your Facebook Page

## Setup Steps

### Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" as the app type
4. Fill in your app details:
   - App Name: "Wahala Zone Auto Poster" (or your choice)
   - App Contact Email: Your email
   - Business Account: Optional
5. Click "Create App"

### Step 2: Add Facebook Login Product

1. In your app dashboard, go to "Add Products"
2. Find "Facebook Login" and click "Set Up"
3. Select "Web" as the platform
4. Enter your WordPress site URL: `https://nowahalazone.com`

### Step 3: Configure Facebook Login Settings

1. Go to "Facebook Login" → "Settings" in the left sidebar
2. Add these URLs to "Valid OAuth Redirect URIs":
   ```
   https://nowahalazone.com
   https://nowahalazone.com/
   ```
3. Save changes

### Step 4: Get Your Page Access Token

1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown at the top
3. Click "Generate Access Token"
4. Grant these permissions (click "Add a Permission"):
   - `pages_show_list` - Read your pages
   - `pages_read_engagement` - Read page engagement
   - `pages_manage_posts` - Publish and manage posts
   - `pages_manage_engagement` - Manage comments and reactions
5. Click "Generate Access Token" and log in if prompted
6. Click the "i" icon next to the access token
7. Click "Open in Access Token Tool"
8. Click "Extend Access Token" to get a long-lived token (60 days)
9. Copy this token - this is your **User Access Token**

### Step 5: Get Your Page ID and Page Access Token

1. In the Graph API Explorer, use this query:
   ```
   me/accounts
   ```
2. Click "Submit"
3. Find your page in the results
4. Copy these two values:
   - `id` - This is your **Page ID**
   - `access_token` - This is your **Page Access Token** (never expires!)

### Step 6: Update Your .env File

Open your `.env` file and replace the placeholder values:

```env
FACEBOOK_PAGE_ID=your_actual_page_id_here
FACEBOOK_ACCESS_TOKEN=your_actual_page_access_token_here
```

Example:
```env
FACEBOOK_PAGE_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=EAABsbCS1iHgBO7ZCqxqVWcOE3ZBvOZBKLHzFghijk...
```

### Step 7: Test the Integration

Run the test script to verify everything works:

```bash
node testFacebook.js
```

Expected output:
```
=== Testing Facebook Integration ===

Step 1: Verifying Facebook access token...
[Facebook] Token is valid. Connected as: Your Page Name
✅ Facebook token is valid!

Step 2: Testing photo post to Facebook...
[Facebook] Posting photo to Facebook page: https://picsum.photos/800/600
[Facebook] Successfully posted photo to Facebook. Post ID: 123456789012345_987654321098765
✅ Successfully posted to Facebook!
Post ID: 123456789012345_987654321098765

=== Test Complete ===
```

If you see any errors, check:
- Your access token is correct and not expired
- Your page ID is correct
- You granted all required permissions
- Your app is in "Development" or "Live" mode

### Step 8: Make Your App Live (Important!)

For production use, you need to make your app live:

1. Go to your app dashboard
2. Click "App Settings" → "Basic"
3. Scroll down to "App Mode"
4. Toggle from "Development" to "Live"
5. You may need to complete "Business Verification" for this

**Alternative for Development:**
- Add your Facebook account as an "App Tester" or "Developer" in the app settings
- Development mode works for these accounts without making the app live

## How It Works

### Automatic Posting Flow

```
Article Scraped → Rewritten → Published to WordPress → ✓ Posted to Facebook
```

When an article is successfully published to WordPress (`publishStage.js`):

1. The system extracts:
   - Featured image URL
   - Article title (rewritten)
   - WordPress post URL

2. Calls Facebook Graph API to post:
   - Image as a photo post
   - Title as the caption
   - WordPress URL as "Read more" link

3. Saves Facebook post ID to MongoDB

### Facebook Post Format

Your Facebook posts will look like this:

```
[Featured Image]

Article Title Goes Here

The article excerpt provides readers with a preview of the content,
giving them context about what they'll find when they click through.
This helps increase engagement and click-through rates on Facebook.

📖 Read the full story:
https://nowahalazone.com/article-slug
```

**Format includes:**
- Featured image (large, eye-catching)
- Post title (AI-rewritten for engagement)
- Excerpt (~30 words, provides context)
- WordPress URL with clear call-to-action

📖 **See [FACEBOOK_POST_FORMAT.md](FACEBOOK_POST_FORMAT.md) for complete formatting details and customization options.**

## Database Schema Changes

The `Post` schema now includes:
- `fbPostId` - Facebook post ID (format: `{page_id}_{post_id}`)
- `fbPostUrl` - Facebook post URL (future use)

## Troubleshooting

### Error: "Invalid OAuth access token"
- Your access token expired or is incorrect
- Generate a new Page Access Token (Steps 4-5)

### Error: "Permissions error"
- You didn't grant all required permissions
- Go back to Step 4 and ensure all permissions are granted

### Error: "This content isn't available right now"
- Your app is in Development mode and your account isn't a tester
- Either make the app Live (Step 8) or add yourself as a tester

### Error: "The user hasn't authorized the application"
- Your Page Access Token is wrong
- Make sure you're using the **Page** token from `me/accounts`, not the User token

### Facebook post not created (no error)
- Check the console logs for `[Facebook Stage]` messages
- Facebook posting is non-critical - WordPress post will still succeed
- Verify your credentials in `.env`

## Advanced Configuration

### Customize Facebook Post Message

Edit `publishStage.js` line 528-532 to customize the message:

```javascript
const fbResult = await postPhotoToFacebook({
  imageUrl: post.imageLink,
  message: `${post.rewrittenTitle}\n\n${post.excerpt}`, // Add excerpt
  link: wpResult.link,
})
```

### Post Only Certain Categories

Add a category check before posting:

```javascript
// Only post Entertainment and Sports to Facebook
if (['Entertainment', 'Sports'].includes(post.category)) {
  const fbResult = await postPhotoToFacebook({
    imageUrl: post.imageLink,
    message: post.rewrittenTitle,
    link: wpResult.link,
  })
}
```

### Disable Facebook Posting Temporarily

Comment out the Facebook posting block in `publishStage.js` (lines 526-551):

```javascript
// Post to Facebook after successful WordPress publish
/*
try {
  const fbResult = await postPhotoToFacebook({
    ...
  })
} catch (fbError) {
  ...
}
*/
```

## Security Notes

1. **Never commit your .env file** - It contains sensitive tokens
2. **Page Access Tokens don't expire** - Keep them secure
3. **User Access Tokens expire in 60 days** - Only needed for initial setup
4. **Regenerate tokens if compromised** - Go through Steps 4-5 again

## API Rate Limits

Facebook has rate limits:
- **200 calls per hour per user** for Graph API
- **600 calls per 600 seconds per page** for publishing

Your scraper posts ~12 articles per hour (5-minute intervals), well under the limit.

## Support

If you encounter issues:
1. Check Facebook's [Graph API Explorer](https://developers.facebook.com/tools/explorer/) to test your token
2. Review [Facebook's debugging tool](https://developers.facebook.com/tools/debug/accesstoken/)
3. Check console logs for `[Facebook]` messages
4. Verify your app's dashboard for any restrictions

## Files Modified

- `facebook.js` - New Facebook API integration module
- `publishStage.js` - Added Facebook posting after WordPress publish
- `db.js` - Added `fbPostId` and `fbPostUrl` fields
- `.env` - Added `FACEBOOK_PAGE_ID` and `FACEBOOK_ACCESS_TOKEN`
- `testFacebook.js` - Test script for Facebook integration
