import OpenAI from 'openai'
import dotenv from 'dotenv'
import {
  getModerationConfig,
  isCategoryAllowed,
  isSourceBlocked,
  matchesSkipPattern
} from './moderationConfig.js'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Facebook Content Policy Categories to check
 * Based on Facebook Community Standards
 */
const FACEBOOK_VIOLATION_KEYWORDS = {
  violence: [
    'kill', 'murder', 'assassinate', 'brutal attack', 'graphic violence',
    'beheading', 'torture', 'massacre', 'genocide', 'mass shooting'
  ],
  hate_speech: [
    'racial slur', 'ethnic cleansing', 'hate crime', 'bigotry',
  ],
  adult_content: [
    'pornography', 'xxx', 'explicit nudity', 'sexual intercourse',
  ],
  dangerous_organizations: [
    'terrorist', 'terrorism', 'isis', 'al-qaeda', 'boko haram',
  ],
  // Note: News articles may legitimately discuss these topics
  // This is why we use AI moderation as the primary check
}

/**
 * Categories that require extra scrutiny for Facebook
 */
const SENSITIVE_CATEGORIES = ['Gists', 'Entertainment']

/**
 * Moderate content using OpenAI's Moderation API
 * @param {string} content - The content to moderate
 * @returns {Object} Moderation result with flags
 */
export async function moderateWithOpenAI(content) {
  try {
    const response = await openai.moderations.create({
      input: content,
    })

    const result = response.results[0]

    return {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores,
    }
  } catch (error) {
    console.error('[Moderation] OpenAI moderation error:', error.message)
    // On error, default to safe (don't post)
    return {
      flagged: true,
      categories: { error: true },
      categoryScores: {},
      error: error.message,
    }
  }
}

/**
 * Analyze image using OpenAI Vision API for Facebook policy violations
 * @param {string} imageUrl - URL of the image to analyze
 * @returns {Object} Analysis result with safety assessment
 */
export async function analyzeImageWithVision(imageUrl) {
  try {
    console.log(`[Moderation] Analyzing image: ${imageUrl}`)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image for Facebook Community Standards violations. Check for:
1. Violence or graphic content (blood, injuries, weapons used violently)
2. Nudity or sexual content
3. Hate symbols or hate speech imagery
4. Dangerous individuals or organizations
5. Misinformation or manipulated media

For NEWS images: Some violence/sensitive content is acceptable if it's newsworthy and not gratuitously graphic.

Respond in JSON format:
{
  "isSafe": true/false,
  "violations": ["category1", "category2"],
  "severity": "none/low/medium/high",
  "reasoning": "Brief explanation",
  "isNewsworthy": true/false
}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    })

    const content = response.choices[0].message.content

    // Try to parse JSON response
    let analysis
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      analysis = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('[Moderation] Failed to parse Vision API response:', content)
      // If parsing fails, assume unsafe to be cautious
      return {
        isSafe: false,
        violations: ['parsing_error'],
        severity: 'high',
        reasoning: 'Failed to parse image analysis response',
        rawResponse: content,
      }
    }

    console.log(`[Moderation] Image analysis result: ${analysis.isSafe ? 'SAFE' : 'UNSAFE'} - ${analysis.reasoning}`)

    return analysis
  } catch (error) {
    console.error('[Moderation] Vision API error:', error.message)
    // On error, block the image to be safe
    return {
      isSafe: false,
      violations: ['api_error'],
      severity: 'high',
      reasoning: `Vision API error: ${error.message}`,
      error: error.message,
    }
  }
}

/**
 * Analyze image for Instagram Community Guidelines violations
 * Instagram has similar but slightly different policies than Facebook
 * @param {string} imageUrl - URL of the image to analyze
 * @returns {Object} Analysis result for Instagram
 */
