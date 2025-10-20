import { verifyInstagramToken, postPhotoToInstagram, postStoryToInstagram } from './instagram.js'
import dotenv from 'dotenv'

dotenv.config()

async function testInstagramStory() {
  console.log('=== Testing Instagram Feed + Story Integration ===\n')

  // Step 1: Verify Instagram token
  console.log('Step 1: Verifying Instagram access token...')
  const isValid = await verifyInstagramToken()

  if (!isValid) {
    console.error('\n❌ Instagram token verification failed!')
    console.error('Please check your INSTAGRAM_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN in .env')
    process.exit(1)
  }

  console.log('✅ Instagram token is valid!\n')

  // Test data
  const testTitle = 'Breaking: Instagram Stories Now Have Clickable Links!'
  const testExcerpt = 'Great news for content creators! Instagram Stories posted via API now support clickable link stickers. This means your audience can click directly to your website from your story.'
  const testWordPressUrl = 'https://nowahalazone.com/instagram-clickable-links-test'
  const testImageUrl = 'https://picsum.photos/1080/1920' // Vertical image for stories (9:16)

  console.log('='.repeat(60))
  console.log('Test Content:')
  console.log('='.repeat(60))
  console.log(`Title: ${testTitle}`)
  console.log(`Excerpt: ${testExcerpt.substring(0, 100)}...`)
  console.log(`URL: ${testWordPressUrl}`)
  console.log(`Image: ${testImageUrl}`)
  console.log('='.repeat(60))
  console.log()

  // Step 2: Test Feed Post (permanent, URL not clickable)
  console.log('Step 2: Testing Instagram Feed Post...')
  console.log('─'.repeat(60))

  const feedCaption = `${testTitle}\n\n${testExcerpt}\n\n🔗 ${testWordPressUrl}`

  console.log('Feed Caption Preview:')
  console.log('─'.repeat(60))
  console.log(feedCaption)
  console.log('─'.repeat(60))
  console.log('Note: URL in feed caption is NOT clickable (Instagram limitation)')
  console.log()

  const feedResult = await postPhotoToInstagram({
    imageUrl: 'https://picsum.photos/1080/1080', // Square for feed
    caption: feedCaption,
  })

  if (feedResult && feedResult.success) {
    console.log('✅ Successfully posted to Instagram Feed!')
    console.log(`Feed Post ID: ${feedResult.postId}`)
    console.log()
  } else {
    console.error('❌ Failed to post to Instagram Feed')
    console.error('Cannot proceed to Story test without Feed success')
    process.exit(1)
  }

  // Step 3: Test Story Post (24 hours, CLICKABLE link)
  console.log('Step 3: Testing Instagram Story with Clickable Link...')
  console.log('─'.repeat(60))
  console.log('Story Details:')
  console.log(`  • Image: ${testImageUrl}`)
  console.log(`  • Clickable Link: ${testWordPressUrl}`)
  console.log(`  • Duration: 24 hours`)
  console.log('─'.repeat(60))
  console.log()

  const storyResult = await postStoryToInstagram({
    imageUrl: testImageUrl,
    link: testWordPressUrl, // This creates a CLICKABLE link sticker!
  })

  if (storyResult && storyResult.success) {
    console.log('✅ Successfully posted to Instagram Story!')
    console.log(`Story ID: ${storyResult.storyId}`)
    console.log()
    console.log('🎉 Story Features:')
    console.log('  ✅ Clickable link sticker')
    console.log('  ✅ Users can swipe up or tap to visit your site')
    console.log('  ✅ Available for 24 hours')
    console.log('  ✅ Can be saved to Story Highlights')
    console.log()
  } else {
    console.error('❌ Failed to post to Instagram Story')
    console.error('Check the error messages above for details')
  }

  console.log('='.repeat(60))
  console.log('Test Summary:')
  console.log('='.repeat(60))
  console.log(`Feed Post: ${feedResult?.success ? '✅ Posted' : '❌ Failed'}`)
  console.log(`Story Post: ${storyResult?.success ? '✅ Posted (with clickable link!)' : '❌ Failed'}`)
  console.log()
  console.log('📱 Check your Instagram account:')
  console.log('  1. Feed: Look for the test post with URL (not clickable)')
  console.log('  2. Story: Tap your profile picture - should have clickable link!')
  console.log('='.repeat(60))

  console.log('\n=== Test Complete ===')
}

testInstagramStory().catch((error) => {
  console.error('Test error:', error)
  process.exit(1)
})
