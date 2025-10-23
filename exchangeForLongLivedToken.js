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

async function exchangeToken() {
  console.log('=== Exchange for Long-Lived Page Access Token ===\n')

  console.log('This script will exchange your short-lived token for a long-lived one.')
  console.log('Long-lived tokens do NOT expire (or expire in ~60 days for User tokens).\n')

  console.log('You need:')
  console.log('  1. Your Facebook App ID')
  console.log('  2. Your Facebook App Secret')
  console.log('  3. Your short-lived Page Access Token (from getPageToken.js)\n')

  console.log('─'.repeat(60))
  console.log('Finding your App ID and App Secret:')
  console.log('─'.repeat(60))
  console.log('1. Go to: https://developers.facebook.com/apps/')
  console.log('2. Click on your app')
  console.log('3. Go to Settings → Basic')
  console.log('4. App ID is shown at the top')
  console.log('5. App Secret: Click "Show" button (you may need to enter your password)')
  console.log('─'.repeat(60))
  console.log()

  const appId = await question('Enter your App ID: ')
  const appSecret = await question('Enter your App Secret: ')
  const shortToken = await question('Enter your short-lived Page Access Token: ')

  if (!appId || !appSecret || !shortToken) {
    console.error('\n❌ All fields are required!')
    rl.close()
    return
  }

  console.log('\n─'.repeat(60))
  console.log('Exchanging token...\n')

  try {
    // Exchange for long-lived token
    const exchangeUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId.trim()}&client_secret=${appSecret.trim()}&fb_exchange_token=${encodeURIComponent(shortToken.trim())}`

    const response = await axios.get(exchangeUrl)

    if (response.data && response.data.access_token) {
      const longLivedToken = response.data.access_token

      console.log('✅ Successfully exchanged for long-lived token!\n')

      // Debug the token to see its expiration
      try {
        const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${encodeURIComponent(longLivedToken)}&access_token=${encodeURIComponent(longLivedToken)}`
        const debugResponse = await axios.get(debugUrl)

        if (debugResponse.data && debugResponse.data.data) {
          const tokenData = debugResponse.data.data
          const expiresAt = tokenData.expires_at

          console.log('Token Information:')
          console.log('─'.repeat(60))
          console.log('Type:', tokenData.type)
          console.log('Is Valid:', tokenData.is_valid)
          console.log('App ID:', tokenData.app_id)

          if (expiresAt === 0) {
            console.log('Expires:', 'NEVER ✅ (Permanent token!)')
          } else {
            const expiryDate = new Date(expiresAt * 1000)
            console.log('Expires:', expiryDate.toISOString())

            const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
            console.log(`Days until expiry: ${daysUntilExpiry}`)
          }

          console.log('─'.repeat(60))
        }
      } catch (debugError) {
        // Debug failed but we still have the token
        console.log('(Could not verify token expiration, but exchange was successful)')
      }

      console.log('\n' + '='.repeat(60))
      console.log('Your Long-Lived Token:')
      console.log('='.repeat(60))
      console.log(longLivedToken)
      console.log('='.repeat(60))

      console.log('\n✅ Update your .env file with this token:')
      console.log('FACEBOOK_ACCESS_TOKEN=' + longLivedToken)
      console.log('INSTAGRAM_ACCESS_TOKEN=' + longLivedToken)

      console.log('\n⚠️  IMPORTANT:')
      console.log('• Keep this token SECRET - never commit to git!')
      console.log('• Page Access Tokens typically don\'t expire')
      console.log('• If you change your Facebook password, regenerate the token')

    } else {
      console.error('❌ Unexpected response format:', response.data)
    }

  } catch (error) {
    console.error('\n❌ Token exchange failed!')
    console.error('Error:', error.response?.data || error.message)

    if (error.response?.data?.error) {
      console.error('\nError details:')
      console.error(`  Message: ${error.response.data.error.message}`)
      console.error(`  Type: ${error.response.data.error.type}`)
      console.error(`  Code: ${error.response.data.error.code}`)

      if (error.response.data.error.code === 190) {
        console.error('\n⚠️  The token you provided is invalid or expired.')
        console.error('Try running "node getPageToken.js" first to get a fresh token.')
      }
    }
  }

  rl.close()
}

exchangeToken().catch(error => {
  console.error('Script error:', error)
  rl.close()
  process.exit(1)
})
