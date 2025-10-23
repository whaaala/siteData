# X (Twitter) Auto-Posting Setup Guide

This guide will help you set up automatic X (Twitter) posting for your WordPress published articles.

## Prerequisites

- An X (Twitter) account
- Developer account access on X
- Your X account should be in good standing (no restrictions)

## Setup Steps

### Step 1: Apply for X Developer Account

1. Go to **[X Developer Portal](https://developer.twitter.com/)**
2. Click **"Sign up"** or **"Apply"** for a developer account
3. Fill out the application:
   - **Primary use case**: "Building automation tools for content publishing"
   - **Will your app use Tweet, Retweet, Like, Follow, or Direct Message functionality?**: Yes
   - **Are you planning to analyze Twitter data?**: No
   - **Will your product use or display Tweets or Twitter content outside of Twitter?**: Yes (WordPress website)
   - **Describe how you'll use Twitter data**: "Automatically posting article summaries with images to X when published on WordPress"

4. Submit and wait for approval (usually 1-2 days)

### Step 2: Create an X App

Once your developer account is approved:

1. Go to **[Developer Dashboard](https://developer.twitter.com/en/portal/dashboard)**
2. Click **"+ Create Project"**
3. Fill in project details:
   - **Project Name**: "Nowahala Zone Auto Poster"
   - **Use case**: "Making a bot"
   - **Project description**: "Automated news content sharing bot"

4. Create an app within the project:
   - **App name**: "NowahalaBot" (must be unique across X)
   - **App description**: "Automated bot for sharing news articles"

### Step 3: Get Your API Keys

After creating the app:

1. In your app dashboard, go to **"Keys and tokens"** tab
2. You'll see:
   - **API Key** (also called Consumer Key)
   - **API Key Secret** (also called Consumer Secret)

3. Click **"Generate"** under **Access Token and Secret**
4. You'll get:
   - **Access Token**
   - **Access Token Secret**

**⚠️ IMPORTANT**: Copy all 4 values immediately! You won't be able to see the secrets again.

### Step 4: Set App Permissions

1. In your app dashboard, go to **"Settings"** tab
2. Scroll to **"App permissions"**
3. Click **"Edit"**
4. Select **"Read and Write"** (required for posting tweets)
5. Click **"Save"**

**Note**: If you change permissions, you need to regenerate your Access Token and Secret!

### Step 5: Add to Environment Variables

Update your `.env` file with the credentials:

```env
# X (Twitter) API Credentials
X_API_KEY=your_api_key_here
X_API_SECRET=your_api_secret_here
X_ACCESS_TOKEN=your_access_token_here
X_ACCESS_SECRET=your_access_secret_here
```

**Example:**
```env
X_API_KEY=abc123XYZabc123XYZabc123
X_API_SECRET=def456UVWdef456UVWdef456UVWdef456UVWdef456UVW
X_ACCESS_TOKEN=9876543210-ghi789RSTghi789RSTghi789RST
X_ACCESS_SECRET=jkl012MNOjkl012MNOjkl012MNOjkl012MNOjkl012MNO
```

### Step 6: Install Dependencies

Run:
```bash
npm install
```

This will install the `twitter-api-v2` package that was added to your `package.json`.

### Step 7: Test the Integration

Run the test script to verify everything works:

```bash
node testX.js
```

Expected output:
```
=== Testing X (Twitter) Integration ===

Step 1: Verifying X credentials...
[X] Credentials are valid. Connected as: @your_handle (Your Name)
✅ X credentials are valid!

Step 2: Testing tweet post with image...
[X] Tweet text (150 chars): Test Post: Nigeria's Tech Scene Shows Growth...
[X] Downloading image: https://picsum.photos/1080/1080
[X] Uploading media to X...
[X] Media uploaded. Media ID: 1234567890123456789
[X] Posting tweet with image...
[X] Successfully posted to X. Tweet ID: 9876543210987654321
✅ Successfully posted to X!
Tweet ID: 9876543210987654321
Tweet URL: https://x.com/i/web/status/9876543210987654321

=== Test Complete ===
```

## How It Works

### Automatic Posting Flow

```
Article Scraped → Rewritten → Published to WordPress →
→ Posted to Facebook → Posted to Instagram → ✓ Posted to X
```

After an article is successfully published to WordPress, Facebook, and Instagram, it's automatically posted to X.

### X Post Format

Your X posts will look like this:

```
Article Title Goes Here

Brief excerpt from the article that gives readers a preview...

🔗 https://nowahalazone.com/article-slug
```

**Tweet format includes:**
- Featured image (or Instagram-optimized image if available)
- Post title
- Excerpt (truncated to fit 280 char limit)
- WordPress URL

### Character Limit Handling

X has a 280 character limit. The system automatically:
1. **Prioritizes**: Title → Link (always included)
2. **Adds excerpt** if there's room
3. **Truncates** text with "..." if needed
4. **Auto-shortens** links to 23 characters

Example:
```
Original: 350 characters
After formatting: 278 characters (fits!)
```

## Database Schema

The `Post` schema now includes X-specific fields:
- `xTweetId` - Tweet ID
- `xTweetUrl` - Full tweet URL
- `xPostStatus` - Status: pending/posted/failed_to_post/error
- `xPostDate` - When tweet was posted

## X API Rate Limits

**Standard access (Free tier):**
- **50 tweets per 24 hours** (app limit)
- **1,500 tweets per month** (app limit)

**Basic tier ($100/month):**
- **3,000 tweets per month**
- **10,000 reads per month**

Your scraper typically posts **12-15 articles per hour**, which is well under free tier limits since posts only go to X after passing all checks.

## Troubleshooting

### Error: "Read-only application cannot POST"
- **Solution**: App permissions are set to "Read only"
- Go to app settings → App permissions → Change to "Read and Write"
- **Important**: Regenerate Access Token and Secret after changing permissions!

### Error: "Invalid or expired token"
- **Solution**: Credentials are incorrect
- Double-check all 4 values in `.env`
- Make sure there are no extra spaces or quotes
- Try regenerating tokens in X Developer Portal

### Error: "Could not authenticate you"
- **Solution**: One of the keys/secrets is wrong
- Verify you copied the correct values:
  - API Key (Consumer Key)
  - API Key Secret (Consumer Secret)
  - Access Token
  - Access Token Secret

### Error: "You currently have Essential access"
- **Solution**: Free tier has strict limits
- You're hitting rate limits (50 tweets/day)
- Wait 24 hours or upgrade to Basic tier
- Check your usage in X Developer Portal

### Tweets not posting
- **Solution 1**: Check logs for errors
- **Solution 2**: Run `node testX.js` to verify credentials
- **Solution 3**: Check X account isn't suspended/restricted
- **Solution 4**: Verify app permissions are "Read and Write"

## Advanced Configuration

### Disable X Posting Temporarily

Comment out the X block in `publishStage.js` (lines 782-830):

```javascript
// ========== POST TO X (TWITTER) ==========
/*
try {
  console.log('[X Stage] Posting to X (Twitter)...')
  ...
} catch (xError) {
  ...
}
*/
```

### Customize Tweet Format

Edit the `formatTweetText()` function in `x.js` to change how tweets are formatted:

```javascript
export function formatTweetText(title, excerpt, link) {
  // Your custom formatting logic here
  return `${title}\n\n${excerpt}\n\n${link}`
}
```

### Post Only Certain Categories to X

Add a category filter before X posting:

```javascript
// Only post News and Entertainment to X
const allowedCategories = ['News', 'Entertainment']
if (!allowedCategories.includes(post.category)) {
  console.log(`[X Stage] ⏭️ Skipping - Category not allowed`)
  return
}
```

## Security Notes

1. **Never commit `.env` file** - Contains sensitive tokens
2. **Regenerate tokens if exposed** - Revoke and create new ones in Developer Portal
3. **Monitor API usage** - Check Developer Dashboard regularly
4. **Enable 2FA** on your X account

## Support & Resources

- [X API Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
- [twitter-api-v2 Package Docs](https://github.com/PLhery/node-twitter-api-v2)
- [X API Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)

## Files Modified

- `x.js` - New X API integration module
- `publishStage.js` - Added X posting after Instagram
- `db.js` - Added X-specific fields
- `package.json` - Added `twitter-api-v2` dependency
- `.env` - Added X API credentials

## What's Next?

After setup:
1. Run `npm install` to install new dependency
2. Run `node testX.js` to verify integration
3. Restart your scraper: `npm start`
4. Monitor logs for X posting success
5. Check your X profile for new tweets

Your scraper will now automatically post to X (Twitter) along with WordPress, Facebook, and Instagram! 🎉
