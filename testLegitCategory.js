/**
 * Test legit.ng category extraction
 */

import { chromium } from 'playwright'

// Test URLs from different categories
const testUrls = [
  {
    url: 'https://www.legit.ng/politics/1626929-breaking-okonjo-iweala-joins-2027-presidential-race-picks-atiku-running-mate/',
    expectedCategory: 'News',
    description: 'Politics article'
  },
  {
    url: 'https://www.legit.ng/entertainment/1626886-im-boy-mom-destiny-etiko-sparks-reactions-video-playing-football-male-kid/',
    expectedCategory: 'Entertainment',
    description: 'Entertainment article'
  },
  {
    url: 'https://www.legit.ng/people/1626925-man-shares-video-wife-bringing-n50-naira-notes-restaurant-pay-bill/',
    expectedCategory: 'Lifestyle',
    description: 'Lifestyle article'
  }
]

async function testLegitCategory() {
  console.log('=== Testing Legit.ng Category Extraction ===\n')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })

  for (const test of testUrls) {
    console.log(`\n--- Test: ${test.description} ---`)
    console.log(`URL: ${test.url}`)
    console.log(`Expected: ${test.expectedCategory}\n`)

    const page = await context.newPage()

    try {
      await page.goto(test.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(2000)

      // Test the selector from sites.js
      console.log('Testing selector: .c-breadcrumbs:first-of-type')
      const categoryEl = await page.$('.c-breadcrumbs:first-of-type')

      if (categoryEl) {
        const categoryText = await categoryEl.textContent()
        console.log(`✅ Found category element`)
        console.log(`   Raw text: "${categoryText.trim()}"`)

        // Test the multi-line parsing logic from scrapeRaw.js
        const lines = categoryText.trim().split('\n').filter(line => line.trim())
        const lastLine = lines[lines.length - 1]?.trim()
        console.log(`   Parsed category: "${lastLine}"`)

        if (lastLine && lastLine.toLowerCase().includes(test.expectedCategory.toLowerCase())) {
          console.log(`   ✅ PASS: Category matches expected`)
        } else {
          console.log(`   ❌ FAIL: Expected "${test.expectedCategory}", got "${lastLine}"`)
        }
      } else {
        console.log('❌ Category element not found')
      }

      // Check all breadcrumb elements
      console.log('\n=== All Breadcrumb Elements ===')
      const allBreadcrumbs = await page.$$('.c-breadcrumbs')
      console.log(`Found ${allBreadcrumbs.length} breadcrumb elements:`)

      for (let i = 0; i < allBreadcrumbs.length; i++) {
        const text = await allBreadcrumbs[i].textContent()
        console.log(`  ${i + 1}. "${text.trim()}"`)
      }

      // Check breadcrumb links
      console.log('\n=== Breadcrumb Links ===')
      const breadcrumbLinks = await page.$$('.c-breadcrumbs a')
      console.log(`Found ${breadcrumbLinks.length} breadcrumb links:`)

      for (let i = 0; i < breadcrumbLinks.length; i++) {
        const text = await breadcrumbLinks[i].textContent()
        const href = await breadcrumbLinks[i].getAttribute('href')
        console.log(`  ${i + 1}. Text: "${text.trim()}", Href: ${href}`)
      }

    } catch (error) {
      console.error('Error:', error.message)
    } finally {
      await page.close()
    }
  }

  await browser.close()
  console.log('\n=== Test Complete ===')
}

testLegitCategory()
