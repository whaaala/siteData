/**
 * Get permanent Page Access Tokens from long-lived User token
 */

import axios from 'axios'

const APP_ID = '760442996603359'
const APP_SECRET = '97d79878e56125b90104ca2590b89c9d'
const SHORT_USER_TOKEN = 'EAAKznm6vOd8BP0FCNktHhuEgtkmj9ZCZClKi0fyNDQerkchVx8v6vBRXbNE4wot0fCCLBh0DDaFUvQODoksfsHZCemFkBdMXZA8VQ5piKsoZCiE7v1Va1OBhAun61reZCYHKqwXNy0g3i1kZCaZAAQYSxbi2AbZAJR6bYdmUxr5705zc25w9tn7HFvXABzdtZAINZAWz4HNBpgQVTJWCVK7pdJpmAUi7uxZByZCywjdhyEI1Ly4ZCAQZAyXZCju1u1QtT2OpNuvfmLfYRcJmCv79MeYXJn5xzNZAU'

console.log('=== Getting Permanent Page Access Tokens ===\n')

async function getPermanentTokens() {
  try {
    // Step 1: Exchange for long-lived User token
    console.log('Step 1: Exchanging for long-lived User token...')
    const exchangeUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT_USER_TOKEN}`

    const exchangeResponse = await axios.get(exchangeUrl)
    const longLivedUserToken = exchangeResponse.data.access_token
    console.log('✅ Got long-lived User token\n')

    // Step 2: Try to get Page tokens directly using the long-lived token
    console.log('Step 2: Getting Page Access Tokens directly...')

    const pageIds = [
      '794703240393538',  // No Wahala Zone
      '767259479813044',  // No WahalaZone
      '2243952629209691'  // Nigeriacelebrities
    ]

    for (const pageId of pageIds) {
      try {
        const url = `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,access_token&access_token=${longLivedUserToken}`
        const response = await axios.get(url)

        console.log(`✅ ${response.data.name}`)
        console.log(`   Page ID: ${response.data.id}`)

        if (response.data.access_token) {
          const pageToken = response.data.access_token

          // Check if Page token is permanent
          const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${pageToken}&access_token=${longLivedUserToken}`
          const debugResponse = await axios.get(debugUrl)

          const tokenInfo = debugResponse.data.data

          if (tokenInfo.expires_at === 0) {
            console.log(`   🎯 PERMANENT TOKEN - Never expires!`)
          } else {
            const expiryDate = new Date(tokenInfo.expires_at * 1000)
            const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
            console.log(`   ⏰ Expires: ${expiryDate.toLocaleString()} (${daysUntilExpiry} days)`)
          }

          console.log(`   Token: ${pageToken}`)
        } else {
          console.log(`   ❌ No access_token in response`)
        }
        console.log()

      } catch (error) {
        console.log(`❌ Failed to get token for page ${pageId}`)
        console.log(`   Error: ${error.response?.data?.error?.message || error.message}\n`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message)
  }
}

getPermanentTokens()
