import { prepareImageForInstagram } from './instagramImageUtils.js'
import fs from 'fs'

async function testInstagramImagePreparation() {
  console.log('=== Testing Instagram Image Aspect Ratio Fix ===\n')

  // Test different aspect ratios
  const testImages = [
    {
      name: 'Valid Square (1:1)',
      url: 'https://picsum.photos/1080/1080',
      expectedResize: false,
      expectedRatio: 1.0
    },
    {
      name: 'Valid Portrait (4:5)',
      url: 'https://picsum.photos/1080/1350',
      expectedResize: false,
      expectedRatio: 0.8
    },
    {
      name: 'Valid Landscape (1.91:1)',
      url: 'https://picsum.photos/1080/566',
      expectedResize: false,
      expectedRatio: 1.91
    },
    {
      name: 'Too Wide (3:1 - needs resize)',
      url: 'https://picsum.photos/1500/500',
      expectedResize: true,
      expectedRatio: 3.0
    },
    {
      name: 'Too Tall (2:3 - needs resize)',
      url: 'https://picsum.photos/800/1200',
      expectedResize: true,
      expectedRatio: 0.67
    },
    {
      name: 'Very Wide Banner (4:1 - needs resize)',
      url: 'https://picsum.photos/2000/500',
      expectedResize: true,
      expectedRatio: 4.0
    }
  ]

  console.log('📊 Instagram Requirements:')
  console.log('─'.repeat(80))
  console.log('  • Minimum: 320x320px')
  console.log('  • Square: 1:1 (1080x1080 recommended)')
  console.log('  • Portrait: max 4:5 (1080x1350 recommended)')
  console.log('  • Landscape: max 1.91:1 (1080x566 recommended)')
  console.log('─'.repeat(80))
  console.log()

  let passCount = 0
  let failCount = 0

  for (const test of testImages) {
    console.log(`🖼️  Testing: ${test.name}`)
    console.log('─'.repeat(80))

    try {
      const result = await prepareImageForInstagram(test.url)

      console.log(`   Original URL: ${test.url}`)
      console.log(`   Original Aspect: ${test.expectedRatio.toFixed(2)}`)
      console.log(`   Was Resized: ${result.wasResized ? '✅ Yes' : '❌ No'}`)
      console.log(`   Final Dimensions: ${result.width}x${result.height}`)
      console.log(`   Final Aspect Ratio: ${result.aspectRatio.toFixed(2)}`)

      // Validate the result
      const isValid = result.aspectRatio >= 0.8 && result.aspectRatio <= 1.91
      const resizeExpectation = test.expectedResize === result.wasResized

      if (isValid && resizeExpectation) {
        console.log(`   Result: ✅ PASS`)
        passCount++

        // Save test output
        const filename = `./test-ig-${test.name.replace(/\s+/g, '-').toLowerCase()}.jpg`
        fs.writeFileSync(filename, result.buffer)
        console.log(`   💾 Saved to: ${filename}`)
      } else {
        console.log(`   Result: ❌ FAIL`)
        if (!isValid) {
          console.log(`      ❌ Final aspect ratio ${result.aspectRatio.toFixed(2)} not in valid range (0.8-1.91)`)
        }
        if (!resizeExpectation) {
          console.log(`      ❌ Resize expectation mismatch (expected: ${test.expectedResize}, got: ${result.wasResized})`)
        }
        failCount++
      }

    } catch (error) {
      console.log(`   Result: ❌ ERROR`)
      console.log(`   Error: ${error.message}`)
      failCount++
    }

    console.log()
  }

  console.log('═'.repeat(80))
  console.log('📈 TEST SUMMARY')
  console.log('═'.repeat(80))
  console.log(`✅ Passed: ${passCount}/${testImages.length}`)
  console.log(`❌ Failed: ${failCount}/${testImages.length}`)
  console.log()

  if (failCount === 0) {
    console.log('🎉 All tests passed! Instagram image preparation is working correctly!')
    console.log()
    console.log('✅ What this fixes:')
    console.log('  • Validates aspect ratios before posting')
    console.log('  • Automatically resizes images that are too wide or too tall')
    console.log('  • Crops from center to preserve important content')
    console.log('  • Optimizes images for Instagram (quality: 90, progressive JPEG)')
    console.log('  • Prevents "aspect ratio not supported" errors')
    console.log()
    console.log('Your Instagram posts will now work with any image! 🚀')
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.')
  }
  console.log('═'.repeat(80))
}

testInstagramImagePreparation().catch(error => {
  console.error('Test error:', error)
  process.exit(1)
})
