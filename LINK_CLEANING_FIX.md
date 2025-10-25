# Link Cleaning Fix - Remove ALL Nigerian News Site Links

## Problem

Posts published to WordPress contained links back to Nigerian news sites (competitors), including:
- Premium Times Nigeria (premiumtimesng.com)
- Daily Trust (dailytrust.com)
- Guardian Nigeria (guardian.ng)
- Punch, Vanguard, The Cable, Sahara Reporters, etc.

**Example:** https://nowahalazone.com/kano-hisbah-decision-on-tiktokers-court-marriage-sparks-online-debate/

This post contained links to:
1. `https://www.premiumtimesng.com/regional/nwest/675232-court-orders-hisbah-to-oversee-marriage-of-two-kano-tiktokers.html`
2. `https://dailytrust.com/hisbah-cancels-tiktokers-court-ordered-marriage/`

## Root Cause

### 1. Link Cleaning Logic Was Too Narrow
The `cleanAllLinksInContent()` function in `utils.js` only removed Nigerian news site links if they were **internal pages** (category, tag, or author pages).

**Old Logic (Lines 140-149):**
```javascript
for (const site of nigerianNewsSites) {
  if (href.includes(site) && sourceDomain !== site) {
    // ONLY removed if it was a category/tag/author link
    if (href.includes('/tag/') || href.includes('/category/') || href.includes('/author/')) {
      shouldRemove = true
      reason = `internal category/tag link to ${site}`
      break
    }
  }
}
```

**Problem:** Links to actual news articles were NOT removed!

### 2. OpenAI Was Adding Links
The AI content generation prompt encouraged adding links to sources:
```
"Where possible, link directly to official sources, press releases, court documents, or agency reports."
```

The AI interpreted this as "link to news articles" and added links to Premium Times, Daily Trust, etc.

## Solution

### Fix 1: Update Link Cleaning Logic ✅

**File:** `utils.js` (Lines 122-147)

**Changed from:**
```javascript
// Only removed category/tag/author links
for (const site of nigerianNewsSites) {
  if (href.includes(site) && sourceDomain !== site) {
    if (href.includes('/tag/') || href.includes('/category/') || href.includes('/author/')) {
      shouldRemove = true
      break
    }
  }
}
```

**Changed to:**
```javascript
// Remove ALL links to Nigerian news sites
for (const site of nigerianNewsSites) {
  if (href.includes(site)) {
    shouldRemove = true
    reason = `links to competitor news site ${site}`
    break
  }
}
```

**Added dailytrust.com to the list:**
```javascript
const nigerianNewsSites = [
  'pulse.ng', 'pulse.com.gh',
  'legit.ng',
  'dailypost.ng',
  'punchng.com',
  'premiumtimesng.com',
  'guardian.ng',
  'yabaleftonline.ng',
  'gistreel.com',
  'naijanews.com',
  'brila.net',
  'notjustok.com',
  'vanguardngr.com',
  'thecable.ng',
  'saharareporters.com',
  'dailytrust.com'  // ADDED
]
```

### Fix 2: Update OpenAI Prompt ✅

**File:** `openai.js` (Lines 190-195)

**Changed from:**
```
🚦 Source Attribution & Links
- Where possible, link directly to official sources, press releases, court documents, or agency reports.
- Attribute quotes to named individuals (e.g., spokespersons, officials, activists) and include date/source if available.
```

**Changed to:**
```
🚦 Source Attribution & Links
- IMPORTANT: Do NOT add links to Nigerian news sites (Punch, Guardian Nigeria, Premium Times, Vanguard, Daily Trust, The Cable, Sahara Reporters, Pulse Nigeria, Legit.ng, Daily Post, etc.)
- Do NOT add links to competitor news websites or blogs
- ONLY link to official sources: government websites, press releases, court documents, agency reports, international organizations (WHO, UNICEF, UN, etc.)
- Attribute quotes to named individuals (e.g., spokespersons, officials, activists) and include date/source if available, but do NOT hyperlink to news sites
- You can mention source names in text (e.g., "according to Premium Times...") but do NOT create hyperlinks to them
```

## Testing

### Test Added: Nigerian News Site Links Removal

