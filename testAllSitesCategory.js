/**
 * Comprehensive test for ALL sites - category extraction analysis
 */

import { chromium } from 'playwright'

// Test URLs for all major sites
const allSitesTests = [
  // PULSE SITES (already fixed)
  { site: 'pulse.com.gh', url: 'https://www.pulse.com.gh/articles/news/63-npp-mps-declare-support-for-dr-bawumia-ahead-of-january-31-presidential-primaries-2025102316244949388', expected: 'News', selector: '.c-breadcrumbs:first-of-type' },

  // LEGIT SITES (just fixed)
  { site: 'legit.ng', url: 'https://www.legit.ng/entertainment/1626886-im-boy-mom-destiny-etiko-sparks-reactions-video-playing-football-male-kid/', expected: 'Entertainment', selector: '.c-breadcrumbs:first-of-type' },

  // NAIJANEWS SITES (empty selectors)
  { site: 'naijanews.com', url: 'https://www.naijanews.com/2025/10/23/breaking-fct-minister-nyesom-wike-set-to-join-apc/', expected: 'News', selector: 'EMPTY' },

  // GISTREEL SITES (complex selector)
  { site: 'gistreel.com', url: 'https://www.gistreel.com/politics/breaking-tribunal-sacks-governor-elect/', expected: 'News', selector: '.entry-header .post-cat-wrap a:last-child' },

  // GUARDIAN SITES (hardcoded)
  { site: 'guardian.ng', url: 'https://guardian.ng/category/news/politics/president-tinubu-meets-service-chiefs/', expected: 'News', selector: 'EMPTY (hardcoded)' },

  // DAILYPOST SITES (should work)
  { site: 'dailypost.ng', url: 'https://dailypost.ng/2025/10/23/breaking-pdp-crisis-deepens-as-governors-demand-atikus-resignation/', expected: 'News', selector: '.mvp-post-cat span' },

  // LEADERSHIP SITES (should work)
  { site: 'leadership.ng', url: 'https://leadership.ng/breaking-senate-passes-2025-budget/', expected: 'News', selector: '.jeg_meta_category a' },

  // GISTLOVER SITES (should work)
  { site: 'gistlover.com', url: 'https://gistlover.com/news/breaking-celebrity-scandal-rocks-nigeria/', expected: 'News', selector: '.mh-meta .entry-meta-categories a' },

  // PUNCHNG SITES (empty post-level selector)
  { site: 'punchng.com', url: 'https://punchng.com/breaking-nigeria-inflation-hits-new-high/', expected: 'News', selector: 'EMPTY (listing only)' },

  // PREMIUMTIMES SITES (empty post-level selector)
  { site: 'premiumtimesng.com', url: 'https://premiumtimesng.com/news/headlines/breaking-court-ruling-shakes-political-landscape/', expected: 'News', selector: 'EMPTY (listing only)' },

  // YABALEFT SITES (empty post-level selector)
  { site: 'yabaleftonline.ng', url: 'https://www.yabaleftonline.ng/entertainment/celebrity-wedding-shuts-down-lagos/', expected: 'Entertainment', selector: 'EMPTY (listing only)' },

  // THENEWSGURU SITES (should work)
  { site: 'thenewsguru.com', url: 'https://thenewsguru.com/news/breaking-major-development/', expected: 'News', selector: '.taxonomy-category a' },

  // BRILA SITES (should work)
  { site: 'brila.net', url: 'https://brila.net/football/super-eagles-prepare-for-afcon/', expected: 'Sports', selector: '.meta-item .category' },

  // NOTJUSTOK SITES (URL-based)
  { site: 'notjustok.com', url: 'https://www.notjustok.com/news/wizkid-announces-new-album/', expected: 'Entertainment', selector: 'EMPTY (URL-based)' }
]

