import { verifyFacebookToken, postPhotoToFacebook } from './facebook.js'
import dotenv from 'dotenv'

dotenv.config()

async function testFacebookIntegration() {
  console.log('=== Testing Facebook Integration ===\n')

  // Step 1: Verify Facebook token
  console.log('Step 1: Verifying Facebook access token...')
  const isValid = await verifyFacebookToken()

  if (!isValid) {
    console.error('❌ Facebook token verification failed!')
    console.error('Please check your FACEBOOK_ACCESS_TOKEN in .env file')
    process.exit(1)
  }

  console.log('✅ Facebook token is valid!\n')

  // Step 2: Test posting (optional - comment out if you don't want to post during test)
  console.log('Step 2: Testing photo post to Facebook...')
  console.log('(This will create an actual post on your page with new format)')

  // Test with the new format: Title + Excerpt + WordPress URL
  const testTitle = 'Test Post: Nigeria\'s Economy Shows Strong Growth'
  const testExcerpt = 'This is a test post from the automated news system. The excerpt provides a brief summary of the article content, giving readers a preview of what they\'ll find when they click through to the full story.'
  const testWordPressUrl = 'https://nowahalazone.com/test-article'

  const testMessage = `${testTitle}\n\n${testExcerpt}\n\n📖 Read the full story:\n${testWordPressUrl}`

  console.log('\nTest post format:')
  console.log('─'.repeat(60))
  console.log(testMessage)
  console.log('─'.repeat(60))
  console.log()

  const testPost = await postPhotoToFacebook({
    imageUrl: 'https://picsum.photos/800/600', // Random test image
    message: testMessage,
    link: testWordPressUrl,
  })

  if (testPost && testPost.success) {
    console.log('✅ Successfully posted to Facebook!')
    console.log(`Post ID: ${testPost.postId}`)
  } else {
    console.error('❌ Failed to post to Facebook')
  }

  console.log('\n=== Test Complete ===')
}

testFacebookIntegration().catch(console.error)
