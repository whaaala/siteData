import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

/**
 * Posts an image with caption to Instagram
 *
 * Instagram Graph API requires a 2-step process:
 * 1. Create a media container (prepare the post)
 * 2. Publish the media container
 *
 * @param {Object} postData
 * @param {string} postData.imageUrl - The image URL to post
 * @param {string} postData.caption - Caption for the photo (max 2200 characters)
 * @returns {Object} Instagram post response with post ID
 */
export async function postPhotoToInstagram({ imageUrl, caption }) {
  if (!INSTAGRAM_ACCOUNT_ID || !INSTAGRAM_ACCESS_TOKEN) {
    console.error(
      '[Instagram] Missing INSTAGRAM_ACCOUNT_ID or INSTAGRAM_ACCESS_TOKEN in environment variables'
    )
    return null
  }

  try {
    // Instagram caption limit is 2200 characters
    const finalCaption = caption.length > 2200
      ? caption.substring(0, 2197) + '...'
      : caption

    console.log(`[Instagram] Creating media container for image: ${imageUrl}`)

    // Step 1: Create a media container
    const createUrl = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media`

    const createResponse = await axios.post(createUrl, {
      image_url: imageUrl,
      caption: finalCaption,
      access_token: INSTAGRAM_ACCESS_TOKEN,
    })

    if (!createResponse.data || !createResponse.data.id) {
      console.error('[Instagram] Failed to create media container')
      return null
    }

    const mediaContainerId = createResponse.data.id
    console.log(`[Instagram] Media container created: ${mediaContainerId}`)

    // Step 2: Wait for media container to be ready
    const isReady = await waitForMediaContainer(mediaContainerId, 10, 2000)

    if (!isReady) {
      console.error('[Instagram] Media container not ready, cannot publish')
      return null
    }

    // Step 3: Publish the media container
    console.log(`[Instagram] Publishing media container...`)

    const publishUrl = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`

    const publishResponse = await axios.post(publishUrl, {
      creation_id: mediaContainerId,
      access_token: INSTAGRAM_ACCESS_TOKEN,
    })

    if (publishResponse.data && publishResponse.data.id) {
      console.log(`[Instagram] Successfully posted to Instagram. Post ID: ${publishResponse.data.id}`)
      return {
        success: true,
        postId: publishResponse.data.id,
      }
    }

    return null
  } catch (error) {
    console.error('[Instagram] Error posting to Instagram:', error.response?.data || error.message)

    // Log specific error details
    if (error.response?.data?.error) {
      console.error('[Instagram] Error details:', {
        message: error.response.data.error.message,
        type: error.response.data.error.type,
        code: error.response.data.error.code,
      })
    }

    return null
  }
}

/**
 * Checks if a media container is ready to be published
 * @param {string} mediaContainerId - The media container ID to check
 * @returns {Promise<boolean>} True if ready, false otherwise
 */