export async function analyzeImageForInstagram(imageUrl) {
  try {
    console.log(`[Moderation] Analyzing image for Instagram: ${imageUrl}`)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image for Instagram Community Guidelines violations. Check for:
1. Nudity or sexual activity (Instagram is stricter than Facebook)
2. Violence or graphic content (blood, injuries, weapons)
3. Hate speech or symbols
4. Bullying or harassment imagery
5. Self-harm or suicide content
6. Illegal drugs or sales
7. Dangerous organizations
8. Misinformation about health

For NEWS images: Some sensitive content is acceptable if it's newsworthy and not exploitative.

Instagram is particularly strict about:
- Partial nudity (cleavage, underwear, etc.)
- Suggestive poses
- Graphic violence or injuries
- Self-harm imagery

Respond in JSON format:
{
  "isSafe": true/false,
  "violations": ["category1", "category2"],
  "severity": "none/low/medium/high",
  "reasoning": "Brief explanation",
  "isNewsworthy": true/false,
  "instagramSpecificIssues": "Any Instagram-specific concerns"
}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    })

    const content = response.choices[0].message.content

    // Try to parse JSON response
    let analysis
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      analysis = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('[Moderation] Failed to parse Instagram Vision API response:', content)
      return {
        isSafe: false,
        violations: ['parsing_error'],
        severity: 'high',
        reasoning: 'Failed to parse image analysis response',
        rawResponse: content,
      }
    }

    console.log(`[Moderation] Instagram image analysis: ${analysis.isSafe ? 'SAFE' : 'UNSAFE'} - ${analysis.reasoning}`)

    return analysis
  } catch (error) {
    console.error('[Moderation] Instagram Vision API error:', error.message)
    return {
      isSafe: false,
      violations: ['api_error'],
      severity: 'high',
      reasoning: `Instagram Vision API error: ${error.message}`,
      error: error.message,
    }
  }
}

/**
 * Check if content contains high-risk keywords
 * @param {string} content - The content to check
 * @returns {Object} Result with violations found
 */
function checkKeywords(content) {
  const lowerContent = content.toLowerCase()
  const violations = []

  for (const [category, keywords] of Object.entries(FACEBOOK_VIOLATION_KEYWORDS)) {
    for (const keyword of keywords) {
      // Check for exact phrase match (not just word fragments)
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (regex.test(lowerContent)) {
        violations.push({ category, keyword })
      }
    }
  }

  return {
    hasViolations: violations.length > 0,
    violations,
  }
}

/**
 * Comprehensive check if content is safe for Facebook
 * @param {Object} post - The post object from database
 * @returns {Object} Safety result with recommendation
 */
