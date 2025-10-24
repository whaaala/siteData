import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN

/**
 * Posts a link to a Facebook page
 * @param {Object} postData
 * @param {string} postData.link - The WordPress post URL
 * @param {string} postData.message - Optional message/caption for the post
 * @returns {Object} Facebook post response with post ID
 */
export async function postToFacebook({ link, message }) {
  if (!FACEBOOK_PAGE_ID || !FACEBOOK_ACCESS_TOKEN) {
    console.error(
      '[Facebook] Missing FACEBOOK_PAGE_ID or FACEBOOK_ACCESS_TOKEN in environment variables'
    )
    return null
  }

  try {
    console.log(`[Facebook] Posting link to Facebook page: ${link}`)

    // Facebook Graph API endpoint for posting to a page feed
    const url = `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/feed`

    const response = await axios.post(url, {
      link: link,
      message: message || '',
      access_token: FACEBOOK_ACCESS_TOKEN,
    })

    if (response.data && response.data.id) {
      console.log(`[Facebook] Successfully posted to Facebook. Post ID: ${response.data.id}`)
      return {
        success: true,
        postId: response.data.id,
      }
    }

    return null
  } catch (error) {
    console.error('[Facebook] Error posting to Facebook:', error.response?.data || error.message)

    // Log specific error details
    if (error.response?.data?.error) {
      console.error('[Facebook] Error details:', {
        message: error.response.data.error.message,
        type: error.response.data.error.type,
        code: error.response.data.error.code,
      })
    }

    return null
  }
}

/**
 * Posts a photo with caption to Facebook page
 * @param {Object} postData
 * @param {string} postData.imageUrl - The image URL to post
 * @param {string} postData.message - Caption for the photo
 * @param {string} postData.link - WordPress link (included in caption)
 * @param {string} [postData.pageId] - Optional: Facebook page ID (uses env var if not provided)
 * @param {string} [postData.accessToken] - Optional: Access token (uses env var if not provided)
 * @param {string} [postData.pageName] - Optional: Page name for logging
 * @returns {Object} Facebook post response with post ID
 */
export async function postPhotoToFacebook({ imageUrl, message, link, pageId, accessToken, pageName }) {
  // Use custom credentials or fall back to environment variables
  const fbPageId = pageId || FACEBOOK_PAGE_ID
  const fbAccessToken = accessToken || FACEBOOK_ACCESS_TOKEN
  const fbPageName = pageName || 'Facebook'

  if (!fbPageId || !fbAccessToken) {
    console.error(
      '[Facebook] Missing FACEBOOK_PAGE_ID or FACEBOOK_ACCESS_TOKEN'
    )
    return null
  }

  try {
    console.log(`[Facebook] Posting photo to ${fbPageName}: ${imageUrl}`)

    // Post as a photo with caption
    // The message already contains the link and excerpt formatted properly
    const url = `https://graph.facebook.com/v18.0/${fbPageId}/photos`

    const response = await axios.post(url, {
      url: imageUrl, // Direct image URL
      caption: message || '', // Message already contains link + excerpt
      access_token: fbAccessToken,
    })

    if (response.data && response.data.id) {
      console.log(`[Facebook] Successfully posted photo to ${fbPageName}. Post ID: ${response.data.id}`)
      return {
        success: true,
        postId: response.data.id,
        pageName: fbPageName,
        pageId: fbPageId,
      }
    }

    return null
  } catch (error) {
    console.error('[Facebook] Error posting photo to Facebook:', error.response?.data || error.message)

    if (error.response?.data?.error) {
      console.error('[Facebook] Error details:', {
        message: error.response.data.error.message,
        type: error.response.data.error.type,
        code: error.response.data.error.code,
      })
    }

    return null
  }
}

/**
 * Verifies that the Facebook access token is valid
 * @returns {boolean} True if token is valid
 */
export async function verifyFacebookToken() {
  if (!FACEBOOK_ACCESS_TOKEN) {
    console.error('[Facebook] FACEBOOK_ACCESS_TOKEN not found in environment variables')
    return false
  }

  try {
    const url = `https://graph.facebook.com/v18.0/me?access_token=${FACEBOOK_ACCESS_TOKEN}`
    const response = await axios.get(url)

    if (response.data && response.data.id) {
      console.log(`[Facebook] Token is valid. Connected as: ${response.data.name || response.data.id}`)
      return true
    }

    return false
  } catch (error) {
    console.error('[Facebook] Token verification failed:', error.response?.data || error.message)
    return false
  }
}
