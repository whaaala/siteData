import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

async function checkToken() {
  console.log('=== Checking Your Page Access Token ===\n')

  const token = process.env.FACEBOOK_ACCESS_TOKEN
  const configuredPageId = process.env.FACEBOOK_PAGE_ID
  const configuredIgId = process.env.INSTAGRAM_ACCOUNT_ID

  console.log('Current Configuration in .env:')
  console.log('─'.repeat(80))
  console.log(`FACEBOOK_PAGE_ID: ${configuredPageId}`)
  console.log(`INSTAGRAM_ACCOUNT_ID: ${configuredIgId}`)
  console.log(`Token: ${token ? token.substring(0, 30) + '...' : 'MISSING'}`)
  console.log('─'.repeat(80))
  console.log()

  if (!token) {
    console.error('❌ No token found in .env file!')
    process.exit(1)
  }

  // Check what pages this token can access
  console.log('🔍 Finding which page this token belongs to...')
  console.log('─'.repeat(80))

  try {
    const url = `https://graph.facebook.com/v18.0/me/accounts?access_token=${encodeURIComponent(token)}`
    const response = await axios.get(url)

    if (response.data.data && response.data.data.length > 0) {
      console.log('✅ This token can access these pages:\n')

      for (let i = 0; i < response.data.data.length; i++) {
        const page = response.data.data[i]
        console.log(`${i + 1}. ${page.name}`)
        console.log(`   Page ID: ${page.id}`)
        console.log(`   Category: ${page.category}`)

        // Check if this matches the configured page
        if (page.id === configuredPageId) {
          console.log(`   ✅ This MATCHES your configured FACEBOOK_PAGE_ID!`)
        } else {
          console.log(`   ⚠️  This does NOT match your configured page ID`)
        }

        // Get Instagram account for this page
        try {
          const pageUrl = `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${encodeURIComponent(token)}`
          const pageResponse = await axios.get(pageUrl)

          if (pageResponse.data.instagram_business_account) {
            const igId = pageResponse.data.instagram_business_account.id
            console.log(`   Instagram ID: ${igId}`)

            if (igId === configuredIgId) {
              console.log(`   ✅ This MATCHES your configured INSTAGRAM_ACCOUNT_ID!`)
            } else {
              console.log(`   ⚠️  This does NOT match your configured Instagram ID`)
            }
          } else {
            console.log(`   ⚠️  No Instagram account linked`)
          }
        } catch (error) {
          console.log(`   ⚠️  Could not check Instagram: ${error.response?.data?.error?.message || error.message}`)
        }

        console.log()
      }

      // Find the correct page
      const correctPage = response.data.data.find(p => p.id === configuredPageId)

      if (!correctPage && response.data.data.length > 0) {
        console.log('─'.repeat(80))
        console.log('⚠️  MISMATCH DETECTED!')
        console.log('─'.repeat(80))
        console.log('\nYour token belongs to:')
        response.data.data.forEach(page => {
          console.log(`  - ${page.name} (ID: ${page.id})`)
        })
        console.log(`\nBut your .env has: ${configuredPageId}`)
        console.log('\n💡 SOLUTION: Update your .env with the correct page ID from above')
        console.log('Or regenerate the token for the correct page.')
      } else if (correctPage) {
        console.log('─'.repeat(80))
        console.log('✅ Your token and page ID match!')
        console.log('─'.repeat(80))
      }

    } else {
      console.log('❌ This token cannot access any pages!')
      console.log('\n💡 This might be a User Access Token, not a Page Access Token')
      console.log('Go back to Graph API Explorer and select "Get Page Access Token"')
    }

  } catch (error) {
    console.error('❌ Error checking token:')
    console.error(`   ${error.response?.data?.error?.message || error.message}`)
    console.error(`   Code: ${error.response?.data?.error?.code}`)

    if (error.response?.data?.error?.code === 190) {
      console.log('\n💡 Error 190 means the token is invalid or expired')
      console.log('You need to generate a fresh Page Access Token')
    }
  }

  console.log('─'.repeat(80))
  console.log('\n=== Check Complete ===')
}

checkToken().catch(error => {
  console.error('Script error:', error.message)
  process.exit(1)
})
