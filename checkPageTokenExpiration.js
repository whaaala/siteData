/**
 * Check if the Page Access Token is permanent
 */

import axios from 'axios'

const PAGE_TOKEN = 'EAAKznm6vOd8BP2mBw5DJvSP4eiRw0Ur5seq0rAAsSSewWUKdo5XlJViJAz3t06LftlMQMicVk3MvzxCo8xsStARmiOX7inQE7teCOQD5UrPsSUkepf2OLYKeGzlhk7ZA3cwZChf5JARmAvQHpFmi5s2L2WgWpMZASG00CGmyxP69dx8CoQegMCYigLZBdCnUrCqtJlZBc'

console.log('=== Checking Page Token Expiration ===\n')

async function checkExpiration() {
  try {
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${PAGE_TOKEN}&access_token=${PAGE_TOKEN}`
    const response = await axios.get(debugUrl)

    const tokenInfo = response.data.data

    console.log('Token Type:', tokenInfo.type)
    console.log('App ID:', tokenInfo.app_id)
    console.log('Valid:', tokenInfo.is_valid)

    if (tokenInfo.expires_at === 0) {
      console.log('\n✅ PERMANENT TOKEN - Never expires!')
    } else {
      const expirationDate = new Date(tokenInfo.expires_at * 1000)
      console.log(`\n⏰ TEMPORARY TOKEN - Expires: ${expirationDate.toLocaleString()}`)

      const now = new Date()
      const hoursRemaining = (expirationDate - now) / (1000 * 60 * 60)
      console.log(`   Time remaining: ${hoursRemaining.toFixed(1)} hours`)
    }

    if (tokenInfo.data_access_expires_at) {
      const dataExpirationDate = new Date(tokenInfo.data_access_expires_at * 1000)
      console.log(`\nData Access Expires: ${dataExpirationDate.toLocaleString()}`)
    }

    if (tokenInfo.granular_scopes) {
      console.log('\nGranted Scopes:')
      tokenInfo.granular_scopes.forEach(scope => {
        console.log(`  • ${scope.scope}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message)
  }
}

checkExpiration()
