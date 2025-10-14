# Facebook Post Format

## Overview

All posts to Facebook are automatically formatted to include:
1. **Post Title** (from rewritten WordPress title)
2. **Featured Image** (WordPress hosted image)
3. **Excerpt** (30-word summary of the article)
4. **WordPress URL** (link to read the full story)

## Post Format Example

### On Facebook, your posts will look like this:

```
[Featured Image - large visual]

Nigeria's Economy Shows Strong Growth in Q4 2024

The Nigerian economy has demonstrated resilience with a 3.5% growth rate
in the fourth quarter, according to the National Bureau of Statistics.
This marks a significant improvement from previous quarters and signals
positive economic recovery.

📖 Read the full story:
https://nowahalazone.com/nigeria-economy-growth-q4-2024
```

## Format Breakdown

### 1. Featured Image
- **Source:** Post's featured image uploaded to WordPress
- **Size:** Facebook optimized (automatically handled)
- **Position:** Top of the post (native Facebook photo post)

### 2. Post Title
- **Source:** `post.rewrittenTitle` (AI-rewritten title)
- **Format:** Plain text, appears as the first line of the caption
- **Character Limit:** 10-300 characters (validated by moderation)

### 3. Excerpt
- **Source:** Auto-generated from `post.rewrittenDetails`
- **Length:** ~30 words (configurable)
- **Format:** Plain text with HTML tags removed
- **Purpose:** Provides context and encourages clicks

### 4. WordPress URL
- **Source:** `wpResult.link` (published WordPress URL)
- **Format:** Preceded by "📖 Read the full story:"
- **Purpose:** Direct link to full article

## Implementation Details

### Code Location
**File:** `publishStage.js` (lines 33-50)

```javascript
function formatFacebookPostMessage(title, excerpt, wordpressUrl) {
  let message = ''

  // Add title
  message += `${title}\n\n`

  // Add excerpt if available
  if (excerpt && excerpt.trim()) {
    const cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').trim()
    message += `${cleanExcerpt}\n\n`
  }

  // Add read more call-to-action with WordPress URL
  message += `📖 Read the full story:\n${wordpressUrl}`

  return message
}
```

### Excerpt Generation
**File:** `publishStage.js` (line 160)

```javascript
const excerpt = getExcerpt(post.rewrittenDetails, 30)
```

The excerpt is:
- Generated from rewritten content (not original)
- Limited to 30 words for optimal Facebook length
- Stripped of HTML tags
- Saved to database for consistency

## Facebook API Usage

### Photo Post Method
We use the Facebook Graph API's **photo post** endpoint:

```javascript
await postPhotoToFacebook({
  imageUrl: post.imageLink,       // Featured image URL
  message: fbMessage,             // Formatted text (title + excerpt + URL)
  link: wpResult.link,            // WordPress URL
})
```

### API Endpoint
`https://graph.facebook.com/v18.0/{PAGE_ID}/photos`

### Parameters
- `url`: Image URL to post
- `caption`: Full message text (title + excerpt + URL)
- `access_token`: Page access token

## Customization Options

### Change Excerpt Length

Edit `publishStage.js` line 160:

```javascript
// Current: 30 words
const excerpt = getExcerpt(post.rewrittenDetails, 30)

// Longer excerpt: 50 words
const excerpt = getExcerpt(post.rewrittenDetails, 50)

// Shorter excerpt: 20 words
const excerpt = getExcerpt(post.rewrittenDetails, 20)
```

**Recommendation:** Keep between 20-40 words for best Facebook engagement.

### Customize Message Format

Edit the `formatFacebookPostMessage` function in `publishStage.js`:

#### Add Hashtags

```javascript
function formatFacebookPostMessage(title, excerpt, wordpressUrl) {
  let message = `${title}\n\n${excerpt}\n\n📖 Read the full story:\n${wordpressUrl}`

  // Add hashtags
  message += '\n\n#Nigeria #News #Breaking'

  return message
}
```

#### Add Call-to-Action

```javascript
function formatFacebookPostMessage(title, excerpt, wordpressUrl) {
  let message = `${title}\n\n${excerpt}\n\n`

  // Custom CTA
  message += `👉 Click to read more:\n${wordpressUrl}\n\n`
  message += `💬 What do you think? Comment below!`

  return message
}
```

#### Add Emoji to Title

```javascript
function formatFacebookPostMessage(title, excerpt, wordpressUrl) {
  // Add breaking news emoji
  let message = `🚨 ${title}\n\n`

  message += `${excerpt}\n\n`
  message += `📖 Read the full story:\n${wordpressUrl}`

  return message
}
```

### Category-Specific Formatting

Add different formats for different categories:

```javascript
function formatFacebookPostMessage(title, excerpt, wordpressUrl, category) {
  let message = ''

  // Category-specific emoji
  const categoryEmojis = {
    'Sports': '⚽',
    'Entertainment': '🎬',
    'News': '📰',
    'HealthAndFitness': '💪',
    'FoodAndDrink': '🍽️'
  }

  const emoji = categoryEmojis[category] || '📰'

  message += `${emoji} ${title}\n\n`
  message += `${excerpt}\n\n`
  message += `📖 Read the full story:\n${wordpressUrl}`

  return message
}
```

Then update the call in `publishStage.js` line 557:

```javascript
const fbMessage = formatFacebookPostMessage(
  post.rewrittenTitle,
  post.excerpt,
  wpResult.link,
  post.category  // Add category parameter
)
```

## Character Limits

### Facebook Limits
- **Caption text:** 63,206 characters (plenty of room)
- **Link preview:** Facebook auto-generates from URL
- **Image size:** Max 10MB (handled by WordPress upload)

### Our Limits
- **Title:** 10-300 characters (enforced by moderation)
- **Excerpt:** ~150-250 characters (30 words ≈ 200 chars)
- **Total message:** ~400-600 characters typically

## Best Practices

### 1. Keep Excerpts Concise
- 30 words is optimal for Facebook
- Longer excerpts work but may reduce engagement
- Excerpt should create curiosity, not tell full story

### 2. Use Clear CTAs
- "Read the full story" is clear and effective
- Can customize based on content type
- Emoji (📖) draws attention to link

### 3. Image Quality Matters
- WordPress images are automatically optimized
- Featured images should be 1200x630px or larger
- Quality images increase engagement by 2-3x

### 4. Test Format Changes
After customizing, test with:

```bash
node testFacebook.js
```

This creates a real Facebook post so you can preview the format.

## Troubleshooting

### Excerpt Not Showing
**Problem:** Facebook post only shows title, no excerpt

**Check:**
1. Is excerpt being generated? Check database: `db.posts.findOne({_id: ObjectId('...')}, {excerpt: 1})`
2. Is excerpt being passed to `formatFacebookPostMessage`?
3. Look for console logs: `[Facebook Stage]`

**Solution:**
```javascript
// Add debug logging in publishStage.js
console.log('[DEBUG] Excerpt:', post.excerpt)
console.log('[DEBUG] FB Message:', fbMessage)
```

### Excerpt Too Long/Short
**Problem:** Excerpt is truncated or too brief

**Solution:** Adjust word count in `publishStage.js` line 160:
```javascript
const excerpt = getExcerpt(post.rewrittenDetails, 40) // Increase to 40 words
```

### HTML Tags in Excerpt
**Problem:** Excerpt shows `<p>` or other HTML tags

**Cause:** `cleanExcerpt` regex failed

**Solution:** The regex should handle this. If it persists, update `formatFacebookPostMessage`:
```javascript
const cleanExcerpt = excerpt
  .replace(/<[^>]*>/g, '')        // Remove HTML tags
  .replace(/&[^;]+;/g, '')        // Remove HTML entities
  .replace(/\s+/g, ' ')           // Normalize whitespace
  .trim()
```

### Line Breaks Not Working
**Problem:** Post appears as one long block of text

**Cause:** Facebook's API requires literal `\n` characters

**Check:** Ensure using template literals with backticks (`) not quotes (')

```javascript
// Correct ✓
message += `${title}\n\n${excerpt}`

// Wrong ✗
message += title + '\n\n' + excerpt  // May not work consistently
```

## Examples by Category

### News Post
```
📰 Federal Government Announces New Economic Policy

The federal government has unveiled a comprehensive economic reform package
aimed at stabilizing inflation and boosting local manufacturing. The policy
includes tax incentives for businesses and infrastructure investments across
multiple states.

📖 Read the full story:
https://nowahalazone.com/new-economic-policy-announced
```

### Sports Post
```
⚽ Super Eagles Secure Victory in AFCON Qualifier

Nigeria's national football team delivered an impressive performance, defeating
their rivals 3-1 in a crucial AFCON qualifying match. The victory puts the
Super Eagles in prime position to advance to the tournament finals.

📖 Read the full story:
https://nowahalazone.com/super-eagles-afcon-victory
```

### Entertainment Post
```
🎬 Nollywood Film Breaks Box Office Records

The latest Nollywood blockbuster has shattered all previous box office records,
earning over ₦500 million in its opening weekend. The film's success marks a
new era for Nigerian cinema and showcases the industry's growing global appeal.

📖 Read the full story:
https://nowahalazone.com/nollywood-box-office-record
```

## Performance Metrics

### Engagement Expectations
With this format, expect:
- **Click-through rate:** 3-7% (good)
- **Engagement rate:** 5-10% (likes, comments, shares)
- **Reach:** 2-3x your follower count (with good content)

### Why This Format Works
1. **Image catches attention** (stops scrolling)
2. **Title communicates topic** (creates interest)
3. **Excerpt provides context** (builds curiosity)
4. **Clear CTA with link** (drives traffic)

## A/B Testing Ideas

Test different formats to see what works best:

### Test 1: With vs Without Emoji
```javascript
// Version A: With emoji
message += `📖 Read the full story:\n${wordpressUrl}`

// Version B: Without emoji
message += `Read the full story:\n${wordpressUrl}`
```

### Test 2: Question vs Statement Title
```javascript
// Version A: Question
"Will Nigeria's Economy Continue Growing? Here's What Experts Say"

// Version B: Statement
"Nigeria's Economy Shows Strong Growth in Q4 2024"
```

### Test 3: Excerpt Length
```javascript
// Version A: Short (20 words)
const excerpt = getExcerpt(post.rewrittenDetails, 20)

// Version B: Long (40 words)
const excerpt = getExcerpt(post.rewrittenDetails, 40)
```

Track engagement for each version over 1-2 weeks to optimize.

---

**Remember:** The format is automatically applied to ALL posts. Test thoroughly before deploying changes to production!
