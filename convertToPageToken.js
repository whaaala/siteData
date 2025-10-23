import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

async function convertToPageToken() {
  console.log('=== Converting User Token to Page Token ===\n')

  const userToken = process.env.FACEBOOK_ACCESS_TOKEN
  const targetPageId = process.env.FACEBOOK_PAGE_ID

  if (!userToken) {
    console.error('❌ No token found in .env file!')
    process.exit(1)
  }

  console.log(`User Token: ${userToken.substring(0, 30)}...`)
  console.log(`Target Page ID: ${targetPageId}`)
  console.log()

  try {
    // Step 1: Get all pages this user token can access
    console.log('🔍 Step 1: Finding your pages...')
    console.log('─'.repeat(80))

    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${encodeURIComponent(userToken)}`
    const pagesResponse = await axios.get(pagesUrl)

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      console.error('❌ No pages found for this user token!')
      process.exit(1)
    }

    console.log(`✅ Found ${pagesResponse.data.data.length} page(s):\n`)

    // Step 2: Find the target page and get its Page Access Token
    let targetPage = null
    for (const page of pagesResponse.data.data) {
      console.log(`  • ${page.name} (ID: ${page.id})`)
      if (page.id === targetPageId) {
        targetPage = page
        console.log(`    ✅ This is your configured page!`)
        console.log(`    📝 Page Access Token found!`)
      }
    }

    console.log('─'.repeat(80))
    console.log()

    if (!targetPage) {
      console.error(`❌ Could not find page with ID: ${targetPageId}`)
      console.error('\nAvailable pages:')
      pagesResponse.data.data.forEach(page => {
        console.error(`  - ${page.name} (ID: ${page.id})`)
      })
      process.exit(1)
    }

    // Step 3: The page object already contains the Page Access Token!
    const pageToken = targetPage.access_token

    console.log('✅ Step 2: Successfully extracted Page Access Token!')
    console.log('─'.repeat(80))
    console.log()

    // Step 4: Check the Page token details
    console.log('🔍 Step 3: Checking Page token details...')
    console.log('─'.repeat(80))

    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${encodeURIComponent(pageToken)}&access_token=${encodeURIComponent(pageToken)}`
    const debugResponse = await axios.get(debugUrl)
    const tokenData = debugResponse.data.data

    console.log('✅ Page Token Information:')
    console.log(`   Type: ${tokenData.type}`)
    console.log(`   Valid: ${tokenData.is_valid}`)

    if (tokenData.expires_at === 0) {
      console.log(`   Expires: ✅ NEVER (Permanent!)`)
    } else {
      const expiryDate = new Date(tokenData.expires_at * 1000)
      console.log(`   Expires: ${expiryDate.toISOString()}`)
    }

    console.log(`   Permissions: ${tokenData.scopes ? tokenData.scopes.join(', ') : 'N/A'}`)
    console.log('─'.repeat(80))
    console.log()

    // Step 5: Test Instagram access
    console.log('🔍 Step 4: Testing Instagram access...')
    console.log('─'.repeat(80))

    const igAccountId = process.env.INSTAGRAM_ACCOUNT_ID

    try {
      const igUrl = `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,username&access_token=${encodeURIComponent(pageToken)}`
      const igResponse = await axios.get(igUrl)

      console.log('✅ Instagram Access Test:')
      console.log(`   Username: @${igResponse.data.username}`)
      console.log(`   ID: ${igResponse.data.id}`)
      console.log('\n✅ Page token can access Instagram!')
    } catch (error) {
      console.error('❌ Instagram access test failed')
      console.error(`   ${error.response?.data?.error?.message || error.message}`)
    }

    console.log('─'.repeat(80))
    console.log()

    // Step 6: Show the final tokens
    console.log('🎉 SUCCESS! Here are your tokens:')
    console.log('═'.repeat(80))
    console.log()
    console.log('📋 COPY THESE TO YOUR .env FILE:')
    console.log()
    console.log(`FACEBOOK_ACCESS_TOKEN=${pageToken}`)
    console.log(`INSTAGRAM_ACCESS_TOKEN=${pageToken}`)
    console.log()
    console.log('═'.repeat(80))
    console.log()

    if (tokenData.expires_at === 0) {
      console.log('✅ This is a PERMANENT token that will never expire!')
    } else {
      console.log('⚠️  This token will expire. Consider generating a long-lived token.')
    }

    console.log()
    console.log('Next steps:')
    console.log('  1. Copy the tokens above to your .env file')
    console.log('  2. Run: node testFacebook.js')
    console.log('  3. Run: node testInstagram.js')
    console.log()

  } catch (error) {
    console.error('❌ Error during conversion:')
    console.error(`   ${error.response?.data?.error?.message || error.message}`)
    console.error(`   Code: ${error.response?.data?.error?.code}`)
    process.exit(1)
  }
}

convertToPageToken().catch(error => {
  console.error('Script error:', error.message)
  process.exit(1)
})
