/**
 * Test naijanews.com category extraction
 */

import { chromium } from 'playwright'

// Test URLs from different categories
const testUrls = [
  {
    url: 'https://www.naijanews.com/2025/10/23/god-gave-me-my-girlfriend-as-a-consolation-from-all-my-troubles-odumodublvck/',
    expectedCategory: 'Entertainment',
    description: 'Entertainment article'
  },
  {
    url: 'https://www.naijanews.com/2025/10/23/breaking-fct-minister-nyesom-wike-set-to-join-apc/',
    expectedCategory: 'News',
    description: 'Politics/News article'
  },
  {
    url: 'https://www.naijanews.com/2025/10/23/nff-confirms-victor-osimhen-as-super-eagles-captain-for-afcon-2025/',
    expectedCategory: 'Sports',
    description: 'Sports article'
  }
]

async function testNaijanewsCategory() {
  console.log('=== Testing Naijanews.com Category Extraction ===\n')

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

      // Try various potential category selectors
      console.log('=== Testing Potential Category Selectors ===\n')

      const selectors = [
        '.entry-category',
        '.category',
        '.post-category',
        'article .category',
        '.breadcrumbs',
        '.breadcrumb',
        '[rel="category tag"]',
        '.entry-meta .category',
        '.post-meta .category'
      ]

      let foundCategory = false

      for (const selector of selectors) {
        try {
          const el = await page.$(selector)
          if (el) {
            const text = await el.textContent()
            console.log(`✅ Found "${selector}": "${text.trim()}"`)
            foundCategory = true
          }
        } catch (e) {
          // Selector not found
        }
      }

      if (!foundCategory) {
        console.log('❌ No category selectors found')
      }

      // Check URL structure
      console.log('\n=== URL Structure ===')
      const urlPath = new URL(test.url).pathname
      console.log(`Path: ${urlPath}`)

      // Extract date and slug
      const pathParts = urlPath.split('/').filter(p => p)
      console.log(`Parts: ${JSON.stringify(pathParts)}`)

      // Check if URL contains category hints
      if (urlPath.includes('/entertainment/')) {
        console.log('✅ URL contains "/entertainment/"')
      } else if (urlPath.includes('/sports/')) {
        console.log('✅ URL contains "/sports/"')
      } else if (urlPath.includes('/politics/') || urlPath.includes('/news/')) {
        console.log('✅ URL contains "/politics/" or "/news/"')
      } else {
        console.log('⚠️ URL does not contain obvious category indicators')
        console.log('   URL structure: /YYYY/MM/DD/slug/')
      }

      // Check page source for category metadata
      console.log('\n=== Checking Metadata ===')
      const categoryMeta = await page.$('meta[property="article:section"]')
      if (categoryMeta) {
        const content = await categoryMeta.getAttribute('content')
        console.log(`✅ Found meta article:section: "${content}"`)
      } else {
        console.log('❌ No meta article:section found')
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

testNaijanewsCategory()
