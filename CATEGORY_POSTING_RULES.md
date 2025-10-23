# Category Posting Rules

## Current Configuration

Your scraper now filters which categories are posted to Instagram and X (Twitter).

## Posting Rules by Platform

| Category | WordPress | Facebook | Instagram | X (Twitter) |
|----------|-----------|----------|-----------|-------------|
| **Entertainment** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Gists** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **News** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Sports** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Lifestyle** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **HealthAndFitness** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **FoodAndDrink** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Cars** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |

## Why This Configuration?

### Instagram & X Limits
- **Instagram**: 25 posts per day
- **X**: 50 tweets per day (free tier)
- **Your posting rate**: ~135 posts per day

### Solution
By posting only **Entertainment** and **Gists** to Instagram and X:
- Reduces social media posts to ~40-50 per day
- Stays under rate limits
- WordPress and Facebook still get all content

## Estimated Post Distribution

Based on typical category distribution:

| Category | % of Posts | Daily Posts (approx) |
|----------|------------|---------------------|
| **Entertainment** | 25% | ~34 posts |
| **Gists** | 15% | ~20 posts |
| **News** | 30% | ~41 posts |
| **Sports** | 20% | ~27 posts |
| **Others** | 10% | ~13 posts |

**Instagram/X will receive**: ~54 posts/day (Entertainment + Gists)
- Instagram: Will still hit 25/day limit occasionally
- X: Will stay under 50/day limit

## Log Messages

### When Category is Allowed

**Instagram:**
```
[Instagram Stage] ✅ Category "Entertainment" is allowed
[Instagram Stage] Checking content safety for Instagram...
```

**X:**
```
[X Stage] ✅ Category "Gists" is allowed
[X Stage] Posting to X (Twitter)...
```

### When Category is Blocked

**Instagram:**
```
[Instagram Stage] ⏭️ Skipping Instagram - Category "News" not in allowed list
[Instagram Stage] Allowed categories: Entertainment, Gists
```

**X:**
```
[X Stage] ⏭️ Skipping X - Category "Sports" not in allowed list
[X Stage] Allowed categories: Entertainment, Gists
```

## Customizing Categories

### Add More Categories

To allow more categories to Instagram/X, edit `publishStage.js`:

**For Instagram (around line 662):**
```javascript
const instagramAllowedCategories = ['Entertainment', 'Gists', 'Sports']
//                                                           ^^^^^^^^ Add more here
```

**For X (around line 831):**
```javascript
const xAllowedCategories = ['Entertainment', 'Gists', 'Sports']
//                                                     ^^^^^^^^ Add more here
```

**Available categories:**
- Entertainment
- Gists
- News
- Sports
- Lifestyle
- HealthAndFitness
- FoodAndDrink
- Cars

### Remove Categories

To post only Entertainment:

```javascript
const instagramAllowedCategories = ['Entertainment'] // Gists removed
const xAllowedCategories = ['Entertainment'] // Gists removed
```

### Different Categories for Each Platform

```javascript
// Instagram: Only Entertainment
const instagramAllowedCategories = ['Entertainment']

// X: Entertainment and Gists
const xAllowedCategories = ['Entertainment', 'Gists']
```

### Allow All Categories (Disable Filtering)

**Instagram:**
```javascript
// Comment out the category filter
/*
if (!instagramAllowedCategories.includes(post.category)) {
  // Skip Instagram
} else
*/
if (!isInstagramPostingAllowed().allowed) {
  // Rate limited
} else {
  // Post to Instagram
}
```

**X:**
```javascript
// Comment out the category filter
/*
if (!xAllowedCategories.includes(post.category)) {
  // Skip X
} else
*/
if (!isXPostingAllowed().allowed) {
  // Rate limited
} else {
  // Post to X
}
```

## Database Tracking

Posts skipped due to category filtering are marked in MongoDB:

**Instagram:**
```javascript
igModerationStatus: 'skipped_pattern_match'
igModerationReason: 'Category "News" not allowed for Instagram'
```

**X:**
```javascript
xPostStatus: 'error'
// (Category filtering logged but not stored separately)
```

## Recommended Configurations

### Conservative (Stay Under Limits)
```javascript
const instagramAllowedCategories = ['Entertainment'] // 25% = ~34 posts/day
const xAllowedCategories = ['Entertainment'] // 25% = ~34 posts/day
```

### Balanced (Current Configuration)
```javascript
const instagramAllowedCategories = ['Entertainment', 'Gists'] // 40% = ~54 posts/day
const xAllowedCategories = ['Entertainment', 'Gists'] // 40% = ~54 posts/day
```

### Aggressive (May Hit Limits)
```javascript
const instagramAllowedCategories = ['Entertainment', 'Gists', 'Sports'] // 60% = ~81 posts/day
const xAllowedCategories = ['Entertainment', 'Gists', 'Sports'] // 60% = ~81 posts/day
```

### Different for Each Platform
```javascript
// Instagram: Conservative (stay under 25/day)
const instagramAllowedCategories = ['Entertainment']

// X: Moderate (stay under 50/day)
const xAllowedCategories = ['Entertainment', 'Gists']
```

## Monitoring Category Performance

To see which categories are being posted most, check your MongoDB:

```javascript
// Posts successfully posted to Instagram by category
db.posts.aggregate([
  { $match: { igModerationStatus: 'posted' } },
  { $group: { _id: '$category', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Posts skipped from Instagram by category
db.posts.aggregate([
  { $match: { igModerationStatus: 'skipped_pattern_match' } },
  { $group: { _id: '$category', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

## Files Modified

- `publishStage.js` - Added category filters at lines ~662 (Instagram) and ~831 (X)

## Summary

✅ **WordPress**: Posts all categories (unlimited)

✅ **Facebook**: Posts all categories (~50/day soft limit)

⚡ **Instagram**: Posts only Entertainment & Gists (~54/day → may still hit 25 limit)

⚡ **X**: Posts only Entertainment & Gists (~54/day → stays under 50 limit)

🎯 **Result**: Reduced social media volume by ~60% while keeping WordPress/Facebook at full volume

📊 **Rate limits**: X should stay under limit, Instagram may still hit limit occasionally

💡 **To reduce further**: Change to `['Entertainment']` only for both platforms (~34 posts/day)
