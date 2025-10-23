/**
 * Test lazy-loading image fix
 */

import { load } from 'cheerio'

console.log('=== Testing Lazy-Loading Image Detection ===\n')

// Test HTML with lazy-loaded images (from yabaleftonline)
const testHtml = `
<div class="content">
  <img src="//www.yabaleftonline.ng/wp-content/plugins/a3-lazy-load/assets/images/lazy_placeholder.gif"
       data-src="https://www.yabaleftonline.ng/wp-content/uploads/2025/10/image1.jpg"
       class="lazy-hidden" />

  <img src="https://example.com/regular-image.jpg" />

  <img src="data:image/svg+xml,%3Csvg..."
       data-src="https://example.com/lazy-svg.jpg" />

  <img data-src="https://example.com/no-src-attribute.jpg" />
</div>
`

const $ = load(testHtml)
const imgTags = $('img')

console.log(`Found ${imgTags.length} images\n`)

for (let i = 0; i < imgTags.length; i++) {
  const img = imgTags[i]
  let src = $(img).attr('src')

  console.log(`Image ${i + 1}:`)
  console.log(`  Original src: ${src || 'NO SRC'}`)
  console.log(`  data-src: ${$(img).attr('data-src') || 'none'}`)

  // Apply the fix logic
  const isPlaceholder = src && (
    src.includes('lazy_placeholder') ||
    src.includes('placeholder.gif') ||
    src.includes('placeholder.png') ||
    src.includes('lazy-load') ||
    src.startsWith('data:image/svg')
  )

  if (!src || src.startsWith('data:') || isPlaceholder) {
    const lazySrc = $(img).attr('data-src') || $(img).attr('data-lazy-src')
    if (lazySrc) {
      console.log(`  ✅ LAZY-LOADED DETECTED: Will use data-src: ${lazySrc}`)
      src = lazySrc
    }
  }

  console.log(`  Final src to use: ${src}`)
  console.log()
}

console.log('=== Test Complete ===\n')
console.log('Expected results:')
console.log('  Image 1: Should use data-src (lazy_placeholder detected) ✅')
console.log('  Image 2: Should use original src (regular image) ✅')
console.log('  Image 3: Should use data-src (data URI detected) ✅')
console.log('  Image 4: Should use data-src (no src attribute) ✅')
