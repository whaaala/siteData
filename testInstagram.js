import { verifyInstagramToken, postPhotoToInstagram } from './instagram.js'
import dotenv from 'dotenv'

dotenv.config()

async function testInstagramIntegration() {
  console.log('=== Testing Instagram Integration ===\n')

  // Step 1: Verify Instagram token
  console.log('Step 1: Verifying Instagram access token...')
  const isValid = await verifyInstagramToken()

  if (!isValid) {
    console.error('\n❌ Instagram token verification failed!')
    console.error('Please check your INSTAGRAM_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN in .env')
    process.exit(1)
  }

  console.log('✅ Instagram token is valid!\n')

  // Step 2: Test posting a photo
  console.log('Step 2: Testing photo post to Instagram...')

  const testTitle = 'Test Post from Wahala Zone'
  const testExcerpt = 'This is a test post from the automated news aggregation system. Testing Instagram integration with AI content moderation.'
  const testWordPressUrl = 'https://nowahalazone.com/test-post'
  const testImageUrl = 'https://nowahalazone.com/wp-content/uploads/2024/10/rema-2-1.jpeg' // Instagram prefers square images

  // Format caption
  const testCaption = `${testTitle}\n\n${testExcerpt}\n\n🔗 Read more: ${testWordPressUrl}`

  console.log('\n' + '─'.repeat(60))
  console.log('Test Caption:')
  console.log('─'.repeat(60))
  console.log(testCaption)
  console.log('─'.repeat(60))
  console.log()

  const testPost = await postPhotoToInstagram({
    imageUrl: testImageUrl,
    caption: testCaption,
  })

  if (testPost && testPost.success) {
    console.log('✅ Successfully posted to Instagram!')
    console.log(`Post ID: ${testPost.postId}`)
    console.log('\nℹ️ Check your Instagram account to see the post!')
  } else {
    console.error('❌ Failed to post to Instagram')
    console.error('Check the error messages above for details')
  }

  console.log('\n=== Test Complete ===')
}

testInstagramIntegration().catch((error) => {
  console.error('Test error:', error)
  process.exit(1)
})