export async function isContentSafeForFacebook(post) {
  console.log(`[Moderation] Checking if post is safe for Facebook: "${post.rewrittenTitle}"`)

  const result = {
    isSafe: true,
    reason: null,
    moderationFlags: {},
    imageAnalysis: {},
    recommendations: [],
  }

  // Combine title and excerpt for comprehensive check
  const contentToCheck = `${post.rewrittenTitle}\n\n${post.excerpt || ''}`

  // 1. OpenAI Moderation (Primary check)
  const aiModeration = await moderateWithOpenAI(contentToCheck)
  result.moderationFlags = aiModeration

  if (aiModeration.flagged) {
    const flaggedCategories = Object.entries(aiModeration.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category)

    // Determine if violations are acceptable for news content
    const criticalCategories = ['violence/graphic', 'sexual', 'sexual/minors', 'hate']
    const hasCriticalViolation = flaggedCategories.some(cat =>
      criticalCategories.some(critical => cat.includes(critical))
    )

    if (hasCriticalViolation) {
      result.isSafe = false
      result.reason = `OpenAI flagged for: ${flaggedCategories.join(', ')}`
      console.log(`[Moderation] ❌ Post BLOCKED - ${result.reason}`)
      return result
    } else {
      // Soft warning for borderline content
      result.recommendations.push(`Flagged but acceptable for news: ${flaggedCategories.join(', ')}`)
      console.log(`[Moderation] ⚠️ Soft warning: ${flaggedCategories.join(', ')}`)
    }
  }

  // 1.5. IMAGE ANALYSIS (Critical for Facebook!)
  if (post.imageLink && post.imageLink.trim() !== '') {
    console.log('[Moderation] Analyzing featured image...')
    const imageAnalysis = await analyzeImageWithVision(post.imageLink)
    result.imageAnalysis = imageAnalysis

    // Block if image is unsafe
    if (!imageAnalysis.isSafe) {
      result.isSafe = false
      result.reason = `Image violated policy: ${imageAnalysis.reasoning} (Violations: ${imageAnalysis.violations?.join(', ') || 'unknown'})`
      console.log(`[Moderation] ❌ Post BLOCKED - ${result.reason}`)
      return result
    }

    // Warn if severity is medium or high but still safe
    if (imageAnalysis.severity === 'medium' || imageAnalysis.severity === 'high') {
      result.recommendations.push(`Image has ${imageAnalysis.severity} severity content: ${imageAnalysis.reasoning}`)
      console.log(`[Moderation] ⚠️ Image warning (${imageAnalysis.severity}): ${imageAnalysis.reasoning}`)
    } else {
      console.log(`[Moderation] ✅ Image is safe: ${imageAnalysis.reasoning}`)
    }
  }

  // 2. Keyword Check (Secondary check)
  const keywordCheck = checkKeywords(contentToCheck)
  if (keywordCheck.hasViolations) {
    const violationSummary = keywordCheck.violations
      .map(v => `${v.category}: "${v.keyword}"`)
      .join(', ')
    result.recommendations.push(`Contains sensitive keywords: ${violationSummary}`)
    console.log(`[Moderation] ⚠️ Contains sensitive keywords: ${violationSummary}`)

    // For now, just log - don't block based on keywords alone
    // (News articles legitimately discuss sensitive topics)
  }

  // 3. Category-based rules
  if (SENSITIVE_CATEGORIES.includes(post.category)) {
    result.recommendations.push(`Category "${post.category}" requires extra review`)
    console.log(`[Moderation] ℹ️ Sensitive category: ${post.category}`)
  }

  // 4. Content quality checks
  if (!post.imageLink || post.imageLink === '') {
    result.isSafe = false
    result.reason = 'No featured image - Facebook posts perform poorly without images'
    console.log(`[Moderation] ❌ Post BLOCKED - No featured image`)
    return result
  }

  if (!post.rewrittenTitle || post.rewrittenTitle.length < 10) {
    result.isSafe = false
    result.reason = 'Title too short or missing'
    console.log(`[Moderation] ❌ Post BLOCKED - Invalid title`)
    return result
  }

  // 5. Facebook-specific restrictions
  if (contentToCheck.includes('clickbait') || /click here|you won't believe/i.test(contentToCheck)) {
    result.recommendations.push('Possible clickbait detected')
    console.log(`[Moderation] ⚠️ Possible clickbait detected`)
  }

  if (result.isSafe) {
    console.log(`[Moderation] ✅ Post is SAFE for Facebook`)
    if (result.recommendations.length > 0) {
      console.log(`[Moderation] Recommendations: ${result.recommendations.join('; ')}`)
    }
  }

  return result
}

/**
 * Get human-readable explanation of moderation flags
 * @param {Object} moderationResult - Result from isContentSafeForFacebook
 * @returns {string} Human-readable explanation
 */
export function getModerationExplanation(moderationResult) {
  if (moderationResult.isSafe) {
    return 'Content passed all safety checks'
  }

  let explanation = `Content blocked: ${moderationResult.reason || 'Unknown reason'}`

  if (moderationResult.recommendations.length > 0) {
    explanation += `\nRecommendations: ${moderationResult.recommendations.join('; ')}`
  }

  return explanation
}

/**
 * Check specific high-risk scenarios
 * @param {Object} post - The post object
 * @returns {boolean} True if post should skip Facebook
 */
export function shouldSkipFacebookPosting(post) {
  const config = getModerationConfig()

  // Check if Facebook posting is globally disabled
  if (!config.facebookPostingEnabled) {
    console.log('[Moderation] Facebook posting is globally disabled')
    return true
  }

  // Check if moderation is disabled (allow all)
  if (!config.moderationEnabled) {
    console.log('[Moderation] Moderation is disabled - allowing all posts')
    return false
  }

  // Check category allowlist
  if (!isCategoryAllowed(post.category)) {
    console.log(`[Moderation] Category "${post.category}" is not in allowed list`)
    return true
  }

  // Check if source is blocked
  if (isSourceBlocked(post.website)) {
    console.log(`[Moderation] Source "${post.website}" is blocked`)
    return true
  }

  // Check URL patterns
  if (matchesSkipPattern(post.url)) {
    console.log(`[Moderation] URL matches skip pattern: ${post.url}`)
    return true
  }

  // Check override - always post sources
  if (config.overrides.alwaysPostSources.some(source => post.website?.includes(source))) {
    console.log(`[Moderation] Source "${post.website}" is in always-post list - skipping all checks`)
    return false // Don't skip - always post
  }

  // Check override - never post sources
  if (config.overrides.neverPostSources.some(source => post.website?.includes(source))) {
    console.log(`[Moderation] Source "${post.website}" is in never-post list`)
    return true
  }

  return false
}

