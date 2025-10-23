# Weighted Category-Based Scraping System

## Overview

Your scraper now intelligently prioritizes content to meet daily category distribution targets. It tracks what's been posted today and focuses on categories that need more content.

---

## Daily Target Distribution

Based on **WordPress posts** (posts with `wpPostId`):

| Category | Target % | WordPress Category |
|----------|----------|-------------------|
| **News** | 10% | News (ID: 35) |
| **Entertainment** | 30% | Entertainment (ID: 21) |
| **Gists** | 25% | Gists (ID: 1) |
| **Sports** | 5% | Sports (ID: 45) |
| **FoodAndDrink** | 5% | Food & Drink (ID: 24) |
| **Cars** | 5% | **Lifestyle** (ID: 30) ⚠️ |
| **HealthAndFitness** | 5% | Health & Fitness (ID: 27) |
| **Lifestyle** | 15% | Lifestyle (ID: 30) |
| **TOTAL** | **100%** | |

**Note:** Cars content is tracked separately (5% target) but posted to WordPress under Lifestyle category. This means **Lifestyle in WordPress will have ~20% total** (15% Lifestyle + 5% Cars).

---

## How It Works

### 1. Category Tracking

Every time the scraper runs, it:
1. Counts all posts published to WordPress **today**
2. Calculates current percentage for each category
3. Compares current % vs target %
4. Identifies which categories need more content

### 2. Weighted URL Selection

Instead of random selection, the scraper:
1. **Analyzes URLs** - Guesses which category each URL will produce (based on URL path and domain)
2. **Prioritizes needed categories** - Picks URLs that match under-represented categories
3. **Smart fallback** - If no URLs match needed categories, selects randomly

**Example:**
```
Current Status:
  Entertainment: 20% (target: 30%) → Deficit: +10%
  Gists: 15% (target: 25%) → Deficit: +10%
  News: 12% (target: 10%) → Deficit: -2%

Next Scrape:
  🎯 Prioritize Entertainment or Gists URLs
  ⏭️ Skip News URLs (already above target)
```

### 3. URL Category Guessing

The system guesses URL categories based on:

**URL Path Keywords:**
- `/sport`, `/football` → Sports
- `/entertainment`, `/music` → Entertainment
- `/gist`, `/gossip` → Gists
- `/food`, `/recipe` → FoodAndDrink
- `/car`, `/auto` → Cars
- `/health`, `/fitness` → HealthAndFitness
- `/lifestyle`, `/fashion` → Lifestyle
- `/news`, `/politics` → News

**Domain Hints:**
- `notjustok`, `bellanaija` → Entertainment
- `yabaleft`, `lindaikeji` → Gists
- `brila`, `completesports` → Sports
- `motorverso`, `girlracer` → Cars
- `womenshealth`, `fitness` → HealthAndFitness
- `punch`, `guardian`, `tribune` → News

---

## Redistribution Logic

When a category has **no available content**, its percentage is redistributed:

| Category | Gets % of Orphaned |
|----------|-------------------|
| Entertainment | **60%** (highest) |
| Gists | **30%** |
| News | **10%** (lowest) |

**Example:**
If Sports (5%) has no content available:
- Entertainment: 30% + (5% × 60%) = **33%**
- Gists: 25% + (5% × 30%) = **26.5%**
- News: 10% + (5% × 10%) = **10.5%**

---

## Daily Status Log

Every scrape cycle shows:

```
==================================================================
📊 Daily Category Distribution Status
==================================================================
Total WordPress posts today: 24

Category          | Posts | Current% | Target% | Deficit  | Status
----------------------------------------------------------------------
Entertainment     |     8 |   33.3% |   30.0% |    -3.3% | 🔵 Excess
Gists             |     5 |   20.8% |   25.0% |    +4.2% | 🟡 Need more
Lifestyle         |     4 |   16.7% |   15.0% |    -1.7% | ✅ On track
News              |     3 |   12.5% |   10.0% |    -2.5% | 🔵 Excess
HealthAndFitness  |     2 |    8.3% |    5.0% |    -3.3% | 🔵 Excess
FoodAndDrink      |     1 |    4.2% |    5.0% |    +0.8% | ✅ On track
Cars              |     1 |    4.2% |    5.0% |    +0.8% | ✅ On track
Sports            |     0 |    0.0% |    5.0% |    +5.0% | 🔴 High need
==================================================================
🎯 Priority: Focus on "Sports" content
==================================================================
```

