# Quick Reference - Category Filtering & Rate Limits

## 🎯 What Posts Where?

```
┌─────────────┬───────────┬──────────┬───────────┬────────────┐
│  Category   │ WordPress │ Facebook │ Instagram │ X (Twitter)│
├─────────────┼───────────┼──────────┼───────────┼────────────┤
│Entertainment│    ✅     │    ✅    │    ✅     │     ✅     │
│   Gists     │    ✅     │    ✅    │    ✅     │     ✅     │
│    News     │    ✅     │    ✅    │    ❌     │     ❌     │
│   Sports    │    ✅     │    ✅    │    ❌     │     ❌     │
│  Lifestyle  │    ✅     │    ✅    │    ❌     │     ❌     │
│   Health    │    ✅     │    ✅    │    ❌     │     ❌     │
│    Food     │    ✅     │    ✅    │    ❌     │     ❌     │
│    Cars     │    ✅     │    ✅    │    ❌     │     ❌     │
└─────────────┴───────────┴──────────┴───────────┴────────────┘
```

## 📊 Expected Volume

**Total posts per day**: ~135

**Distribution**:
- WordPress: 135 posts (all categories)
- Facebook: 135 posts (all categories)
- Instagram: ~54 posts (Entertainment + Gists only)
- X: ~54 posts (Entertainment + Gists only)

## 🚦 Rate Limits

| Platform | Limit | Your Rate | Status |
|----------|-------|-----------|--------|
| WordPress | Unlimited | 135/day | ✅ Safe |
| Facebook | ~50/day | 135/day | ✅ OK (soft limit) |
| Instagram | 25/day | 54/day | ⚠️ May hit limit |
| X (Free) | 50/day | 54/day | ⚠️ May hit limit |

**Note**: Instagram and X may still occasionally hit rate limits, but frequency is reduced by 60%.

## 🔧 Quick Edits

### To Change Allowed Categories

Edit `publishStage.js`:

**Instagram (line ~662):**
```javascript
const instagramAllowedCategories = ['Entertainment', 'Gists']
```

**X (line ~831):**
```javascript
const xAllowedCategories = ['Entertainment', 'Gists']
```

### Common Configurations

**Conservative** (reduce to ~34 posts/day):
```javascript
const instagramAllowedCategories = ['Entertainment']
const xAllowedCategories = ['Entertainment']
```

**Moderate** (current - ~54 posts/day):
```javascript
const instagramAllowedCategories = ['Entertainment', 'Gists']
const xAllowedCategories = ['Entertainment', 'Gists']
```

**Aggressive** (~81 posts/day):
```javascript
const instagramAllowedCategories = ['Entertainment', 'Gists', 'Sports']
const xAllowedCategories = ['Entertainment', 'Gists', 'Sports']
```

## 📝 Log Examples

**Category Allowed:**
```
[Instagram Stage] ✅ Category "Entertainment" is allowed
[X Stage] ✅ Category "Gists" is allowed
```

**Category Blocked:**
```
[Instagram Stage] ⏭️ Skipping Instagram - Category "News" not in allowed list
[X Stage] ⏭️ Skipping X - Category "Sports" not in allowed list
```

**Rate Limited:**
```
[Instagram Stage] ⏸️ Instagram posting temporarily disabled (rate limited)
[Instagram Stage] Cooldown remaining: 87 minutes
```

## 🔄 Reset Rate Limits

**Instagram:**
```bash
node resetInstagramRateLimit.js
```

**X:**
```bash
node resetXRateLimit.js
```

## 📚 Full Documentation

- `CATEGORY_POSTING_RULES.md` - Category filtering details
- `RATE_LIMITS_OVERVIEW.md` - Rate limit management
- `INSTAGRAM_RATE_LIMITS.md` - Instagram specifics
- `X_RATE_LIMITS.md` - X (Twitter) specifics

## 🚀 To Reduce Rate Limits Further

**Option 1**: Post only Entertainment
```javascript
['Entertainment'] // ~34 posts/day
```

**Option 2**: Slow down scraper (in `scheduler.js`)
```javascript
await new Promise((res) => setTimeout(res, 22 * 60 * 1000)) // 22 min
```

**Option 3**: Upgrade X to Basic tier ($100/month)
- 100 tweets/day instead of 50/day
- Enough for current volume

## ✅ Current Status

All systems are configured and running:
- ✅ Category filtering active
- ✅ Rate limit tracking active
- ✅ Auto-pause/resume enabled
- ✅ Fast retry on failures (1 min)
- ✅ Manual reset tools available
