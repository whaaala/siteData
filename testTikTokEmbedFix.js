/**
 * Test TikTok embed cleanup
 */

import { embedSocialLinksInContent } from './utils.js'

console.log('=== Testing TikTok Embed Cleanup ===\n')

// Sample HTML with TikTok embed that has unwanted URLs inside
const testHtml = `
<p>Some content before the TikTok.</p>

<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@nailmartusa/video/6978263826064035078" data-video-id="6978263826064035078">
  <section>
    https://www.tiktok.com/@nailmartusa?refer=embed
    <p>Many people don't know about this type of mani and I'm here to tell you more about it🥰
    https://www.tiktok.com/tag/russianmanicure?refer=embed
    https://www.tiktok.com/tag/gelmani?refer=embed
    https://www.tiktok.com/tag/cuticle?refer=embed
    </p>
    https://www.tiktok.com/music/Stuck-In-The-Middle-6832618984580335617?refer=embed
  </section>
</blockquote>
<script async src="https://www.tiktok.com/embed.js"></script>

<p>Some content after the TikTok.</p>
`

console.log('BEFORE processing:')
console.log('─'.repeat(80))
console.log(testHtml)
console.log('─'.repeat(80))
console.log()

const processedHtml = embedSocialLinksInContent(testHtml)

console.log('AFTER processing:')
console.log('─'.repeat(80))
console.log(processedHtml)
console.log('─'.repeat(80))
console.log()

// Check if unwanted URLs were removed
const hasCreatorUrl = processedHtml.includes('https://www.tiktok.com/@nailmartusa?refer=embed')
const hasTagUrl = processedHtml.includes('https://www.tiktok.com/tag/russianmanicure?refer=embed')
const hasMusicUrl = processedHtml.includes('https://www.tiktok.com/music/Stuck-In-The-Middle')

// Check if the video embed URL is still there
const hasVideoEmbed = processedHtml.includes('cite="https://www.tiktok.com/@nailmartusa/video/6978263826064035078"')

console.log('='.repeat(80))
console.log('VERIFICATION')
console.log('='.repeat(80))
console.log(`Creator URL removed: ${!hasCreatorUrl ? '✅ YES' : '❌ NO (still present)'}`)
console.log(`Tag URL removed: ${!hasTagUrl ? '✅ YES' : '❌ NO (still present)'}`)
console.log(`Music URL removed: ${!hasMusicUrl ? '✅ YES' : '❌ NO (still present)'}`)
console.log(`Video embed preserved: ${hasVideoEmbed ? '✅ YES' : '❌ NO (removed)'}`)
console.log()

if (!hasCreatorUrl && !hasTagUrl && !hasMusicUrl && hasVideoEmbed) {
  console.log('✅ TEST PASSED - TikTok embed cleaned up correctly!')
} else {
  console.log('❌ TEST FAILED - Issues detected')
}