**Status Indicators:**
- 🔴 **High need** - Deficit > 5%
- 🟡 **Need more** - Deficit 2-5%
- ✅ **On track** - Deficit within ±2%
- 🔵 **Excess** - Over target by > 2%

---

## Files Modified

1. **categoryTargets.js** - Target percentages and redistribution weights
2. **dailyCategoryTracker.js** - Tracking logic and status reporting
3. **crawer.js** - Weighted URL selection logic
4. **normalizeCategory.js** - Added Cars category
5. **categoryMap.js** - Maps Cars → Lifestyle WordPress category

---

## Testing the System

### View Today's Status
The status log appears automatically every time the scraper runs.

### Check MongoDB
Query posts by category:
```javascript
// Count today's posts by category
db.posts.aggregate([
  {
    $match: {
      wpPostId: { $exists: true },
      timePosted: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  },
  {
    $group: {
      _id: "$category",
      count: { $sum: 1 }
    }
  }
])
```

---

## Expected Behavior

### Early in Day (0-10 posts)
- Scraper prioritizes **variety** - tries to get at least 1 post from each category
- Boosts priority for categories with 0 posts

### Mid-Day (10-50 posts)
- Scraper focuses on **deficits** - prioritizes categories furthest from target
- Uses weighted random selection based on deficit size

### Late in Day (50+ posts)
- Fine-tuning - adjusts to hit exact percentages
- May over-represent some categories to compensate for unavailable categories

---

## Advantages

✅ **Balanced content** - No category dominates or gets neglected
✅ **Smart prioritization** - Focuses scraping effort where needed
✅ **Flexible** - Adapts when some categories have no content available
✅ **Transparent** - Clear status log shows what's happening
✅ **Automatic** - No manual intervention needed

---

## Monitoring

### Daily Review
Check the status log to see:
- Are all categories hitting their targets?
- Which categories consistently fall short?
- Are some sites not producing expected categories?

### Adjustments
If you notice patterns:
1. **Update URL guessing** in `crawer.js` if categories are misidentified
2. **Adjust targets** in `categoryTargets.js` if goals change
3. **Add more sites** for under-represented categories

---

## Example Day Timeline

```
8:00 AM - First post (Entertainment)
  Status: All categories at 0% except Entertainment (100%)
  Next: Prioritize other categories for variety

10:00 AM - 5 posts total
  Entertainment: 40%, News: 20%, Gists: 20%, Lifestyle: 20%
  Next: Continue Entertainment (still below 30% absolute)

2:00 PM - 30 posts total
  Entertainment: 33%, Gists: 27%, News: 13%, Lifestyle: 17%
  Sports: 3%, Food: 3%, Cars: 3%, Health: 1%
  Next: Focus on Sports, Food, Cars, Health (all below target)

8:00 PM - 100 posts total
  Entertainment: 31%, Gists: 25%, Lifestyle: 19% (15% + 4% Cars)
  News: 10%, Health: 6%, Sports: 5%, Food: 4%
  Next: Minor adjustments, mostly balanced

11:00 PM - End of day
  ✅ All targets achieved within ±2%
```

---

## Troubleshooting

### Category always under target
- Check if enough sites produce that category
- Verify URL guessing is accurate for that category
- Consider adding more sites focused on that category

### Category always over target
- Too many URLs are being tagged as this category
- Check URL guessing logic in `crawer.js`
- May need to reduce target percentage

### Redistribution not working
- Make sure `unavailableCategories` array is passed correctly
- Check that unavailable categories actually have no posts
- Verify redistribution weights in `categoryTargets.js`

---

## Summary

Your scraper now **actively manages content distribution** to hit precise daily targets. It's smart enough to:
- 🎯 Focus on what's needed
- 🔄 Adapt when content isn't available
- 📊 Show you exactly what's happening
- ✅ Achieve balanced, diverse content every day

No more manual balancing - the system handles it automatically! 🚀
