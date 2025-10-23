import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

async function findInstagramId() {
  console.log('=== Finding Instagram Account ID ===\n')

  const token = process.env.FACEBOOK_ACCESS_TOKEN
  const pageId = process.env.FACEBOOK_PAGE_ID

  console.log(`Facebook Page ID: ${pageId}`)
  console.log(`Token: ${token.substring(0, 30)}...`)
  console.log()

  try {
    // Query the page for its Instagram business account
    const url = `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,instagram_business_account&access_token=${encodeURIComponent(token)}`
    const response = await axios.get(url)

    console.log('✅ Page Information:')
    console.log('─'.repeat(80))
    console.log(`Page Name: ${response.data.name}`)
    console.log(`Page ID: ${response.data.id}`)

    if (response.data.instagram_business_account) {
      const igId = response.data.instagram_business_account.id
      console.log(`Instagram Linked: ✅ Yes`)
      console.log(`Instagram Account ID: ${igId}`)
      console.log('─'.repeat(80))
      console.log()

      // Get Instagram account details
      console.log('🔍 Getting Instagram account details...')
      console.log('─'.repeat(80))

      try {
        const igUrl = `https://graph.facebook.com/v18.0/${igId}?fields=id,username,name,profile_picture_url&access_token=${encodeURIComponent(token)}`
        const igResponse = await axios.get(igUrl)

        console.log('✅ Instagram Account:')
        console.log(`   Username: @${igResponse.data.username}`)
        console.log(`   Name: ${igResponse.data.name}`)
        console.log(`   ID: ${igResponse.data.id}`)
        console.log('─'.repeat(80))
        console.log()

        console.log('═'.repeat(80))
        console.log('🎉 SUCCESS! Update your .env file with:')
        console.log('═'.repeat(80))
        console.log()
        console.log(`INSTAGRAM_ACCOUNT_ID=${igId}`)
        console.log()
        console.log('═'.repeat(80))

      } catch (error) {
        console.error('❌ Could not get Instagram details')
        console.error(`   ${error.response?.data?.error?.message || error.message}`)
      }

    } else {
      console.log(`Instagram Linked: ❌ No`)
      console.log('─'.repeat(80))
      console.log()
      console.error('❌ No Instagram account is linked to this Facebook Page!')
      console.error()
      console.error('To link your Instagram account:')
      console.error('  1. Go to your Facebook Page settings')
      console.error('  2. Click "Instagram" in the left sidebar')
      console.error('  3. Click "Connect Account"')
      console.error('  4. Log in to your Instagram Business account')
      console.error()
      console.error('Note: Your Instagram must be a Business or Creator account.')
    }

  } catch (error) {
    console.error('❌ Error querying Facebook Page:')
    console.error(`   ${error.response?.data?.error?.message || error.message}`)
    console.error(`   Code: ${error.response?.data?.error?.code}`)
  }
}

findInstagramId().catch(error => {
  console.error('Script error:', error.message)
  process.exit(1)
})
