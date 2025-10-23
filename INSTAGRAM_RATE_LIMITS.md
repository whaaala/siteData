# Instagram Rate Limit Management

## What is this?

Instagram has strict API rate limits to prevent spam and protect their platform. When you hit these limits, the scraper automatically:
- Detects the rate limit error
- Pauses Instagram posting for a cooldown period (default: 2 hours)
- Continues posting to WordPress, Facebook, and X (Twitter)
- Automatically resumes Instagram posting after the cooldown period

## How it works

### Automatic Rate Limit Detection

The system automatically detects rate limit errors from Instagram:
- Error code 4: "Application request limit reached"
- Error code 32: "Page request limit reached"
- Error subcode 2207051: "Action blocked due to rate limits"

When detected, Instagram posting is paused for 2 hours by default.

### During Rate Limit Cooldown

While Instagram is rate limited:
1. **WordPress**: ✅ Posts continue normally
2. **Facebook**: ✅ Posts continue normally
3. **Instagram**: ⏸️ Skipped with message: "Instagram posting temporarily disabled (rate limited)"
4. **X (Twitter)**: ✅ Posts continue normally

Your scraper continues working! Only Instagram is paused.

### Automatic Resume

After the cooldown period (2 hours), Instagram posting automatically resumes on the next post.

## Rate Limit Information

### Instagram API Limits (as of 2024)

**For standard Instagram Business/Creator accounts:**
- **25 posts per day** via API
- **Rate limit window**: Rolling 24-hour period
- **Story posts**: Separate limit (also ~25 per day)

### Common Causes of Rate Limits

1. **Too many posts in short time** - Posting more than 25 times in 24 hours
2. **Multiple apps using same account** - Other tools posting to same Instagram account
3. **Suspicious behavior** - Instagram's automated spam detection
4. **Account restrictions** - Account flagged or in restricted mode

## Managing Rate Limits

### Check Current Status

```bash
node -e "import('./instagramRateLimitTracker.js').then(m => console.log(m.getRateLimitStatus()))"
```

Output shows:
```json
{
  "isRateLimited": true,
  "rateLimitedUntil": "2025-10-23T16:30:00.000Z",
  "lastRateLimitError": {
    "message": "Application request limit reached",
    "code": 4,
    "subcode": 2207051,
    "timestamp": "2025-10-23T14:30:00.000Z"
  },
  "totalRateLimitHits": 3
}
```

### Manually Reset Rate Limit

If you know the rate limit has been lifted (24 hours passed, account unrestricted, etc.), you can manually reset:

```bash
node resetInstagramRateLimit.js
```

This will:
- Clear the rate limit flag
- Resume Instagram posting immediately
- Show before/after status

**⚠️ Warning**: Only reset if you're sure the rate limit is gone, otherwise you'll just hit it again.

## Preventing Rate Limits

### 1. Post Less Frequently

If you're hitting rate limits regularly, reduce posting frequency in `scheduler.js`:

```javascript
// Current: Every 8 minutes (max ~180 posts/day)
await new Promise((res) => setTimeout(res, 8 * 60 * 1000))

// Slower: Every 12 minutes (max ~120 posts/day)
await new Promise((res) => setTimeout(res, 12 * 60 * 1000))

// Even slower: Every 20 minutes (max ~72 posts/day)
await new Promise((res) => setTimeout(res, 20 * 60 * 1000))
```

**Recommendation**: For Instagram's 25 posts/day limit, post no more than once every **58 minutes** (25 posts × 58 min = 24.1 hours).

### 2. Disable Instagram for Certain Categories

Skip Instagram for categories that post too frequently. In `publishStage.js`, add before Instagram posting:

```javascript
// Skip Instagram for "News" category (too many posts)
if (post.category === 'News') {
  console.log('[Instagram Stage] ⏭️ Skipping Instagram for News category')
  continue // Skip to X posting
}
```

### 3. Post Only Stories (No Feed Posts)

Stories don't count against the main post limit. To post only stories, comment out the feed post in `publishStage.js`:

```javascript
// Comment out feed posting
/*
const igResult = await postPhotoToInstagram({
  imageUrl: instagramImageUrl,
  caption: igCaption,
})
*/

// Keep only story posting
const storyResult = await postStoryToInstagram({
  imageUrl: instagramImageUrl,
  link: wpResult.link,
})
```

### 4. Use Multiple Instagram Accounts

If you need high posting volume:
1. Create multiple Instagram Business accounts
2. Link each to a different Facebook Page
3. Rotate between accounts in your scraper

## Monitoring Rate Limits

### Check Logs

Your scraper logs will show:

**When rate limit is hit:**
```
[Instagram] Error posting to Instagram: Application request limit reached
[Instagram Stage] 🚫 Rate limit error detected. Marking Instagram as rate limited...
[Instagram Rate Limit] 🚫 Instagram posting disabled until 10/23/2025, 4:30:00 PM
[Instagram Rate Limit] Cooldown period: 2 hours
[Instagram Rate Limit] Total rate limit hits: 1
```

**When rate limit prevents posting:**
```
[Instagram Stage] ⏸️ Instagram posting temporarily disabled (rate limited)
[Instagram Stage] Reason: Rate limited until 10/23/2025, 4:30:00 PM
[Instagram Stage] Cooldown remaining: 87 minutes
```

**When rate limit expires:**
```
[Instagram Rate Limit] ✅ Cooldown period ended. Instagram posting re-enabled.
```

## Troubleshooting

### Issue: Rate limits keep happening

**Solution 1**: Post less frequently (see "Preventing Rate Limits" above)

**Solution 2**: Check if other apps are using the same Instagram account
- Go to Instagram Settings → Security → Apps and Websites
- Remove any apps you're not using

**Solution 3**: Check if your account is restricted
- Go to Instagram Settings → Account Status
- Check for any restrictions or warnings

### Issue: Posts fail even after cooldown

**Possible causes:**
1. **Account suspended** - Check Instagram app for notifications
2. **Access token expired** - Regenerate long-lived token
3. **Facebook Page disconnected from Instagram** - Reconnect in Facebook settings
4. **Different error** - Check logs for non-rate-limit errors

### Issue: Want to change cooldown period

Edit `instagramRateLimitTracker.js`:

```javascript
const DEFAULT_COOLDOWN_HOURS = 2 // Change to 4, 6, 12, or 24 hours
```

Or when calling `markInstagramRateLimited()`:

```javascript
markInstagramRateLimited(error, 4) // 4 hour cooldown instead of 2
```

## Files Modified

- `instagramRateLimitTracker.js` - Rate limit tracking system (NEW)
- `publishStage.js` - Added rate limit checks before Instagram posting
- `resetInstagramRateLimit.js` - Manual reset utility (NEW)
- `instagramRateLimit.json` - Stores current rate limit status (auto-generated)

## Summary

✅ **Rate limiting is now automatic** - No action needed from you

✅ **Scraper continues working** - WordPress, Facebook, and X posting unaffected

✅ **Instagram resumes automatically** - After 2-hour cooldown period

✅ **Manual override available** - Use `resetInstagramRateLimit.js` if needed

🎯 **Best practice**: Post no more than once every hour to stay well under Instagram's 25 posts/day limit
