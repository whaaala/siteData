import axios from 'axios'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function setupAllTokens() {
  console.log('=== Complete Facebook + Instagram Token Setup ===\n')

  console.log('This script will get you BOTH:')
  console.log('  ✅ Facebook Page Access Token (with correct permissions)')
  console.log('  ✅ Instagram Account ID\n')

  console.log('Step 1: Generate a NEW User Access Token')
  console.log('─'.repeat(60))
  console.log('1. Go to: https://developers.facebook.com/tools/explorer/')
  console.log('2. Select your app from the dropdown')
  console.log('3. Click "Generate Access Token"')
  console.log('4. When permission dialog appears, make sure these are checked:')
  console.log('   ✓ pages_show_list')
  console.log('   ✓ pages_manage_posts (NOT publish_actions!)')
  console.log('   ✓ pages_read_engagement')
  console.log('   ✓ instagram_basic (if available)')
  console.log('   ✓ instagram_content_publish (if available)')
  console.log('5. Click "Generate" and copy the token')
  console.log('─'.repeat(60))
  console.log()

  const userToken = await question('Paste your NEW User Access Token: ')

  if (!userToken || userToken.trim().length < 50) {
    console.error('❌ Invalid token.')
    rl.close()
    return
  }

  console.log('\n' + '='.repeat(60))
  console.log('Verifying token and fetching pages...')
  console.log('='.repeat(60))
  console.log()

  try {
    // Verify token
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${encodeURIComponent(userToken.trim())}&access_token=${encodeURIComponent(userToken.trim())}`
    const debugResponse = await axios.get(debugUrl)

    if (debugResponse.data?.data) {
      const tokenInfo = debugResponse.data.data
      console.log('Token Information:')
      console.log('  Type:', tokenInfo.type)
      console.log('  App ID:', tokenInfo.app_id)
      console.log('  Scopes:', tokenInfo.scopes?.join(', ') || 'None')
      console.log()

      // Check for required permissions
      const scopes = tokenInfo.scopes || []
      const hasPagesManagePosts = scopes.includes('pages_manage_posts')
      const hasPagesShowList = scopes.includes('pages_show_list')
      const hasInstagramBasic = scopes.includes('instagram_basic')
      const hasInstagramPublish = scopes.includes('instagram_content_publish')

      console.log('Permission Check:')
      console.log(`  ${hasPagesShowList ? '✅' : '❌'} pages_show_list`)
      console.log(`  ${hasPagesManagePosts ? '✅' : '⚠️ '} pages_manage_posts ${!hasPagesManagePosts ? '(REQUIRED for Facebook posting!)' : ''}`)
      console.log(`  ${hasInstagramBasic ? '✅' : '⚠️ '} instagram_basic ${!hasInstagramBasic ? '(needed for Instagram)' : ''}`)
      console.log(`  ${hasInstagramPublish ? '✅' : '⚠️ '} instagram_content_publish ${!hasInstagramPublish ? '(needed for Instagram)' : ''}`)
      console.log()

      if (!hasPagesManagePosts) {
        console.error('❌ Missing pages_manage_posts permission!')
        console.error('This is REQUIRED for posting to Facebook.')
        console.error('Please generate a new token with this permission checked.\n')
      }

      if (!hasInstagramBasic || !hasInstagramPublish) {
        console.log('⚠️  Missing Instagram permissions.')
        console.log('If you want Instagram posting, you need to add Instagram')
        console.log('product to your app first (see FACEBOOK_APP_SETUP.md)\n')
      }
    }

    // Get pages
    console.log('Fetching your Facebook Pages...\n')
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${encodeURIComponent(userToken.trim())}`
    const pagesResponse = await axios.get(pagesUrl)

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      console.error('❌ No pages found with me/accounts!\n')

      // Try direct page access as fallback
      console.log('Trying alternative method...\n')
      const knownPageId = await question('Enter your Facebook Page ID (if you know it): ')

      if (knownPageId && knownPageId.trim()) {
        console.log('\nAttempting to access page directly...\n')

        try {
          const pageUrl = `https://graph.facebook.com/v18.0/${knownPageId.trim()}?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(userToken.trim())}`
          const pageResponse = await axios.get(pageUrl)

          if (pageResponse.data.access_token) {
            const pageToken = pageResponse.data.access_token
            console.log('✅ Got Page Access Token!')
            console.log(`   Page: ${pageResponse.data.name}`)
            console.log(`   ID: ${pageResponse.data.id}`)
            console.log()

            // Check Instagram
            if (pageResponse.data.instagram_business_account) {
              const igId = pageResponse.data.instagram_business_account.id
              console.log('✅ Instagram Account Found!')
              console.log(`   Instagram Account ID: ${igId}`)
              console.log()

              console.log('='.repeat(60))
              console.log('✅ SUCCESS! Add these to your .env:')
              console.log('='.repeat(60))
              console.log(`FACEBOOK_PAGE_ID=${pageResponse.data.id}`)
              console.log(`FACEBOOK_ACCESS_TOKEN=${pageToken}`)
              console.log(`INSTAGRAM_ACCOUNT_ID=${igId}`)
              console.log(`INSTAGRAM_ACCESS_TOKEN=${pageToken}`)
              console.log('='.repeat(60))
            } else {
              console.log('⚠️  No Instagram account linked to this page\n')
              console.log('For Facebook only:')
              console.log('─'.repeat(60))
              console.log(`FACEBOOK_PAGE_ID=${pageResponse.data.id}`)
              console.log(`FACEBOOK_ACCESS_TOKEN=${pageToken}`)
              console.log('─'.repeat(60))
            }
          } else {
            console.error('❌ Could not get page access token.')
            console.error('You likely don\'t have admin access to this page.')
          }
        } catch (directError) {
          console.error('❌ Failed:', directError.response?.data?.error?.message || directError.message)
        }
      }

      rl.close()
      return
    }

    // Process each page
    console.log(`✅ Found ${pagesResponse.data.data.length} page(s)!\n`)

    for (const page of pagesResponse.data.data) {
      console.log('='.repeat(60))
      console.log(`📄 ${page.name}`)
      console.log('='.repeat(60))
      console.log(`ID: ${page.id}`)
      console.log(`Category: ${page.category}`)
      console.log()

      const pageToken = page.access_token

      // Check Instagram connection
      try {
        const igCheckUrl = `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${encodeURIComponent(pageToken)}`
        const igCheckResponse = await axios.get(igCheckUrl)

        if (igCheckResponse.data.instagram_business_account) {
          const igId = igCheckResponse.data.instagram_business_account.id

          // Get Instagram username
          let username = 'Unknown'
          try {
            const igInfoUrl = `https://graph.facebook.com/v18.0/${igId}?fields=username&access_token=${encodeURIComponent(pageToken)}`
            const igInfoResponse = await axios.get(igInfoUrl)
            username = igInfoResponse.data.username
          } catch (e) {
            // Ignore username fetch errors
          }

          console.log('✅ Instagram: LINKED')
          console.log(`   Account ID: ${igId}`)
          console.log(`   Username: @${username}`)
          console.log()

          console.log('Add these to your .env:')
          console.log('─'.repeat(60))
          console.log(`FACEBOOK_PAGE_ID=${page.id}`)
          console.log(`FACEBOOK_ACCESS_TOKEN=${pageToken}`)
          console.log(`INSTAGRAM_ACCOUNT_ID=${igId}`)
          console.log(`INSTAGRAM_ACCESS_TOKEN=${pageToken}`)
          console.log('─'.repeat(60))

        } else {
          console.log('⚠️  Instagram: NOT LINKED')
          console.log()
          console.log('To link Instagram:')
          console.log('  1. Convert Instagram to Business Account')
          console.log('  2. Link to this Facebook Page')
          console.log()
          console.log('For Facebook only:')
          console.log('─'.repeat(60))
          console.log(`FACEBOOK_PAGE_ID=${page.id}`)
          console.log(`FACEBOOK_ACCESS_TOKEN=${pageToken}`)
          console.log('─'.repeat(60))
        }

      } catch (igError) {
        console.log('⚠️  Could not check Instagram')
        console.log(`   Error: ${igError.response?.data?.error?.message || igError.message}`)
        console.log()
        console.log('For Facebook only:')
        console.log('─'.repeat(60))
        console.log(`FACEBOOK_PAGE_ID=${page.id}`)
        console.log(`FACEBOOK_ACCESS_TOKEN=${pageToken}`)
        console.log('─'.repeat(60))
      }

      console.log()
    }

    console.log('='.repeat(60))
    console.log('⚠️  IMPORTANT: These are SHORT-LIVED tokens!')
    console.log('='.repeat(60))
    console.log('They expire in 1-2 hours.')
    console.log('To get LONG-LIVED (permanent) tokens:')
    console.log('  → Run: node exchangeForLongLivedToken.js')
    console.log('  → You\'ll need your App ID and App Secret')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message)
  }

  rl.close()
}

setupAllTokens().catch(error => {
  console.error('Script error:', error)
  rl.close()
  process.exit(1)
})
