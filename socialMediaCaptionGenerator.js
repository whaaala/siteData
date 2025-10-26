/**
 * Social Media Caption Generator
 * Creates engaging, platform-optimized captions for Facebook, Instagram, and Twitter/X
 */

import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate engaging social media caption using AI
 * @param {Object} params
 * @param {string} params.title - Article title
 * @param {string} params.excerpt - Article excerpt
 * @param {string} params.category - Article category (Entertainment, News, Sports, etc.)
 * @param {string} params.platform - Platform (facebook, instagram, twitter)
 * @param {string} params.link - WordPress URL
 * @returns {Promise<string>} Engaging caption
 */
export async function generateEngagingCaption({
  title,
  excerpt,
  category,
  platform,
  link,
}) {
  try {
    const platformGuidelines = getPlatformGuidelines(platform, category)

    const prompt = `You are a Nigerian social media expert specializing in creating viral, engaging content for ${platform}.

ARTICLE DETAILS:
Title: ${title}
Category: ${category}
Excerpt: ${excerpt}

PLATFORM: ${platform.toUpperCase()}
${platformGuidelines}

Create an engaging ${platform} caption that:
1. Starts with an attention-grabbing hook (question, surprising fact, or emotional statement)
2. Uses strategic emojis that match Nigerian audience preferences
3. Includes the most relevant information from the excerpt
4. Adds ${platform === 'instagram' ? '5-10' : '3-5'} trending Nigerian/African hashtags
5. Ends with a call-to-action (comment, share, tag someone)
6. Feels authentic and conversational (use Nigerian expressions naturally)
7. Maintains the tone appropriate for ${category} content

${platform === 'instagram' ? 'Use line breaks for readability and more emojis for visual appeal.' : ''}
${platform === 'twitter' ? 'CRITICAL: Keep TOTAL length under 250 characters to leave room for the link. This is NON-NEGOTIABLE.' : ''}
${platform === 'facebook' ? 'Can be longer (300-500 chars) for storytelling but stay engaging.' : ''}

${platform === 'twitter' ? 'TWITTER CHARACTER LIMIT: Your caption + link must be under 280 chars. Keep caption under 250 chars.' : ''}

Return ONLY the caption text, no explanations or meta-commentary.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a Nigerian social media expert. Create engaging captions that resonate with Nigerian and West African audiences. Use local expressions naturally.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8, // Higher creativity for engaging content
      max_tokens: 500,
    })

    let caption = response.choices[0].message.content.trim()

    // Add link (Facebook after first paragraph, Twitter at end)
    if (platform === 'facebook') {
      // For Facebook: Put engaging content first (visible before "See more")
      // Then add link after the hook (below "See more" fold)
      // Split caption into paragraphs and insert link after first paragraph/hook
      const paragraphs = caption.split('\n\n')
      if (paragraphs.length > 1) {
        // Insert link after first paragraph (hook)
        paragraphs.splice(1, 0, `🔗 Read full story: ${link}`)
        caption = paragraphs.join('\n\n')
      } else {
        // If only one paragraph, add link at the end
        caption += `\n\n🔗 Read full story: ${link}`
      }
    } else if (platform === 'twitter') {
      // For Twitter, link is usually added at the end
      caption += `\n\n${link}`
    }
    // Instagram: Link goes in bio or story, not caption

    return caption
  } catch (error) {
    console.error(`[Caption Generator] Error generating ${platform} caption:`, error.message)
    // Fallback to enhanced manual caption
    return generateManualCaption({ title, excerpt, category, platform, link })
  }
}

/**
 * Get platform-specific guidelines
 */
function getPlatformGuidelines(platform, category) {
  const guidelines = {
    facebook: `
FACEBOOK BEST PRACTICES:
- Length: 300-500 characters (can go longer for compelling stories)
- Emojis: Use 3-5 relevant emojis strategically
- Hashtags: 3-5 hashtags (Facebook users engage less with heavy hashtag use)
- Tone: Conversational, community-focused, storytelling
- CTAs: "What do you think?", "Tag someone who...", "Share if you agree"
- Engagement: Ask questions to spark comments`,

    instagram: `
INSTAGRAM BEST PRACTICES:
- Length: First 125 characters are visible before "more" button
- Emojis: Use 5-10 emojis for visual appeal and breaks
- Hashtags: 5-10 relevant hashtags (can use up to 30 but 5-10 performs best)
- Tone: Visual, lifestyle-focused, aspirational
- Line breaks: Use breaks between sections for readability
- CTAs: "Double tap if...", "Tag a friend who...", "Comment with 🔥 if..."`,

    twitter: `
TWITTER/X BEST PRACTICES:
- Length: MAX 280 characters TOTAL (including link preview space ~23 chars)
- Emojis: 1-3 emojis maximum
- Hashtags: 1-3 hashtags only (more reduces engagement)
- Tone: Punchy, news-style, conversation-starter
- CTAs: "RT if...", "Your thoughts?", "Debate in comments"
- Thread potential: If story is big, can indicate "Thread 🧵" for continuation`,
  }

  return guidelines[platform] || guidelines.facebook
}

/**
 * Generate manual caption (fallback when AI fails)
 */
function generateManualCaption({ title, excerpt, category, platform, link }) {
  const categoryEmojis = {
    Entertainment: '🎬',
    News: '📰',
    Sports: '⚽',
    Gists: '👀',
    Lifestyle: '✨',
    HealthAndFitness: '💪',
    FoodAndDrink: '🍽️',
  }

  const emoji = categoryEmojis[category] || '📢'
  const hashtags = getHashtagsForCategory(category, platform)

  let caption = ''

  if (platform === 'instagram') {
    caption = `${emoji} ${title}\n\n${excerpt.substring(0, 150)}...\n\n${hashtags}\n\n💬 What's your take? Drop a comment!`
  } else if (platform === 'twitter') {
    // Twitter needs to be short
    caption = `${emoji} ${title.substring(0, 200)}\n\n${hashtags}\n\n${link}`
  } else {
    // Facebook - Engaging content first, then link after first paragraph
    caption = `${emoji} ${title}\n\n🔗 Read full story: ${link}\n\n${excerpt.substring(0, 250)}...\n\n${hashtags}\n\n💬 What do you think? Share your thoughts!`
  }

  return caption
}

