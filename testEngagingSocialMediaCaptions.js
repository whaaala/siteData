/**
 * Test Enhanced Social Media Caption Generator
 * Tests AI-powered captions for Facebook, Instagram, and Twitter/X
 */

import {
  formatEngagingFacebookPost,
  formatEngagingInstagramPost,
  formatEngagingTwitterPost,
} from './socialMediaCaptionGenerator.js'

console.log('=== Testing Enhanced Social Media Caption Generator ===\n')

// Sample article data
const sampleArticles = [
  {
    title: 'Kunle Hamilton Criticizes BBNaija\'s Imisi, Sends Strong Message to Celestial Youths',
    excerpt:
      'The world of Nigerian reality television experienced another historic moment as Opeyemi Ayanwale, popularly known as Imisi, clinched the title of winner for Season 10 of Big Brother Naija (BBNaija). Her triumph, however, has sparked deep conversations—not only among viewers but within religious communities and their leaders.',
    category: 'Entertainment',
    link: 'https://nowahalazone.com/kunle-hamilton-criticizes-bbnaijas-imisi/',
  },
  {
    title: 'Video Reportedly Shows Single Mother in Tears After Selling Phone to Feed Child',
    excerpt:
      'In a heart-wrenching scene that has ignited conversations across Nigerian social media and beyond, a video purportedly captures a single mother breaking down in tears after being compelled to sell her mobile phone to buy food for her young daughter.',
    category: 'News',
    link: 'https://nowahalazone.com/single-mother-sells-phone-to-feed-child/',
  },
  {
    title: 'Super Eagles Qualify for AFCON 2025 After Thrilling Victory',
    excerpt:
      'Nigeria\'s Super Eagles secured their spot in the 2025 Africa Cup of Nations with a commanding 3-1 victory over rivals Ghana in Abuja. Goals from Victor Osimhen, Ademola Lookman, and Samuel Chukwueze sealed the qualification.',
    category: 'Sports',
    link: 'https://nowahalazone.com/super-eagles-afcon-2025/',
  },
]

async function testCaptions() {
  try {
    for (const article of sampleArticles) {
      console.log('═'.repeat(80))
      console.log(`📰 ARTICLE: ${article.title}`)
      console.log(`📂 CATEGORY: ${article.category}`)
      console.log('═'.repeat(80))
      console.log()

      // Test Facebook
      console.log('📘 FACEBOOK CAPTION:')
      console.log('─'.repeat(80))
      const fbCaption = await formatEngagingFacebookPost(
        article.title,
        article.excerpt,
        article.category,
        article.link
      )
      console.log(fbCaption)
      console.log()
      console.log(`✓ Length: ${fbCaption.length} characters`)
      console.log()

      // Test Instagram
      console.log('📸 INSTAGRAM CAPTION:')
      console.log('─'.repeat(80))
      const igCaption = await formatEngagingInstagramPost(
        article.title,
        article.excerpt,
        article.category
      )
      console.log(igCaption)
      console.log(`\n🔗 ${article.link}`)
      console.log()
      console.log(`✓ Length: ${igCaption.length + article.link.length + 5} characters`)
      console.log()

      // Test Twitter/X
      console.log('🐦 TWITTER/X CAPTION:')
      console.log('─'.repeat(80))
      const twitterCaption = await formatEngagingTwitterPost(
        article.title,
        article.excerpt,
        article.category,
        article.link
      )
      console.log(twitterCaption)
      console.log()
      console.log(
        `✓ Length: ${twitterCaption.length} characters ${twitterCaption.length <= 280 ? '✅' : '❌ (exceeds 280)'}`
      )
      console.log()
      console.log()
    }

    console.log('═'.repeat(80))
    console.log('✅ TEST COMPLETED SUCCESSFULLY')
    console.log('═'.repeat(80))
    console.log()
    console.log('KEY IMPROVEMENTS:')
    console.log('  ✓ Attention-grabbing hooks (questions, surprising facts, emotions)')
    console.log('  ✓ Strategic emoji usage for visual appeal')
    console.log('  ✓ Platform-specific hashtags (Nigerian/African trending tags)')
    console.log('  ✓ Call-to-actions (comment, share, tag, engage)')
    console.log('  ✓ Conversational tone with Nigerian expressions')
    console.log('  ✓ Optimized length for each platform')
    console.log()
    console.log('PLATFORM OPTIMIZATIONS:')
    console.log('  📘 Facebook: Storytelling format, community-focused, 3-5 hashtags')
    console.log('  📸 Instagram: Visual appeal, 5-10 hashtags, line breaks for readability')
    console.log('  🐦 Twitter/X: Punchy and concise, 1-3 hashtags, max 280 characters')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

testCaptions()
