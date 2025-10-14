# Facebook Content Moderation Guide

## Overview

This system automatically moderates all content before posting to Facebook to ensure compliance with Facebook's Community Standards and Terms of Service. Every post is checked through multiple layers of validation before being shared.

## Why Moderation Matters

Facebook has strict content policies. Violations can result in:
- Posts being removed
- Reduced page reach
- Account restrictions or bans
- Loss of posting privileges

This moderation system helps protect your Facebook page by automatically filtering problematic content.

## How It Works

### Multi-Layer Moderation System

Every post goes through these checks **before** posting to Facebook:

```
WordPress Post Published ✓
         ↓
[1] Configuration Check (Category, Source, URL patterns)
         ↓
[2] OpenAI Content Moderation (AI-powered safety check)
         ↓
[3] Keyword Analysis (Sensitive terms detection)
         ↓
[4] Quality Validation (Image, title, format)
         ↓
✅ APPROVED → Post to Facebook
         OR
🚫 BLOCKED → Skip Facebook, save reason to DB
```

### Layer 1: Configuration Rules

**File:** `moderationConfig.js`

Quick checks based on your configuration:

#### Category Filtering
```javascript
allowedCategories: [
  'News',
  'Entertainment',
  'Sports',
  'Lifestyle',
  'HealthAndFitness',
  'FoodAndDrink',
  // 'Gists', // Disabled by default - may contain unverified content
]
```

**Default:** Gists category is blocked (contains rumors/gossip)

#### Source Blocking
Block specific websites:
```javascript
blockedSources: [
  'unreliable-source.com',
  'problematic-site.com'
]
```

#### URL Pattern Filtering
Skip posts with specific URL patterns:
```javascript
skipUrlPatterns: [
  '/obituary/',      // Death notices
  '/death-notice/',  // Obituaries
  '/accident/',      // Accident reports (may be graphic)
]
```

### Layer 2: OpenAI Content Moderation

**File:** `contentModeration.js`

Uses OpenAI's Moderation API to detect:

| Category | Action | Description |
|----------|--------|-------------|
| `violence/graphic` | **BLOCK** | Graphic violence or gore |
| `sexual` | **BLOCK** | Sexual content |
| `sexual/minors` | **BLOCK** | Content involving minors |
| `hate` | **BLOCK** | Hate speech or discrimination |
| `self-harm` | **BLOCK** | Self-harm content |
| `violence` | WARN | Non-graphic violence (acceptable for news) |
| `harassment` | WARN | Context-dependent harassment |

**How it works:**
1. Combines title + excerpt for analysis
2. Sends to OpenAI Moderation API
3. Checks flagged categories against blocking rules
4. Allows news-appropriate content (violence reporting, etc.)

### Layer 3: Keyword Analysis

Scans content for high-risk keywords:

```javascript
// Examples of blocked keywords
'graphic violence', 'explicit nudity', 'hate crime'
```

**Smart Detection:**
- Uses word boundaries (not just substrings)
- Context-aware (news articles can discuss sensitive topics)
- Only blocks extremely problematic phrases

### Layer 4: Quality Validation

Ensures Facebook-ready posts:

✅ **Required:**
- Featured image present
- Title length 10-300 characters
- Valid WordPress URL

🚫 **Blocked:**
- No image (Facebook posts need visuals)
- Too short/long titles
- Clickbait patterns detected

## Moderation Statuses

Posts are marked with one of these statuses in the database:

| Status | Meaning |
|--------|---------|
| `pending` | Not yet checked |
| `approved` | Passed all checks, ready to post |
| `posted` | Successfully posted to Facebook |
| `blocked` | Failed moderation checks |
| `skipped_pattern_match` | Matched skip pattern (URL/source) |
| `failed_to_post` | Approved but Facebook API failed |
| `error` | Technical error during check |

## Configuration

### Edit `moderationConfig.js`

#### Enable/Disable Facebook Posting

```javascript
facebookPostingEnabled: true,  // Set to false to stop all FB posting
```

#### Enable/Disable Moderation

```javascript
moderationEnabled: true,  // Set to false to post everything (DANGEROUS!)
```

⚠️ **Warning:** Disabling moderation bypasses all safety checks!

#### Customize Allowed Categories

```javascript
// Only allow specific categories
allowedCategories: ['News', 'Sports'],  // Only these will post

// OR allow all categories
allowedCategories: [],  // Empty array = allow all
```

#### Block Specific Sources

```javascript
blockedSources: [
  'tabloid-site.com',
  'unverified-news.com'
]
```

#### Add URL Skip Patterns

```javascript
skipUrlPatterns: [
  '/obituary/',
  '/crime-scene/',
  '/explicit/',
]
```

#### Override Always/Never Post

```javascript
overrides: {
  // Always post from these sources (skips ALL checks)
  alwaysPostSources: [
    'bbc.com',
    'reuters.com'
  ],

  // Never post from these sources
  neverPostSources: [
    'fake-news-site.com'
  ]
}
```

