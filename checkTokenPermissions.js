/**
 * Check what permissions a Facebook token has
 */

import axios from 'axios'

const TOKEN = 'EAAKznm6vOd8BP0FCNktHhuEgtkmj9ZCZClKi0fyNDQerkchVx8v6vBRXbNE4wot0fCCLBh0DDaFUvQODoksfsHZCemFkBdMXZA8VQ5piKsoZCiE7v1Va1OBhAun61reZCYHKqwXNy0g3i1kZCaZAAQYSxbi2AbZAJR6bYdmUxr5705zc25w9tn7HFvXABzdtZAINZAWz4HNBpgQVTJWCVK7pdJpmAUi7uxZByZCywjdhyEI1Ly4ZCAQZAyXZCju1u1QtT2OpNuvfmLfYRcJmCv79MeYXJn5xzNZAU'

console.log('=== Checking Token Permissions ===\n')

async function checkToken() {
  try {
    // 1. Check if token is valid
    console.log('1. Validating token...')
    const meUrl = `https://graph.facebook.com/v18.0/me?access_token=${TOKEN}`
    const meResponse = await axios.get(meUrl)
    console.log(`✅ Token is valid`)
    console.log(`   Connected as: ${meResponse.data.name}`)
    console.log(`   User ID: ${meResponse.data.id}\n`)

    // 2. Check permissions
    console.log('2. Checking permissions...')
    const permUrl = `https://graph.facebook.com/v18.0/me/permissions?access_token=${TOKEN}`
    const permResponse = await axios.get(permUrl)

    const allPerms = permResponse.data.data
    const grantedPerms = allPerms.filter(p => p.status === 'granted')
    const declinedPerms = allPerms.filter(p => p.status === 'declined')

    console.log(`\n✅ Granted Permissions (${grantedPerms.length}):`)
    grantedPerms.forEach(p => console.log(`   ✓ ${p.permission}`))

    if (declinedPerms.length > 0) {
      console.log(`\n❌ Declined Permissions (${declinedPerms.length}):`)
      declinedPerms.forEach(p => console.log(`   ✗ ${p.permission}`))
    }

    // 3. Check for required permissions
    console.log('\n3. Checking REQUIRED permissions for posting...')
    const requiredPerms = ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list']
    const grantedPermNames = grantedPerms.map(p => p.permission)

    requiredPerms.forEach(perm => {
      if (grantedPermNames.includes(perm)) {
        console.log(`   ✅ ${perm} - GRANTED`)
      } else {
        console.log(`   ❌ ${perm} - MISSING`)
      }
    })

    // 4. Check token type
    console.log('\n4. Checking token type...')
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${TOKEN}&access_token=${TOKEN}`
    const debugResponse = await axios.get(debugUrl)

    const tokenInfo = debugResponse.data.data
    console.log(`   Token Type: ${tokenInfo.type}`)
    console.log(`   App ID: ${tokenInfo.app_id}`)
    console.log(`   Expires: ${tokenInfo.expires_at === 0 ? 'Never (Permanent)' : new Date(tokenInfo.expires_at * 1000).toLocaleString()}`)

    if (tokenInfo.granular_scopes) {
      console.log('\n   Granular Scopes:')
      tokenInfo.granular_scopes.forEach(scope => {
        console.log(`   • ${scope.scope}`)
        if (scope.target_ids && scope.target_ids.length > 0) {
          console.log(`     Target IDs: ${scope.target_ids.join(', ')}`)
        }
      })
    }

    // 5. Try to get pages
    console.log('\n5. Checking pages accessible...')
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${TOKEN}`
    const pagesResponse = await axios.get(pagesUrl)

    const pages = pagesResponse.data.data || []
    console.log(`   Found ${pages.length} pages accessible`)

    if (pages.length > 0) {
      pages.forEach((page, i) => {
        console.log(`\n   ${i + 1}. ${page.name}`)
        console.log(`      ID: ${page.id}`)
        console.log(`      Category: ${page.category}`)
      })
    } else {
      console.log(`   ❌ No pages accessible with this token`)
    }

    // Final verdict
    console.log('\n' + '='.repeat(60))
    console.log('VERDICT')
    console.log('='.repeat(60))

    if (pages.length === 0) {
      console.log('❌ PROBLEM: Token has 0 pages accessible')
      console.log('\nWHY THIS HAPPENS:')
      console.log('When you generated the token in Graph API Explorer,')
      console.log('there should have been a popup asking:')
      console.log('"Which pages do you want to give access to?"')
      console.log('\nYou must CHECK THE BOXES next to your pages:')
      console.log('  ☐ No Wahala Zone')
      console.log('  ☐ No WahalaZone')
      console.log('  ☐ Nigeriacelebrities')
      console.log('\nWithout checking these boxes, the token cannot access pages.')
      console.log('\nSOLUTION:')
      console.log('1. Go back to Graph API Explorer')
      console.log('2. Generate a NEW token')
      console.log('3. When the popup appears, CHECK THE BOXES')
      console.log('4. Click Continue')
      console.log('5. Try again with the new token')
    } else {
      console.log('✅ Token is ready to use!')
      console.log(`   Can access ${pages.length} page(s)`)
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message)
  }
}

checkToken()
