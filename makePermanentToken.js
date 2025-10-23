import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

async function makePermanentToken() {
  console.log('=== Creating Long-Lived (Permanent) Token ===\n')

  // We need:
  // 1. Your short-lived User Access Token (the one you generated)
  // 2. Your App ID and App Secret

  const shortLivedToken = 'EAASfqZBNEGX8BP3w0ZCJyqTbpOd46pfNN8XTaCKs0ed2n3bGtcdS50Bks87QdlFSs2fmbn4B7aBU9QpAaZBgtNmxnoGpmPNZAkihurUNUcNkF1myeSefZAf1X2qQ5Xi3hWqMZAvZCXr8TWQ8NAtLgK80FdZBGqRyRd8dzpluZCzWAynMNYDdEJxpYLQuQOZBTNtfJuxtLLC3bCwR9POkadflUpOoDXpHW0Vds37ToV'

  console.log('To create a long-lived token, you need:')
  console.log('  1. Your Facebook App ID')
  console.log('  2. Your Facebook App Secret')
  console.log()
  console.log('Where to find these:')
  console.log('  1. Go to: https://developers.facebook.com/apps/')
  console.log('  2. Click on your app')
  console.log('  3. Go to Settings → Basic')
  console.log('  4. Copy the App ID and App Secret')
  console.log()
  console.log('Once you have them, you can exchange your short-lived token for a long-lived one.')
  console.log()
  console.log('═'.repeat(80))
  console.log()
  console.log('INSTRUCTIONS:')
  console.log()
  console.log('Run this command in your terminal (replace APP_ID and APP_SECRET):')
  console.log()
  console.log('curl -i -X GET "https://graph.facebook.com/v18.0/oauth/access_token?')
  console.log('  grant_type=fb_exchange_token&')
  console.log('  client_id=YOUR_APP_ID&')
  console.log('  client_secret=YOUR_APP_SECRET&')
  console.log(`  fb_exchange_token=${shortLivedToken}"`)
  console.log()
  console.log('This will return a long-lived User Access Token (valid for 60 days).')
  console.log()
  console.log('Then, use that token to get a Page Access Token (which NEVER expires).')
  console.log()
  console.log('═'.repeat(80))
  console.log()
  console.log('OR - EASIER METHOD:')
  console.log()
  console.log('Just generate a new token every time this one expires!')
  console.log('The current Page Access Token already works perfectly.')
  console.log('You can set a reminder to regenerate it before October 23, 2025.')
  console.log()
}

makePermanentToken().catch(error => {
  console.error('Script error:', error.message)
})
