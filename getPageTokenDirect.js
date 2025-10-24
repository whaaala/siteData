/**
 * Try to get Page Access Token by querying the page directly
 */

import axios from 'axios'

const USER_TOKEN = 'EAAKznm6vOd8BP0FCNktHhuEgtkmj9ZCZClKi0fyNDQerkchVx8v6vBRXbNE4wot0fCCLBh0DDaFUvQODoksfsHZCemFkBdMXZA8VQ5piKsoZCiE7v1Va1OBhAun61reZCYHKqwXNy0g3i1kZCaZAAQYSxbi2AbZAJR6bYdmUxr5705zc25w9tn7HFvXABzdtZAINZAWz4HNBpgQVTJWCVK7pdJpmAUi7uxZByZCywjdhyEI1Ly4ZCAQZAyXZCju1u1QtT2OpNuvfmLfYRcJmCv79MeYXJn5xzNZAU'
const PAGE_IDS = [
  '794703240393538',  // No Wahala Zone
  '767259479813044',  // No WahalaZone
  '2243952629209691'  // Unknown page from granular scopes
]

console.log('=== Trying to Get Page Access Tokens Directly ===\n')

async function getPageTokens() {
  for (const pageId of PAGE_IDS) {
    try {
      console.log(`Trying page ID: ${pageId}...`)

      // Try to get page info including access token
      const url = `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,access_token&access_token=${USER_TOKEN}`
      const response = await axios.get(url)

      console.log(`✅ SUCCESS!`)
      console.log(`   Page Name: ${response.data.name}`)
      console.log(`   Page ID: ${response.data.id}`)

      if (response.data.access_token) {
        console.log(`   ✅ Page Access Token Found!`)
        console.log(`   Token: ${response.data.access_token}`)
      } else {
        console.log(`   ❌ No access_token in response`)
      }
      console.log()

    } catch (error) {
      console.log(`❌ FAILED`)
      if (error.response?.data?.error) {
        console.log(`   Error: ${error.response.data.error.message}`)
      } else {
        console.log(`   Error: ${error.message}`)
      }
      console.log()
    }
  }
}

getPageTokens()
