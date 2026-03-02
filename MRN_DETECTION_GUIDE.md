# MRN Auto-Detection & EHR Automation Guide

## Overview

The Scribe Cockpit now includes automatic MRN detection from live speech-to-text transcription with full EHR workflow automation.

## Features

### Automatic Detection
- Detects MRN numbers from live transcript in real-time
- Handles multiple speech-to-text variations
- Normalizes to standard format: `MRN-XXXX`
- Continuously monitors transcript stream

### Automatic Actions
When a valid MRN is detected:
1. Opens EHR sidebar automatically
2. Fills MRN search field
3. Triggers search automatically
4. Opens Summary tab after results load
5. Prevents duplicate triggers for same MRN

## MRN Format

### Standard Format
```
MRN-XXXX
```

Where:
- Prefix: `MRN`
- Separator: `-` (hyphen)
- Code: 3-12 alphanumeric characters (uppercase)
- No spaces allowed

### Valid Examples
- `MRN-AB123`
- `MRN-ABA121`
- `MRN-0001ABC`
- `MRN-0178HGR`
- `MRN-XYZ789`

## Speech-to-Text Variations Supported

The system automatically normalizes these variations:

### Spacing Variations
- `MRN AB123` → `MRN-AB123`
- `M R N AB123` → `MRN-AB123`
- `MRN  AB123` (multiple spaces) → `MRN-AB123`

### Hyphen/Dash Variations
- `MRN - AB123` → `MRN-AB123`
- `MRN-AB123` → `MRN-AB123` (already correct)

### Spoken Words
- `MRN dash AB123` → `MRN-AB123`
- `MRN hyphen AB123` → `MRN-AB123`

### Case Variations
- `mrn ab123` → `MRN-AB123`
- `Mrn AB123` → `MRN-AB123`
- `MRN ab123` → `MRN-AB123`

### Combined Variations
- `m r n - ab123` → `MRN-AB123`
- `M R N  AB 123` → `MRN-AB123`
- `mrn dash ab123` → `MRN-AB123`

## Detection Rules

### Valid MRN Requirements
1. Must start with "MRN" (case-insensitive)
2. Code must be 3-12 characters
3. Code must be alphanumeric only
4. Final format: `MRN-{CODE}` (uppercase)

### Invalid Examples (Will NOT Trigger)
- `MR-AB123` (incorrect prefix)
- `MRN-AB` (too short, less than 3 chars)
- `MRN-ABCDEFGHIJKLM` (too long, more than 12 chars)
- `MRN-AB@123` (contains special characters)

## Workflow Behavior

### Continuous Detection
- Monitors last 5 transcript items
- Scans each new transcript entry
- Detects MRN changes during conversation
- Debounced to prevent rapid triggering

### Duplicate Prevention
- Tracks last processed MRN
- Only triggers automation once per unique MRN
- Resets when EHR is closed or cleared
- Allows new MRN after patient change

### Timing & Delays
- Sidebar opens with 300ms transition
- Search triggers after 150ms delay
- Summary tab opens after 1200ms (allows results to load)
- Debounce: 500ms between detection scans

## Integration with Template Detection

The MRN detection works alongside existing template auto-detection:

```
User says: "SOAP note for patient MRN AB123"
```

Result:
1. Template "SOAP Note" is auto-selected
2. MRN `MRN-AB123` is detected
3. SOAP note generation begins
4. EHR sidebar opens and searches for `MRN-AB123`
5. Summary tab opens automatically

## Error Handling

### Graceful Failures
- No error if EHR elements not found
- Logs warnings to console (not user-visible)
- Continues normal operation if automation fails
- Does not interrupt transcript processing

### Reset Triggers
MRN automation state resets when:
- EHR close button clicked
- User manually changes patient
- Room/session changes
- Page refresh

## Testing Examples

### Test Phrase 1
```
"Patient MRN AB123 presenting with fever"
```
Expected: Detects `MRN-AB123`, triggers automation

### Test Phrase 2
```
"Medical record number dash A B A 1 2 1"
```
Expected: Detects `MRN-ABA121`, triggers automation

### Test Phrase 3
```
"M R N hyphen zero zero zero one A B C"
```
Expected: Detects `MRN-0001ABC`, triggers automation

### Test Phrase 4
```
"This is for MRN 0178HGR patient file"
```
Expected: Detects `MRN-0178HGR`, triggers automation

### Test Phrase 5
```
"Previous patient was MRN AB123, now seeing MRN XYZ789"
```
Expected:
- First detects `MRN-AB123`
- Then detects `MRN-XYZ789` and triggers new search

## Technical Implementation

### Core Functions

#### `normalizeMRN(rawInput)`
- Normalizes raw input to standard format
- Handles spacing, case, and separator variations
- Returns `MRN-XXXX` or `null`

#### `detectMRNFromText(text)`
- Searches text for MRN patterns
- Uses multiple regex patterns for variations
- Validates code length and characters
- Returns normalized MRN or `null`

#### `automateEHRWorkflow(mrn)`
- Opens EHR sidebar
- Fills search field
- Triggers search
- Opens Summary tab
- Prevents duplicate automation

#### `continuousMRNDetection()`
- Scans recent transcript items
- Detects MRN changes
- Triggers automation for new MRNs

### State Management

```javascript
state.lastProcessedMrn       // Last MRN that triggered automation
state.mrnAutomationInProgress // Prevents concurrent automations
state.mrnAutomationTimer      // Debounce timer for detection
```

## Configuration

### Constants
```javascript
CONFIG.MRN_AUTOMATION_DELAY_MS = 1200  // Delay before opening Summary tab
```

### Adjustable Timings
- Sidebar open delay: 300ms
- Search trigger delay: 150ms
- Summary tab delay: 1200ms (configured)
- Detection debounce: 500ms

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Works with WebSocket connection
- No additional dependencies

## Troubleshooting

### MRN Not Detected
1. Check MRN format matches requirements
2. Verify code is 3-12 characters
3. Ensure alphanumeric only
4. Check browser console for warnings

### Automation Not Triggered
1. Verify EHR elements are present
2. Check if MRN already processed
3. Ensure sidebar not already open with same patient
4. Check network connection for search

### Summary Tab Not Opening
1. Verify search completed successfully
2. Check 1200ms delay is sufficient
3. Ensure notes list rendered
4. Check Summary tab element exists

## Future Enhancements

Potential improvements:
- Configurable MRN format patterns
- Support for alternative MRN prefixes
- Adjustable automation delays via UI
- Visual feedback for MRN detection
- Audio confirmation of detected MRN