## Monitoring Moderation Results

### Check Database

Query MongoDB to see moderation results:

```javascript
// Find all blocked posts
db.posts.find({ fbModerationStatus: 'blocked' })

// Find posts blocked today
db.posts.find({
  fbModerationStatus: 'blocked',
  fbModerationDate: { $gte: new Date('2025-01-15') }
})

// See why a post was blocked
db.posts.findOne({ _id: ObjectId('...') }, {
  fbModerationStatus: 1,
  fbModerationReason: 1,
  fbModerationFlags: 1
})
```

### Check Console Logs

Look for these log messages:

```
[Moderation] Checking if post is safe for Facebook: "Article Title"
[Moderation] ✅ Post is SAFE for Facebook
[Moderation] 🚫 Post blocked from Facebook: OpenAI flagged for: violence/graphic
[Moderation] ⚠️ Soft warning: violence
[Facebook Stage] ✅ Successfully posted to Facebook. Post ID: 123_456
```

### Understanding Moderation Flags

OpenAI provides scores (0-1) for each category:

```json
{
  "categories": {
    "sexual": false,
    "hate": false,
    "violence": true,
    "violence/graphic": false
  },
  "category_scores": {
    "sexual": 0.00012,
    "hate": 0.00034,
    "violence": 0.45,      // 45% confidence - WARNED
    "violence/graphic": 0.02
  }
}
```

**Scores above 0.5 are typically flagged**

## Example Scenarios

### ✅ Scenario 1: Clean News Article (POSTED)

```
Title: "Nigeria's Economy Shows Growth in Q4"
Category: News
Source: premiumtimesng.com

Moderation Result:
✅ Category allowed
✅ Source not blocked
✅ OpenAI: No flags
✅ Has featured image
→ POSTED to Facebook
```

### 🚫 Scenario 2: Graphic Content (BLOCKED)

```
Title: "Horrific Details: Brutal Attack Leaves Multiple Dead"
Category: News
Source: dailypost.ng

Moderation Result:
✅ Category allowed
✅ Source not blocked
❌ OpenAI: Flagged "violence/graphic"
→ BLOCKED from Facebook
Reason: "OpenAI flagged for: violence/graphic"
```

### ⚠️ Scenario 3: Violence Reporting (POSTED with Warning)

```
Title: "Lagos Residents Protest Police Violence"
Category: News
Source: punchng.com

Moderation Result:
✅ Category allowed
✅ Source not blocked
⚠️ OpenAI: Flagged "violence" (but not graphic)
✅ Acceptable for news context
→ POSTED to Facebook (with warning logged)
```

### 🚫 Scenario 4: Gists Category (BLOCKED)

```
Title: "Shocking Rumor About Celebrity XYZ"
Category: Gists
Source: gistlover.com

Moderation Result:
❌ Category "Gists" not in allowed list
→ BLOCKED from Facebook
Reason: "Category not allowed"
```

### 🚫 Scenario 5: Obituary (SKIPPED)

```
Title: "Remembering John Doe: 1950-2025"
Category: News
Source: guardian.ng
URL: https://guardian.ng/news/obituary/remembering-john-doe

Moderation Result:
❌ URL matches skip pattern: /obituary/
→ SKIPPED Facebook posting
Reason: "Post URL matches skip pattern"
```

### 🚫 Scenario 6: No Featured Image (BLOCKED)

```
Title: "Breaking: Major Announcement"
Category: News
Source: naijanews.com
Image: (missing)

Moderation Result:
✅ Category allowed
✅ OpenAI: No flags
❌ No featured image
→ BLOCKED from Facebook
Reason: "No featured image - Facebook posts perform poorly without images"
```

## Troubleshooting

### All Posts Are Being Blocked

**Check:**
1. Is `facebookPostingEnabled: true` in `moderationConfig.js`?
2. Are categories in `allowedCategories` array?
3. Check console logs for specific block reasons
4. Verify OpenAI API key is valid

### Posts That Should Be Blocked Are Being Posted

**Check:**
1. Is `moderationEnabled: true` in `moderationConfig.js`?
2. Is the source in `alwaysPostSources` override?
3. Review OpenAI moderation thresholds
4. Add keywords to `strictBlockKeywords`

### News Articles About Sensitive Topics Being Blocked

**This is normal!** News articles often discuss:
- Violence (wars, crime, accidents)
- Political conflicts
- Social issues

**Solution:**
The system already allows **non-graphic** violence reporting. If legitimate news is being blocked:

1. Check the exact OpenAI category flagged
2. Review `blockingModerationCategories` in config
3. Move category from blocking to warning list if appropriate
4. Use source overrides for trusted news sources

### False Positives (Safe Content Blocked)

OpenAI moderation is very sensitive. To reduce false positives:

