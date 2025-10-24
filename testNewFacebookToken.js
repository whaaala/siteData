/**
 * Test new Facebook token
 */

import axios from 'axios'

const NEW_TOKEN = 'EAAS5Lw9XGyABPzy8kEY7tjattHoz4yWiOYaeYHPbN2rAdQ7aWgFczol05WlaPuWQVtCmKUa8XAvIz05d2deQIoiwX4FGWofS5UxmUQvm1SAl1jWathgKmoIvb2K80XHGRd5G1zP1M4kHoc2fkZAzGCm0JaD43GvbPyhqKHm3es5qeZCeO2ybahA1Az2vsEDzhrSJj0vdfCPilty5wrK0u7t4qRY3sTI9BY5zZB45z0rjo0HeCbVmOfiHLpiSKzgI9k5u8u4dyIJwdEZD'
const PAGE_ID = '893499463838290'

console.log('=== Testing New Facebook Token ===\n')

async function testToken() {
  try {
    // Test 1: Verify token is valid
    console.log('Test 1: Verifying token validity...')
    const meUrl = `https://graph.facebook.com/v18.0/me?access_token=${NEW_TOKEN}`
    const meResponse = await axios.get(meUrl)
    console.log(`✅ Token is valid. Connected as: ${meResponse.data.name}`)
    console.log(`   ID: ${meResponse.data.id}\n`)

    // Test 2: Check token permissions
    console.log('Test 2: Checking token permissions...')
    const permUrl = `https://graph.facebook.com/v18.0/me/permissions?access_token=${NEW_TOKEN}`
    const permResponse = await axios.get(permUrl)

    const permissions = permResponse.data.data
    const grantedPermissions = permissions.filter(p => p.status === 'granted').map(p => p.permission)

    console.log('Granted permissions:')
    grantedPermissions.forEach(p => console.log(`  ✅ ${p}`))

    // Check for required permissions
    const requiredPerms = ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list']
    const missingPerms = requiredPerms.filter(p => !grantedPermissions.includes(p))

    if (missingPerms.length > 0) {
      console.log('\n⚠️ Missing required permissions:')
      missingPerms.forEach(p => console.log(`  ❌ ${p}`))
    } else {
      console.log('\n✅ All required permissions granted!')
    }

    // Test 3: Check if token is a Page token
    console.log('\nTest 3: Checking if this is a Page Access Token...')
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${NEW_TOKEN}&access_token=${NEW_TOKEN}`
    const debugResponse = await axios.get(debugUrl)

    const tokenInfo = debugResponse.data.data
    console.log(`Token type: ${tokenInfo.type}`)
    console.log(`Expires: ${tokenInfo.expires_at === 0 ? 'Never (Permanent)' : new Date(tokenInfo.expires_at * 1000).toLocaleString()}`)
    console.log(`App ID: ${tokenInfo.app_id}`)

    if (tokenInfo.granular_scopes) {
      console.log('\nGranted scopes:')
      tokenInfo.granular_scopes.forEach(scope => {
        console.log(`  • ${scope.scope} (${scope.target_ids?.join(', ') || 'all'})`)
      })
    }

    // Test 4: Try to post to page (dry run - just check endpoint)
    console.log('\nTest 4: Testing page posting capability...')
    const pageUrl = `https://graph.facebook.com/v18.0/${PAGE_ID}?fields=name,access_token&access_token=${NEW_TOKEN}`
    const pageResponse = await axios.get(pageUrl)

    console.log(`✅ Can access page: ${pageResponse.data.name}`)

    if (pageResponse.data.access_token) {
      console.log('✅ Token includes page access')
    } else {
      console.log('⚠️ Token does not include page-specific access')
    }

    // Final verdict
    console.log('\n' + '='.repeat(60))
    console.log('VERDICT')
    console.log('='.repeat(60))

    const hasRequiredPerms = missingPerms.length === 0
    const isPageToken = tokenInfo.type === 'PAGE'

    if (hasRequiredPerms && (isPageToken || grantedPermissions.includes('pages_manage_posts'))) {
      console.log('✅ TOKEN IS READY TO USE!')
      console.log('   This token can post to your Facebook page.')
    } else {
      console.log('❌ TOKEN NEEDS FIXES:')
      if (!hasRequiredPerms) {
        console.log('   - Missing permissions:', missingPerms.join(', '))
      }
      if (!isPageToken && !grantedPermissions.includes('pages_manage_posts')) {
        console.log('   - Token needs pages_manage_posts permission')
      }
    }

  } catch (error) {
    console.error('❌ Error testing token:', error.response?.data || error.message)
  }
}

testToken()
