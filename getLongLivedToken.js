/**
 * Exchange short-lived User token for long-lived token,
 * then get permanent Page Access Token
 */

import axios from 'axios'

const APP_ID = '760442996603359'
const APP_SECRET = '97d79878e56125b90104ca2590b89c9d'
const USER_TOKEN = 'EAAKznm6vOd8BP0FCNktHhuEgtkmj9ZCZClKi0fyNDQerkchVx8v6vBRXbNE4wot0fCCLBh0DDaFUvQODoksfsHZCemFkBdMXZA8VQ5piKsoZCiE7v1Va1OBhAun61reZCYHKqwXNy0g3i1kZCaZAAQYSxbi2AbZAJR6bYdmUxr5705zc25w9tn7HFvXABzdtZAINZAWz4HNBpgQVTJWCVK7pdJpmAUi7uxZByZCywjdhyEI1Ly4ZCAQZAyXZCju1u1QtT2OpNuvfmLfYRcJmCv79MeYXJn5xzNZAU'

console.log('=== Exchanging for Long-Lived Permanent Token ===\n')

async function getLongLivedToken() {
  try {
    // Step 1: Exchange User token for long-lived User token
    console.log('Step 1: Exchanging for long-lived User token...')
    const exchangeUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${USER_TOKEN}`

    const exchangeResponse = await axios.get(exchangeUrl)

    if (!exchangeResponse.data || !exchangeResponse.data.access_token) {
      console.error('❌ Failed to exchange token')
      return
    }

    const longLivedUserToken = exchangeResponse.data.access_token
    console.log('✅ Got long-lived User token\n')

    // Step 2: Check expiration of long-lived User token
    console.log('Step 2: Checking User token expiration...')
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${longLivedUserToken}&access_token=${longLivedUserToken}`
    const debugResponse = await axios.get(debugUrl)

    const tokenInfo = debugResponse.data.data
    if (tokenInfo.expires_at === 0) {
      console.log('✅ User token never expires!\n')
    } else {
      const expiryDate = new Date(tokenInfo.expires_at * 1000)
      const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
      console.log(`⏰ User token expires: ${expiryDate.toLocaleString()}`)
      console.log(`   Days until expiry: ${daysUntilExpiry}\n`)
    }

    // Step 3: Get Page Access Tokens (these are PERMANENT!)
    console.log('Step 3: Getting Page Access Tokens...')
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedUserToken}`
    const pagesResponse = await axios.get(pagesUrl)

    const pages = pagesResponse.data.data || []

    if (pages.length === 0) {
      console.log('❌ No pages found. The long-lived token also has 0 pages accessible.')
      console.log('   The issue is with the token generation, not the exchange.')
      return
    }

    console.log(`✅ Found ${pages.length} pages!\n`)

    // Step 4: For each page, get the Page Access Token and check if it's permanent
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      console.log(`${i + 1}. ${page.name}`)
      console.log(`   Page ID: ${page.id}`)
      console.log(`   Category: ${page.category}`)

      // Check Page token expiration
      const pageTokenDebugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${page.access_token}&access_token=${longLivedUserToken}`
      const pageTokenDebugResponse = await axios.get(pageTokenDebugUrl)

      const pageTokenInfo = pageTokenDebugResponse.data.data
      if (pageTokenInfo.expires_at === 0) {
        console.log(`   ✅ PERMANENT TOKEN - Never expires!`)
      } else {
        const expiryDate = new Date(pageTokenInfo.expires_at * 1000)
        console.log(`   ⏰ Expires: ${expiryDate.toLocaleString()}`)
      }

      console.log(`   Token: ${page.access_token}`)
      console.log()
    }

    // Step 5: Show the No Wahala Zone token specifically
    const noWahalaZone = pages.find(p => p.id === '794703240393538')

    if (noWahalaZone) {
      console.log('='.repeat(60))
      console.log('🎯 YOUR PERMANENT TOKEN FOR "No Wahala Zone"')
      console.log('='.repeat(60))
      console.log()
      console.log('Page Name:', noWahalaZone.name)
      console.log('Page ID:', noWahalaZone.id)
      console.log()
      console.log('PERMANENT TOKEN:')
      console.log(noWahalaZone.access_token)
      console.log()
      console.log('Update your .env with:')
      console.log(`FACEBOOK_ACCESS_TOKEN=${noWahalaZone.access_token}`)
      console.log(`INSTAGRAM_ACCESS_TOKEN=${noWahalaZone.access_token}`)
      console.log()
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message)
  }
}

getLongLivedToken()
