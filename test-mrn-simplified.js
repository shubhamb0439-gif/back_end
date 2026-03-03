// Test SIMPLIFIED MRN Logic

function formatMRN(text) {
  if (!text) return text;

  const numberWords = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
  };

  const stopWords = /^(is|the|number|patient|id|medical|record|on|in|at|to|for|with|from|by|of|off|file|arrived|was|has|note|consultation|and|or|hi|doctor|hello|came|went|had)$/i;

  let formatted = text;

  // SINGLE PATTERN: Catch any variation of "MRN" followed by alphanumeric content
  formatted = formatted.replace(
    /\b(MRNA|m\s*r\s*n|mrn)\s+((?:[a-z0-9]+\s*)+)/gi,
    (match, prefix, codeRaw) => {
      const words = codeRaw.trim().split(/\s+/);
      const validWords = [];

      for (const w of words) {
        if (!w) continue;
        if (stopWords.test(w)) break;
        validWords.push(w);
      }

      const cleanCode = validWords
        .map(w => {
          const lower = w.toLowerCase();
          if (numberWords[lower]) return numberWords[lower];
          return w.toUpperCase();
        })
        .join('')
        .replace(/[^A-Z0-9]/g, '');

      if (cleanCode.length >= 3) {
        return `MRN-${cleanCode}`;
      }
      return match;
    }
  );

  return formatted;
}

// Test Cases
const tests = [
  { input: "MRN ABA 121", expected: "MRN-ABA121", desc: "Basic with spaces" },
  { input: "MRN A BA 123", expected: "MRN-ABA123", desc: "Extra spaces" },
  { input: "MRNA BA 121", expected: "MRN-BA121", desc: "MRNA variation" },
  { input: "m r n zero one two", expected: "MRN-012", desc: "Spelled out with number words" },
  { input: "mrn aba 121", expected: "MRN-ABA121", desc: "Lowercase" },
  { input: "MRN ABA121", expected: "MRN-ABA121", desc: "No space in code" },
  { input: "MRNA BA121. Hi doctor.", expected: "MRN-BA121", desc: "With punctuation" },
  { input: "Disrespected note. MRNA BA121. Hi doctor.", expected: "MRN-BA121", desc: "Screenshot scenario" },
  { input: "patient mrn abc 456 on file", expected: "MRN-ABC456", desc: "In sentence" },
  { input: "MRN zero zero one a b c", expected: "MRN-001ABC", desc: "Number words" },
  { input: "MRN aba121", expected: "MRN-ABA121", desc: "Your exact case: aba121 (should capture ALL)" },
  { input: "MRN 07B", expected: "MRN-07B", desc: "Short MRN with number" },
  { input: "MRN 07B XOR ABC", expected: "MRN-07BXORABC", desc: "Long MRN - no limit" },
  { input: "MRN VERYLONGCODE123456789", expected: "MRN-VERYLONGCODE123456789", desc: "Very long MRN (no 12 char limit)" },
];

console.log("=== SIMPLIFIED MRN LOGIC TEST ===\n");

let passed = 0;
let failed = 0;

tests.forEach((test, i) => {
  const result = formatMRN(test.input);
  const success = result.includes(test.expected);

  console.log(`Test ${i + 1}: ${test.desc}`);
  console.log(`  Input:    "${test.input}"`);
  console.log(`  Output:   "${result}"`);
  console.log(`  Expected: "${test.expected}"`);
  console.log(`  Status:   ${success ? "✅ PASS" : "❌ FAIL"}`);
  console.log();

  if (success) passed++;
  else failed++;
});

console.log(`\n=== RESULTS ===`);
console.log(`Passed: ${passed}/${tests.length}`);
console.log(`Failed: ${failed}/${tests.length}`);
