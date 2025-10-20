import siteNames from './websites/sites.js'

console.log('='.repeat(70))
console.log('🔍 Validating Site Configurations')
console.log('='.repeat(70))
console.log()

let foundIssues = false
let siteIndex = 0

for (const siteVar of Object.keys(siteNames)) {
  const site = siteNames[siteVar]

  // Check if site has siteUrl
  if (!site.siteUrl || !Array.isArray(site.siteUrl)) {
    console.error(`❌ Site #${siteIndex} (${siteVar}): Missing or invalid siteUrl array`)
    foundIssues = true
    siteIndex++
    continue
  }

  // Check each URL in the array
  for (let urlIdx = 0; urlIdx < site.siteUrl.length; urlIdx++) {
    const url = site.siteUrl[urlIdx]

    if (!url || typeof url !== 'string') {
      console.error(`❌ Site #${siteIndex} (${siteVar})[${urlIdx}]: Invalid URL`)
      console.error(`   Site name: ${site.siteName || site.domain || 'Unknown'}`)
      console.error(`   URL value: ${JSON.stringify(url)}`)
      console.error(`   Type: ${typeof url}`)
      console.error(`   Full array length: ${site.siteUrl.length}`)
      console.log()
      foundIssues = true
    }
  }

  siteIndex++
}

if (!foundIssues) {
  console.log('✅ All sites validated successfully!')
  console.log(`   Total sites: ${Object.keys(siteNames).length}`)
} else {
  console.log('='.repeat(70))
  console.log('⚠️  Found issues in site configurations')
  console.log('Please fix the invalid URLs in websites/sites.js')
  console.log('='.repeat(70))
}
