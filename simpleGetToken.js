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

async function getTokenSimple() {
  console.log('=== Simple Facebook/Instagram Token Setup ===\n')

  console.log('This script will help you get a Page Access Token for Instagram posting.\n')

  console.log('Step 1: Get ANY User Access Token')
  console.log('─'.repeat(60))
  console.log('1. Go to: https://developers.facebook.com/tools/explorer/')
  console.log('2. Make sure your app is selected in the top-right dropdown')
  console.log('3. Just click "Generate Access Token" (don\'t worry about permissions)')
  console.log('4. Allow any permissions it asks for')
  console.log('5. Copy the token from the "Access Token" field')
  console.log('─'.repeat(60))
  console.log()

  const userToken = await question('Paste your User Access Token here: ')

  if (!userToken || userToken.trim().length < 50) {
    console.error('❌ Invalid token. Please try again.')
    rl.close()
    return
  }

  console.log('\n' + '─'.repeat(60))
  console.log('Analyzing your token and fetching pages...\n')

  try {
    // First, let's see what we're working with
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${encodeURIComponent(userToken.trim())}&access_token=${encodeURIComponent(userToken.trim())}`
    const debugResponse = await axios.get(debugUrl)

    if (debugResponse.data?.data) {
      const tokenInfo = debugResponse.data.data
      console.log('Token Info:')
      console.log(`  App ID: ${tokenInfo.app_id}`)
      console.log(`  Type: ${tokenInfo.type}`)
      console.log(`  Valid: ${tokenInfo.is_valid}`)
      console.log(`  Scopes: ${tokenInfo.scopes?.join(', ') || 'None'}`)
      console.log()
    }

    // Get pages
    console.log('Fetching your Facebook Pages...\n')
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${encodeURIComponent(userToken.trim())}`
    const pagesResponse = await axios.get(pagesUrl)

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      console.error('❌ No Facebook Pages found!\n')
      console.error('This means either:')
      console.error('  1. You don\'t admin any Facebook Pages')
      console.error('  2. Your app needs "pages_show_list" permission')
      console.error('  3. You need to add "Page Public Access" to your app\n')

      console.log('How to fix:')
      console.log('─'.repeat(60))
      console.log('1. Go to: https://developers.facebook.com/apps/')
      console.log('2. Click on your app')
      console.log('3. Go to "App Review" → "Permissions and Features"')
      console.log('4. Find "pages_show_list" and click "Request Advanced Access"')
      console.log('5. (For testing, Development Mode apps can use this without review)')
      console.log('─'.repeat(60))

      rl.close()
      return
    }

    console.log(`✅ Found ${pagesResponse.data.data.length} page(s)!\n`)

    for (const page of pagesResponse.data.data) {
      console.log('='.repeat(60))
      console.log(`📄 Page: ${page.name}`)
      console.log('='.repeat(60))
      console.log(`Page ID: ${page.id}`)
      console.log(`Category: ${page.category}`)
      console.log(`Access Token: ${page.access_token.substring(0, 30)}...`)
      console.log()

      // Try to get Instagram info
      try {
        const igCheckUrl = `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${encodeURIComponent(page.access_token)}`
        const igCheckResponse = await axios.get(igCheckUrl)

        if (igCheckResponse.data.instagram_business_account) {
          const igId = igCheckResponse.data.instagram_business_account.id
          console.log('✅ Instagram Account: LINKED')
          console.log(`   Instagram Account ID: ${igId}`)

          // Try to get username
          try {
            const igInfoUrl = `https://graph.facebook.com/v18.0/${igId}?fields=username&access_token=${encodeURIComponent(page.access_token)}`
            const igInfoResponse = await axios.get(igInfoUrl)
            console.log(`   Username: @${igInfoResponse.data.username}`)
          } catch (e) {
            console.log('   (Could not fetch username - may need instagram_basic permission)')
          }

          console.log()
          console.log('✅ READY FOR INSTAGRAM! Add these to your .env:')
          console.log('─'.repeat(60))
          console.log(`FACEBOOK_PAGE_ID=${page.id}`)
          console.log(`FACEBOOK_ACCESS_TOKEN=${page.access_token}`)
          console.log(`INSTAGRAM_ACCOUNT_ID=${igId}`)
          console.log(`INSTAGRAM_ACCESS_TOKEN=${page.access_token}`)
          console.log('─'.repeat(60))

        } else {
          console.log('⚠️  Instagram Account: NOT LINKED')
          console.log()
          console.log('To link Instagram to this page:')
          console.log('  1. Open Instagram app on your phone')
          console.log('  2. Settings → Account → Switch to Professional Account')
          console.log('  3. Choose "Business" and connect to this Facebook Page')
          console.log()
          console.log('Or via Facebook:')
          console.log(`  1. Go to: https://www.facebook.com/${page.id}/settings/`)
          console.log('  2. Click "Instagram" in the sidebar')
          console.log('  3. Click "Connect Account"')
          console.log()
          console.log('For now, you can still use this for Facebook posting:')
          console.log('─'.repeat(60))
          console.log(`FACEBOOK_PAGE_ID=${page.id}`)
          console.log(`FACEBOOK_ACCESS_TOKEN=${page.access_token}`)
          console.log('─'.repeat(60))
        }

      } catch (igError) {
        console.log('⚠️  Could not check Instagram connection')
        console.log('   Error:', igError.response?.data?.error?.message || igError.message)

        if (igError.response?.data?.error?.code === 190) {
          console.log('   This might mean the app needs Instagram permissions configured.')
        }

        console.log()
        console.log('You can still use this token for Facebook:')
        console.log('─'.repeat(60))
        console.log(`FACEBOOK_PAGE_ID=${page.id}`)
        console.log(`FACEBOOK_ACCESS_TOKEN=${page.access_token}`)
        console.log('─'.repeat(60))
      }

      console.log()
    }

    console.log('='.repeat(60))
    console.log('IMPORTANT: Token Expiration')
    console.log('='.repeat(60))
    console.log('The tokens above are SHORT-LIVED (expire in 1-2 hours).')
    console.log('To get LONG-LIVED tokens that don\'t expire:')
    console.log('  1. Copy one of the tokens above')
    console.log('  2. Run: node exchangeForLongLivedToken.js')
    console.log('  3. Follow the prompts')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.error || error.message)

    if (error.response?.data?.error) {
      const err = error.response.data.error
      console.error('\nError Details:')
      console.error(`  Code: ${err.code}`)
      console.error(`  Type: ${err.type}`)
      console.error(`  Message: ${err.message}`)

      if (err.code === 190) {
        console.error('\n⚠️  Your token is invalid or expired.')
        console.error('Go back to Graph API Explorer and generate a new one.')
      }
    }
  }

  rl.close()
}

getTokenSimple().catch(error => {
  console.error('Script error:', error)
  rl.close()
  process.exit(1)
})
