import sharp from 'sharp'
import fetch from 'node-fetch'
import path from 'path'
import axios from 'axios'

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

/**
 * Download an image from a URL and upload it to WordPress media library.
 * Returns the WordPress media ID if successful, or null if failed.
 */
export async function uploadImageToWordpress(
  imageUrl,
  wordpressUrl,
  username,
  password
) {
  try {
    // Download the image
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error('Failed to fetch image')
    const buffer = await response.buffer()
    const fileName = imageUrl.split('/').pop().split('?')[0] || 'image.jpg'

    // Upload to WordPress
    const uploadUrl = `${wordpressUrl}/wp-json/wp/v2/media`
    console.log('[DEBUG] Uploading image to WordPress URL:', uploadUrl)
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' + Buffer.from(username + ':' + password).toString('base64'),
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'image/jpeg',
      },
      body: buffer,
    })
    if (!uploadRes.ok) throw new Error('Failed to upload image to WordPress')
    const data = await uploadRes.json()
    return data.id // This is the media ID
  } catch (err) {
    console.error('[WordPress Image Upload] Error:', err)
    return null
  }
}
/**
 * Post content to WordPress using the REST API.
 * Adds the main image at the top of the content if available.
 */
export async function postToWordpress(
  post,
  featuredMediaId,
  wordpressUrl,
  username,
  password,
  imageUrl
) {
  // Add main image to content HTML if available
  let contentHtml = ''
  if (imageUrl) {
    contentHtml += `<img src="${imageUrl}" alt="${post.title}" style="max-width:100%;height:auto;" /><br/>`
  }
  contentHtml += Array.isArray(post.postDetails)
    ? post.postDetails.join('\n')
    : post.postDetails

  const body = {
    title: post.title,
    content: contentHtml,
    status: 'publish',
    categories: post.categories || [],
    author: post.author || undefined,
    excerpt: post.excerpt,
    featured_media: featuredMediaId || undefined,
    format: 'standard',
    meta: { is_featured: post.is_featured || false },
  }

  const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(
      `Failed to upload post to WordPress: ${response.statusText}\n${errorText}`
    )
    return null
  }
  const postData = await response.json()
  return postData
}

export async function wordpressPostExists(
  title,
  imageUrl,
  wordpressUrl,
  username,
  password
) {
  // Check by slug (exact title match)
  const slug = slugify(title)
  const slugRes = await axios.get(
    `${wordpressUrl}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}`,
    { auth: { username, password } }
  )
  if (slugRes.data && slugRes.data.length > 0) return true

  // Check by image URL (featured media)
  const imgRes = await axios.get(
    `${wordpressUrl}/wp-json/wp/v2/media?search=${encodeURIComponent(
      imageUrl
    )}`,
    { auth: { username, password } }
  )
  if (imgRes.data && imgRes.data.length > 0) {
    for (const media of imgRes.data) {
      const postsRes = await axios.get(
        `${wordpressUrl}/wp-json/wp/v2/posts?featured_media=${media.id}`,
        { auth: { username, password } }
      )
      if (postsRes.data && postsRes.data.length > 0) return true
    }
  }

  return false
}

export async function areContentsSimilar(content1, content2) {
  // Normalize: lowercase, remove punctuation and extra spaces
  const clean = (str) =>
    str
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
  const c1 = clean(content1)
  const c2 = clean(content2)

  // Substring check
  if (c1.includes(c2) || c2.includes(c1)) return true

  // Levenshtein distance (basic implementation)
  function levenshtein(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i])
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    return matrix[b.length][a.length]
  }

  const distance = levenshtein(c1, c2)
  const threshold = Math.floor(Math.max(c1.length, c2.length) * 0.2) // 20% difference allowed
  return distance <= threshold
}

export async function uploadBufferToWordpress(
  buffer,
  filename,
  wordpressUrl,
  username,
  password
) {
  const uploadUrl = `${wordpressUrl}/wp-json/wp/v2/media`
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' + Buffer.from(username + ':' + password).toString('base64'),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'image/jpeg',
    },
    body: buffer,
  })
  if (!uploadRes.ok) throw new Error('Failed to upload image to WordPress')
  const data = await uploadRes.json()
  return data // or data.source_url if you want the URL
}
