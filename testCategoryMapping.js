/**
 * Test that all inferred categories map correctly to WordPress
 */

import { wpCategoryMap, getRandomAuthorId } from './categoryMap.js'
import { normalizeCategory } from './normalizeCategory.js'

console.log('=== TESTING CATEGORY MAPPING ===\n')

// All categories we infer in our URL-based fixes
const inferredCategories = [
  'News',
  'Entertainment',
  'Sports',
  'Lifestyle',
  'Gists',
  'HealthAndFitness',
  'FoodAndDrink'
]

console.log('Testing WordPress Category Mapping...\n')

let allMapped = true
const results = []

inferredCategories.forEach(category => {
  console.log(`Testing category: "${category}"`)

  // Step 1: Check if normalizeCategory preserves it
  const normalized = normalizeCategory(category)
  console.log(`  1. After normalizeCategory(): "${normalized}"`)

  if (normalized !== category) {
    console.log(`     ⚠️ WARNING: Category changed after normalization!`)
    allMapped = false
  } else {
    console.log(`     ✅ Category preserved`)
  }

  // Step 2: Check if WordPress mapping exists
  const wpCategoryId = wpCategoryMap[normalized]
  console.log(`  2. WordPress Category ID: ${wpCategoryId}`)

  if (!wpCategoryId) {
    console.log(`     ❌ ERROR: No WordPress mapping found!`)
    allMapped = false
    results.push({ category, status: '❌ NO WP MAPPING', wpId: null, hasAuthors: false })
  } else {
    console.log(`     ✅ Mapped to WordPress category ${wpCategoryId}`)
  }

  // Step 3: Check if author mapping exists
  const authorId = getRandomAuthorId(normalized)
  console.log(`  3. Random Author ID: ${authorId}`)

  if (!authorId) {
    console.log(`     ❌ ERROR: No authors configured for this category!`)
    allMapped = false
    results.push({ category, status: '❌ NO AUTHORS', wpId: wpCategoryId, hasAuthors: false })
  } else {
    console.log(`     ✅ Authors configured`)
    results.push({ category, status: '✅ FULLY MAPPED', wpId: wpCategoryId, hasAuthors: true })
  }

  console.log()
})

// Summary
console.log('='.repeat(80))
console.log('MAPPING SUMMARY')
console.log('='.repeat(80))
console.log()

console.table(results)

console.log()
if (allMapped) {
  console.log('✅ SUCCESS: All inferred categories are properly mapped to WordPress!')
  console.log('✅ All categories have WordPress IDs')
  console.log('✅ All categories have author pools')
} else {
  console.log('❌ ERROR: Some categories are not properly mapped!')
  console.log('   Please fix categoryMap.js or normalizeCategory.js')
}

// Additional check: Verify all sites are using valid categories
console.log('\n' + '='.repeat(80))
console.log('SITE-SPECIFIC CATEGORY VALIDATION')
console.log('='.repeat(80))
console.log()

const siteCategories = {
  'pulse.com.gh': ['News', 'Entertainment', 'Lifestyle', 'Sports'],
  'legit.ng': ['News', 'Entertainment', 'Lifestyle', 'Sports'],
  'naijanews.com': ['News', 'Entertainment', 'Sports', 'Gists'],
  'gistreel.com': ['News', 'Entertainment', 'Gists', 'Sports'],
  'guardian.ng': ['News', 'Sports', 'Lifestyle'],
  'punchng.com': ['Sports', 'Gists', 'Entertainment'],
  'premiumtimesng.com': ['Entertainment', 'Sports', 'HealthAndFitness', 'FoodAndDrink'],
  'yabaleftonline.ng': ['Entertainment', 'Gists']
}

let allSitesValid = true

Object.entries(siteCategories).forEach(([site, categories]) => {
  console.log(`\n${site}:`)
  categories.forEach(cat => {
    const wpId = wpCategoryMap[cat]
    const hasAuthors = !!getRandomAuthorId(cat)

    if (wpId && hasAuthors) {
      console.log(`  ✅ ${cat} → WordPress ID ${wpId}`)
    } else {
      console.log(`  ❌ ${cat} → MISSING MAPPING`)
      allSitesValid = false
    }
  })
})

console.log('\n' + '='.repeat(80))
if (allSitesValid) {
  console.log('✅ ALL SITES USE VALID MAPPED CATEGORIES')
} else {
  console.log('❌ SOME SITES USE UNMAPPED CATEGORIES - FIX REQUIRED')
}
console.log('='.repeat(80))
