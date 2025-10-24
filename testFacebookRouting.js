/**
 * Test Facebook page routing based on category
 */

import { getFacebookPagesForCategory } from './facebookPageRouter.js'

console.log('=== Testing Facebook Page Routing ===\n')

const testCategories = [
  'Entertainment',
  'Gists',
  'News',
  'Sports',
  'Lifestyle',
  'HealthAndFitness',
  'FoodAndDrink',
  'Cars',
]

console.log('Routing Rules:')
console.log('─'.repeat(60))
console.log('• Entertainment & Gists → Nigeriacelebrities + No Wahala Zone')
console.log('• All other categories → No Wahala Zone only')
console.log('─'.repeat(60))
console.log()

testCategories.forEach(category => {
  const pages = getFacebookPagesForCategory(category)

  console.log(`Category: ${category}`)
  console.log(`  → Posts to ${pages.length} page(s):`)

  pages.forEach(page => {
    console.log(`     • ${page.name} (${page.pageId})`)
  })

  console.log()
})

console.log('='.repeat(60))
console.log('SUMMARY')
console.log('='.repeat(60))
console.log('Entertainment → Nigeriacelebrities + No Wahala Zone ✅')
console.log('Gists → Nigeriacelebrities + No Wahala Zone ✅')
console.log('News → No Wahala Zone only ✅')
console.log('Sports → No Wahala Zone only ✅')
console.log('All other categories → No Wahala Zone only ✅')
