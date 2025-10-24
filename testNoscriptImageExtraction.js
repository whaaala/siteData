/**
 * Test noscript image extraction
 */

import { load } from 'cheerio'

console.log('=== Testing Noscript Image Extraction ===\n')

// Sample HTML with noscript images (from yabaleft)
const testHtml = `
<p>Some text before the image.</p>

<noscript>
  <img fetchpriority="high" decoding="async" class="alignnone size-full wp-image-896757" src="https://www.yabaleftonline.ng/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-16-at-10.30.42-AM.jpeg" alt="" width="715" height="717" srcset="https://www.yabaleftonline.ng/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-16-at-10.30.42-AM.jpeg 715w, https://www.yabaleftonline.ng/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-16-at-10.30.42-AM-300x300.jpeg 300w" sizes="(max-width: 715px) 100vw, 715px" />
</noscript>

<p>Some text after the image.</p>

<noscript>
  <img decoding="async" class="alignnone size-full wp-image-896759" src="https://www.yabaleftonline.ng/wp-content/uploads/2025/10/Screenshot-2025-10-16-102058.jpg" alt="" width="1042" height="454" />
</noscript>

<p>End of content.</p>
`

console.log('BEFORE extraction:')
console.log('─'.repeat(80))
console.log(testHtml)
console.log('─'.repeat(80))
console.log()

// Simulate the fix
const $ = load(testHtml)

// Extract images from noscript tags
$('noscript').each(function () {
  const noscriptContent = $(this).html()
  if (noscriptContent && noscriptContent.includes('<img')) {
    // Parse the noscript content to extract the img tag
    const $noscript = load(noscriptContent)
    const imgEl = $noscript('img').first()

    if (imgEl.length) {
      // Replace the noscript tag with the actual img tag
      $(this).replaceWith(imgEl.toString())
    }
  }
})

const processedHtml = $.html()

console.log('AFTER extraction:')
console.log('─'.repeat(80))
console.log(processedHtml)
console.log('─'.repeat(80))
console.log()

// Verify
const $result = load(processedHtml)
const noscriptCount = $result('noscript').length
const imgCount = $result('img').length

console.log('='.repeat(80))
console.log('VERIFICATION')
console.log('='.repeat(80))
console.log(`Noscript tags remaining: ${noscriptCount} (should be 0)`)
console.log(`Image tags found: ${imgCount} (should be 2)`)
console.log()

if (noscriptCount === 0 && imgCount === 2) {
  console.log('✅ TEST PASSED - All noscript images extracted successfully!')
} else {
  console.log('❌ TEST FAILED')
}
