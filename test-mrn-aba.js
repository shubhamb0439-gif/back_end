function detectMRNFromText(text) {
  if (!text || typeof text !== 'string') return null;

  // Pre-process: Replace spoken words before detection and clean up spacing
  let preprocessed = text
    .replace(/\bDASH\b/gi, '-')
    .replace(/\bHYPHEN\b/gi, '-')
    .replace(/\s*-\s*/g, '-');

  const excludeWords = /^(NUMBER|IS|MRN|MRNA|PATIENT|ID|MEDICAL|RECORD|THE|A|AN|HYPHEN|DASH|HI|HELLO|DOCTOR|NOTE|WILL|BE|IN)$/i;

  const variations = [
    // "MRN number is MRN AB123" - capture after second "MRN"
    /\bMRN\s+NUMBER\s+IS\s+MRN\s+([A-Z0-9]{3,12})\b/i,
    // "Medical record number is AB123"
    /\bMEDICAL\s+RECORD\s+NUMBER\s+IS\s+([A-Z0-9]{3,12})\b/i,
    // "MRN number is AB123"
    /\bMRN\s+NUMBER\s+IS\s+([A-Z0-9]{3,12})\b/i,
    // "Patient ID is MRN AB123"
    /\bPATIENT\s+ID\s+IS\s+MRN\s+([A-Z0-9]{3,12})\b/i,
    // "MRNA BA121" - handle misheard "MRN A" as "MRNA"
    /\bMRNA\s+([A-Z0-9]{3,12})\b/i,
    // "MRN is AB123"
    /\bMRN\s+IS\s+([A-Z0-9]{3,12})\b/i,
    // "MRN-0001 ABC" - capture code with space after hyphen (spoken as "MRN hyphen 0001 ABC")
    /\bMRN-([A-Z0-9]+(?:\s+[A-Z0-9]+)*)/i,
    // "MRN AB123" (with space)
    /\bMRN\s+([A-Z0-9]{3,12})\b/i,
    // "M R N AB123"
    /\bM\s+R\s+N\s+([A-Z0-9]{3,12})\b/i,
    // "ABA 121" at start - capture standalone code at beginning (3-5 letter prefix + space + digits)
    /^([A-Z]{2,5}\s+\d{2,6})\b/i,
    // "AB123" at start - capture alphanumeric code at beginning
    /^([A-Z]{2,5}\d{2,6})\b/i,
  ];

  // Try patterns on preprocessed text first
  for (let i = 0; i < variations.length; i++) {
    const pattern = variations[i];
    const match = preprocessed.match(pattern);
    if (match && match[1]) {
      let code = match[1].trim().toUpperCase().replace(/\s+/g, '');
      if (/^[A-Z0-9]{3,12}$/.test(code) && !excludeWords.test(code)) {
        console.log(`  ✓ Pattern ${i} matched on preprocessed text: "${match[0]}" -> ${code}`);
        return `MRN-${code}`;
      }
    }
  }

  // Fallback to original text
  for (let i = 0; i < variations.length; i++) {
    const pattern = variations[i];
    const match = text.match(pattern);
    if (match && match[1]) {
      let code = match[1].trim().toUpperCase().replace(/\s+/g, '');
      if (/^[A-Z0-9]{3,12}$/.test(code) && !excludeWords.test(code)) {
        console.log(`  ✓ Pattern ${i} matched on original text: "${match[0]}" -> ${code}`);
        return `MRN-${code}`;
      }
    }
  }

  return null;
}

// Test cases
console.log('\n=== MRN Detection Tests (Updated) ===\n');

const testCases = [
  'ABA 121. Hi doctor, I\'m feeling a persistent pain in my head over a period of two days.',
  'MRNA BA121 Hi doctor. Hi patient Doctor.',
  'MRN hyphen AB123',
  'AB123 is the patient ID',
  'The patient is AB456',
  'Disrespected note will be in. Consultation note. MRNA BA121',
];

testCases.forEach(test => {
  const result = detectMRNFromText(test);
  console.log(`Input: "${test}"`);
  console.log(`Result: ${result || 'NOT DETECTED'}`);
  console.log(`Status: ${result ? '✓ DETECTED' : '✗ NOT DETECTED'}\n`);
});