```javascript
// In moderationConfig.js
blockingModerationCategories: [
  'violence/graphic',  // Keep this
  'sexual',            // Keep this
  'sexual/minors',     // Keep this
  'hate',              // Keep this
  // Remove 'self-harm' if blocking mental health news
]
```

## Best Practices

### 1. Start Strict, Then Loosen

Begin with strict moderation:
```javascript
allowedCategories: ['News', 'Sports'],  // Very safe
```

Monitor for a week, then gradually add categories:
```javascript
allowedCategories: ['News', 'Sports', 'Entertainment'],
```

### 2. Whitelist Trusted Sources

```javascript
overrides: {
  alwaysPostSources: [
    'bbc.com',
    'reuters.com',
    'aljazeera.com'
  ]
}
```

These skip all moderation checks.

### 3. Review Blocked Content Weekly

```javascript
// In your DB
db.posts.find({
  fbModerationStatus: 'blocked',
  fbModerationDate: { $gte: new Date('2025-01-15') }
}).limit(10)
```

Look for patterns:
- Are safe posts being blocked?
- Are problematic posts getting through?

### 4. Use Category-Based Rules

Different categories need different scrutiny:

```javascript
allowedCategories: [
  'News',              // Wide range of topics
  'Sports',            // Generally safe
  'HealthAndFitness',  // Generally safe
  // 'Gists',          // High risk - unverified rumors
]
```

### 5. Monitor OpenAI Costs

OpenAI Moderation API costs:
- $0.002 per 1,000 tokens (~750 words)
- Average article: ~500 tokens
- Cost per moderation: ~$0.001 (0.1 cents)

At 12 posts/hour: ~$2.88/month

### 6. Keep Logs

All moderation decisions are logged:
- Console: Real-time monitoring
- Database: Historical analysis
- MongoDB queries: Trend analysis

## Advanced Configuration

### Custom Moderation Logic

Edit `contentModeration.js` to add custom rules:

```javascript
export async function isContentSafeForFacebook(post) {
  // ... existing checks ...

  // Custom rule: Block all posts about specific topic
  if (post.rewrittenTitle.toLowerCase().includes('cryptocurrency')) {
    result.isSafe = false
    result.reason = 'Cryptocurrency content not allowed'
    return result
  }

  // Custom rule: Require certain keywords for specific categories
  if (post.category === 'Entertainment') {
    if (!post.excerpt || post.excerpt.length < 50) {
      result.isSafe = false
      result.reason = 'Entertainment posts must have longer excerpts'
      return result
    }
  }

  return result
}
```

### Time-Based Posting Restrictions

Add time-based rules:

```javascript
// In contentModeration.js
export function shouldSkipFacebookPosting(post) {
  // ... existing checks ...

  // Don't post sensitive content at night
  const hour = new Date().getHours()
  if (post.category === 'Gists' && (hour < 6 || hour > 22)) {
    console.log('[Moderation] Skipping Gists post during night hours')
    return true
  }

  return false
}
```

## Facebook Community Standards Reference

Key policies to be aware of:

1. **Violence and Graphic Content**
   - Don't post graphic images of violence
   - News reporting of violence is allowed (without graphic images)

2. **Hate Speech**
   - No content attacking people based on protected characteristics

3. **Adult Content**
   - No sexual content or nudity
   - Educational/news context has some exceptions

4. **Misinformation**
   - Don't share false news or hoaxes
   - Verify sources before posting

5. **Spam and Engagement Bait**
   - No "like and share" posts
   - No clickbait headlines

Read full policies: https://transparency.fb.com/policies/community-standards/

## Support and Updates

### Monitoring System Health

Create a monitoring query:

```javascript
// Check moderation stats for today
db.posts.aggregate([
  {
    $match: {
      fbModerationDate: { $gte: new Date('2025-01-15') }
    }
  },
  {
    $group: {
      _id: '$fbModerationStatus',
      count: { $sum: 1 }
    }
  }
])

// Expected output:
// { _id: 'posted', count: 45 }
// { _id: 'blocked', count: 3 }
// { _id: 'skipped_pattern_match', count: 2 }
```

### Updating Moderation Rules

As Facebook policies change:

1. Update `blockingModerationCategories` in `moderationConfig.js`
2. Add new keywords to `strictBlockKeywords`
3. Update URL patterns in `skipUrlPatterns`
4. Test with recent posts

### Getting Help

If you encounter issues:

1. Check console logs for `[Moderation]` and `[Facebook Stage]` messages
2. Query database for `fbModerationReason` field
3. Review OpenAI moderation flags in `fbModerationFlags` field
4. Test with `testFacebook.js` script

## Files Reference

- `contentModeration.js` - Core moderation logic with OpenAI
- `moderationConfig.js` - User-configurable rules
- `publishStage.js` - Integration point (checks before posting)
- `facebook.js` - Facebook API integration
- `db.js` - Database schema with moderation fields

---

**Remember:** It's better to be too cautious than risk your Facebook page. The system defaults to blocking suspicious content - adjust rules gradually as you monitor results.
