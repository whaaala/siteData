/**
 * Test the pulse.com.gh URL-based category inference
 */

console.log('=== Testing Pulse Category Inference ===\n')

const testUrls = [
  {
    url: 'https://www.pulse.com.gh/articles/news/63-npp-mps-declare-support-for-dr-bawumia-ahead-of-january-31-presidential-primaries-2025102316244949388',
    expected: 'News'
  },
  {
    url: 'https://www.pulse.com.gh/entertainment/some-entertainment-article',
    expected: 'Entertainment'
  },
  {
    url: 'https://www.pulse.com.gh/lifestyle/wellness-tips',
    expected: 'Lifestyle'
  },
  {
    url: 'https://www.pulse.com.gh/sports/football-news',
    expected: 'Sports'
  },
  {
    url: 'https://www.pulse.com.gh/business/economy-update',
    expected: 'News' // Business maps to News
  },
  {
    url: 'https://www.pulse.ng/news/local/lagos-news',
    expected: 'News'
  }
]

testUrls.forEach(({ url, expected }, index) => {
  console.log(`Test ${index + 1}: ${url}`)

  try {
    const urlPath = new URL(url).pathname.toLowerCase()
    let category = null

    if (urlPath.includes('/news/') || urlPath.includes('/articles/news/')) {
      category = 'News'
    } else if (urlPath.includes('/entertainment/')) {
      category = 'Entertainment'
    } else if (urlPath.includes('/lifestyle/')) {
      category = 'Lifestyle'
    } else if (urlPath.includes('/sports/')) {
      category = 'Sports'
    } else if (urlPath.includes('/business/')) {
      category = 'News'
    }

    if (category === expected) {
      console.log(`  ✅ PASS: Inferred category "${category}"`)
    } else {
      console.log(`  ❌ FAIL: Expected "${expected}", got "${category}"`)
    }
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`)
  }

  console.log()
})

console.log('=== Test Complete ===')
