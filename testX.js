import { verifyXCredentials, postToX, formatTweetText } from './x.js'
import dotenv from 'dotenv'

dotenv.config()

async function testXIntegration() {
  console.log('=== Testing X (Twitter) Integration ===\n')

  // Step 1: Verify credentials
  console.log('Step 1: Verifying X credentials...')
  console.log('─'.repeat(80))

  const isValid = await verifyXCredentials()

  if (!isValid) {
    console.log('❌ X credentials are invalid or missing!')
    console.log('\nPlease check:')
    console.log('  1. X_API_KEY is set in .env')
    console.log('  2. X_API_SECRET is set in .env')
    console.log('  3. X_ACCESS_TOKEN is set in .env')
    console.log('  4. X_ACCESS_SECRET is set in .env')
    console.log('\nSee X_SETUP.md for detailed setup instructions.')
    process.exit(1)
  }

  console.log('✅ X credentials are valid!')
  console.log('─'.repeat(80))
  console.log()

  // Step 2: Test tweet posting with image
  console.log('Step 2: Testing tweet post with image...')
  console.log('─'.repeat(80))

  const testTitle = "Test Post: Nigeria's Tech Scene Shows Strong Growth"
  const testExcerpt = "The Nigerian technology sector continues to attract significant investment and talent, positioning itself as a major hub for innovation in Africa."
  const testLink = "https://nowahalazone.com/test-article"
  const testImage = "https://picsum.photos/1080/1080"

  // Format tweet text
  const tweetText = formatTweetText(testTitle, testExcerpt, testLink)

  console.log('\nTest Tweet Format:')
  console.log('─'.repeat(80))
  console.log(tweetText)
  console.log('─'.repeat(80))
  console.log(`Character count: ${tweetText.length}/280`)
  console.log()

  try {
    const result = await postToX({
      imageUrl: testImage,
      text: tweetText,
      link: testLink,
    })

    if (result && result.success) {
      console.log('✅ Successfully posted to X!')
      console.log(`Tweet ID: ${result.tweetId}`)
      console.log(`Tweet URL: https://x.com/i/web/status/${result.tweetId}`)
      console.log()
      console.log('🎉 Check your X profile to see the test tweet!')
    } else {
      console.log('❌ Failed to post to X')
      console.log('Check the error messages above for details.')
    }

  } catch (error) {
    console.log('❌ Error during test:')
    console.log(`   ${error.message}`)
  }

  console.log('─'.repeat(80))
  console.log()

  console.log('=== Test Complete ===\n')

  console.log('📋 Next Steps:')
  console.log('  1. Check your X profile to see the test tweet')
  console.log('  2. Delete the test tweet if desired')
  console.log('  3. Your scraper is now ready to post to X automatically!')
  console.log()
  console.log('Your scraper will post to X after publishing to WordPress.')
  console.log('Posts will include: Title + Excerpt + Link + Image')
  console.log()
}

testXIntegration().catch(error => {
  console.error('Test script error:', error.message)
  process.exit(1)
})
