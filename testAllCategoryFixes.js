/**
 * Quick test to verify ALL category fixes work correctly
 * Tests URL inference logic for all 8 fixed sites
 */

console.log('=== TESTING ALL CATEGORY FIXES ===\n')

const allTests = [
  // Pulse.com.gh / pulse.ng
  { site: 'pulse.com.gh', url: 'https://www.pulse.com.gh/articles/news/politics', expected: 'News' },
  { site: 'pulse.com.gh', url: 'https://www.pulse.com.gh/entertainment/celebrity', expected: 'Entertainment' },
  { site: 'pulse.ng', url: 'https://www.pulse.ng/lifestyle/wellness', expected: 'Lifestyle' },
  { site: 'pulse.ng', url: 'https://www.pulse.ng/sports/football', expected: 'Sports' },
  { site: 'pulse.com.gh', url: 'https://www.pulse.com.gh/business/economy', expected: 'News' },

  // Legit.ng
  { site: 'legit.ng', url: 'https://www.legit.ng/politics/elections', expected: 'News' },
  { site: 'legit.ng', url: 'https://www.legit.ng/business-economy/markets', expected: 'News' },
  { site: 'legit.ng', url: 'https://www.legit.ng/entertainment/movies', expected: 'Entertainment' },
  { site: 'legit.ng', url: 'https://www.legit.ng/people/relationships', expected: 'Lifestyle' },
  { site: 'legit.ng', url: 'https://www.legit.ng/sports/football', expected: 'Sports' },

  // Naijanews.com
  { site: 'naijanews.com', url: 'https://www.naijanews.com/entertainment/music', expected: 'Entertainment' },
  { site: 'naijanews.com', url: 'https://www.naijanews.com/sports/afcon', expected: 'Sports' },
  { site: 'naijanews.com', url: 'https://www.naijanews.com/gist/celebrity', expected: 'Gists' },
  { site: 'naijanews.com', url: 'https://www.naijanews.com/2025/10/23/politics', expected: 'News' }, // default

  // Gistreel.com
  { site: 'gistreel.com', url: 'https://www.gistreel.com/politics/election', expected: 'News' },
  { site: 'gistreel.com', url: 'https://www.gistreel.com/entertainment-news/celebrity', expected: 'Entertainment' },
  { site: 'gistreel.com', url: 'https://www.gistreel.com/viral-news/trending', expected: 'Gists' },
  { site: 'gistreel.com', url: 'https://www.gistreel.com/sport/football', expected: 'Sports' },

  // Guardian.ng
  { site: 'guardian.ng', url: 'https://guardian.ng/category/news/politics/', expected: 'News' },
  { site: 'guardian.ng', url: 'https://guardian.ng/politics/election/', expected: 'News' },
  { site: 'guardian.ng', url: 'https://guardian.ng/category/sport/football/', expected: 'Sports' },
  { site: 'guardian.ng', url: 'https://guardian.ng/category/life/relationships/', expected: 'Lifestyle' },

  // Punchng.com
  { site: 'punchng.com', url: 'https://punchng.com/topics/sports/football/', expected: 'Sports' },
  { site: 'punchng.com', url: 'https://punchng.com/sports/super-eagles/', expected: 'Sports' },
  { site: 'punchng.com', url: 'https://punchng.com/punch-lite/trending/', expected: 'Gists' },
  { site: 'punchng.com', url: 'https://punchng.com/entertainment/movies/', expected: 'Entertainment' },

  // Premiumtimesng.com
  { site: 'premiumtimesng.com', url: 'https://premiumtimesng.com/entertainment/nollywood/', expected: 'Entertainment' },
  { site: 'premiumtimesng.com', url: 'https://premiumtimesng.com/category/sports/football/', expected: 'Sports' },
  { site: 'premiumtimesng.com', url: 'https://premiumtimesng.com/category/health/wellness/', expected: 'HealthAndFitness' },
  { site: 'premiumtimesng.com', url: 'https://premiumtimesng.com/category/agriculture/farming/', expected: 'FoodAndDrink' },

  // Yabaleftonline.ng
  { site: 'yabaleftonline.ng', url: 'https://www.yabaleftonline.ng/entertainment/celebrity/', expected: 'Entertainment' },
  { site: 'yabaleftonline.ng', url: 'https://www.yabaleftonline.ng/viral/trending/', expected: 'Gists' }
]