/**
 * Get relevant hashtags for category and platform
 */
function getHashtagsForCategory(category, platform) {
  const hashtagMap = {
    Entertainment: {
      facebook: '#NigerianEntertainment #NollywoodGist #AfrobeatNews',
      instagram:
        '#NigerianCelebs #NollywoodActress #AfrobeatNews #NaijaEntertainment #LagosNightLife #NaijaGist',
      twitter: '#NaijaTwitter #BBNaija #NollywoodGist',
    },
    News: {
      facebook: '#NigeriaNews #NaijaNews #AfricaNews',
      instagram: '#NigeriaNews #LagosNews #NaijaUpdates #AfricaNews #NaijaTwitter #NewsUpdate',
      twitter: '#Nigeria #BreakingNews #NaijaNews',
    },
    Sports: {
      facebook: '#NigeriaSports #NaijaFootball #SuperEagles',
      instagram:
        '#NigerianFootball #SuperEagles #NaijaAthletes #AfricanFootball #LagosFootball #NaijaSports',
      twitter: '#SuperEagles #AFCON #NaijaFootball',
    },
    Gists: {
      facebook: '#NaijaGist #LagosGist #GistLover',
      instagram:
        '#NaijaGistLover #LagosGist #NigerianGist #GistLover #NaijaStories #LagosNightLife',
      twitter: '#NaijaGist #GistLovers #LagosGist',
    },
    Lifestyle: {
      facebook: '#NigerianLifestyle #LagosLiving #NaijaLifestyle',
      instagram:
        '#LagosBabes #NaijaLifestyle #LagosLiving #NigerianWedding #NaijaFashion #LagosLife',
      twitter: '#LagosBabes #NaijaLifestyle #LagosLife',
    },
    HealthAndFitness: {
      facebook: '#NaijaFitness #HealthyNaija #WellnessNigeria',
      instagram:
        '#NaijaFitness #LagosGym #HealthyNigeria #NaijaWellness #FitNaija #LagosFitness',
      twitter: '#NaijaFitness #HealthyNaija #Wellness',
    },
    FoodAndDrink: {
      facebook: '#NigerianFood #NaijaFood #AfricanCuisine',
      instagram:
        '#NaijaFood #NigerianCuisine #JollofRice #LagosRestaurants #NaijaFoodie #AfricanFood',
      twitter: '#JollofRice #NaijaFood #Afro Cuisine',
    },
  }

  return hashtagMap[category]?.[platform] || '#Nigeria #Naija #Africa'
}

/**
 * Enhanced Facebook post message with AI-generated caption
 */
export async function formatEngagingFacebookPost(title, excerpt, category, wordpressUrl) {
  try {
    const caption = await generateEngagingCaption({
      title,
      excerpt,
      category,
      platform: 'facebook',
      link: wordpressUrl,
    })
    return caption
  } catch (error) {
    console.error('[Facebook Caption] Error generating caption, using fallback:', error.message)
    return generateManualCaption({
      title,
      excerpt,
      category,
      platform: 'facebook',
      link: wordpressUrl,
    })
  }
}

/**
 * Enhanced Instagram caption (for future Instagram integration)
 */
export async function formatEngagingInstagramPost(title, excerpt, category) {
  try {
    const caption = await generateEngagingCaption({
      title,
      excerpt,
      category,
      platform: 'instagram',
      link: '', // Instagram links go in bio
    })
    return caption
  } catch (error) {
    console.error('[Instagram Caption] Error generating caption, using fallback:', error.message)
    return generateManualCaption({
      title,
      excerpt,
      category,
      platform: 'instagram',
      link: '',
    })
  }
}

/**
 * Enhanced Twitter/X post (for future Twitter integration)
 */
export async function formatEngagingTwitterPost(title, excerpt, category, wordpressUrl) {
  try {
    const caption = await generateEngagingCaption({
      title,
      excerpt,
      category,
      platform: 'twitter',
      link: wordpressUrl,
    })
    return caption
  } catch (error) {
    console.error('[Twitter Caption] Error generating caption, using fallback:', error.message)
    return generateManualCaption({
      title,
      excerpt,
      category,
      platform: 'twitter',
      link: wordpressUrl,
    })
  }
}
