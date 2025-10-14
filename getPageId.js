import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN

async function getPageId() {
  console.log('=== Finding Your Facebook Page ID ===\n')

  if (!ACCESS_TOKEN || ACCESS_TOKEN === 'your_facebook_page_access_token_here') {
    console.error('❌ FACEBOOK_ACCESS_TOKEN not set in .env file')
    process.exit(1)
  }

  try {
    // First, check what type of token this is
    console.log('Step 1: Checking token type...')
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${ACCESS_TOKEN}&access_token=${ACCESS_TOKEN}`
    const debugResponse = await axios.get(debugUrl)

    console.log('Token info:')
    console.log('  Type:', debugResponse.data.data.type)
    console.log('  App ID:', debugResponse.data.data.app_id)
    console.log('  Valid:', debugResponse.data.data.is_valid)
    console.log('  Expires:', debugResponse.data.data.expires_at || 'Never')
    console.log()

    // Get pages associated with this token
    console.log('Step 2: Getting your pages...')
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${ACCESS_TOKEN}`
    const pagesResponse = await axios.get(pagesUrl)

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      console.log('❌ No pages found!')
      console.log('\nThis could mean:')
      console.log('1. You are not an admin of any Facebook Pages')
      console.log('2. This is a Page token (not a User token)')
      console.log('3. The token does not have pages_show_list permission')
      console.log('\nTrying to get page info directly...')

      // If it's a page token, try to get page info directly
      try {
        const pageInfoUrl = `https://graph.facebook.com/v18.0/me?access_token=${ACCESS_TOKEN}`
        const pageInfo = await axios.get(pageInfoUrl)

        console.log('\n✅ Page Information:')
        console.log('━'.repeat(60))
        console.log('Page Name:', pageInfo.data.name)
        console.log('Page ID:', pageInfo.data.id)
        console.log('━'.repeat(60))

        console.log('\n📝 Add this to your .env file:')
        console.log('━'.repeat(60))
        console.log(`FACEBOOK_PAGE_ID=${pageInfo.data.id}`)
        console.log('━'.repeat(60))

        console.log('\n✅ Your FACEBOOK_ACCESS_TOKEN is already set correctly!')
        console.log('This is a Page Access Token that never expires.')

      } catch (err) {
        console.error('❌ Could not get page info:', err.response?.data || err.message)
      }

    } else {
      // User token - show all pages
      console.log(`\n✅ Found ${pagesResponse.data.data.length} page(s):\n`)

      pagesResponse.data.data.forEach((page, index) => {
        console.log(`[${index + 1}] ${page.name}`)
        console.log('    Page ID:', page.id)
        console.log('    Category:', page.category)
        console.log('    Page Token:', page.access_token.substring(0, 20) + '...')
        console.log()
      })

      const firstPage = pagesResponse.data.data[0]

      console.log('━'.repeat(60))
      console.log('📝 Add these to your .env file:')
      console.log('━'.repeat(60))
      console.log(`FACEBOOK_PAGE_ID=${firstPage.id}`)
      console.log(`FACEBOOK_ACCESS_TOKEN=${firstPage.access_token}`)
      console.log('━'.repeat(60))

      console.log('\n💡 Note: Use the PAGE token (not the user token) for best results!')
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message)

    if (error.response?.data?.error) {
      const err = error.response.data.error
      console.log('\nError details:')
      console.log('  Message:', err.message)
      console.log('  Type:', err.type)
      console.log('  Code:', err.code)

      if (err.code === 190) {
        console.log('\n💡 This means your access token is invalid or expired.')
        console.log('   Go to: https://developers.facebook.com/tools/explorer/')
        console.log('   And generate a new token with these permissions:')
        console.log('   - pages_show_list')
        console.log('   - pages_read_engagement')
        console.log('   - pages_manage_posts')
      }
    }
  }
}

getPageId().catch(console.error)
