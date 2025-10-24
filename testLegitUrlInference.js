/**
 * Test URL-based category inference for legit.ng
 */

console.log('=== Testing Legit.ng URL-Based Category Inference ===\n')

const testUrls = [
  { url: 'https://www.legit.ng/politics/1626929-breaking-okonjo-iweala-joins-2027-presidential-race-picks-atiku-running-mate/', expected: 'News' },
  { url: 'https://www.legit.ng/entertainment/1626886-im-boy-mom-destiny-etiko-sparks-reactions-video-playing-football-male-kid/', expected: 'Entertainment' },
  { url: 'https://www.legit.ng/people/1626925-man-shares-video-wife-bringing-n50-naira-notes-restaurant-pay-bill/', expected: 'Lifestyle' },
  { url: 'https://www.legit.ng/sports/1626890-afcon-2025-victor-osimhen-ready-fire-super-eagles-glory/', expected: 'Sports' },
  { url: 'https://www.legit.ng/business-economy/economy/1626929-inflation-rises/', expected: 'News' }
]

testUrls.forEach(({ url, expected }) => {
  console.log(`Testing: ${url}`)

  const urlPath = new URL(url).pathname.toLowerCase()
  let category = null

  if (urlPath.includes('/politics/') || urlPath.includes('/business-economy/')) {
    category = 'News'
    console.log(`  ✅ Inferred: News (from ${urlPath.includes('/politics/') ? 'politics' : 'business-economy'})`)
  } else if (urlPath.includes('/entertainment/')) {
    category = 'Entertainment'
    console.log(`  ✅ Inferred: Entertainment`)
  } else if (urlPath.includes('/people/')) {
    category = 'Lifestyle'
    console.log(`  ✅ Inferred: Lifestyle (from people)`)
  } else if (urlPath.includes('/sports/')) {
    category = 'Sports'
    console.log(`  ✅ Inferred: Sports`)
  } else {
    console.log(`  ❌ No category match in URL path`)
  }

  if (category === expected) {
    console.log(`  ✅ PASS: Matches expected "${expected}"`)
  } else {
    console.log(`  ❌ FAIL: Expected "${expected}", got "${category}"`)
  }

  console.log()
})

console.log('=== Test Complete ===')
