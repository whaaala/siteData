import sharp from 'sharp'
import fetch from 'node-fetch'

/**
 * Instagram aspect ratio requirements:
 * - Minimum width: 320px
 * - Square: 1:1 (1080x1080 recommended)
 * - Portrait: 4:5 max (1080x1350 recommended)
 * - Landscape: 1.91:1 max (1080x566 recommended)
 */

const INSTAGRAM_CONSTRAINTS = {
  MIN_WIDTH: 320,
  MIN_HEIGHT: 320,
  MAX_WIDTH: 1080,
  MAX_HEIGHT: 1350,
  SQUARE: 1.0, // 1:1
  PORTRAIT_MAX: 0.8, // 4:5 = 0.8
  LANDSCAPE_MAX: 1.91, // 1.91:1
}

/**
 * Validates if an image meets Instagram's requirements
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {{ valid: boolean, aspectRatio: number, reason: string }}
 */
function validateInstagramAspectRatio(width, height) {
  const aspectRatio = width / height

  if (width < INSTAGRAM_CONSTRAINTS.MIN_WIDTH || height < INSTAGRAM_CONSTRAINTS.MIN_HEIGHT) {
    return {
      valid: false,
      aspectRatio,
      reason: `Image too small (${width}x${height}). Minimum: ${INSTAGRAM_CONSTRAINTS.MIN_WIDTH}x${INSTAGRAM_CONSTRAINTS.MIN_HEIGHT}`
    }
  }

  // Check if aspect ratio is within Instagram's limits
  // Portrait: width/height should be >= 0.8 (4:5)
  // Landscape: width/height should be <= 1.91
  if (aspectRatio < INSTAGRAM_CONSTRAINTS.PORTRAIT_MAX) {
    return {
      valid: false,
      aspectRatio,
      reason: `Too tall (aspect ratio: ${aspectRatio.toFixed(2)}). Max portrait: 4:5 (0.8)`
    }
  }

  if (aspectRatio > INSTAGRAM_CONSTRAINTS.LANDSCAPE_MAX) {
    return {
      valid: false,
      aspectRatio,
      reason: `Too wide (aspect ratio: ${aspectRatio.toFixed(2)}). Max landscape: 1.91:1`
    }
  }

  return {
    valid: true,
    aspectRatio,
    reason: 'Valid for Instagram'
  }
}

/**
 * Resizes and crops an image to fit Instagram's requirements
 * Defaults to square (1:1) for best compatibility
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {string} targetAspect - 'square', 'portrait', or 'landscape'
 * @returns {Promise<Buffer>} - Resized image buffer
 */
async function resizeForInstagram(imageBuffer, targetAspect = 'square') {
  const image = sharp(imageBuffer)
  const metadata = await image.metadata()

  console.log(`[Instagram Resize] Original: ${metadata.width}x${metadata.height}`)

  let targetWidth, targetHeight

  switch (targetAspect) {
    case 'square':
      // 1:1 - 1080x1080 (Instagram's recommended square)
      targetWidth = 1080
      targetHeight = 1080
      break

    case 'portrait':
      // 4:5 - 1080x1350 (Instagram's recommended portrait)
      targetWidth = 1080
      targetHeight = 1350
      break

    case 'landscape':
      // 1.91:1 - 1080x566 (Instagram's recommended landscape)
      targetWidth = 1080
      targetHeight = 566
      break

    default:
      // Default to square
      targetWidth = 1080
      targetHeight = 1080
  }

  // Resize and crop from center
  const resizedBuffer = await image
    .resize(targetWidth, targetHeight, {
      fit: 'cover', // Crop to fit
      position: 'center' // Crop from center
    })
    .jpeg({
      quality: 90,
      progressive: true,
      mozjpeg: true
    })
    .toBuffer()

  console.log(`[Instagram Resize] Resized to: ${targetWidth}x${targetHeight} (${targetAspect})`)

  return resizedBuffer
}

/**
 * Prepares an image for Instagram by downloading, validating, and resizing if needed
 * @param {string} imageUrl - URL of the image to prepare
 * @returns {Promise<{ buffer: Buffer, width: number, height: number, aspectRatio: number, wasResized: boolean }>}
 */
export async function prepareImageForInstagram(imageUrl) {
  console.log(`[Instagram Image Prep] Processing: ${imageUrl}`)

  // Download image
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer())

  // Check current dimensions
  const image = sharp(imageBuffer)
  const metadata = await image.metadata()

  console.log(`[Instagram Image Prep] Original dimensions: ${metadata.width}x${metadata.height}`)

  // Validate aspect ratio
  const validation = validateInstagramAspectRatio(metadata.width, metadata.height)
  const aspectRatio = metadata.width / metadata.height

  console.log(`[Instagram Image Prep] Aspect ratio: ${aspectRatio.toFixed(2)} - ${validation.reason}`)

  if (validation.valid) {
    // Image is already valid, just optimize it
    console.log(`[Instagram Image Prep] ✅ Image already valid, optimizing...`)

    const optimizedBuffer = await sharp(imageBuffer)
      .jpeg({
        quality: 90,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer()

    return {
      buffer: optimizedBuffer,
      width: metadata.width,
      height: metadata.height,
      aspectRatio,
      wasResized: false
    }
  }

  // Image needs resizing - determine best target aspect
  console.log(`[Instagram Image Prep] ⚠️ Invalid aspect ratio, resizing...`)

  let targetAspect = 'square' // Default to square for maximum compatibility

  // Choose best aspect based on original
  if (aspectRatio >= 0.8 && aspectRatio <= 1.2) {
    // Close to square, make it square
    targetAspect = 'square'
  } else if (aspectRatio < 0.8) {
    // Too tall, use portrait
    targetAspect = 'portrait'
  } else if (aspectRatio > 1.2 && aspectRatio <= 1.91) {
    // Wide but not too wide, use landscape
    targetAspect = 'landscape'
  } else {
    // Too wide, default to square to avoid losing too much content
    targetAspect = 'square'
  }

  const resizedBuffer = await resizeForInstagram(imageBuffer, targetAspect)

  // Get new dimensions
  const resizedMetadata = await sharp(resizedBuffer).metadata()

  return {
    buffer: resizedBuffer,
    width: resizedMetadata.width,
    height: resizedMetadata.height,
    aspectRatio: resizedMetadata.width / resizedMetadata.height,
    wasResized: true
  }
}

/**
 * Uploads a prepared image buffer to WordPress and returns the new URL
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - Original filename
 * @param {string} wordpressUrl - WordPress site URL
 * @param {string} username - WordPress username
 * @param {string} password - WordPress password
 * @returns {Promise<string>} - WordPress image URL
 */
export async function uploadInstagramImageToWordPress(buffer, filename, wordpressUrl, username, password) {
  // Import the WordPress upload function
  const { uploadBufferToWordpress } = await import('./wordpress.js')

  // Generate a unique filename for the Instagram version
  const instagramFilename = filename.replace(/\.(jpg|jpeg|png)$/i, '-instagram.jpg')

  const media = await uploadBufferToWordpress(
    buffer,
    instagramFilename,
    wordpressUrl,
    username,
    password
  )

  if (!media || !media.source_url) {
    throw new Error('Failed to upload Instagram-optimized image to WordPress')
  }

  console.log(`[Instagram Image Prep] ✅ Uploaded to WordPress: ${media.source_url}`)

  return media.source_url
}
