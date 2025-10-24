/**
 * Exchange User Access Token for Page Access Token
 */

import axios from 'axios'

const USER_TOKEN = 'EAAKznm6vOd8BP0FCNktHhuEgtkmj9ZCZClKi0fyNDQerkchVx8v6vBRXbNE4wot0fCCLBh0DDaFUvQODoksfsHZCemFkBdMXZA8VQ5piKsoZCiE7v1Va1OBhAun61reZCYHKqwXNy0g3i1kZCaZAAQYSxbi2AbZAJR6bYdmUxr5705zc25w9tn7HFvXABzdtZAINZAWz4HNBpgQVTJWCVK7pdJpmAUi7uxZByZCywjdhyEI1Ly4ZCAQZAyXZCju1u1QtT2OpNuvfmLfYRcJmCv79MeYXJn5xzNZAU'
const PAGE_ID = '893499463838290' // Nigeriacelebrities - Target page

console.log('=== Getting Page Access Token ===\n')

async function getPageToken() {
  try {
    // Step 1: Get list of pages managed by this user
    console.log('Step 1: Getting your Facebook Pages...')
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${USER_TOKEN}`
    const pagesResponse = await axios.get(pagesUrl)

    const pages = pagesResponse.data.data
    console.log(`Found ${pages.length} pages:\n`)

    // Show all pages
    let targetPage = null
    let nigeriaCelebritiesPage = null

    pages.forEach((page, index) => {
      console.log(`${index + 1}. ${page.name}`)
      console.log(`   ID: ${page.id}`)
      console.log(`   Category: ${page.category}`)
      console.log(`   Access Token: ${page.access_token.substring(0, 20)}...`)

      // Look for "Nigeriacelebrities" page (case-insensitive)
      if (page.name.toLowerCase().includes('nigeriacelebrities') ||
          page.name.toLowerCase().includes('nigeria celebrities')) {
        nigeriaCelebritiesPage = page
        console.log(`   ✅ THIS IS THE NIGERIACELEBRITIES PAGE!`)
      }

      if (page.id === PAGE_ID) {
        targetPage = page
        console.log(`   ✅ THIS IS PAGE ID ${PAGE_ID}`)
      }
      console.log()
    })

    // Use Nigeriacelebrities page if found, otherwise use configured page
    if (nigeriaCelebritiesPage) {
      console.log('✅ Found "Nigeriacelebrities" page!')
      targetPage = nigeriaCelebritiesPage
    } else if (!targetPage) {
      console.error(`❌ Could not find "Nigeriacelebrities" or page with ID ${PAGE_ID}`)
      console.error('Available pages:')
      pages.forEach(p => console.error(`  - ${p.name} (ID: ${p.id})`))
      return
    }

    // Step 2: Get the page access token
    console.log('\n' + '='.repeat(60))
    console.log('✅ PAGE ACCESS TOKEN FOUND!')
    console.log('='.repeat(60))
    console.log()
    console.log('Page Name:', targetPage.name)
    console.log('Page ID:', targetPage.id)
    console.log()
    console.log('📋 YOUR PAGE ACCESS TOKEN:')
    console.log(targetPage.access_token)
    console.log()

    // Step 3: Check token info
    console.log('Checking token details...')
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${targetPage.access_token}&access_token=${USER_TOKEN}`
    const debugResponse = await axios.get(debugUrl)

    const tokenInfo = debugResponse.data.data
    console.log(`Token Type: ${tokenInfo.type}`)
    console.log(`Expires: ${tokenInfo.expires_at === 0 ? '✅ Never (Permanent)' : new Date(tokenInfo.expires_at * 1000).toLocaleString()}`)
    console.log()

    // Step 4: Get Instagram Account ID
    console.log('Getting Instagram Account ID...')
    try {
      const igUrl = `https://graph.facebook.com/v18.0/${PAGE_ID}?fields=instagram_business_account&access_token=${targetPage.access_token}`
      const igResponse = await axios.get(igUrl)

      if (igResponse.data.instagram_business_account) {
        const igAccountId = igResponse.data.instagram_business_account.id
        console.log(`✅ Instagram Account ID: ${igAccountId}`)
        console.log()
      } else {
        console.log('⚠️ No Instagram account connected to this page')
        console.log()
      }
    } catch (igError) {
      console.log('⚠️ Could not get Instagram account:', igError.response?.data?.error?.message || igError.message)
      console.log()
    }

    // Step 5: Test posting capability
    console.log('Testing if token can post photos...')
    const testUrl = `https://graph.facebook.com/v18.0/${PAGE_ID}?fields=name,can_post&access_token=${targetPage.access_token}`
    const testResponse = await axios.get(testUrl)

    console.log(`Can post to page: ${testResponse.data.can_post !== false ? '✅ YES' : '❌ NO'}`)
    console.log()

    // Final instructions
    console.log('='.repeat(60))
    console.log('COPY THIS TOKEN TO YOUR .env FILE')
    console.log('='.repeat(60))
    console.log()
    console.log('Replace BOTH:')
    console.log('- FACEBOOK_ACCESS_TOKEN')
    console.log('- INSTAGRAM_ACCESS_TOKEN')
    console.log()
    console.log('With this token:')
    console.log(targetPage.access_token)
    console.log()

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message)
  }
}

getPageToken()
