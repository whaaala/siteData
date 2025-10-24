/**
 * Test Instagram rate limit error detection
 */

import { isRateLimitError } from './instagramRateLimitTracker.js'

console.log('=== Testing Instagram Rate Limit Error Detection ===\n')

// Test case 1: Real error from user's logs
console.log('Test 1: Real Instagram rate limit error (Code 4, Subcode 2207051)')
const realError = {
  type: 'OAuthException',
  code: 4,
  message: 'Application request limit reached',
  error_subcode: 2207051,
  error: {
    message: 'Application request limit reached',
    type: 'OAuthException',
    is_transient: false,
    code: 4,
    error_subcode: 2207051,
    error_user_title: 'Action is blocked',
    error_user_msg: "We restrict certain activity to protect our community. Tell us if you think that we've made a mistake.",
    fbtrace_id: 'Am7C_jqqGAKt6-tCnBMj1uH'
  }
}

if (isRateLimitError(realError)) {
  console.log('✅ PASS: Correctly detected rate limit error')
} else {
  console.log('❌ FAIL: Did NOT detect rate limit error')
}

// Test case 2: Code 4 only (primary Instagram rate limit code)
console.log('\nTest 2: Code 4 (Application request limit)')
const code4Error = {
  code: 4,
  message: 'Application request limit reached'
}

if (isRateLimitError(code4Error)) {
  console.log('✅ PASS: Correctly detected code 4')
} else {
  console.log('❌ FAIL: Did NOT detect code 4')
}

// Test case 3: Code 32 (Page request limit)
console.log('\nTest 3: Code 32 (Page request limit)')
const code32Error = {
  code: 32,
  message: 'Page request limit reached'
}

if (isRateLimitError(code32Error)) {
  console.log('✅ PASS: Correctly detected code 32')
} else {
  console.log('❌ FAIL: Did NOT detect code 32')
}

// Test case 4: Subcode 2207051 (Action blocked)
console.log('\nTest 4: Subcode 2207051 (Action blocked)')
const subcodeError = {
  error_subcode: 2207051,
  message: 'Action is blocked'
}

if (isRateLimitError(subcodeError)) {
  console.log('✅ PASS: Correctly detected subcode 2207051')
} else {
  console.log('❌ FAIL: Did NOT detect subcode 2207051')
}

// Test case 5: Message-based detection
console.log('\nTest 5: Message-based detection')
const messageError = {
  message: 'Request limit reached'
}

if (isRateLimitError(messageError)) {
  console.log('✅ PASS: Correctly detected from message')
} else {
  console.log('❌ FAIL: Did NOT detect from message')
}

// Test case 6: Nested error structure (after our fix)
console.log('\nTest 6: Nested error structure (response.data.error)')
const nestedError = {
  response: {
    data: {
      error: {
        code: 4,
        error_subcode: 2207051,
        message: 'Application request limit reached'
      }
    }
  }
}

if (isRateLimitError(nestedError)) {
  console.log('✅ PASS: Correctly detected nested error structure')
} else {
  console.log('❌ FAIL: Did NOT detect nested error structure')
}

// Test case 7: Non-rate-limit error (should NOT be detected)
console.log('\nTest 7: Non-rate-limit error (should NOT be detected)')
const normalError = {
  code: 100,
  message: 'Invalid parameter'
}

if (!isRateLimitError(normalError)) {
  console.log('✅ PASS: Correctly ignored non-rate-limit error')
} else {
  console.log('❌ FAIL: Incorrectly detected non-rate-limit error as rate limit')
}

console.log('\n=== Test Complete ===')