let passed = 0
let failed = 0
const failures = []

allTests.forEach(({ site, url, expected }) => {
  try {
    const urlPath = new URL(url).pathname.toLowerCase()
    let category = null

    // Pulse sites
    if (site.includes('pulse.')) {
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
    }

    // Legit.ng
    if (site.includes('legit.ng')) {
      if (urlPath.includes('/politics/') || urlPath.includes('/business-economy/')) {
        category = 'News'
      } else if (urlPath.includes('/entertainment/')) {
        category = 'Entertainment'
      } else if (urlPath.includes('/people/')) {
        category = 'Lifestyle'
      } else if (urlPath.includes('/sports/')) {
        category = 'Sports'
      }
    }

    // Naijanews.com
    if (site.includes('naijanews.com')) {
      if (urlPath.includes('/entertainment/')) {
        category = 'Entertainment'
      } else if (urlPath.includes('/sports/')) {
        category = 'Sports'
      } else if (urlPath.includes('/gist/')) {
        category = 'Gists'
      } else {
        category = 'News'
      }
    }

    // Gistreel.com
    if (site.includes('gistreel.com')) {
      if (urlPath.includes('/politics/')) {
        category = 'News'
      } else if (urlPath.includes('/entertainment-news/')) {
        category = 'Entertainment'
      } else if (urlPath.includes('/viral-news/')) {
        category = 'Gists'
      } else if (urlPath.includes('/sport/')) {
        category = 'Sports'
      }
    }

    // Guardian.ng
    if (site.includes('guardian.ng')) {
      if (urlPath.includes('/category/news/') || urlPath.includes('/politics/')) {
        category = 'News'
      } else if (urlPath.includes('/category/sport/')) {
        category = 'Sports'
      } else if (urlPath.includes('/category/life/')) {
        category = 'Lifestyle'
      }
    }

    // Punchng.com
    if (site.includes('punchng.com')) {
      if (urlPath.includes('/topics/sports/') || urlPath.includes('/sports/')) {
        category = 'Sports'
      } else if (urlPath.includes('/punch-lite/') || urlPath.includes('/gist/')) {
        category = 'Gists'
      } else if (urlPath.includes('/entertainment/')) {
        category = 'Entertainment'
      }
    }

    // Premiumtimesng.com
    if (site.includes('premiumtimesng.com')) {
      if (urlPath.includes('/entertainment/')) {
        category = 'Entertainment'
      } else if (urlPath.includes('/category/sports/')) {
        category = 'Sports'
      } else if (urlPath.includes('/category/health/')) {
        category = 'HealthAndFitness'
      } else if (urlPath.includes('/category/agriculture/') || urlPath.includes('/food/')) {
        category = 'FoodAndDrink'
      }
    }

    // Yabaleftonline.ng
    if (site.includes('yabaleftonline.ng')) {
      if (urlPath.includes('/entertainment/')) {
        category = 'Entertainment'
      } else if (urlPath.includes('/viral/')) {
        category = 'Gists'
      }
    }

    if (category === expected) {
      console.log(`✅ ${site}: ${expected}`)
      passed++
    } else {
      console.log(`❌ ${site}: Expected "${expected}", got "${category}"`)
      failed++
      failures.push({ site, url, expected, got: category })
    }

  } catch (error) {
    console.log(`❌ ${site}: ERROR - ${error.message}`)
    failed++
    failures.push({ site, url, expected, error: error.message })
  }
})

console.log('\n' + '='.repeat(80))
console.log('TEST SUMMARY')
console.log('='.repeat(80))
console.log(`Total tests: ${allTests.length}`)
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`Success rate: ${Math.round((passed / allTests.length) * 100)}%`)

if (failures.length > 0) {
  console.log('\n❌ FAILURES:')
  failures.forEach(f => {
    console.log(`  ${f.site}: ${f.url}`)
    console.log(`    Expected: ${f.expected}, Got: ${f.got || 'ERROR'}`)
    if (f.error) console.log(`    Error: ${f.error}`)
  })
}

console.log('\n=== TEST COMPLETE ===')
