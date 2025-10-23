# X (Twitter) Rate Limit Management

## What is this?

X (formerly Twitter) has strict API rate limits to prevent spam. When you hit these limits, the scraper automatically:
- Detects the rate limit error (HTTP 429)
- Pauses X posting for 24 hours
- Continues posting to WordPress, Facebook, and Instagram
- Automatically resumes X posting after the cooldown period

## How it works

### Automatic Rate Limit Detection

The system automatically detects rate limit errors from X:
- HTTP Status Code 429: "Too Many Requests"
- Error code 88: "Rate limit exceeded"
- Error code 420: "Rate limit" (legacy)

When detected, X posting is paused for 24 hours by default.

### During Rate Limit Cooldown

While X is rate limited:
1. **WordPress**: ✅ Posts continue normally
2. **Facebook**: ✅ Posts continue normally
3. **Instagram**: ✅ Posts continue normally
4. **X (Twitter)**: ⏸️ Skipped with message: "X posting temporarily disabled (rate limited)"

Your scraper continues working! Only X is paused.

### Automatic Resume

After the cooldown period (24 hours), X posting automatically resumes on the next post.

## Rate Limit Information

### X API Limits (Free Tier)

**Standard/Free Access:**
- **50 tweets per 24 hours** (app limit)
- **1,500 tweets per month** (app limit)
- **Rolling 24-hour window** (not daily reset at midnight)

**Basic Tier ($100/month):**
- **3,000 tweets per month**
- **10,000 API reads per month**

**Pro Tier ($5,000/month):**
- **300,000 tweets per month**
- **1,000,000 API reads per month**

### Why You're Hitting Rate Limits

Your scraper posts every 8 minutes during active hours (5am-11pm):
- **18 hours × 60 minutes ÷ 8 minutes = ~135 potential posts per day**
- X free tier only allows **50 posts per day**
- **You're exceeding the limit by 2.7x**

## Preventing Rate Limits

### Option 1: Post Less Frequently (FREE)

Modify `scheduler.js` to post slower:

```javascript
// Current: Every 8 minutes (~135 posts/day)
await new Promise((res) => setTimeout(res, 8 * 60 * 1000))

// Recommended: Every 22 minutes (49 posts/day - just under limit)
await new Promise((res) => setTimeout(res, 22 * 60 * 1000))
```

**Calculation**: 18 hours × 60 min ÷ 22 min = 49 posts/day (safe!)

### Option 2: Skip X for Certain Categories (FREE)

In `publishStage.js`, add before X posting:

```javascript
// Skip X for high-volume categories
const skipCategories = ['News', 'Gists'] // Too many posts
if (skipCategories.includes(post.category)) {
  console.log(`[X Stage] ⏭️ Skipping X for ${post.category} category`)
  // Continue to next platform
} else {
  // Post to X normally
}
```

### Option 3: Post Only High-Priority Content (FREE)

```javascript
// Only post Sports and Entertainment to X
const xAllowedCategories = ['Sports', 'Entertainment']
if (!xAllowedCategories.includes(post.category)) {
  console.log(`[X Stage] ⏭️ Skipping X - category not allowed`)
  // Continue to next platform
} else {
  // Post to X
}
```

### Option 4: Upgrade to Basic Tier ($100/month)

**Pros:**
- 3,000 tweets per month = ~100 tweets per day
- Enough for your current posting rate
- More reliable service

**Cons:**
- $100/month cost

**How to upgrade:**
1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/products)
2. Select "Basic" tier
3. Add payment method
4. Your limits increase immediately

### Option 5: Use Multiple X Apps (FREE but complex)

**Not recommended** - X tracks by account, not app. Multiple apps won't help unless you have multiple X accounts.

## Managing Rate Limits

### Check Current Status

```bash
node -e "import('./xRateLimitTracker.js').then(m => console.log(m.getXRateLimitStatus()))"
```

Output shows:
```json
{
  "isRateLimited": true,
  "rateLimitedUntil": "2025-10-24T14:30:00.000Z",
  "lastRateLimitError": {
    "message": "Too Many Requests",
    "code": 429,
    "title": "Too Many Requests",
    "timestamp": "2025-10-23T14:30:00.000Z"
  },
  "totalRateLimitHits": 1
}
```

### Manually Reset Rate Limit

If you know the rate limit has been lifted (24 hours passed, etc.), you can manually reset:

```bash
node resetXRateLimit.js
```

This will:
- Clear the rate limit flag
- Resume X posting immediately
- Show before/after status

**⚠️ Warning**: Only reset if you're sure 24 hours have passed since the rate limit, otherwise you'll just hit it again.

## Monitoring Rate Limits

### Check Logs

Your scraper logs will show:

**When rate limit is hit:**
```
[X] Error posting to X: Request failed with code 429
[X Stage] 🚫 Rate limit error detected. Marking X as rate limited...
[X Rate Limit] 🚫 X posting disabled until 10/24/2025, 2:30:00 PM
[X Rate Limit] Cooldown period: 24 hours
[X Rate Limit] Total rate limit hits: 1
```

**When rate limit prevents posting:**
```
[X Stage] ⏸️ X posting temporarily disabled (rate limited)
[X Stage] Reason: Rate limited until 10/24/2025, 2:30:00 PM
[X Stage] Cooldown remaining: 1380 minutes (23 hours)
```

**When rate limit expires:**
```
[X Rate Limit] ✅ Cooldown period ended. X posting re-enabled.
```

## Understanding X's Rate Limits

### Rolling 24-Hour Window

X doesn't reset at midnight. If you post 50 tweets between 2pm-2pm, you can't post again until 2pm the next day.

**Example:**
- 2:00 PM - Post tweet #1
- 2:08 PM - Post tweet #2
- ...
- 8:40 PM - Post tweet #50 (LIMIT REACHED)
- Next available: 2:00 PM tomorrow (24 hours after first tweet)

### Per-App vs Per-Account

- Rate limits are **per app** (your X Developer App)
- If you use multiple apps with same account, **limits are shared**
- To bypass: Need multiple X accounts + multiple apps (complex setup)

## Troubleshooting

### Issue: Rate limits keep happening

**Solution 1**: Post less frequently
```javascript
// In scheduler.js, change from 8 minutes to 22 minutes
await new Promise((res) => setTimeout(res, 22 * 60 * 1000))
```

**Solution 2**: Skip categories
```javascript
// Skip high-volume categories from X posting
const skipCategories = ['News', 'Gists']
```

**Solution 3**: Upgrade to Basic tier ($100/month)
- 3,000 tweets/month = ~100 tweets/day
- Enough for current posting rate

### Issue: X says "Could not authenticate you"

**Not a rate limit** - This is an auth error:
1. Check X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET in `.env`
2. Make sure app permissions are "Read and Write"
3. Regenerate Access Token and Secret after changing permissions

### Issue: Posts fail even after 24 hours

**Possible causes:**
1. **Rolling window not complete** - Wait full 24 hours from first post, not last post
2. **Account suspended** - Check X app for notifications
3. **Access token expired** - Regenerate in X Developer Portal
4. **Different error** - Check logs for non-rate-limit errors

### Issue: Want to disable X temporarily

Comment out X block in `publishStage.js`:

```javascript
// ========== POST TO X (TWITTER) ==========
/*
try {
  const xRateLimitCheck = isXPostingAllowed()
  ...
} catch (xError) {
  ...
}
*/
```

### Issue: Want to change cooldown period

Edit `xRateLimitTracker.js`:

```javascript
const DEFAULT_COOLDOWN_HOURS = 24 // Change to 12, 24, or 48 hours
```

## Recommended Setup (Free Tier)

To stay under 50 tweets/day limit:

### Option A: Slow Down Posting
```javascript
// scheduler.js
await new Promise((res) => setTimeout(res, 22 * 60 * 1000)) // 22 minutes
```

### Option B: Category Filtering
```javascript
// publishStage.js - Only post Sports and Entertainment to X
const xAllowedCategories = ['Sports', 'Entertainment']
if (xAllowedCategories.includes(post.category)) {
  // Post to X
}
```

### Option C: Time-Based Posting
```javascript
// Only post to X during peak hours (6pm-10pm)
const hour = new Date().getHours()
if (hour >= 18 && hour < 22) {
  // Post to X
}
```

## Files Modified

- `xRateLimitTracker.js` - Rate limit tracking system (NEW)
- `publishStage.js` - Added rate limit checks before X posting
- `resetXRateLimit.js` - Manual reset utility (NEW)
- `xRateLimit.json` - Stores current rate limit status (auto-generated)

## Summary

✅ **Rate limiting is now automatic** - No action needed from you

✅ **Scraper continues working** - WordPress, Facebook, and Instagram posting unaffected

✅ **X resumes automatically** - After 24-hour cooldown period

✅ **Manual override available** - Use `resetXRateLimit.js` if needed

🎯 **Best practice for free tier**: Post every 22 minutes OR skip high-volume categories

💰 **Best practice for $100/month Basic tier**: Current 8-minute interval works fine (100 tweets/day available)

## Quick Reference

**Check status:**
```bash
node -e "import('./xRateLimitTracker.js').then(m => console.log(m.getXRateLimitStatus()))"
```

**Reset manually:**
```bash
node resetXRateLimit.js
```

**View JSON file directly:**
```bash
cat xRateLimit.json
```

**Current limits:**
- Free: 50 tweets/day
- Basic ($100/mo): 100 tweets/day
- Your rate: ~135 attempts/day (need to reduce)