async function isMediaContainerReady(mediaContainerId) {
  try {
    const statusUrl = `https://graph.facebook.com/v18.0/${mediaContainerId}?fields=status_code&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    const response = await axios.get(statusUrl)

    // Status codes: EXPIRED, ERROR, FINISHED, IN_PROGRESS, PUBLISHED
    const status = response.data?.status_code

    if (status === 'FINISHED') {
      return true
    } else if (status === 'ERROR' || status === 'EXPIRED') {
      console.error(`[Instagram Story] Container status: ${status}`)
      return false
    }

    // Still processing (IN_PROGRESS)
    return false
  } catch (error) {
    console.error('[Instagram Story] Error checking container status:', error.message)
    return false
  }
}

/**
 * Waits for media container to be ready, with polling
 * @param {string} mediaContainerId - The media container ID
 * @param {number} maxAttempts - Maximum polling attempts (default: 10)
 * @param {number} delayMs - Delay between attempts in milliseconds (default: 2000)
 * @returns {Promise<boolean>} True if ready, false if timeout or error
 */
async function waitForMediaContainer(mediaContainerId, maxAttempts = 10, delayMs = 2000) {
  console.log(`[Instagram Story] Waiting for media container to process...`)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isReady = await isMediaContainerReady(mediaContainerId)

    if (isReady) {
      console.log(`[Instagram Story] ✅ Media container ready after ${attempt} attempt(s)`)
      return true
    }

    if (attempt < maxAttempts) {
      console.log(`[Instagram Story] Container not ready yet, waiting ${delayMs / 1000}s... (attempt ${attempt}/${maxAttempts})`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  console.error(`[Instagram Story] ❌ Timeout: Media container not ready after ${maxAttempts} attempts`)
  return false
}

/**
 * Posts an image with clickable link to Instagram Stories
 *
 * Instagram Stories support clickable link stickers via the API.
 * Stories disappear after 24 hours but provide immediate clickable traffic.
 *
 * @param {Object} storyData
 * @param {string} storyData.imageUrl - The image URL to post
 * @param {string} storyData.link - Clickable URL (shows as link sticker)
 * @returns {Object} Instagram story response with story ID
 */
export async function postStoryToInstagram({ imageUrl, link }) {
  if (!INSTAGRAM_ACCOUNT_ID || !INSTAGRAM_ACCESS_TOKEN) {
    console.error(
      '[Instagram Story] Missing INSTAGRAM_ACCOUNT_ID or INSTAGRAM_ACCESS_TOKEN in environment variables'
    )
    return null
  }

  try {
    console.log(`[Instagram Story] Creating story with clickable link: ${link}`)

    // Step 1: Create a story media container with link sticker
    const createUrl = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media`

    const createResponse = await axios.post(createUrl, {
      image_url: imageUrl,
      media_type: 'STORIES', // Specify this is a story, not a feed post
      link: link, // This creates a clickable link sticker
      access_token: INSTAGRAM_ACCESS_TOKEN,
    })

    if (!createResponse.data || !createResponse.data.id) {
      console.error('[Instagram Story] Failed to create story media container')
      return null
    }

    const mediaContainerId = createResponse.data.id
    console.log(`[Instagram Story] Story container created: ${mediaContainerId}`)

    // Step 2: Wait for media container to be ready
    const isReady = await waitForMediaContainer(mediaContainerId, 10, 2000)

    if (!isReady) {
      console.error('[Instagram Story] Media container not ready, cannot publish')
      return null
    }

    // Step 3: Publish the story
    console.log(`[Instagram Story] Publishing story...`)

    const publishUrl = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`

    const publishResponse = await axios.post(publishUrl, {
      creation_id: mediaContainerId,
      access_token: INSTAGRAM_ACCESS_TOKEN,
    })

    if (publishResponse.data && publishResponse.data.id) {
      console.log(`[Instagram Story] Successfully posted story. Story ID: ${publishResponse.data.id}`)
      return {
        success: true,
        storyId: publishResponse.data.id,
      }
    }

    return null
  } catch (error) {
    console.error('[Instagram Story] Error posting story:', error.response?.data || error.message)

    // Log specific error details
    if (error.response?.data?.error) {
      console.error('[Instagram Story] Error details:', {
        message: error.response.data.error.message,
        type: error.response.data.error.type,
        code: error.response.data.error.code,
      })
    }

    return null
  }
}

/**
 * Verifies that the Instagram access token is valid
 * @returns {boolean} True if token is valid
 */
export async function verifyInstagramToken() {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
    console.error('[Instagram] INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID not found in environment variables')
    return false
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}?fields=id,username&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    const response = await axios.get(url)

    if (response.data && response.data.id) {
      console.log(`[Instagram] Token is valid. Connected as: @${response.data.username || response.data.id}`)
      return true
    }

    return false
  } catch (error) {
    console.error('[Instagram] Token verification failed:', error.response?.data || error.message)
    return false
  }
}
