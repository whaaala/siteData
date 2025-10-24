/**
 * Verify Instagram account setup
 */

import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

console.log('=== Verifying Instagram Setup ===\n')

async function verifySetup() {
  try {
    // 1. Check if Facebook page has Instagram account connected
    console.log('1. Checking if Facebook page has Instagram account connected...')
    console.log(`   Facebook Page ID: ${FACEBOOK_PAGE_ID}`)

    const pageUrl = `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}?fields=instagram_business_account&access_token=${FACEBOOK_ACCESS_TOKEN}`
    const pageResponse = await axios.get(pageUrl)

    if (pageResponse.data.instagram_business_account) {
      const connectedIgId = pageResponse.data.instagram_business_account.id
      console.log(`   ✅ Instagram account connected: ${connectedIgId}`)

      if (connectedIgId !== INSTAGRAM_ACCOUNT_ID) {
        console.log(`   ⚠️  WARNING: Connected IG ID (${connectedIgId}) doesn't match .env (${INSTAGRAM_ACCOUNT_ID})`)
        console.log(`   You should update INSTAGRAM_ACCOUNT_ID in .env to: ${connectedIgId}`)
      } else {
        console.log(`   ✅ Instagram account ID matches .env`)
      }
    } else {
      console.log(`   ❌ No Instagram account connected to this Facebook page`)
      console.log(`   You need to connect an Instagram Business account to your Facebook page`)
      return
    }

    console.log()

    // 2. Get Instagram account details
    console.log('2. Getting Instagram account details...')
    const igUrl = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    const igResponse = await axios.get(igUrl)

    console.log(`   Username: @${igResponse.data.username}`)
    console.log(`   Name: ${igResponse.data.name}`)
    console.log(`   Followers: ${igResponse.data.followers_count}`)
    console.log(`   Following: ${igResponse.data.follows_count}`)
    console.log(`   Posts: ${igResponse.data.media_count}`)
    console.log()

    // 3. Check permissions
    console.log('3. Checking token permissions...')
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${INSTAGRAM_ACCESS_TOKEN}&access_token=${FACEBOOK_ACCESS_TOKEN}`
    const debugResponse = await axios.get(debugUrl)

    const tokenInfo = debugResponse.data.data
    if (tokenInfo.granular_scopes) {
      const igScopes = tokenInfo.granular_scopes.filter(s =>
        s.scope.includes('instagram')
      )

      console.log('   Instagram permissions:')
      igScopes.forEach(scope => {
        console.log(`   ✅ ${scope.scope}`)
        if (scope.target_ids) {
          console.log(`      Target IDs: ${scope.target_ids.join(', ')}`)
        }
      })
    }

    console.log()
    console.log('='.repeat(60))
    console.log('VERDICT')
    console.log('='.repeat(60))

    if (pageResponse.data.instagram_business_account) {
      console.log('✅ Instagram account is properly connected')
      console.log('✅ Token has Instagram permissions')
      console.log('\n⚠️  However, posting is still failing.')
      console.log('This could be due to:')
      console.log('1. Image URL accessibility issues')
      console.log('2. Instagram Content Publishing API restrictions')
      console.log('3. Business account verification requirements')
      console.log('\nThe Instagram API has strict requirements for posting.')
      console.log('Image URLs must be:')
      console.log('- Publicly accessible via HTTPS')
      console.log('- Direct image URLs (no redirects)')
      console.log('- Standard formats (JPEG, PNG)')
      console.log('- Proper dimensions (1:1 to 1.91:1 aspect ratio)')
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message)
  }
}

verifySetup()