/**
 * Comprehensive check if content is safe for Instagram
 * Instagram has stricter content policies than Facebook
 * @param {Object} post - The post object from database
 * @returns {Object} Safety result with recommendation
 */
export async function isContentSafeForInstagram(post) {
  console.log(`[Moderation] Checking if post is safe for Instagram: "${post.rewrittenTitle}"`)

  const result = {
    isSafe: true,
    reason: null,
    moderationFlags: {},
    imageAnalysis: {},
    recommendations: [],
  }

  // Combine title and excerpt for text moderation
  const contentToCheck = `${post.rewrittenTitle}\n\n${post.excerpt || ''}`

  // 1. OpenAI Text Moderation
  const aiModeration = await moderateWithOpenAI(contentToCheck)
  result.moderationFlags = aiModeration

  if (aiModeration.flagged) {
    const flaggedCategories = Object.entries(aiModeration.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category)

    // Instagram is stricter - block more categories
    const criticalCategories = [
      'violence/graphic',
      'violence',
      'sexual',
      'sexual/minors',
      'hate',
      'self-harm',
      'self-harm/intent',
      'self-harm/instructions'
    ]

    const hasCriticalViolation = flaggedCategories.some(cat =>
      criticalCategories.some(critical => cat.includes(critical))
    )

    if (hasCriticalViolation) {
      result.isSafe = false
      result.reason = `OpenAI flagged for: ${flaggedCategories.join(', ')}`
      console.log(`[Moderation] ❌ Instagram Post BLOCKED - ${result.reason}`)
      return result
    }
  }

  // 2. IMAGE ANALYSIS (Critical for Instagram - they're strict!)
  if (post.imageLink && post.imageLink.trim() !== '') {
    console.log('[Moderation] Analyzing image for Instagram policies...')
    const imageAnalysis = await analyzeImageForInstagram(post.imageLink)
    result.imageAnalysis = imageAnalysis

    // Instagram is stricter - block medium severity too
    if (!imageAnalysis.isSafe || imageAnalysis.severity === 'medium' || imageAnalysis.severity === 'high') {
      result.isSafe = false
      result.reason = `Instagram image policy: ${imageAnalysis.reasoning} (Violations: ${imageAnalysis.violations?.join(', ') || 'unknown'})`
      console.log(`[Moderation] ❌ Instagram Post BLOCKED - ${result.reason}`)
      return result
    }

    console.log(`[Moderation] ✅ Image is safe for Instagram: ${imageAnalysis.reasoning}`)
  } else {
    // Instagram REQUIRES an image - can't post without one
    result.isSafe = false
    result.reason = 'No image - Instagram posts require an image'
    console.log(`[Moderation] ❌ Instagram Post BLOCKED - No image`)
    return result
  }

  // 3. Content quality checks
  if (!post.rewrittenTitle || post.rewrittenTitle.length < 10) {
    result.isSafe = false
    result.reason = 'Title too short or missing'
    console.log(`[Moderation] ❌ Instagram Post BLOCKED - Invalid title`)
    return result
  }

  // 4. Instagram caption length check (max 2200 characters)
  const caption = `${post.rewrittenTitle}\n\n${post.excerpt || ''}`
  if (caption.length > 2200) {
    result.recommendations.push('Caption will be truncated (Instagram max: 2200 chars)')
    console.log(`[Moderation] ⚠️ Caption too long, will be truncated`)
  }

  if (result.isSafe) {
    console.log(`[Moderation] ✅ Post is SAFE for Instagram`)
  }

  return result
}
