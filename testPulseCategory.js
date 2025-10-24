/**
 * Test pulse.com.gh category extraction
 */

import { chromium } from 'playwright'

const testUrl = 'https://www.pulse.com.gh/articles/news/63-npp-mps-declare-support-for-dr-bawumia-ahead-of-january-31-presidential-primaries-2025102316244949388'

async function testCategoryExtraction() {
  console.log('=== Testing Pulse.com.gh Category Extraction ===\n')
  console.log(`URL: ${testUrl}\n`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })
  const page = await context.newPage()

  try {
    console.log('Loading page...')
    await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    console.log('✅ Page loaded\n')

    // Wait for content to be available
    await page.waitForTimeout(3000)

    // Test the category selector from sites.js
    console.log('=== Testing Category Selector ===')
    console.log('Selector: .c-breadcrumbs:first-of-type\n')

    const categoryEl = await page.$('.c-breadcrumbs:first-of-type')
    if (categoryEl) {
      const categoryText = await categoryEl.textContent()
      console.log(`✅ Found category element`)
      console.log(`   Text: "${categoryText.trim()}"\n`)
    } else {
      console.log('❌ Category element not found\n')
    }

    // Check ALL breadcrumbs
    console.log('=== All Breadcrumb Elements ===')
    const allBreadcrumbs = await page.$$('.c-breadcrumbs')
    console.log(`Found ${allBreadcrumbs.length} breadcrumb elements:`)

    for (let i = 0; i < allBreadcrumbs.length; i++) {
      const text = await allBreadcrumbs[i].textContent()
      console.log(`  ${i + 1}. "${text.trim()}"`)
    }
    console.log()

    // Check URL path
    console.log('=== URL Analysis ===')
    const urlPath = new URL(testUrl).pathname
    console.log(`Path: ${urlPath}`)
    if (urlPath.includes('/news/')) {
      console.log('✅ URL contains "/news/" - should be News category')
    }
    console.log()

    // Try alternative selectors
    console.log('=== Alternative Selectors ===')

    const breadcrumbLinks = await page.$$('.c-breadcrumbs a')
    if (breadcrumbLinks.length > 0) {
      console.log(`Found ${breadcrumbLinks.length} breadcrumb links:`)
      for (let i = 0; i < breadcrumbLinks.length; i++) {
        const text = await breadcrumbLinks[i].textContent()
        const href = await breadcrumbLinks[i].getAttribute('href')
        console.log(`  ${i + 1}. Text: "${text.trim()}", Href: ${href}`)
      }
    }

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await browser.close()
  }
}

testCategoryExtraction()
