import { TwitterApi } from 'twitter-api-v2'
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

dotenv.config()

// X (Twitter) API v2 credentials
const X_API_KEY = process.env.X_API_KEY
const X_API_SECRET = process.env.X_API_SECRET
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN
const X_ACCESS_SECRET = process.env.X_ACCESS_SECRET

// Initialize Twitter API client
let xClient = null

function initializeXClient() {
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
    console.error(
      '[X] Missing X API credentials in environment variables. ' +
      'Required: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET'
    )
    return null
  }

  if (!xClient) {
    xClient = new TwitterApi({
      appKey: X_API_KEY,
      appSecret: X_API_SECRET,
      accessToken: X_ACCESS_TOKEN,
      accessSecret: X_ACCESS_SECRET,
    })
  }

  return xClient
}

/**
 * Downloads an image to a temporary file for X upload
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<string>} - Path to downloaded file
 */
async function downloadImageForX(imageUrl) {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const tempPath = path.join(process.cwd(), `temp-x-image-${Date.now()}.jpg`)

  fs.writeFileSync(tempPath, buffer)

  return tempPath
}

/**
 * Posts a tweet with an image to X (Twitter)
 *
 * X (Twitter) API requirements:
 * - Text: 280 characters max (4000 for X Premium)
 * - Images: JPG, PNG, GIF, WEBP (max 5MB)
 * - Can include up to 4 images per tweet
 *
 * @param {Object} postData
 * @param {string} postData.imageUrl - The image URL to post
 * @param {string} postData.text - Tweet text (max 280 characters)
 * @param {string} [postData.link] - Optional link to include
 * @returns {Promise<Object>} X post response with tweet ID
 */
export async function postToX({ imageUrl, text, link }) {
  const client = initializeXClient()

  if (!client) {
    console.error('[X] X client not initialized. Check API credentials.')
    return null
  }

  try {
    // X has a 280 character limit (4000 for X Premium, but we'll use 280 for compatibility)
    const MAX_LENGTH = 280

    // Format tweet text
    let tweetText = text

    // If link is provided and we have room, add it
    if (link) {
      // X auto-shortens links to 23 characters
      const linkLength = 23
      const availableLength = MAX_LENGTH - linkLength - 3 // -3 for "... "

      if (tweetText.length > availableLength) {
        tweetText = tweetText.substring(0, availableLength - 3) + '...'
      }

      tweetText += `\n\n${link}`
    } else {
      // No link, just truncate if too long
      if (tweetText.length > MAX_LENGTH) {
        tweetText = tweetText.substring(0, MAX_LENGTH - 3) + '...'
      }
    }

    console.log(`[X] Tweet text (${tweetText.length} chars): ${tweetText.substring(0, 100)}...`)

    if (!imageUrl) {
      // Post text-only tweet
      console.log('[X] Posting text-only tweet...')
      const tweet = await client.v2.tweet(tweetText)

      return {
        success: true,
        tweetId: tweet.data.id,
        text: tweet.data.text,
      }
    }

    // Download image temporarily
    console.log(`[X] Downloading image: ${imageUrl}`)
    const imagePath = await downloadImageForX(imageUrl)

    try {
      // Upload media to X
      console.log('[X] Uploading media to X...')
      const mediaId = await client.v1.uploadMedia(imagePath)
      console.log(`[X] Media uploaded. Media ID: ${mediaId}`)

      // Post tweet with media
      console.log('[X] Posting tweet with image...')
      const tweet = await client.v2.tweet(tweetText, {
        media: { media_ids: [mediaId] }
      })

      console.log(`[X] Successfully posted to X. Tweet ID: ${tweet.data.id}`)

      // Clean up temp file
      fs.unlinkSync(imagePath)

      return {
        success: true,
        tweetId: tweet.data.id,
        text: tweet.data.text,
      }

    } catch (uploadError) {
      // Clean up temp file on error
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
      throw uploadError
    }

  } catch (error) {
    console.error('[X] Error posting to X:', error.message)

    // Log specific error details
    if (error.data) {
      console.error('[X] Error details:', {
        title: error.data.title,
        detail: error.data.detail,
        type: error.data.type,
      })
    }

    return null
  }
}

/**
 * Verifies that X API credentials are valid
 * @returns {Promise<boolean>} True if credentials are valid
 */
export async function verifyXCredentials() {
  const client = initializeXClient()

  if (!client) {
    console.error('[X] X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, or X_ACCESS_SECRET not found in environment variables')
    return false
  }

  try {
    // Try to get authenticated user info
    const user = await client.v2.me()

    if (user && user.data) {
      console.log(`[X] Credentials are valid. Connected as: @${user.data.username} (${user.data.name})`)
      return true
    }

    return false
  } catch (error) {
    console.error('[X] Credential verification failed:', error.message)
    return false
  }
}

/**
 * Formats text for X with proper length and link handling
 * @param {string} title - Post title
 * @param {string} excerpt - Post excerpt
 * @param {string} link - WordPress post link
 * @returns {string} Formatted tweet text
 */
export function formatTweetText(title, excerpt, link) {
  const MAX_LENGTH = 280
  const LINK_LENGTH = 23 // X auto-shortens links to 23 chars

  // Calculate available space: total - link - newlines
  const availableSpace = MAX_LENGTH - LINK_LENGTH - 4 // -4 for "\n\n" and "..."

  let tweetText = ''

  // Start with title
  if (title) {
    if (title.length <= availableSpace) {
      tweetText = title
    } else {
      tweetText = title.substring(0, availableSpace - 3) + '...'
    }
  }

  // Try to add excerpt if there's room
  if (excerpt && tweetText.length < availableSpace - 20) {
    const cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').trim()
    const remainingSpace = availableSpace - tweetText.length - 2 // -2 for "\n\n"

    if (cleanExcerpt.length <= remainingSpace) {
      tweetText += `\n\n${cleanExcerpt}`
    } else if (remainingSpace > 20) {
      // Only add excerpt if we have at least 20 chars of space
      tweetText += `\n\n${cleanExcerpt.substring(0, remainingSpace - 3)}...`
    }
  }

  // Add link
  tweetText += `\n\n${link}`

  return tweetText
}
