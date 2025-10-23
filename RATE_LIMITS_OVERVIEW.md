# Rate Limit Management Overview

## Quick Summary

Your scraper now automatically handles rate limits for Instagram and X (Twitter). When rate limits are hit, those platforms pause while WordPress and Facebook continue working.

## Current Rate Limit Status

### Instagram
- **Limit**: 25 posts per day
- **Cooldown**: 2 hours when rate limited
- **Status**: Active - will auto-pause if limit hit
- **Reset**: `node resetInstagramRateLimit.js`

### X (Twitter)
- **Limit**: 50 tweets per day (free tier)
- **Cooldown**: 24 hours when rate limited
- **Status**: Active - will auto-pause if limit hit
- **Reset**: `node resetXRateLimit.js`

### Facebook
- **Limit**: No strict daily limit (but has spam detection)
- **Cooldown**: N/A
- **Status**: No rate limit tracking (works fine)

## What Happens When Rate Limited?

```
┌─────────────────────────────────────────────────────────┐
│                    Post Processing Flow                  │
└─────────────────────────────────────────────────────────┘

  Scrape → Rewrite → WordPress → Facebook → Instagram → X
                         ✅         ✅          ⏸️       ⏸️
                                             (paused) (paused)
```

**Example scenario:**
1. Instagram hits rate limit at 2:00 PM
2. X hits rate limit at 3:00 PM
3. System continues posting to WordPress + Facebook
4. Instagram resumes at 4:00 PM (2 hour cooldown)
5. X resumes at 3:00 PM next day (24 hour cooldown)

## Monitoring Rate Limits

### Check All Platforms

**Instagram:**
```bash
node -e "import('./instagramRateLimitTracker.js').then(m => console.log(m.getRateLimitStatus()))"
```

**X (Twitter):**
```bash
node -e "import('./xRateLimitTracker.js').then(m => console.log(m.getXRateLimitStatus()))"
```

### Watch Logs

Your scraper logs show real-time rate limit status:

**When limit is hit:**
```
[Instagram Stage] 🚫 Rate limit error detected. Marking Instagram as rate limited...
[Instagram Rate Limit] 🚫 Instagram posting disabled until 10/23/2025, 4:30:00 PM
[Instagram Rate Limit] Cooldown period: 2 hours
```

**When limit prevents posting:**
```
[X Stage] ⏸️ X posting temporarily disabled (rate limited)
[X Stage] Reason: Rate limited until 10/24/2025, 2:30:00 PM
[X Stage] Cooldown remaining: 1380 minutes
```

**When limit expires:**
```
[Instagram Rate Limit] ✅ Cooldown period ended. Instagram posting re-enabled.
```

## Preventing Rate Limits

### Option 1: Slow Down Your Scraper (Recommended for Free Tier)

Current rate: **Every 8 minutes** = ~135 posts/day

**For Instagram (25 posts/day):**
```javascript
// scheduler.js - Post every 58 minutes
await new Promise((res) => setTimeout(res, 58 * 60 * 1000))
// Result: 25 posts/day (safe for Instagram)
```

**For X Free Tier (50 posts/day):**
```javascript
// scheduler.js - Post every 22 minutes
await new Promise((res) => setTimeout(res, 22 * 60 * 1000))
// Result: 49 posts/day (safe for X)
```

**Both Instagram + X (25 posts/day):**
```javascript
// scheduler.js - Post every 58 minutes (safest)
await new Promise((res) => setTimeout(res, 58 * 60 * 1000))
// Result: 25 posts/day (safe for both)
```

### Option 2: Skip Categories for Social Media

Reduce social media posts without affecting WordPress:

**Skip high-volume categories:**
```javascript
// publishStage.js - Before Instagram/X posting
const skipSocialMediaCategories = ['News', 'Gists'] // Too many posts

// For Instagram
if (skipSocialMediaCategories.includes(post.category)) {
  console.log(`[Instagram Stage] ⏭️ Skipping ${post.category} category`)
} else {
  // Post to Instagram
}

// For X
if (skipSocialMediaCategories.includes(post.category)) {
  console.log(`[X Stage] ⏭️ Skipping ${post.category} category`)
} else {
  // Post to X
}
```

### Option 3: Post Only Priority Categories

**Whitelist approach:**
```javascript
// Only post Sports and Entertainment to social media
const socialMediaCategories = ['Sports', 'Entertainment']

if (!socialMediaCategories.includes(post.category)) {
  console.log(`[Social Media] ⏭️ Skipping - not priority category`)
  // Skip Instagram and X, but still post to WordPress/Facebook
} else {
  // Post to all platforms
}
```

### Option 4: Time-Based Posting

**Post to social media only during peak hours:**
```javascript
// Post to Instagram/X only between 6pm-10pm (4 hours)
const hour = new Date().getHours()
const isPeakHours = hour >= 18 && hour < 22

if (!isPeakHours) {
  console.log(`[Social Media] ⏭️ Skipping - outside peak hours`)
  // Skip Instagram and X
} else {
  // Post to Instagram and X
}
```

### Option 5: Upgrade to Paid Tiers

