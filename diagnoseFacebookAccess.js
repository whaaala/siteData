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

async function diagnose() {
  console.log('=== Facebook Access Diagnostic Tool ===\n')

  console.log('This will help diagnose why your pages aren\'t showing up.\n')

  const userToken = await question('Paste your User Access Token: ')

  if (!userToken || userToken.trim().length < 50) {
    console.error('❌ Invalid token.')
    rl.close()
    return
  }

  const pageId = await question('Enter your Facebook Page ID (845270065336508): ') || '845270065336508'

  console.log('\n' + '='.repeat(60))
  console.log('Running Diagnostics...')
  console.log('='.repeat(60))
  console.log()

  try {
    // Test 1: Check token details
    console.log('Test 1: Token Information')
    console.log('─'.repeat(60))
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${encodeURIComponent(userToken.trim())}&access_token=${encodeURIComponent(userToken.trim())}`
    const debugResponse = await axios.get(debugUrl)

    if (debugResponse.data?.data) {
      const tokenInfo = debugResponse.data.data
      console.log('✅ Token is valid')
      console.log(`   App ID: ${tokenInfo.app_id}`)
      console.log(`   User ID: ${tokenInfo.user_id}`)
      console.log(`   Type: ${tokenInfo.type}`)

      if (tokenInfo.issued_at) {
        try {
          console.log(`   Issued at: ${new Date(tokenInfo.issued_at * 1000).toISOString()}`)
        } catch (e) {
          console.log(`   Issued at: ${tokenInfo.issued_at}`)
        }
      }

      if (tokenInfo.expires_at === 0) {
        console.log(`   Expires: Never`)
      } else if (tokenInfo.expires_at) {
        try {
          console.log(`   Expires: ${new Date(tokenInfo.expires_at * 1000).toISOString()}`)
        } catch (e) {
          console.log(`   Expires: ${tokenInfo.expires_at}`)
        }
      }

      console.log(`   Scopes: ${tokenInfo.scopes?.join(', ') || 'None'}`)
      console.log()

      const hasPagesList = tokenInfo.scopes?.includes('pages_show_list')
      const hasPagesManage = tokenInfo.scopes?.includes('pages_manage_posts')
      console.log('   Required Scopes Check:')
      console.log(`   ${hasPagesList ? '✅' : '❌'} pages_show_list`)
      console.log(`   ${hasPagesManage ? '✅' : '❌'} pages_manage_posts`)
    }
    console.log()

    // Test 2: Try me/accounts
    console.log('Test 2: Checking me/accounts endpoint')
    console.log('─'.repeat(60))
    const accountsUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${encodeURIComponent(userToken.trim())}`
    const accountsResponse = await axios.get(accountsUrl)

    console.log(`Response: ${JSON.stringify(accountsResponse.data, null, 2)}`)

    if (accountsResponse.data.data && accountsResponse.data.data.length > 0) {
      console.log(`✅ Found ${accountsResponse.data.data.length} page(s)`)
    } else {
      console.log('❌ No pages returned from me/accounts')
      console.log('\nThis means you either:')
      console.log('  1. Don\'t have ADMIN role on any pages')
      console.log('  2. Need to grant "pages_show_list" during token generation')
      console.log('  3. Have an app configuration issue')
    }
    console.log()

    // Test 3: Try accessing the page directly
    console.log('Test 3: Accessing Page Directly')
    console.log('─'.repeat(60))
    const pageUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,category&access_token=${encodeURIComponent(userToken.trim())}`

    try {
      const pageResponse = await axios.get(pageUrl)
      console.log('✅ Can access page publicly')
      console.log(`   Name: ${pageResponse.data.name}`)
      console.log(`   ID: ${pageResponse.data.id}`)
      console.log(`   Category: ${pageResponse.data.category}`)
    } catch (pageError) {
      console.log('❌ Cannot access page')
      console.log(`   Error: ${pageError.response?.data?.error?.message || pageError.message}`)
    }
    console.log()

    // Test 4: Check if user is admin of the page
    console.log('Test 4: Checking Page Admin Status')
    console.log('─'.repeat(60))
    const rolesUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=roles&access_token=${encodeURIComponent(userToken.trim())}`

    try {
      const rolesResponse = await axios.get(rolesUrl)
      console.log('Page roles response:', JSON.stringify(rolesResponse.data, null, 2))
    } catch (rolesError) {
      console.log('Cannot fetch roles (may require page admin access)')
      console.log(`Error: ${rolesError.response?.data?.error?.message || rolesError.message}`)
    }
    console.log()

    // Test 5: Try to get page access token directly
    console.log('Test 5: Attempting Direct Page Access Token')
    console.log('─'.repeat(60))
    const pageTokenUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=access_token&access_token=${encodeURIComponent(userToken.trim())}`

    try {
      const pageTokenResponse = await axios.get(pageTokenUrl)
      if (pageTokenResponse.data.access_token) {
        console.log('✅ SUCCESS! Got Page Access Token directly!')
        const pageAccessToken = pageTokenResponse.data.access_token
        console.log(`   Token: ${pageAccessToken.substring(0, 30)}...`)
        console.log()

        // Now check Instagram
        console.log('Checking Instagram connection...')
        const igUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(pageAccessToken)}`
        const igResponse = await axios.get(igUrl)

        if (igResponse.data.instagram_business_account) {
          const igId = igResponse.data.instagram_business_account.id
          console.log('✅ Instagram is linked!')
          console.log(`   Instagram Account ID: ${igId}`)

          console.log()
          console.log('='.repeat(60))
          console.log('✅✅✅ SUCCESS! Add these to your .env: ✅✅✅')
          console.log('='.repeat(60))
          console.log(`FACEBOOK_PAGE_ID=${pageId}`)
          console.log(`FACEBOOK_ACCESS_TOKEN=${pageAccessToken}`)
          console.log(`INSTAGRAM_ACCOUNT_ID=${igId}`)
          console.log(`INSTAGRAM_ACCESS_TOKEN=${pageAccessToken}`)
          console.log('='.repeat(60))
        } else {
          console.log('⚠️  Instagram not linked to this page')
          console.log()
          console.log('For Facebook posting only:')
          console.log('─'.repeat(60))
          console.log(`FACEBOOK_PAGE_ID=${pageId}`)
          console.log(`FACEBOOK_ACCESS_TOKEN=${pageAccessToken}`)
          console.log('─'.repeat(60))
        }

      } else {
        console.log('❌ No access token in response')
      }
    } catch (tokenError) {
      console.log('❌ Cannot get page access token')
      console.log(`   Error: ${tokenError.response?.data?.error?.message || tokenError.message}`)
      console.log()
      console.log('This means you likely don\'t have admin access to this page.')
      console.log()
      console.log('To fix this:')
      console.log('  1. Go to: https://www.facebook.com/' + pageId + '/settings/')
      console.log('  2. Click "Page Roles" or "People and Other Pages"')
      console.log('  3. Make sure your account is listed as "Admin"')
      console.log('  4. If not, ask the page owner to add you as Admin')
    }
    console.log()

    // Test 6: Alternative - use Facebook Business Manager
    console.log('Test 6: Alternative Method - Facebook Business Manager')
    console.log('─'.repeat(60))
    console.log('If the above doesn\'t work, try this:')
    console.log()
    console.log('1. Go to: https://business.facebook.com/')
    console.log('2. Select your Business Account')
    console.log('3. Go to Business Settings → Accounts → Pages')
    console.log('4. Find your page "Nowahala Lounge"')
    console.log('5. Check if you have admin access')
    console.log('6. If you manage the page through Business Manager,')
    console.log('   you may need to use System User tokens instead')
    console.log('─'.repeat(60))

  } catch (error) {
    console.error('\n❌ Diagnostic Error:', error.response?.data || error.message)
  }

  rl.close()
}

diagnose().catch(error => {
  console.error('Script error:', error)
  rl.close()
  process.exit(1)
})