```javascript
{
  name: 'Nigerian news site links removal',
  sourceUrl: 'https://yabaleftonline.ng/article-123',
  html: `
    <p>According to <a href="https://www.premiumtimesng.com/news/article">Premium Times</a>,
    the court ordered. <a href="https://dailytrust.com/hisbah-article">Daily Trust</a> also reported.</p>
    <p>International: <a href="https://www.unicef.org/report">UNICEF Report</a></p>
    <p>More from <a href="https://guardian.ng/news/politics">Guardian Nigeria</a>.</p>
  `,
  expectedRemoved: 3,
  description: 'Should remove all Nigerian news site links but keep UNICEF'
}
```

**Result:** ✅ PASSED

All 7 tests passed, including the new test for Nigerian news site link removal.

## What Gets Removed Now

### ❌ Removed (Nigerian News Sites)
- premiumtimesng.com
- dailytrust.com
- guardian.ng
- punchng.com
- vanguardngr.com
- thecable.ng
- saharareporters.com
- pulse.ng / pulse.com.gh
- legit.ng
- dailypost.ng
- yabaleftonline.ng
- gistreel.com
- naijanews.com
- brila.net
- notjustok.com

### ✅ Preserved (Legitimate External Links)
- International news: BBC, Reuters, Al Jazeera, CNN, etc.
- Government: .gov, .gov.ng websites
- International organizations: WHO, UNICEF, UN, World Bank, etc.
- Educational: Wikipedia, university websites
- Official sources: Court documents, press releases
- Social media embeds: Twitter, Instagram, TikTok, Facebook, YouTube

## Behavior Changes

### Before Fix:
1. AI could add links to Premium Times, Daily Trust, Guardian Nigeria, etc.
2. Link cleaner only removed category/tag/author links from these sites
3. Links to actual news articles from competitor sites remained in published posts

### After Fix:
1. AI is instructed NOT to add links to Nigerian news sites
2. Link cleaner removes ALL links to Nigerian news sites (articles, categories, everything)
3. AI can still mention source names in text (e.g., "according to Premium Times...")
4. Only legitimate external links (government, international orgs, etc.) are preserved

## Impact on New Posts

All posts published after this fix will:
- ✅ Have NO links to competitor Nigerian news sites
- ✅ Preserve legitimate external links (WHO, UNICEF, etc.)
- ✅ Still mention sources in text for attribution
- ✅ Maintain professional, clean link structure

## Impact on Old Posts

Old posts published before this fix will still contain competitor links. To fix them, you would need to:
1. Re-run the publishing pipeline on old posts (not recommended)
2. Manually edit posts in WordPress to remove competitor links
3. Accept that old posts have these links (they're already published)

## How It Works

### Stage 1: Content Generation (openai.js)
AI is now instructed to NOT add links to Nigerian news sites during content rewriting.

### Stage 2: Link Cleaning (publishStage.js)
Before publishing to WordPress, all links are cleaned:

```javascript
// Clean all invalid and source site links
console.log('[WordPress Stage] Cleaning invalid and source site links...')
contentWithEmbeds = cleanAllLinksInContent(contentWithEmbeds, post.url)
```

### Stage 3: Result
Content published to WordPress has:
- No links to source site
- No links to competitor sites
- Only legitimate external links
- Professional, clean appearance

## Verification

Run the test suite to verify:
```bash
node testLinkCleaning.js
```

Expected output:
```
✅ Passed: 7/7
❌ Failed: 0/7
🎉 ALL TESTS PASSED!
```

## Related Files

- **utils.js** (lines 122-147) - Link cleaning logic
- **openai.js** (lines 190-195) - AI prompt instructions
- **publishStage.js** (lines 223-227) - Link cleaning integration
- **testLinkCleaning.js** - Test suite with 7 test cases

## Summary

✅ **No more competitor links** - All links to Nigerian news sites removed
✅ **Legitimate links preserved** - WHO, UNICEF, government sites kept
✅ **AI compliance** - OpenAI instructed not to add competitor links
✅ **Clean link structure** - Professional appearance, no broken links
✅ **All tests passing** - 7/7 tests passed including new test case

Posts will now be published with clean, professional link structures that benefit SEO and user experience!