**X Basic Tier ($100/month):**
- 3,000 tweets/month = ~100 tweets/day
- Current 8-minute interval works fine

**Instagram:**
- No paid upgrade available
- 25 posts/day is hard limit for all accounts

## Platform Comparison

| Platform | Free Limit | Paid Limit | Cooldown | Auto-Resume |
|----------|-----------|-----------|----------|-------------|
| **WordPress** | Unlimited* | Unlimited* | N/A | N/A |
| **Facebook** | ~50/day** | ~50/day** | N/A | N/A |
| **Instagram** | 25/day | 25/day | 2 hours | ✅ Yes |
| **X (Twitter)** | 50/day | 100/day*** | 24 hours | ✅ Yes |

\* Depends on hosting
\*\* No official limit, but spam detection exists
\*\*\* Basic tier ($100/mo)

## Files Overview

### Rate Limit Trackers
- `instagramRateLimitTracker.js` - Instagram rate limit system
- `xRateLimitTracker.js` - X rate limit system
- `instagramRateLimit.json` - Instagram status (auto-generated)
- `xRateLimit.json` - X status (auto-generated)

### Reset Utilities
- `resetInstagramRateLimit.js` - Manually reset Instagram
- `resetXRateLimit.js` - Manually reset X

### Documentation
- `INSTAGRAM_RATE_LIMITS.md` - Detailed Instagram guide
- `X_RATE_LIMITS.md` - Detailed X guide
- `RATE_LIMITS_OVERVIEW.md` - This file

### Integration
- `publishStage.js` - Rate limit checks integrated
- `crawer.js` - Fast retry on failures (1 min instead of 8 min)
- `scheduler.js` - Controls posting frequency

## Recommended Configuration

### For Maximum Posts (Current Setup)

**Posts every 8 minutes:**
- ✅ WordPress: ~135 posts/day
- ✅ Facebook: ~135 posts/day (usually fine)
- ⚠️ Instagram: 25 posts/day (will hit limit and pause)
- ⚠️ X: 50 posts/day (will hit limit and pause)

**Result**: WordPress and Facebook get all posts, Instagram and X will auto-pause when limits hit

### For Stable Social Media (Recommended)

**Posts every 58 minutes:**
- ✅ WordPress: 25 posts/day
- ✅ Facebook: 25 posts/day
- ✅ Instagram: 25 posts/day (no rate limits!)
- ✅ X: 25 posts/day (no rate limits!)

**Result**: All platforms work smoothly, no rate limit pauses

### For Selective Social Media (Best of Both Worlds)

**Posts every 8 minutes + category filtering:**
```javascript
// Skip News/Gists from Instagram and X
// Result:
// - WordPress/Facebook: 135 posts/day (all categories)
// - Instagram/X: ~40 posts/day (filtered categories)
```

**Result**: Maximum WordPress coverage, selective social media posting, rare rate limits

## Troubleshooting

### Problem: Instagram keeps hitting rate limit

**Solutions:**
1. Post every 58 minutes (safest)
2. Skip high-volume categories (News, Gists)
3. Post only during peak hours (4-hour window)

### Problem: X keeps hitting rate limit

**Solutions:**
1. Post every 22 minutes (free tier safe)
2. Skip high-volume categories
3. Upgrade to Basic tier ($100/month)

### Problem: Both platforms hitting limits

**Solution:**
```javascript
// scheduler.js - Post every 58 minutes
await new Promise((res) => setTimeout(res, 58 * 60 * 1000))
```

### Problem: Want to disable rate limit tracking

**Instagram:**
```javascript
// publishStage.js - Comment out rate limit check
/*
const rateLimitCheck = isInstagramPostingAllowed()
if (!rateLimitCheck.allowed) {
  ...
}
*/
```

**X:**
```javascript
// publishStage.js - Comment out rate limit check
/*
const xRateLimitCheck = isXPostingAllowed()
if (!xRateLimitCheck.allowed) {
  ...
}
*/
```

### Problem: Manually reset after 24 hours

**Instagram:**
```bash
node resetInstagramRateLimit.js
```

**X:**
```bash
node resetXRateLimit.js
```

## Quick Commands Reference

**Check Instagram status:**
```bash
node -e "import('./instagramRateLimitTracker.js').then(m => console.log(m.getRateLimitStatus()))"
```

**Check X status:**
```bash
node -e "import('./xRateLimitTracker.js').then(m => console.log(m.getXRateLimitStatus()))"
```

**Reset Instagram:**
```bash
node resetInstagramRateLimit.js
```

**Reset X:**
```bash
node resetXRateLimit.js
```

**View status files:**
```bash
cat instagramRateLimit.json
cat xRateLimit.json
```

**Start scraper:**
```bash
npm start
```

## Summary

✅ **Automatic rate limit handling** - No manual intervention needed

✅ **Non-blocking design** - One platform's rate limit doesn't affect others

✅ **Auto-resume** - Platforms automatically resume after cooldown

✅ **Manual override** - Reset scripts available if needed

🎯 **Recommended setup**: Post every 58 minutes OR use category filtering

📊 **Current status**: All systems active and working
