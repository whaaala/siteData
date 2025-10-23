/**
 * Test yabaleftonline lazy-loaded images - deep inspection
 */

import { chromium } from 'playwright'
import { load } from 'cheerio'

const testUrl = 'https://www.yabaleftonline.ng/woman-welcomes-triplets-12-years-marriage-fibroid-surgeries/'

async function testLazyImages() {
  console.log('=== Testing Yabaleftonline Lazy-Loaded Images ===\n')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  })
  const page = await context.newPage()

  await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

  const html = await page.content()
  const $ = load(html)

  const content = $('.td-post-content')
  const images = content.find('img')

  console.log(`Found ${images.length} images in content\n`)

  images.each((i, img) => {
    const $img = $(img)
    console.log(`Image ${i + 1}:`)
    console.log(`  src: ${$img.attr('src')}`)
    console.log(`  data-src: ${$img.attr('data-src')}`)
    console.log(`  data-lazy-src: ${$img.attr('data-lazy-src')}`)
    console.log(`  data-src-fg: ${$img.attr('data-src-fg')}`)
    console.log(`  data-lazy: ${$img.attr('data-lazy')}`)
    console.log(`  class: ${$img.attr('class')}`)
    console.log(`  alt: ${$img.attr('alt')}`)

    // Get parent link if exists
    const parentLink = $img.parent('a')
    if (parentLink.length > 0) {
      console.log(`  parent <a> href: ${parentLink.attr('href')}`)
    }

    console.log()
  })

  await browser.close()
}

testLazyImages()
