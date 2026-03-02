# MRN Auto-Detection - Quick Reference

## For Developers

### Key Functions

```javascript
// Normalize raw input to MRN-XXXX format
normalizeMRN(rawInput) → 'MRN-XXXX' | null

// Detect MRN from any text
detectMRNFromText(text) → 'MRN-XXXX' | null

// Trigger full EHR automation
automateEHRWorkflow(mrn) → Promise<void>

// Scan recent transcripts for MRN changes
continuousMRNDetection() → void
```

### State Variables

```javascript
state.lastProcessedMrn          // String | null - Last automated MRN
state.mrnAutomationInProgress   // Boolean - Automation in progress
state.mrnAutomationTimer        // Number | null - Debounce timer ID
```

### Configuration

```javascript
CONFIG.MRN_AUTOMATION_DELAY_MS = 1200  // Summary tab delay
```

### Integration Points

**Automatic trigger on transcript:**
```javascript
// In appendTranscriptItem()
if (detected.mrn) {
  automateEHRWorkflow(detected.mrn);
}
```

**Continuous monitoring:**
```javascript
// In handleSignalMessage() transcript_console handler
state.mrnAutomationTimer = setTimeout(() => {
  continuousMRNDetection();
}, 500);
```

**Reset on EHR close:**
```javascript
// In resetEHRState() and resetEHRToSearchState()
state.lastProcessedMrn = null;
state.mrnAutomationInProgress = false;
clearTimeout(state.mrnAutomationTimer);
```

## For Testing

### Test File
Open: `test-mrn-detection.html`

### Quick Tests

```javascript
// In browser console
detectMRNFromText('MRN AB123')        // → 'MRN-AB123'
detectMRNFromText('M R N dash AB123') // → 'MRN-AB123'
detectMRNFromText('mrn 0001abc')      // → 'MRN-0001ABC'
detectMRNFromText('invalid')          // → null
```

### Test Automation Flow

1. Open Scribe Cockpit
2. Connect to device
3. Speak: "Patient MRN AB123"
4. Observe: EHR sidebar opens, searches, Summary tab opens

## For Users

### Supported Formats

**Say any of these:**
- "MRN AB123"
- "M R N AB123"
- "MRN dash AB123"
- "MRN hyphen AB123"
- "Medical record number AB123"

**Result:**
- EHR opens automatically
- Searches for MRN-AB123
- Summary tab opens

### Valid MRN Rules

- Start with "MRN"
- Code: 3-12 characters
- Letters and numbers only
- Examples: AB123, ABA121, 0001ABC, XYZ789

### Invalid Examples

- Too short: MRN-AB ✗
- Too long: MRN-ABCDEFGHIJKLM ✗
- Special chars: MRN-AB@123 ✗
- Wrong prefix: MR-AB123 ✗

## Troubleshooting

### MRN Not Detected

Check:
- [ ] MRN has valid prefix "MRN"
- [ ] Code is 3-12 characters
- [ ] Only letters and numbers
- [ ] Transcript is final (not partial)

### Automation Not Triggered

Check:
- [ ] Browser console for errors
- [ ] Same MRN not already processed
- [ ] EHR elements exist in DOM
- [ ] Network connection active

### Summary Tab Not Opening

Check:
- [ ] Search completed successfully
- [ ] 1200ms delay is sufficient
- [ ] Summary tab element exists
- [ ] Notes list rendered

## Code Locations

**Main implementation:**
- File: `frontend/public/js/scribe-cockpit.js`
- Lines: 1322-1403 (Detection)
- Lines: 4458-4533 (Automation)

**Documentation:**
- `MRN_DETECTION_GUIDE.md` - User guide
- `MRN_IMPLEMENTATION_SUMMARY.md` - Technical details
- `test-mrn-detection.html` - Test suite

## Common Patterns

### Detect MRN from transcript
```javascript
const transcript = "Patient MRN AB123 presenting";
const mrn = detectMRNFromText(transcript);
// mrn === 'MRN-AB123'
```

### Check if MRN already processed
```javascript
if (state.lastProcessedMrn === 'MRN-AB123') {
  // Already processed, skip automation
}
```

### Reset automation state
```javascript
state.lastProcessedMrn = null;
state.mrnAutomationInProgress = false;
if (state.mrnAutomationTimer) {
  clearTimeout(state.mrnAutomationTimer);
  state.mrnAutomationTimer = null;
}
```

### Manually trigger automation
```javascript
automateEHRWorkflow('MRN-AB123');
```

## Performance Tips

1. Detection is debounced (500ms)
2. Only last 5 transcript items scanned
3. Regex compiled once (fast)
4. No external API calls for detection

## Security Notes

1. Strict format validation
2. No special characters allowed
3. Uppercase normalization
4. No injection risk
5. No external dependencies

## Version Info

**Implementation Date:** 2026-03-02
**Version:** 1.0.0
**Status:** Production Ready ✓
