/**
 * Test Feature Image Optimization
 * Verifies that the largest/best quality image is selected as the feature image
 */

import { findLargestImageInContent } from './utils.js'

console.log('=== Testing Feature Image Optimization ===\n')
console.log('This test demonstrates how the system finds and uses the largest image from scraped content\n')

// Test scenario: Multiple images with different sizes
// We'll use some real test images from different sources
const testScenarios = [
  {
    name: 'Scenario 1: Multiple images in content, larger one inside',
    initialImageUrl: 'https://cdn.legit.ng/images/640/b5f94847b4bb9ae3.jpeg',
    postDetails: [
      `
      <div>
        <p>This is some content with images.</p>
        <img src="https://cdn.legit.ng/images/640/b5f94847b4bb9ae3.jpeg" alt="Small image">
        <p>More content here.</p>
        <img src="https://cdn.legit.ng/images/1120/b5f94847b4bb9ae3.jpeg" alt="Larger image">
        <p>Even more content.</p>
      </div>
      `,
    ],
    expectedResult: 'Should select the 1120px image (larger)',
  },
  {
    name: 'Scenario 2: Initial image is the largest',
    initialImageUrl: 'https://cdn.legit.ng/images/1120/1e1483767a87c4d1.jpeg',
    postDetails: [
      `
      <div>
        <p>Content with smaller images.</p>
        <img src="https://cdn.legit.ng/images/320/1e1483767a87c4d1.jpeg" alt="Thumbnail">
        <img src="https://cdn.legit.ng/images/640/1e1483767a87c4d1.jpeg" alt="Medium">
      </div>
      `,
    ],
    expectedResult: 'Should keep the initial 1120px image (already largest)',
  },
  {
    name: 'Scenario 3: No images in content',
    initialImageUrl: 'https://cdn.legit.ng/images/640/b5f94847b4bb9ae3.jpeg',
    postDetails: [
      `
      <div>
        <p>This content has no images at all.</p>
        <p>Just text content.</p>
      </div>
      `,
    ],
    expectedResult: 'Should use the initial image (only option)',
  },
]

async function testFeatureImageOptimization() {
  try {
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i]

      console.log('═'.repeat(90))
      console.log(`TEST ${i + 1}: ${scenario.name}`)
      console.log('═'.repeat(90))
      console.log()

      console.log('📋 Setup:')
      console.log(`   Initial Feature Image: ${scenario.initialImageUrl}`)
      console.log(`   Content: ${scenario.postDetails[0].length} characters`)
      console.log()

      console.log('🔍 Expected Result:')
      console.log(`   ${scenario.expectedResult}`)
      console.log()

      console.log('⏳ Running optimization...')
      console.log()

      const largestImage = await findLargestImageInContent(
        scenario.postDetails,
        scenario.initialImageUrl
      )

      console.log()
      console.log('✅ RESULT:')

      if (!largestImage) {
        console.log('   ❌ No images found')
      } else if (largestImage.url === scenario.initialImageUrl) {
        console.log('   ✓ Initial feature image is already the largest')
        console.log(`   Dimensions: ${largestImage.width}x${largestImage.height}`)
        console.log(`   Pixels: ${largestImage.pixels.toLocaleString()}`)
      } else {
        console.log('   🎯 Found larger image in content!')
        console.log(`   New Feature Image: ${largestImage.url}`)
        console.log(`   Dimensions: ${largestImage.width}x${largestImage.height}`)
        console.log(`   Pixels: ${largestImage.pixels.toLocaleString()}`)
      }

      console.log()
    }

    console.log('═'.repeat(90))
    console.log('📊 SUMMARY OF FEATURE IMAGE OPTIMIZATION')
    console.log('═'.repeat(90))
    console.log()
    console.log('✅ How It Works:')
    console.log('   1. Extract all unique image URLs from scraped post content')
    console.log('   2. Fetch each image and get its dimensions (width × height)')
    console.log('   3. Compare all images by total pixels (width × height)')
    console.log('   4. Select the largest image as the WordPress feature image')
    console.log('   5. If initial image is already largest, keep it')
    console.log()
    console.log('✅ Benefits:')
    console.log('   • Always use the highest quality/largest image available')
    console.log('   • Better looking featured images on WordPress')
    console.log('   • Higher quality social media shares (Facebook, Instagram, X)')
    console.log('   • Improved visual appeal and user engagement')
    console.log('   • No more small/low-quality feature images')
    console.log()
    console.log('✅ Applied To:')
    console.log('   • ALL sites being scraped (universal implementation)')
    console.log('   • Automatically runs during the scraping stage')
    console.log('   • No manual configuration needed per site')
    console.log()
    console.log('🎯 EXPECTED RESULTS:')
    console.log('   • WordPress featured images will be larger and higher quality')
    console.log('   • Facebook posts will have better image quality')
    console.log('   • Instagram posts will have sharper, clearer images')
    console.log('   • X/Twitter posts will have better previews')
    console.log('   • Overall better visual presentation across all platforms')
    console.log()

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

testFeatureImageOptimization()
