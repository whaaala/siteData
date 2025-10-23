import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

async function debugToken() {
  console.log('=== Instagram Token Debugger ===\n')

  // Check if environment variables are loaded
  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN
  const igAccountId = process.env.INSTAGRAM_ACCOUNT_ID
  const fbPageId = process.env.FACEBOOK_PAGE_ID

  console.log('Environment Variables Check:')
  console.log('─'.repeat(60))
  console.log('INSTAGRAM_ACCESS_TOKEN exists:', !!token)
  console.log('Token length:', token ? token.length : 0)
  console.log('Token starts with:', token ? token.substring(0, 10) + '...' : 'N/A')
  console.log('Token ends with:', token ? '...' + token.substring(token.length - 10) : 'N/A')
  console.log()
  console.log('INSTAGRAM_ACCOUNT_ID:', igAccountId || 'NOT SET')
  console.log('FACEBOOK_PAGE_ID:', fbPageId || 'NOT SET')
  console.log('─'.repeat(60))
  console.log()

  // Check for common token issues
  console.log('Token Validation:')
  console.log('─'.repeat(60))
  const issues = []

  if (!token) {
    issues.push('❌ Token is missing')
  } else {
    if (token.includes('\n') || token.includes('\r')) {
      issues.push('❌ Token contains newline characters')
    }
    if (token.startsWith('"') || token.startsWith("'")) {
      issues.push('❌ Token starts with a quote')
    }
    if (token.endsWith('"') || token.endsWith("'")) {
      issues.push('❌ Token ends with a quote')
    }
    if (token.includes(' ') && !token.startsWith('EAAG')) {
      issues.push('⚠️  Token contains spaces (might be okay)')
    }
    if (token.length < 50) {
      issues.push('❌ Token seems too short (likely incomplete)')
    }
    if (!token.startsWith('EAA')) {
      issues.push('⚠️  Token doesn\'t start with "EAA" (unusual for Facebook tokens)')
    }
  }

  if (issues.length === 0) {
    console.log('✅ No obvious formatting issues detected')
  } else {
    console.log('Issues found:')
    issues.forEach(issue => console.log('  ' + issue))
  }
  console.log('─'.repeat(60))
  console.log()

  if (!token) {
    console.error('Cannot proceed without a token. Please check your .env file.')
    process.exit(1)
  }

  // Test 1: Inspect the token itself
  console.log('Test 1: Inspecting access token...')
  console.log('─'.repeat(60))
  try {
    const debugTokenUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`
    const debugResponse = await axios.get(debugTokenUrl)

    if (debugResponse.data && debugResponse.data.data) {
      const tokenData = debugResponse.data.data
      console.log('✅ Token can be parsed!')
      console.log('Token Type:', tokenData.type)
      console.log('App ID:', tokenData.app_id)
      console.log('Is Valid:', tokenData.is_valid)
      console.log('Expires At:', tokenData.expires_at === 0 ? 'Never (long-lived)' : new Date(tokenData.expires_at * 1000).toISOString())
      console.log('Scopes:', tokenData.scopes ? tokenData.scopes.join(', ') : 'N/A')

      // Check for Instagram permissions
      const hasInstagramBasic = tokenData.scopes?.includes('instagram_basic')
      const hasInstagramPublish = tokenData.scopes?.includes('instagram_content_publish')

      console.log()
      console.log('Instagram Permissions:')
      console.log('  instagram_basic:', hasInstagramBasic ? '✅' : '❌ MISSING')
      console.log('  instagram_content_publish:', hasInstagramPublish ? '✅' : '❌ MISSING')
    }
  } catch (error) {
    console.error('❌ Token inspection failed!')
    console.error('Error:', error.response?.data?.error || error.message)

    if (error.response?.data?.error?.code === 190) {
      console.error('\n⚠️  Error Code 190 means: Invalid OAuth access token')
      console.error('This could mean:')
      console.error('  1. Token is malformed (has extra characters/spaces)')
      console.error('  2. Token has expired')
      console.error('  3. Token has been revoked')
      console.error('  4. You need to generate a new Page Access Token')
      console.error('\nNext steps:')
      console.error('  → Go to https://developers.facebook.com/tools/explorer/')
      console.error('  → Generate a new Page Access Token')
      console.error('  → Make sure to select your app and get permissions')
    }

    console.log('\n─'.repeat(60))
    return
  }
  console.log('─'.repeat(60))
  console.log()

  // Test 2: Try to get Facebook Page info (if FACEBOOK_PAGE_ID is set)
  if (fbPageId) {
    console.log('Test 2: Getting Facebook Page info...')
    console.log('─'.repeat(60))
    try {
      const pageUrl = `https://graph.facebook.com/v18.0/${fbPageId}?fields=id,name,instagram_business_account&access_token=${encodeURIComponent(token)}`
      const pageResponse = await axios.get(pageUrl)

      console.log('✅ Successfully retrieved page info!')
      console.log('Page Name:', pageResponse.data.name)
      console.log('Page ID:', pageResponse.data.id)

      if (pageResponse.data.instagram_business_account) {
        console.log('Instagram Account ID:', pageResponse.data.instagram_business_account.id)
        console.log('\n✅ Instagram account is linked!')
        console.log(`\nAdd this to your .env file:`)
        console.log(`INSTAGRAM_ACCOUNT_ID=${pageResponse.data.instagram_business_account.id}`)
      } else {
        console.log('❌ No Instagram business account linked to this page')
        console.log('\nYou need to:')
        console.log('  1. Convert your Instagram to a Business account')
        console.log('  2. Link it to your Facebook Page')
        console.log('  3. See INSTAGRAM_SETUP.md for detailed instructions')
      }
    } catch (error) {
      console.error('❌ Failed to get page info')
      console.error('Error:', error.response?.data?.error || error.message)
    }
    console.log('─'.repeat(60))
    console.log()
  }

  // Test 3: Try to get Instagram account info (if INSTAGRAM_ACCOUNT_ID is set)
  if (igAccountId) {
    console.log('Test 3: Getting Instagram account info...')
    console.log('─'.repeat(60))
    try {
      const igUrl = `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,username,profile_picture_url&access_token=${encodeURIComponent(token)}`
      const igResponse = await axios.get(igUrl)

      console.log('✅ Successfully retrieved Instagram info!')
      console.log('Instagram ID:', igResponse.data.id)
      console.log('Username:', igResponse.data.username)
      console.log('\n✅ Your Instagram integration is ready!')
    } catch (error) {
      console.error('❌ Failed to get Instagram account info')
      console.error('Error:', error.response?.data?.error || error.message)

      if (error.response?.data?.error?.code === 190) {
        console.error('\n⚠️  The token cannot access this Instagram account')
        console.error('Make sure:')
        console.error('  1. The token is a Page Access Token (not User Access Token)')
        console.error('  2. The Instagram account is linked to your Facebook Page')
        console.error('  3. The INSTAGRAM_ACCOUNT_ID is correct')
      }
    }
    console.log('─'.repeat(60))
  }

  console.log('\n=== Debug Complete ===')
}

debugToken().catch(error => {
  console.error('Debug script error:', error)
  process.exit(1)
})
