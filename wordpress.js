import sharp from 'sharp';
import fetch from 'node-fetch';
import path from 'path';

/**
 * Download an image from a URL and upload it to WordPress media library.
 * Returns the WordPress media ID if successful, or null if failed.
 */
export async function uploadImageToWordpress(imageUrl, wordpressUrl, username, password) {
  // Download the image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    console.error(`Failed to download image: ${imageResponse.statusText}`);
    return null;
  }
  let imageBuffer = await imageResponse.buffer();
  let fileName = imageUrl.split('/').pop().split('?')[0] || 'image.jpg';
  let contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

  // Convert unsupported types to jpeg
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(contentType)) {
    imageBuffer = await sharp(imageBuffer).jpeg().toBuffer();
    fileName = path.parse(fileName).name + '.jpg';
    contentType = 'image/jpeg';
  }

  // Upload to WordPress
  const mediaResponse = await fetch(`${wordpressUrl}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': contentType
    },
    body: imageBuffer
  });

  if (!mediaResponse.ok) {
    const errorText = await mediaResponse.text();
    console.error(`Failed to upload image to WordPress: ${mediaResponse.statusText}\n${errorText}`);
    return null;
  }
  const mediaData = await mediaResponse.json();
  return mediaData.id;
}

/**
 * Post content to WordPress using the REST API.
 * Adds the main image at the top of the content if available.
 */
export async function postToWordpress(post, featuredMediaId, wordpressUrl, username, password, imageUrl) {
  // Add main image to content HTML if available
  let contentHtml = '';
  if (imageUrl) {
    contentHtml += `<img src="${imageUrl}" alt="${post.title}" style="max-width:100%;height:auto;" /><br/>`;
  }
  contentHtml += Array.isArray(post.postDetails) ? post.postDetails.join('\n') : post.postDetails;

  const body = {
    title: post.title,
    content: contentHtml,
    status: 'publish',
    categories: post.categories || [],
    author: post.author || undefined,
    excerpt: post.excerpt,
    featured_media: featuredMediaId || undefined,
    format: 'standard',
    meta: { is_featured: post.is_featured || false }
  };

  const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to upload post to WordPress: ${response.statusText}\n${errorText}`);
    return null;
  }
  const postData = await response.json();
  return postData;
}