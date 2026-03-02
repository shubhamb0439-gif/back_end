// Test complete MRN flow: Voice formatting + Detection
// This tests the integration between voice.js _formatMRN() and scribe-cockpit.js detectMRNFromText()

// Simulated _formatMRN from voice.js (UPDATED VERSION)
function formatMRN(text) {
  if (!text) return text;

  const numberWords = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
  };

  const excludeWords = /^(is|the|number|patient|id|medical|record|an|dash|hyphen|mrn)$/i;

  let formatted = text;

  // Pattern 1: "MRN number is MRN ABA121" - handle redundant MRN
  formatted = formatted.replace(
    /\b(?:m\s*r\s*n|mrn)\s+number\s+is\s+(?:m\s*r\s*n|mrn)\s+([a-z0-9\s]+)\b/gi,
    (match, code) => {
      const cleanCode = code.trim().replace(/\s+/g, '').toUpperCase();
      if (cleanCode.length >= 3 && cleanCode.length <= 12) {
        return `MRN-${cleanCode}`;
      }
      return match;
    }
  );

  // Pattern 2: "MRN is ABA121" or "MRN number is ABA121" (with number words)
  formatted = formatted.replace(
    /\b(m\s*r\s*n|mrn)\s+(?:number\s+)?is\s+((?:(?:zero|one|two|three|four|five|six|seven|eight|nine|[a-z0-9])[\s]*)+)\b/gi,
    (match, prefix, code) => {
      const words = code.trim().split(/\s+/);
      const converted = words.map(w => {
        const lower = w.toLowerCase();
        if (numberWords[lower]) return numberWords[lower];
        return w.toUpperCase();
      }).join('');

      if (converted.length >= 3 && converted.length <= 12) {
        return `MRN-${converted}`;
      }
      return match;
    }
  );

  // Pattern 3: "mrn" or "m r n" followed by alphanumeric code or number words
  formatted = formatted.replace(
    /\b(m\s*r\s*n|mrn)\s+((?:(?:zero|one|two|three|four|five|six|seven|eight|nine|[a-z]{1,3}|\d+)[\s\-]*){1,12})/gi,
    (match, prefix, codeRaw) => {
      const words = codeRaw.trim().split(/[\s\-]+/);

      const stopWords = /^(on|in|at|to|for|with|from|by|of|off|file|patient|arrived|was|has|note|consultation|and|or|the)$/i;
      const validWords = [];

      for (const w of words) {
        if (!w) continue;
        if (stopWords.test(w)) break;
        if (!excludeWords.test(w)) validWords.push(w);
      }

      const cleanCode = validWords
        .map(w => {
          const lower = w.toLowerCase();
          if (numberWords[lower]) return numberWords[lower];
          if (w.length === 1) return w.toUpperCase();
          return w.toUpperCase();
        })
        .join('')
        .replace(/[^A-Z0-9]/g, '');

      if (cleanCode.length >= 3 && cleanCode.length <= 12) {
        return `MRN-${cleanCode}`;
      }
      return match;
    }
  );

  return formatted;
}

// Simulated detectMRNFromText from scribe-cockpit.js
function detectMRNFromText(text) {
  if (!text || typeof text !== 'string') return null;

  let preprocessed = text
    .replace(/\bDASH\b/gi, '-')
    .replace(/\bHYPHEN\b/gi, '-')
    .replace(/\s*-\s*/g, '-');

  const excludeWords = /^(NUMBER|IS|MRN|MRNA|PATIENT|ID|MEDICAL|RECORD|THE|A|AN|HYPHEN|DASH)$/i;

  const variations = [
    /\bMRN\s+NUMBER\s+IS\s+MRN\s+([A-Z0-9]{3,12})\b/i,
    /\bMEDICAL\s+RECORD\s+NUMBER\s+IS\s+([A-Z0-9]{3,12})\b/i,
    /\bMRN\s+NUMBER\s+IS\s+([A-Z0-9]{3,12})\b/i,
    /\bPATIENT\s+ID\s+IS\s+MRN\s+([A-Z0-9]{3,12})\b/i,
    /\bMRNA\s+([A-Z0-9]{3,12})\b/i,
    /\bMRN\s+IS\s+([A-Z0-9]{3,12})\b/i,
    /\bMRN-([A-Z0-9]+(?:\s+[A-Z0-9]+)*)/i,
    /\bMRN\s+([A-Z0-9]{3,12})\b/i,
    /\bM\s+R\s+N\s+([A-Z0-9]{3,12})\b/i,
  ];

  for (const pattern of variations) {
    const match = preprocessed.match(pattern);
    if (match && match[1]) {
      let code = match[1].trim().toUpperCase().replace(/\s+/g, '');
      if (/^[A-Z0-9]{3,12}$/.test(code) && !excludeWords.test(code)) {
        return `MRN-${code}`;
      }
    }
  }

  for (const pattern of variations) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let code = match[1].trim().toUpperCase().replace(/\s+/g, '');
      if (/^[A-Z0-9]{3,12}$/.test(code) && !excludeWords.test(code)) {
        return `MRN-${code}`;
      }
    }
  }

  return null;
}

// Test cases
const testCases = [
  {
    spoken: "mrn aba 121",
    expected: "MRN-ABA121",
    description: "User's exact case - spoken with spaces"
  },
  {
    spoken: "MRN ABA 121",
    expected: "MRN-ABA121",
    description: "Capitalized version"
  },
  {
    spoken: "the patient MRN is ABA 121",
    expected: "MRN-ABA121",
    description: "MRN in sentence context"
  },
  {
    spoken: "m r n zero zero one a b c",
    expected: "MRN-001ABC",
    description: "Spelled out with number words"
  },
  {
    spoken: "MRN number is MRN ABA121",
    expected: "MRN-ABA121",
    description: "Redundant MRN prefix"
  },
  {
    spoken: "patient mrn number is aba one two one",
    expected: "MRN-ABA121",
    description: "Patient context with number words"
  },
  {
    spoken: "disrespected note should be in a consultation note. MRN ABA 121",
    expected: "MRN-ABA121",
    description: "User's exact transcription scenario"
  },
  {
    spoken: "mrn-abc123",
    expected: "MRN-ABC123",
    description: "Already formatted with hyphen"
  },
  {
    spoken: "the patient has mrn abc 456 on file",
    expected: "MRN-ABC456",
    description: "MRN in middle of sentence"
  }
];

console.log("=== Complete MRN Flow Test ===\n");

testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.description}`);
  console.log(`  Spoken input:  "${test.spoken}"`);

  // Step 1: Voice formatting
  const formatted = formatMRN(test.spoken);
  console.log(`  After voice.js formatMRN(): "${formatted}"`);

  // Step 2: Detection
  const detected = detectMRNFromText(formatted);
  console.log(`  After scribe-cockpit.js detectMRNFromText(): "${detected}"`);

  // Validation
  const pass = detected === test.expected;
  console.log(`  Expected: "${test.expected}"`);
  console.log(`  Result: ${pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log();
});
