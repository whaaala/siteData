// Excerpt generator
export function getExcerpt(htmlContent, wordCount = 30) {
  const text = htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').slice(0, wordCount).join(' ') + '...';
}

// Patterns for site name replacement
export const siteNamePatterns = [
  /\bDaily\s*Post\b/gi,
  /\bDAILY\s*POST\b/gi,
  /\bDAILYPOST\b/gi,
  /\bLeadership\b/gi,
  /\bLEADERSHIP\b/gi,
  /\bGistlover\b/gi,
  /\bGISTLOVER\b/gi
];

// Replace site names in visible text only
export function replaceSiteNamesOutsideTags(html) {
  return html.split(/(<[^>]+>)/g).map((part, i) => {
    if (i % 2 === 0) {
      siteNamePatterns.forEach(pattern => {
        part = part.replace(pattern, 'NOWAHALAZONE');
      });
    }
    return part;
  }).join('');
}

// Replace site names in an array of HTML contents
export function replaceSiteNamesInPostDetails(postDetails) {
  return postDetails.map(htmlContent => replaceSiteNamesOutsideTags(htmlContent));
}

// Save new post to MongoDB
export async function saveNewPostToDb(Post, postData) {
  const postDoc = new Post(postData);
  await postDoc.save();
  return postDoc;
}

// In utils.js
export function normalizeString(str) {
  return str ? str.trim().toLowerCase() : '';
}