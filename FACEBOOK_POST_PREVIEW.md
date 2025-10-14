# Facebook Post Visual Preview

## Your Current Facebook Post Format

When a post is published to Facebook, it appears like this:

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│  [FEATURED IMAGE - Large, Eye-Catching Photo]       │
│                                                       │
└─────────────────────────────────────────────────────┘

Post Title Goes Here

This is the excerpt that provides readers with a preview
of the article content. It gives context about what they'll
find when they click through to read the full story.

📖 Read the full story:
https://nowahalazone.com/article-slug
```

## Breakdown:

1. **Featured Image** (at the very top - large and prominent)
2. **Title** (first line of caption below image)
3. **Excerpt** (~30 words, provides context)
4. **WordPress URL** (with call-to-action icon)

## Live Example:

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│          [Image of Nigerian currency/economy]        │
│                                                       │
└─────────────────────────────────────────────────────┘

Nigeria's Economy Shows Strong Growth in Q4 2024

The Nigerian economy has demonstrated resilience with a
3.5% growth rate in the fourth quarter, according to the
National Bureau of Statistics. This marks a significant
improvement from previous quarters.

📖 Read the full story:
https://nowahalazone.com/nigeria-economy-growth-q4-2024
```

## This Is Already Implemented! ✅

The code in `publishStage.js` (lines 33-50) creates exactly this format:

```javascript
function formatFacebookPostMessage(title, excerpt, wordpressUrl) {
  let message = ''

  // 1. Title
  message += `${title}\n\n`

  // 2. Excerpt (after title)
  if (excerpt && excerpt.trim()) {
    const cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').trim()
    message += `${cleanExcerpt}\n\n`
  }

  // 3. WordPress URL (after excerpt)
  message += `📖 Read the full story:\n${wordpressUrl}`

  return message
}
```

And the image is automatically placed at the top by Facebook's photo API.

## How Facebook Photo Posts Work:

When you post a photo to Facebook using the Graph API (`/photos` endpoint):
- **Image** is automatically displayed at the top (large and prominent)
- **Caption** appears below the image (contains: title + excerpt + URL)

This is Facebook's standard photo post layout and cannot be changed.

## Test Your Format:

Run this to see a real example on your Facebook page:

```bash
node testFacebook.js
```

This will create a test post showing exactly how your posts will appear!

## Order Confirmation:

✅ **Top:** Featured Image (large, eye-catching)
✅ **Below Image:** Title (first thing readers see in caption)
✅ **Below Title:** Excerpt (provides context)
✅ **At Bottom:** WordPress URL with 📖 icon

This format is designed for maximum engagement on Facebook! 🎯
