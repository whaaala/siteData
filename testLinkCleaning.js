/**
 * Test Link Cleaning Functionality
 * Verifies that source site links, broken links, and invalid references are removed
 */

import { cleanAllLinksInContent } from './utils.js'

console.log('=== Testing Link Cleaning Functionality ===\n')

// Test scenarios with various types of links
const testCases = [
  {
    name: 'Source site links removal',
    sourceUrl: 'https://pulse.ng/entertainment/fireboy-justin-bieber-article',
    html: `
      <p>According to <a href="https://pulse.ng/entertainment/another-article">Pulse Nigeria</a>,
      the event was great. <a href="https://www.pulse.ng/category/entertainment">More news</a>.</p>
      <p>External: <a href="https://bbc.com/news">BBC News</a></p>
    `,
    expectedRemoved: 2,
    description: 'Should remove all pulse.ng links but keep BBC'
  },
  {
    name: 'Nigerian news site links removal',
    sourceUrl: 'https://yabaleftonline.ng/article-123',
    html: `
      <p>According to <a href="https://www.premiumtimesng.com/news/article">Premium Times</a>,
      the court ordered. <a href="https://dailytrust.com/hisbah-article">Daily Trust</a> also reported.</p>
      <p>International: <a href="https://www.unicef.org/report">UNICEF Report</a></p>
      <p>More from <a href="https://guardian.ng/news/politics">Guardian Nigeria</a>.</p>
    `,
    expectedRemoved: 3,
    description: 'Should remove all Nigerian news site links but keep UNICEF'
  },
  {
    name: 'Broken links removal',
    sourceUrl: 'https://legit.ng/sports/article-123',
    html: `
      <p>Click <a href="#">here</a> or <a href="javascript:void(0)">here</a>.</p>
      <p>Empty: <a href="">link</a> and <a href="undefined">broken</a>.</p>
      <p>Good: <a href="https://reuters.com">Reuters</a></p>
    `,
    expectedRemoved: 4,
    description: 'Should remove all broken links but keep Reuters'
  },
  {
    name: 'Social embed protection',
    sourceUrl: 'https://dailypost.ng/news/article',
    html: `
      <div class="twitter-tweet">
        <p>Tweet content</p>
        <a href="https://twitter.com/user/status/123">View on Twitter</a>
      </div>
      <p>External: <a href="https://dailypost.ng/other">DailyPost link</a></p>
    `,
    expectedRemoved: 1,
    description: 'Should keep Twitter embed link but remove source site link'
  },
  {
    name: 'Internal category links',
    sourceUrl: 'https://punch.ng/entertainment/article',
    html: `
      <p>Related: <a href="https://legit.ng/tag/entertainment">Entertainment</a></p>
      <p>Author: <a href="https://punch.ng/author/john">John's posts</a></p>
      <p>External: <a href="https://wikipedia.org/page">Wikipedia</a></p>
    `,
    expectedRemoved: 2,
    description: 'Should remove internal links but keep Wikipedia'
  },
  {
    name: 'Empty text links',
    sourceUrl: 'https://naijanews.com/article',
    html: `
      <p>Text with <a href="https://example.com"></a> empty link.</p>
      <p>Another <a href="https://test.com">   </a> whitespace link.</p>
      <p>Good: <a href="https://reuters.com">Reuters Article</a></p>
    `,
    expectedRemoved: 2,
    description: 'Should remove empty text links but keep valid one'
  },
  {
    name: 'Generic anchor links',
    sourceUrl: 'https://guardian.ng/news/article',
    html: `
      <p>Read <a href="#section">more</a> or <a href="#top">click here</a>.</p>
      <p>Source: <a href="#ref">source</a></p>
      <p>Valid: <a href="https://who.int/report">WHO Report</a></p>
    `,
    expectedRemoved: 2,
    description: 'Should remove generic anchors (click here, source) but keep WHO link'
  }
]

async function testLinkCleaning() {
  let passedTests = 0
  let failedTests = 0

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i]

    console.log('═'.repeat(90))
    console.log(`TEST ${i + 1}: ${test.name}`)
    console.log('═'.repeat(90))
    console.log()
    console.log('📋 Setup:')
    console.log(`   Source URL: ${test.sourceUrl}`)
    console.log(`   Description: ${test.description}`)
    console.log()

    console.log('📄 Original HTML:')
    console.log(test.html)
    console.log()

    console.log('⏳ Running link cleaning...')
    console.log()

    // Run the cleaning function
    const cleaned = cleanAllLinksInContent(test.html, test.sourceUrl)

    console.log()
    console.log('✨ Cleaned HTML:')
    console.log(cleaned)
    console.log()

    // Count links before and after
    const originalLinks = (test.html.match(/<a[^>]*>/g) || []).length
    const cleanedLinks = (cleaned.match(/<a[^>]*>/g) || []).length
    const removed = originalLinks - cleanedLinks

    console.log('📊 RESULTS:')
    console.log(`   Original links: ${originalLinks}`)
    console.log(`   Remaining links: ${cleanedLinks}`)
    console.log(`   Links removed: ${removed}`)
    console.log(`   Expected removed: ${test.expectedRemoved}`)
    console.log()

    if (removed === test.expectedRemoved) {
      console.log('✅ TEST PASSED')
      passedTests++
    } else {
      console.log('❌ TEST FAILED')
      console.log(`   Expected ${test.expectedRemoved} links removed, but got ${removed}`)
      failedTests++
    }
    console.log()
  }

  console.log('═'.repeat(90))
  console.log('📊 TEST SUMMARY')
  console.log('═'.repeat(90))
  console.log()
  console.log(`✅ Passed: ${passedTests}/${testCases.length}`)
  console.log(`❌ Failed: ${failedTests}/${testCases.length}`)
  console.log()

  if (failedTests === 0) {
    console.log('🎉 ALL TESTS PASSED!')
  } else {
    console.log('⚠️  Some tests failed. Review the output above.')
  }
  console.log()

  console.log('═'.repeat(90))
  console.log('📝 WHAT THIS CLEANING DOES')
  console.log('═'.repeat(90))
  console.log()
  console.log('✅ Removes:')
  console.log('   • Links back to source site (e.g., pulse.ng, legit.ng)')
  console.log('   • Broken links (empty hrefs, javascript:void(0), undefined)')
  console.log('   • Internal category/tag/author links from other sites')
  console.log('   • Empty or whitespace-only links')
  console.log('   • Generic anchor links (#section, #top, #more)')
  console.log()
  console.log('✅ Preserves:')
  console.log('   • Legitimate external links (BBC, Reuters, WHO, etc.)')
  console.log('   • Social media embed links (Twitter, Instagram, TikTok)')
  console.log('   • Government and official organization links')
  console.log('   • Wikipedia and educational resources')
  console.log()
  console.log('🎯 BENEFITS:')
  console.log('   • Professional appearance (no broken links)')
  console.log('   • No links back to competitor sites')
  console.log('   • Better user experience (only working links)')
  console.log('   • Improved SEO (clean link structure)')
  console.log('   • Legal protection (no attribution to source)')
  console.log()

  process.exit(failedTests > 0 ? 1 : 0)
}

testLinkCleaning()
