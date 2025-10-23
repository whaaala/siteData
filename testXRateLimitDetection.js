/**
 * Test X rate limit detection
 */

import { isXRateLimitError } from './xRateLimitTracker.js'

console.log('=== Testing X Rate Limit Error Detection ===\n')

// Test Case 1: Error with title and detail (actual format from X API)
const error1 = {
  title: 'Too Many Requests',
  detail: 'Too Many Requests',
  type: 'about:blank',
  message: 'Request failed with code 429'
}

console.log('Test 1: Error with title and detail')
console.log('Error object:', JSON.stringify(error1, null, 2))
console.log('Is rate limit error?', isXRateLimitError(error1) ? '✅ YES' : '❌ NO')
console.log()

// Test Case 2: Error with status code 429
const error2 = {
  status: 429,
  message: 'Too Many Requests'
}

console.log('Test 2: Error with status code 429')
console.log('Error object:', JSON.stringify(error2, null, 2))
console.log('Is rate limit error?', isXRateLimitError(error2) ? '✅ YES' : '❌ NO')
console.log()

// Test Case 3: Error with code 88 (legacy)
const error3 = {
  code: 88,
  message: 'Rate limit exceeded'
}

console.log('Test 3: Error with code 88')
console.log('Error object:', JSON.stringify(error3, null, 2))
console.log('Is rate limit error?', isXRateLimitError(error3) ? '✅ YES' : '❌ NO')
console.log()

// Test Case 4: Non-rate-limit error
const error4 = {
  status: 401,
  message: 'Unauthorized'
}

console.log('Test 4: Non-rate-limit error (401 Unauthorized)')
console.log('Error object:', JSON.stringify(error4, null, 2))
console.log('Is rate limit error?', isXRateLimitError(error4) ? '❌ FALSE POSITIVE' : '✅ CORRECTLY REJECTED')
console.log()

// Test Case 5: Error message contains "rate limit"
const error5 = {
  message: 'You have exceeded the rate limit for this endpoint'
}

console.log('Test 5: Error message contains "rate limit"')
console.log('Error object:', JSON.stringify(error5, null, 2))
console.log('Is rate limit error?', isXRateLimitError(error5) ? '✅ YES' : '❌ NO')
console.log()

console.log('=== Test Complete ===')
console.log('\n✅ All rate limit errors should be detected correctly!')
