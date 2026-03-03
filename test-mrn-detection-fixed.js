/**
 * Test MRN Detection with Spaces in Code
 * This tests the AUTO-SEARCH functionality
 */

// Simulate the detectMRNFromText function from scribe-cockpit.js
function detectMRNFromText(text) {
  if (!text || typeof text !== 'string') return null;

  // Pre-process
  let preprocessed = text
    .replace(/\bDASH\b/gi, '-')
    .replace(/\bHYPHEN\b/gi, '-')
    .replace(/\s*-\s*/g, '-');

  const excludeWords = /^(NUMBER|IS|MRN|MRNA|PATIENT|ID|MEDICAL|RECORD|THE|A|AN|HYPHEN|DASH)$/i;
  const stopWords = /^(ON|IN|AT|TO|FOR|WITH|FROM|BY|PATIENT|DOCTOR|NOTE|FILE|CONSULTATION|HI|HELLO)$/i;

  const variations = [
    // "MRN number is MRN AB123" - capture after second "MRN"
    /\bMRN\s+NUMBER\s+IS\s+MRN\s+([A-Z0-9]+(?:\s+[A-Z0-9]+)*)/i,
    // "Medical record number is AB123"
    /\bMEDICAL\s+RECORD\s+NUMBER\s+IS\s+([A-Z0-9]+(?:\s+[A-Z0-9]+)*)/i,
    // "MRN number is AB123"
    /\bMRN\s+NUMBER\s+IS\s+([A-Z0-9]+(?:\s+[A-Z0-9]+)*)/i,
    // "Patient ID is MRN AB123"
    /\bPATIENT\s+ID\s+IS\s+MRN\s+([A-Z0-9]+(?:\s+[A-Z0-9]+)*)/i,
    // "MRNA BA121" - handle misheard "MRN A" as "MRNA"
    /\bMRNA\s+([A-Z0-9]+(?:\s+[A-Z0-9]+)*)/i,
    // "MRN is AB123"
    /\bMRN\s+IS\s+([A-Z0-9]+(?:\s+[A-Z0-9]+)*)/i,
    // "MRN-0001 ABC" - capture code with space after hyphen
    /\bMRN-([A-Z0-9]+(?:\s+[A-Z0-9]+)*)/i,
    // "MRN AB123" (with space)
    /\bMRN\s+([A-Z0-9]+(?:\s+[A-Z0-9]+)*)/i,
    // "M R N AB123"
    /\bM\s+R\s+N\s+([A-Z0-9]+(?:\s+[A-Z0-9]+)*)/i,
  ];

  // Try patterns on preprocessed text first
  for (const pattern of variations) {
    const match = preprocessed.match(pattern);
    if (match && match[1]) {
      // Split by spaces and filter out stop words
      const words = match[1].trim().split(/\s+/);
      const validWords = [];
      for (const w of words) {
        if (!w) continue;
        if (stopWords.test(w)) break; // Stop at first stop word
        validWords.push(w);
      }
      let code = validWords.join('').toUpperCase();
      if (/^[A-Z0-9]{3,}$/.test(code) && !excludeWords.test(code)) {
        return `MRN-${code}`;
      }
    }
  }

  // Fallback to original text
  for (const pattern of variations) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Split by spaces and filter out stop words
      const words = match[1].trim().split(/\s+/);
      const validWords = [];
      for (const w of words) {
        if (!w) continue;
        if (stopWords.test(w)) break; // Stop at first stop word
        validWords.push(w);
      }
      let code = validWords.join('').toUpperCase();
      if (/^[A-Z0-9]{3,}$/.test(code) && !excludeWords.test(code)) {
        return `MRN-${code}`;
      }
    }
  }

  return null;
}

// Test Cases
const tests = [
  { input: "MRN ABA 121", expected: "MRN-ABA121", desc: "YOUR EXACT CASE with spaces" },
  { input: "MRNA BA 121", expected: "MRN-BA121", desc: "MRNA variation with spaces" },
  { input: "MRN aba 121", expected: "MRN-ABA121", desc: "Lowercase with spaces" },
  { input: "MRN 07B", expected: "MRN-07B", desc: "Short code" },
  { input: "MRN VERYLONGCODE 123 456 789", expected: "MRN-VERYLONGCODE123456789", desc: "Very long with multiple spaces" },
  { input: "patient MRN abc 456 on file", expected: "MRN-ABC456", desc: "In sentence with spaces" },
  { input: "MRN-ABA121", expected: "MRN-ABA121", desc: "Already formatted (from voice.js)" },
  { input: "M R N zero seven B", expected: "MRN-ZEROSEVENB", desc: "Letter words captured as-is (number word conversion happens in voice.js)" },
];

console.log('=== MRN DETECTION TEST (Auto-Search) ===\n');

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  const result = detectMRNFromText(test.input);
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';

  console.log(`Test ${index + 1}: ${test.desc}`);
  console.log(`  Input:    "${test.input}"`);
  console.log(`  Output:   ${result === null ? 'null' : `"${result}"`}`);
  console.log(`  Expected: ${test.expected === null ? 'null' : `"${test.expected}"`}`);
  console.log(`  Status:   ${status}\n`);

  if (status.includes('PASS')) {
    passed++;
  } else {
    failed++;
  }
});

console.log('\n=== RESULTS ===');
console.log(`Passed: ${passed}/${tests.length}`);
console.log(`Failed: ${failed}/${tests.length}`);

if (failed === 0) {
  console.log('\n✅ ALL TESTS PASSED! Auto-search will work correctly.');
} else {
  console.log('\n❌ Some tests failed.');
}
