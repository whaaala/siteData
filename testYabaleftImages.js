/**
 * Test yabaleftonline image extraction
 */

import { chromium } from 'playwright'
import { load } from 'cheerio'

const testUrl = 'https://www.yabaleftonline.ng/woman-welcomes-triplets-12-years-marriage-fibroid-surgeries/'

async function testImageExtraction() {
  console.log('=== Testing Yabaleftonline Image Extraction ===\n')
  console.log(`URL: ${testUrl}\n`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  })
  const page = await context.newPage()

  try {
    console.log('Loading page...')
    await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    console.log('✅ Page loaded\n')

    const html = await page.content()
    const $ = load(html)

    // Check featured image
    console.log('=== Featured Image ===')
    const featuredImg = $('.td-post-featured-image img')
    if (featuredImg.length > 0) {
      console.log(`✅ Found featured image`)
      console.log(`   Selector: .td-post-featured-image img`)
      console.log(`   Src: ${featuredImg.attr('src')}`)
      console.log(`   Srcset: ${featuredImg.attr('srcset')?.substring(0, 100)}...`)
    } else {
      console.log('❌ No featured image found')
    }
    console.log()

    // Check content area
    console.log('=== Content Area ===')
    const content = $('.td-post-content')
    if (content.length > 0) {
      console.log(`✅ Found content area: .td-post-content`)

      // Count all images in content
      const contentImages = content.find('img')
      console.log(`   Total images in content: ${contentImages.length}`)

      if (contentImages.length > 0) {
        console.log('\n   Images found:')
        contentImages.each((i, img) => {
          const $img = $(img)
          const src = $img.attr('src')
          const dataSrc = $img.attr('data-src')
          const classes = $img.attr('class')
          console.log(`   ${i + 1}. Src: ${src || dataSrc || 'NO SRC'}`)
          console.log(`      Classes: ${classes || 'none'}`)
          console.log(`      Parent: ${$img.parent().prop('tagName')}`)
        })
      } else {
        console.log('   ⚠️ No images found in content area')
      }

      // Check for lazy loading
      const lazyImages = content.find('img[data-src], img[data-lazy-src]')
      if (lazyImages.length > 0) {
        console.log(`\n   ⚠️ Found ${lazyImages.length} lazy-loaded images`)
        console.log('   These need special handling!')
      }

      // Get raw HTML snippet
      console.log('\n=== Raw Content HTML (first 500 chars) ===')
      console.log(content.html().substring(0, 500) + '...')

    } else {
      console.log('❌ No content area found')
    }

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await browser.close()
  }
}

testImageExtraction()
