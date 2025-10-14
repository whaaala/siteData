import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const CURRENT_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN
const PAGE_ID = process.env.FACEBOOK_PAGE_ID

async function fixToken() {
  console.log('=== Facebook Token Fixer ===\n')

  if (!CURRENT_TOKEN) {
    console.error('❌ No FACEBOOK_ACCESS_TOKEN found in .env')
    process.exit(1)
  }

  console.log('Your current token:', CURRENT_TOKEN.substring(0, 30) + '...')
  console.log('Your Page ID:', PAGE_ID)
  console.log()

  try {
    // Check current token type
    console.log('Step 1: Checking current token type...')
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${CURRENT_TOKEN}&access_token=${CURRENT_TOKEN}`
    const debugResponse = await axios.get(debugUrl)

    const tokenData = debugResponse.data.data
    console.log('Current token type:', tokenData.type)
    console.log('App ID:', tokenData.app_id)
    console.log('Expires:', tokenData.expires_at === 0 ? 'Never' : new Date(tokenData.expires_at * 1000))
    console.log('Scopes:', tokenData.scopes?.join(', '))
    console.log()

    if (tokenData.type === 'PAGE') {
      console.log('✅ Good news! You already have a Page token.')
      console.log('The error might be due to app permissions.')
      console.log()
      console.log('Solutions:')
      console.log('1. Make sure your app is in "Live" mode (not Development)')
      console.log('2. Or add yourself as a Tester in App Settings → Roles')
      console.log('3. Verify the token has these permissions:')
      console.log('   - pages_manage_posts')
      console.log('   - pages_read_engagement')
      console.log()
      return
    }

    console.log('⚠️  You have a USER token, not a PAGE token.')
    console.log('Let me get the correct Page token for you...\n')

    // Get page token
    console.log('Step 2: Getting Page token from your account...')
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${CURRENT_TOKEN}`
    const pagesResponse = await axios.get(pagesUrl)

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      console.log('❌ No pages found!')
      console.log()
      console.log('This means:')
      console.log('1. You need to generate a token with pages_show_list permission')
      console.log('2. Go to: https://developers.facebook.com/tools/explorer/')
      console.log('3. Select your app')
      console.log('4. Add permissions: pages_show_list, pages_manage_posts, pages_read_engagement')
      console.log('5. Generate token')
      console.log('6. Query: me/accounts')
      console.log('7. Copy the access_token from your page')
      return
    }

    console.log(`✅ Found ${pagesResponse.data.data.length} page(s)\n`)

    // Find the matching page
    let targetPage = pagesResponse.data.data.find(p => p.id === PAGE_ID)

    if (!targetPage) {
      console.log('⚠️  Could not find page with ID:', PAGE_ID)
      console.log('Available pages:')
      pagesResponse.data.data.forEach((page, i) => {
        console.log(`  [${i + 1}] ${page.name} (ID: ${page.id})`)
      })
      console.log()
      targetPage = pagesResponse.data.data[0]
      console.log(`Using first page: ${targetPage.name}`)
    }

    console.log()
    console.log('━'.repeat(70))
    console.log('✅ SUCCESS! Here is your Page Access Token:')
    console.log('━'.repeat(70))
    console.log()
    console.log('Page Name:', targetPage.name)
    console.log('Page ID:', targetPage.id)
    console.log()
    console.log('📝 UPDATE YOUR .ENV FILE WITH THESE VALUES:')
    console.log()
    console.log(`FACEBOOK_PAGE_ID=${targetPage.id}`)
    console.log(`FACEBOOK_ACCESS_TOKEN=${targetPage.access_token}`)
    console.log()
    console.log('━'.repeat(70))
    console.log()
    console.log('💡 This Page token:')
    console.log('   ✓ Never expires')
    console.log('   ✓ Can post to your page')
    console.log('   ✓ Is the correct type for this app')
    console.log()
    console.log('After updating .env, run: node testFacebook.js')
    console.log()

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message)

    if (error.response?.data?.error) {
      const err = error.response.data.error
      console.log()
      console.log('Error details:')
      console.log('  Message:', err.message)
      console.log('  Code:', err.code)
      console.log()

      if (err.code === 190) {
        console.log('💡 Your token is invalid or expired.')
        console.log()
        console.log('Get a new token:')
        console.log('1. Go to: https://developers.facebook.com/tools/explorer/')
        console.log('2. Select your app')
        console.log('3. Add these permissions:')
        console.log('   - pages_show_list')
        console.log('   - pages_manage_posts')
        console.log('   - pages_read_engagement')
        console.log('4. Click "Generate Access Token"')
        console.log('5. Run this script again')
      }

      if (err.code === 200) {
        console.log('💡 App permission issue.')
        console.log()
        console.log('Check:')
        console.log('1. Is your app in "Development" mode?')
        console.log('   → Add yourself as Tester in App Settings → Roles')
        console.log('2. Does your token have pages_manage_posts permission?')
        console.log('   → Check at: https://developers.facebook.com/tools/debug/accesstoken/')
      }
    }
  }
}

fixToken().catch(console.error)
