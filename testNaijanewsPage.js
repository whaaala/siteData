/**
 * Diagnostic script to test naijanews.com page loading
 */

import { chromium } from 'playwright'

const testUrl = 'https://www.naijanews.com/2025/10/23/god-gave-me-my-girlfriend-as-a-consolation-from-all-my-troubles-odumodublvck/'

async function testPageLoad() {
  console.log('=== Testing Naijanews Page Load ===\n')
  console.log(`URL: ${testUrl}\n`)

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const customUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  const context = await browser.newContext({
    userAgent: customUserAgent,
    viewport: { width: 1920, height: 1080 }
  })
  const page = await context.newPage()

  // Test 1: Try with domcontentloaded (current method)
  console.log('Test 1: Loading with domcontentloaded (current method)...')
  try {
    const startTime = Date.now()
    await page.goto(testUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    })
    const loadTime = Date.now() - startTime
    console.log(`✅ SUCCESS with domcontentloaded (${loadTime}ms)\n`)
  } catch (error) {
    console.log(`❌ FAILED with domcontentloaded`)
    console.log(`Error: ${error.message}\n`)

    // Test 2: Try with networkidle
    console.log('Test 2: Trying with networkidle...')
    try {
      const startTime = Date.now()
      await page.goto(testUrl, {
        waitUntil: 'networkidle',
        timeout: 60000
      })
      const loadTime = Date.now() - startTime
      console.log(`✅ SUCCESS with networkidle (${loadTime}ms)\n`)
    } catch (error2) {
      console.log(`❌ FAILED with networkidle`)
      console.log(`Error: ${error2.message}\n`)

      // Test 3: Try with load
      console.log('Test 3: Trying with load...')
      try {
        const startTime = Date.now()
        await page.goto(testUrl, {
          waitUntil: 'load',
          timeout: 60000
        })
        const loadTime = Date.now() - startTime
        console.log(`✅ SUCCESS with load (${loadTime}ms)\n`)
      } catch (error3) {
        console.log(`❌ FAILED with load`)
        console.log(`Error: ${error3.message}\n`)

        // Test 4: Try with commit (earliest event)
        console.log('Test 4: Trying with commit (earliest event)...')
        try {
          const startTime = Date.now()
          await page.goto(testUrl, {
            waitUntil: 'commit',
            timeout: 60000
          })
          const loadTime = Date.now() - startTime
          console.log(`✅ SUCCESS with commit (${loadTime}ms)\n`)
        } catch (error4) {
          console.log(`❌ ALL METHODS FAILED`)
          console.log(`Last error: ${error4.message}\n`)
        }
      }
    }
  }

  // Check if we can access the page content
  console.log('Checking page content...')
  try {
    const title = await page.title()
    console.log(`Page title: "${title}"`)

    const url = page.url()
    console.log(`Current URL: ${url}`)

    // Check for Cloudflare challenge
    const content = await page.content()
    if (content.includes('cloudflare') && content.includes('checking your browser')) {
      console.log('⚠️ WARNING: Cloudflare challenge detected!')
    }

    // Check for specific selectors from naijanews config
    const hasMainContent = await page.$('#mvp-content-main')
    console.log(`Main content found: ${hasMainContent ? '✅ Yes' : '❌ No'}`)

    const hasPostContent = await page.$('#mvp-post-content')
    console.log(`Post content found: ${hasPostContent ? '✅ Yes' : '❌ No'}`)

    const hasImage = await page.$('.wp-post-image')
    console.log(`Featured image found: ${hasImage ? '✅ Yes' : '❌ No'}`)

  } catch (error) {
    console.log(`Error checking content: ${error.message}`)
  }

  await browser.close()
  console.log('\n=== Test Complete ===')
}

testPageLoad().catch(error => {
  console.error('Test script error:', error)
  process.exit(1)
})
