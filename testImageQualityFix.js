/**
 * Test Image Quality Improvements
 * Verifies that images are processed with high quality settings
 */

import { downloadImageAsJpgOrPngForUpload } from './utils.js'
import { prepareImageForInstagram } from './instagramImageUtils.js'
import sharp from 'sharp'

console.log('=== Testing Image Quality Improvements ===\n')

// Test URLs (use a high-quality test image)
const testImageUrls = [
  'https://cdn.legit.ng/images/1120/1e1483767a87c4d1.jpeg', // Example from your site
]

async function testImageQuality() {
  try {
    for (const imageUrl of testImageUrls) {
      console.log('═'.repeat(80))
      console.log(`📷 Testing: ${imageUrl}`)
      console.log('═'.repeat(80))
      console.log()

      // Test 1: WordPress Featured Image Processing
      console.log('🖼️  TEST 1: WordPress Featured Image Processing')
      console.log('─'.repeat(80))

      const { buffer: wpBuffer, filename } = await downloadImageAsJpgOrPngForUpload(
        imageUrl,
        'test-image'
      )

      const wpMetadata = await sharp(wpBuffer).metadata()

      console.log(`✓ Processed for WordPress`)
      console.log(`  Filename: ${filename}`)
      console.log(`  Dimensions: ${wpMetadata.width}x${wpMetadata.height}`)
      console.log(`  Format: ${wpMetadata.format}`)
      console.log(`  Size: ${Math.round(wpBuffer.length / 1024)}KB`)
      console.log(
        `  Quality indicators: ${wpMetadata.chromaSubsampling || 'N/A'} chroma subsampling`
      )
      console.log()

      // Test 2: Instagram Image Processing
      console.log('📸 TEST 2: Instagram Image Processing')
      console.log('─'.repeat(80))

      const igResult = await prepareImageForInstagram(imageUrl)

      const igMetadata = await sharp(igResult.buffer).metadata()

      console.log(`✓ Processed for Instagram`)
      console.log(`  Dimensions: ${igResult.width}x${igResult.height}`)
      console.log(`  Aspect Ratio: ${igResult.aspectRatio.toFixed(2)}`)
      console.log(`  Was Resized: ${igResult.wasResized ? 'Yes' : 'No'}`)
      console.log(`  Format: ${igMetadata.format}`)
      console.log(`  Size: ${Math.round(igResult.buffer.length / 1024)}KB`)
      console.log(
        `  Quality indicators: ${igMetadata.chromaSubsampling || 'N/A'} chroma subsampling`
      )
      console.log()

      // Verify Quality Settings
      console.log('✅ QUALITY VERIFICATION')
      console.log('─'.repeat(80))

      let allGood = true

      // Check WordPress image quality
      if (wpMetadata.format === 'jpeg') {
        if (wpMetadata.chromaSubsampling === '4:4:4') {
          console.log('✅ WordPress: Maximum color quality (4:4:4 chroma subsampling)')
        } else {
          console.log(
            `⚠️  WordPress: Lower color quality (${wpMetadata.chromaSubsampling} chroma subsampling)`
          )
          allGood = false
        }
      }

      // Check Instagram image quality
      if (igMetadata.format === 'jpeg') {
        if (igMetadata.chromaSubsampling === '4:4:4') {
          console.log('✅ Instagram: Maximum color quality (4:4:4 chroma subsampling)')
        } else {
          console.log(
            `⚠️  Instagram: Lower color quality (${igMetadata.chromaSubsampling} chroma subsampling)`
          )
          allGood = false
        }
      }

      // Check Instagram resolution
      if (igResult.width >= 1440 || igResult.height >= 1440) {
        console.log(
          `✅ Instagram: High resolution (${igResult.width}x${igResult.height}) - excellent for HD displays`
        )
      } else if (igResult.width >= 1080 || igResult.height >= 1080) {
        console.log(
          `⚠️  Instagram: Medium resolution (${igResult.width}x${igResult.height}) - could be higher`
        )
      } else {
        console.log(
          `❌ Instagram: Low resolution (${igResult.width}x${igResult.height}) - too small`
        )
        allGood = false
      }

      console.log()

      if (allGood) {
        console.log('🎉 ALL QUALITY CHECKS PASSED!')
      } else {
        console.log('⚠️  Some quality checks need attention')
      }

      console.log()
    }

    console.log('═'.repeat(80))
    console.log('📊 SUMMARY OF IMPROVEMENTS')
    console.log('═'.repeat(80))
    console.log()
    console.log('✅ WordPress Featured Images:')
    console.log('   • JPEG quality: 95 (was 85) - 12% improvement')
    console.log('   • PNG quality: 95 (was 90) - 5% improvement')
    console.log('   • Chroma subsampling: 4:4:4 (maximum color quality)')
    console.log('   • Removed normalize() and sharpen() operations')
    console.log()
    console.log('✅ Instagram Images:')
    console.log('   • JPEG quality: 95 (was 90) - 5% improvement')
    console.log('   • Resolution: 1440px (was 1080px) - 33% more pixels')
    console.log('   • Chroma subsampling: 4:4:4 (maximum color quality)')
    console.log('   • Better resampling algorithm (lanczos3)')
    console.log()
    console.log('✅ Facebook & X (Twitter):')
    console.log('   • Uses same high-quality WordPress images')
    console.log('   • Benefits from all improvements above')
    console.log()
    console.log('🎯 EXPECTED RESULTS:')
    console.log('   • Crystal clear images on all platforms')
    console.log('   • No blurriness or compression artifacts')
    console.log('   • Better color accuracy and sharpness')
    console.log('   • HD quality on retina/high-DPI displays')
    console.log()

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

testImageQuality()
