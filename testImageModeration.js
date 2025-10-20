import { analyzeImageWithVision } from './contentModeration.js'
import dotenv from 'dotenv'

dotenv.config()

async function testImageModeration() {
  console.log('=== Testing Image Moderation with OpenAI Vision ===\n')

  // Test with the problematic image that got you suspended
  const testImages = [
    {
      name: 'Sterling Bank Image (The one that caused suspension)',
      url: 'https://nowahalazone.com/wp-content/uploads/2025/10/Sterling_bank-750x536-1.jpg',
    },
    {
      name: 'Safe Test Image (Random)',
      url: 'https://picsum.photos/800/600',
    },
  ]

  for (const image of testImages) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: ${image.name}`)
    console.log(`URL: ${image.url}`)
    console.log('='.repeat(60))

    const analysis = await analyzeImageWithVision(image.url)

    console.log('\n📊 Analysis Result:')
    console.log(JSON.stringify(analysis, null, 2))

    if (analysis.isSafe) {
      console.log('\n✅ Image is SAFE for Facebook')
    } else {
      console.log('\n❌ Image is BLOCKED from Facebook')
      console.log(`Reason: ${analysis.reasoning}`)
      console.log(`Violations: ${analysis.violations?.join(', ') || 'N/A'}`)
      console.log(`Severity: ${analysis.severity}`)
    }
  }

  console.log('\n=== Test Complete ===')
}

testImageModeration().catch((error) => {
  console.error('Test error:', error)
})
