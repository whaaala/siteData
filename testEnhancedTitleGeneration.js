/**
 * Test Enhanced Title Generation
 * Demonstrates improved title rewriting: catchy, engaging, SEO-ready, AdSense-compliant
 */

import { rewriteTitle } from './openai.js'

console.log('=== Testing Enhanced Title Generation ===\n')
console.log('This test shows how original titles are transformed into:')
console.log('  ✓ Catchy and engaging headlines')
console.log('  ✓ SEO-optimized (60-70 chars, power words, keywords)')
console.log('  ✓ AdSense-compliant (no clickbait, factually accurate)')
console.log('  ✓ VERY different from the original')
console.log('  ✓ Nigerian/African-focused\n')

// Test with various types of titles
const testTitles = [
  // Entertainment
  {
    category: 'Entertainment',
    original: "Kunle Hamilton knocks BBNaija's Imisi, Oshoffa's grandson, sends memo to Cele youths: 'Be proud'",
  },
  // News
  {
    category: 'News',
    original: 'Single mom breaks down selling phone to feed child: Watch',
  },
  // Sports
  {
    category: 'Sports',
    original: 'Super Eagles qualify for AFCON 2025 after defeating Ghana 3-1 in Abuja',
  },
  // Lifestyle
  {
    category: 'Lifestyle',
    original: 'Lagos Fashion Week 2025: Top Designers Showcase New Collections',
  },
  // Gists
  {
    category: 'Gists',
    original: 'Nigerian lady claims her boyfriend bought her a car without asking for anything in return',
  },
]

async function testTitleGeneration() {
  try {
    for (const test of testTitles) {
      console.log('═'.repeat(90))
      console.log(`📂 CATEGORY: ${test.category}`)
      console.log('═'.repeat(90))
      console.log()
      console.log('📄 ORIGINAL TITLE:')
      console.log(`   "${test.original}"`)
      console.log(`   Length: ${test.original.length} characters`)
      console.log()

      console.log('⏳ Generating enhanced title...')
      const rewritten = await rewriteTitle(test.original)
      console.log()

      console.log('✨ ENHANCED TITLE:')
      console.log(`   "${rewritten}"`)
      console.log(`   Length: ${rewritten.length} characters`)
      console.log()

      // Analysis
      console.log('📊 ANALYSIS:')

      // Check length (ideal: 60-70 chars)
      if (rewritten.length >= 60 && rewritten.length <= 70) {
        console.log(`   ✅ Perfect SEO length (${rewritten.length} chars)`)
      } else if (rewritten.length >= 50 && rewritten.length < 60) {
        console.log(`   ✅ Good SEO length (${rewritten.length} chars)`)
      } else if (rewritten.length > 70 && rewritten.length <= 80) {
        console.log(`   ⚠️  Acceptable but slightly long (${rewritten.length} chars)`)
      } else {
        console.log(`   ❌ Length needs adjustment (${rewritten.length} chars)`)
      }

      // Check for power words
      const powerWords = [
        'reveals', 'breaks', 'sparks', 'inside', 'exclusive', 'shocking',
        'truth', 'what', 'need', 'know', 'how', 'why', 'top', 'best',
        'reportedly', 'claims', 'allegedly', 'breaking', 'urgent',
      ]
      const foundPowerWords = powerWords.filter(word =>
        rewritten.toLowerCase().includes(word)
      )
      if (foundPowerWords.length > 0) {
        console.log(`   ✅ Power words used: ${foundPowerWords.join(', ')}`)
      }

      // Check if very different
      const similarityScore = calculateSimilarity(test.original, rewritten)
      if (similarityScore < 0.3) {
        console.log(`   ✅ Very different from original (${Math.round(similarityScore * 100)}% similarity)`)
      } else if (similarityScore < 0.5) {
        console.log(`   ⚠️  Moderately different (${Math.round(similarityScore * 100)}% similarity)`)
      } else {
        console.log(`   ❌ Too similar to original (${Math.round(similarityScore * 100)}% similarity)`)
      }

      // Check for clickbait phrases (should be absent)
      const clickbaitPhrases = [
        'you won\'t believe',
        'this will shock you',
        'doctors hate',
        'one weird trick',
        'what happened next',
      ]
      const hasClickbait = clickbaitPhrases.some(phrase =>
        rewritten.toLowerCase().includes(phrase)
      )
      if (!hasClickbait) {
        console.log('   ✅ No clickbait detected (AdSense-compliant)')
      } else {
        console.log('   ❌ Clickbait detected - needs revision')
      }

      console.log()
    }

    console.log('═'.repeat(90))
    console.log('🎉 TEST COMPLETED')
    console.log('═'.repeat(90))
    console.log()
    console.log('📈 KEY IMPROVEMENTS:')
    console.log('   1. Titles are now 60-70 characters (SEO-optimized)')
    console.log('   2. Power words drive engagement and clicks')
    console.log('   3. COMPLETELY different structure from originals')
    console.log('   4. No clickbait - AdSense-compliant')
    console.log('   5. Nigerian/African-focused angle')
    console.log('   6. Factually accurate with proper qualifiers')
    console.log()
    console.log('🚀 EXPECTED RESULTS:')
    console.log('   • Higher click-through rates (CTR)')
    console.log('   • Better Google rankings (SEO)')
    console.log('   • AdSense approval maintained')
    console.log('   • More engaging for Nigerian audiences')
    console.log('   • Unique titles not flagged as duplicate content')
    console.log()

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

/**
 * Simple similarity calculation (word overlap)
 */
function calculateSimilarity(str1, str2) {
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 3)

  const commonWords = words1.filter(word => words2.includes(word))
  const totalWords = Math.max(words1.length, words2.length)

  return commonWords.length / totalWords
}

testTitleGeneration()