async function testAllSites() {
  console.log('=== COMPREHENSIVE CATEGORY EXTRACTION TEST FOR ALL SITES ===\n')
  console.log(`Testing ${allSitesTests.length} sites...\n`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })

  const results = {
    working: [],
    broken: [],
    needsUrlInference: [],
    errors: []
  }

  for (const test of allSitesTests) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`Testing: ${test.site}`)
    console.log(`URL: ${test.url}`)
    console.log(`Expected category: ${test.expected}`)
    console.log(`Configured selector: ${test.selector}`)
    console.log('-'.repeat(80))

    const page = await context.newPage()

    try {
      await page.goto(test.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(2000)

      let selectorWorks = false
      let extractedCategory = null

      // Test if selector works (skip if EMPTY)
      if (!test.selector.includes('EMPTY')) {
        try {
          const el = await page.$(test.selector)
          if (el) {
            const text = await el.textContent()
            extractedCategory = text.trim()
            selectorWorks = true
            console.log(`✅ Selector works: "${extractedCategory}"`)
          } else {
            console.log(`❌ Selector found no elements`)
          }
        } catch (e) {
          console.log(`❌ Selector error: ${e.message}`)
        }
      } else {
        console.log(`⚠️ No selector configured (empty or hardcoded)`)
      }

      // Test URL-based inference
      console.log('\n--- URL Analysis ---')
      const urlPath = new URL(test.url).pathname.toLowerCase()
      let urlCategory = null

      if (urlPath.includes('/news/') || urlPath.includes('/politics/') || urlPath.includes('/business')) {
        urlCategory = 'News'
        console.log(`✅ URL suggests: News`)
      } else if (urlPath.includes('/entertainment/')) {
        urlCategory = 'Entertainment'
        console.log(`✅ URL suggests: Entertainment`)
      } else if (urlPath.includes('/sports/')) {
        urlCategory = 'Sports'
        console.log(`✅ URL suggests: Sports`)
      } else if (urlPath.includes('/lifestyle/') || urlPath.includes('/people/')) {
        urlCategory = 'Lifestyle'
        console.log(`✅ URL suggests: Lifestyle`)
      } else if (urlPath.includes('/gist/') || urlPath.includes('/viral/')) {
        urlCategory = 'Gists'
        console.log(`✅ URL suggests: Gists`)
      } else {
        console.log(`❌ URL does not contain category indicators`)
      }

      // Determine result
      console.log('\n--- Result ---')
      if (selectorWorks) {
        console.log(`✅ WORKING - Selector extracts category`)
        results.working.push(test.site)
      } else if (urlCategory) {
        console.log(`⚠️ NEEDS URL INFERENCE - Selector broken but URL works`)
        results.needsUrlInference.push({
          site: test.site,
          url: test.url,
          urlPattern: urlPath,
          expectedCategory: test.expected
        })
      } else {
        console.log(`❌ BROKEN - Neither selector nor URL works`)
        results.broken.push({
          site: test.site,
          url: test.url,
          selector: test.selector
        })
      }

    } catch (error) {
      console.error(`❌ ERROR: ${error.message}`)
      results.errors.push({ site: test.site, error: error.message })
    } finally {
      await page.close()
    }
  }

  await browser.close()

  // Print summary
  console.log('\n\n')
  console.log('='.repeat(80))
  console.log('SUMMARY OF RESULTS')
  console.log('='.repeat(80))

  console.log(`\n✅ WORKING SITES (${results.working.length}):`)
  results.working.forEach(site => console.log(`  - ${site}`))

  console.log(`\n⚠️ NEEDS URL INFERENCE FIX (${results.needsUrlInference.length}):`)
  results.needsUrlInference.forEach(item => {
    console.log(`  - ${item.site}`)
    console.log(`    URL pattern: ${item.urlPattern}`)
    console.log(`    Expected: ${item.expectedCategory}`)
  })

  console.log(`\n❌ BROKEN - NO SOLUTION (${results.broken.length}):`)
  results.broken.forEach(item => {
    console.log(`  - ${item.site}`)
    console.log(`    Selector: ${item.selector}`)
  })

  console.log(`\n❌ ERRORS (${results.errors.length}):`)
  results.errors.forEach(item => {
    console.log(`  - ${item.site}: ${item.error}`)
  })

  console.log('\n' + '='.repeat(80))
  console.log('TEST COMPLETE')
  console.log('='.repeat(80))
}

testAllSites()
