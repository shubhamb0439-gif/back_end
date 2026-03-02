function normalizeMRN(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return null;
  let normalized = rawInput.trim().toUpperCase().replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-');
  normalized = normalized.replace(/\bDASH\b/gi, '-').replace(/\bHYPHEN\b/gi, '-');

  const excludeWords = /^(NUMBER|IS|MRN|PATIENT|ID|MEDICAL|RECORD|THE|A|AN)$/i;

  const patterns = [
    /\bM\s*R\s*N\s*-\s*([A-Z0-9]{3,12})\b/i,
    /\bMRN-([A-Z0-9]{3,12})\b/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      const code = match[1].replace(/\s+/g, '');
      if (/^[A-Z0-9]{3,12}$/.test(code) && !excludeWords.test(code)) {
        return `MRN-${code}`;
      }
    }
  }
  return null;
}

function detectMRNFromText(text) {
  if (!text || typeof text !== 'string') return null;

  const excludeWords = /^(NUMBER|IS|MRN|PATIENT|ID|MEDICAL|RECORD|THE|A|AN)$/i;

  const variations = [
    // "MRN number is MRN AB123" - capture after second "MRN"
    /\bMRN\s+NUMBER\s+IS\s+MRN\s+([A-Z0-9]{3,12})\b/i,
    // "Medical record number is AB123"
    /\bMEDICAL\s+RECORD\s+NUMBER\s+IS\s+([A-Z0-9]{3,12})\b/i,
    // "MRN number is AB123"
    /\bMRN\s+NUMBER\s+IS\s+([A-Z0-9]{3,12})\b/i,
    // "Patient ID is MRN AB123"
    /\bPATIENT\s+ID\s+IS\s+MRN\s+([A-Z0-9]{3,12})\b/i,
    // "MRN is AB123"
    /\bMRN\s+IS\s+([A-Z0-9]{3,12})\b/i,
    // "MRN-AB123" (with hyphen)
    /\bMRN-([A-Z0-9]{3,12})\b/i,
    // "MRN AB123" (with space, but not followed by common words)
    /\bMRN\s+([A-Z0-9]{3,12})\b/i,
    // "M R N AB123"
    /\bM\s+R\s+N\s+([A-Z0-9]{3,12})\b/i,
  ];

  for (let i = 0; i < variations.length; i++) {
    const pattern = variations[i];
    const match = text.match(pattern);
    if (match && match[1]) {
      const code = match[1].trim().toUpperCase();
      console.log(`  Pattern ${i}: matched="${match[0]}", captured="${code}"`);
      if (/^[A-Z0-9]{3,12}$/.test(code) && !excludeWords.test(code)) {
        return `MRN-${code}`;
      }
    }
  }

  const normalized = normalizeMRN(text);
  if (normalized) return normalized;

  return null;
}

// Test cases
console.log('\n=== MRN Detection Tests ===\n');

const testCases = [
  'Hi Doctor. My patient MRN number is MRN AB123.',
  'MRN AB123',
  'MRN number is AB123',
  'Patient MRN is AB123',
  'M R N AB123',
  'mrn ab123',
];

testCases.forEach(test => {
  const result = detectMRNFromText(test);
  console.log(`Input: "${test}"`);
  console.log(`Result: ${result}`);
  console.log(`Status: ${result ? '✓ DETECTED' : '✗ NOT DETECTED'}\n`);
});
