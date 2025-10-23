import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

async function checkTokenExpiry() {
  console.log('=== Checking Token Type and Expiry ===\n')

  const token = process.env.FACEBOOK_ACCESS_TOKEN

  if (!token) {
    console.error('❌ No token found in .env file!')
    process.exit(1)
  }

  console.log(`Token: ${token.substring(0, 30)}...`)
  console.log()

  try {
    // Debug the token
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`
    const response = await axios.get(debugUrl)
    const data = response.data.data

    console.log('✅ Token Information:')
    console.log('─'.repeat(80))
    console.log(`Type: ${data.type}`)
    console.log(`App ID: ${data.app_id}`)
    console.log(`User ID: ${data.user_id}`)
    console.log(`Valid: ${data.is_valid}`)

    if (data.expires_at === 0) {
      console.log('⏰ Expires: ✅ NEVER (Long-lived token)')
      console.log('\n🎉 Perfect! This token will never expire!')
    } else {
      const expiryDate = new Date(data.expires_at * 1000)
      const now = new Date()
      const hoursLeft = Math.round((expiryDate - now) / (1000 * 60 * 60))

      console.log(`⏰ Expires: ${expiryDate.toISOString()}`)
      console.log(`   Time left: ${hoursLeft} hours`)

      if (hoursLeft < 48) {
        console.log('\n⚠️  This is a SHORT-LIVED token!')
        console.log('You need to convert it to a long-lived token.')
      }
    }

    console.log()
    console.log('Permissions:')
    if (data.scopes && data.scopes.length > 0) {
      data.scopes.forEach(scope => console.log(`  ✅ ${scope}`))
    } else {
      console.log('  ⚠️  No scopes found')
    }

    // Check if it's a Page token
    console.log()
    if (data.type === 'PAGE') {
      console.log('✅ This is a PAGE ACCESS TOKEN (correct!)')
      console.log('✅ Page Access Tokens never expire!')
    } else if (data.type === 'USER') {
      console.log('❌ This is a USER ACCESS TOKEN (wrong!)')
      console.log('\n💡 You need to get a PAGE ACCESS TOKEN instead:')
      console.log('   1. Go to Graph API Explorer')
      console.log('   2. Click "Get Token" dropdown')
      console.log('   3. Select "Get Page Access Token" (not User!)')
      console.log('   4. Choose your page')
    }

  } catch (error) {
    console.error('❌ Error checking token:')
    console.error(`   ${error.response?.data?.error?.message || error.message}`)
  }

  console.log('\n─'.repeat(80))
}

checkTokenExpiry().catch(error => {
  console.error('Script error:', error.message)
  process.exit(1)
})
