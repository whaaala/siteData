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

async function getPageAccessToken() {
  console.log('=== Facebook Page Access Token Helper ===\n')

  console.log('Step 1: Get a User Access Token with correct permissions')
  console.log('─'.repeat(60))
  console.log('1. Go to: https://developers.facebook.com/tools/explorer/')
  console.log('2. Select your Facebook App from the dropdown')
  console.log('3. Click "Generate Access Token"')
  console.log('4. When the permission dialog appears, make sure these are checked:')
  console.log('   ✓ pages_show_list')
  console.log('   ✓ pages_read_engagement')
  console.log('   ✓ pages_manage_posts')
  console.log('   ✓ instagram_basic')
  console.log('   ✓ instagram_content_publish')
  console.log('5. Click "Generate Access Token" and authorize')
  console.log('6. Copy the token from the "Access Token" field\n')

  const userToken = await question('Paste your User Access Token here: ')

  if (!userToken || userToken.trim().length < 50) {
    console.error('❌ Invalid token. Please try again.')
    rl.close()
    return
  }

  console.log('\n─'.repeat(60))
  console.log('Step 2: Fetching your Facebook Pages...\n')

  try {
    // Get the user's pages
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${encodeURIComponent(userToken.trim())}`
    const pagesResponse = await axios.get(pagesUrl)

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      console.error('❌ No Facebook Pages found!')
      console.error('\nPossible reasons:')
      console.error('  1. You don\'t have admin access to any Facebook Pages')
      console.error('  2. The token doesn\'t have "pages_show_list" permission')
      console.error('  3. You need to grant permissions when generating the token')
      console.error('\nTry again and make sure to:')
      console.error('  → Select ALL the permissions listed above')
      console.error('  → Click "Allow" when Facebook asks for permissions')
      rl.close()
      return
    }

    console.log(`✅ Found ${pagesResponse.data.data.length} page(s):\n`)

    pagesResponse.data.data.forEach((page, index) => {
      console.log(`${index + 1}. ${page.name}`)
      console.log(`   ID: ${page.id}`)
      console.log(`   Category: ${page.category}`)
      console.log()
    })

    console.log('─'.repeat(60))
    console.log('Step 3: Getting Page Access Token for each page...\n')

    for (const page of pagesResponse.data.data) {
      console.log(`Page: ${page.name} (ID: ${page.id})`)
      console.log('─'.repeat(60))

      // The page.access_token from me/accounts is already a Page Access Token
      const pageToken = page.access_token

      // Get detailed info about this page's Instagram connection
      try {
        const pageInfoUrl = `https://graph.facebook.com/v18.0/${page.id}?fields=id,name,instagram_business_account&access_token=${encodeURIComponent(pageToken)}`
        const pageInfoResponse = await axios.get(pageInfoUrl)

        console.log(`Page Access Token: ${pageToken.substring(0, 20)}...${pageToken.substring(pageToken.length - 10)}`)
        console.log(`Token Length: ${pageToken.length} characters`)

        if (pageInfoResponse.data.instagram_business_account) {
          const igAccountId = pageInfoResponse.data.instagram_business_account.id
          console.log(`\n✅ Instagram Business Account Found!`)
          console.log(`Instagram Account ID: ${igAccountId}`)

          // Try to get Instagram username
          try {
            const igInfoUrl = `https://graph.facebook.com/v18.0/${igAccountId}?fields=username,profile_picture_url&access_token=${encodeURIComponent(pageToken)}`
            const igInfoResponse = await axios.get(igInfoUrl)
            console.log(`Instagram Username: @${igInfoResponse.data.username}`)
          } catch (igError) {
            console.log('⚠️  Could not retrieve Instagram username (may need additional permissions)')
          }

          console.log('\n' + '='.repeat(60))
          console.log('✅ SUCCESS! Add these to your .env file:')
          console.log('='.repeat(60))
          console.log(`FACEBOOK_PAGE_ID=${page.id}`)
          console.log(`FACEBOOK_ACCESS_TOKEN=${pageToken}`)
          console.log(`INSTAGRAM_ACCOUNT_ID=${igAccountId}`)
          console.log(`INSTAGRAM_ACCESS_TOKEN=${pageToken}`)
          console.log('='.repeat(60))

        } else {
          console.log('\n⚠️  No Instagram Business Account linked to this page')
          console.log('\nYou need to:')
          console.log('  1. Convert your Instagram to a Business/Creator account')
          console.log('  2. Link it to this Facebook Page')
          console.log('  3. See INSTAGRAM_SETUP.md for instructions')

          console.log('\nStill, you can use this for Facebook posting:')
          console.log(`FACEBOOK_PAGE_ID=${page.id}`)
          console.log(`FACEBOOK_ACCESS_TOKEN=${pageToken}`)
        }

      } catch (error) {
        console.error('❌ Error getting page info:', error.response?.data || error.message)
      }

      console.log('\n')
    }

    console.log('='.repeat(60))
    console.log('Important Notes:')
    console.log('='.repeat(60))
    console.log('• The tokens above are SHORT-LIVED (expire in ~1-2 hours)')
    console.log('• For production, you should exchange them for LONG-LIVED tokens')
    console.log('• Run "node exchangeForLongLivedToken.js" to get permanent tokens')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message)

    if (error.response?.data?.error) {
      console.error('\nError details:')
      console.error(`  Message: ${error.response.data.error.message}`)
      console.error(`  Type: ${error.response.data.error.type}`)
      console.error(`  Code: ${error.response.data.error.code}`)
    }
  }

  rl.close()
}

getPageAccessToken().catch(error => {
  console.error('Script error:', error)
  rl.close()
  process.exit(1)
})
