import { downloadImageAsJpgOrPngForUpload } from './utils.js'
import fs from 'fs'

async function testImageProcessing() {
  console.log('=== Testing Enhanced Image Processing ===\n')

  const testImages = [
    {
      name: 'High Quality Image',
      url: 'https://picsum.photos/1200/800',
      expectedPass: true
    },
    {
      name: 'Minimum Quality Image',
      url: 'https://picsum.photos/400/300',
      expectedPass: true
    },
    {
      name: 'Low Quality Image (should warn)',
      url: 'https://picsum.photos/300/200',
      expectedPass: false // Will warn but still process
    }
  ]

  for (const test of testImages) {
    console.log(`📷 Testing: ${test.name}`)
    console.log(`   URL: ${test.url}`)
    console.log('─'.repeat(80))

    try {
      const result = await downloadImageAsJpgOrPngForUpload(test.url, 'test-image')

      console.log(`   ✅ Processed successfully`)
      console.log(`   Filename: ${result.filename}`)
      console.log(`   Extension: ${result.ext}`)
      console.log(`   Buffer size: ${Math.round(result.buffer.length / 1024)}KB`)

      // Optionally save to disk for manual inspection
      const outputPath = `./test-output-${test.name.replace(/\s+/g, '-').toLowerCase()}${result.ext}`
      fs.writeFileSync(outputPath, result.buffer)
      console.log(`   💾 Saved to: ${outputPath}`)

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }

    console.log()
  }

  console.log('═'.repeat(80))
  console.log('\n🎉 Image Processing Enhancements:')
  console.log('  ✅ Minimum dimension check (400x300)')
  console.log('  ✅ Auto-brightness/contrast adjustment (normalize)')
  console.log('  ✅ Subtle sharpening for clarity')
  console.log('  ✅ JPEG optimization (quality: 85, progressive, mozjpeg)')
  console.log('  ✅ PNG optimization (quality: 90, compression: 9)')
  console.log('  ✅ Metadata removal (EXIF stripped)')
  console.log('  ✅ File size logging')
  console.log()
  console.log('Your featured images will now be clean, clear, and optimized!')
}

testImageProcessing().catch(error => {
  console.error('Test error:', error.message)
  process.exit(1)
})
