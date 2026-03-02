# MRN Voice Dictation Guide

## How to Dictate MRN Numbers

The XR Messaging system now automatically formats MRN numbers when you speak them. You can use any of these natural dictation styles:

### ✅ Supported Formats

#### 1. Basic Format (Recommended)
Just say "MRN" followed by the code with spaces:
- **Say**: "MRN ABA 121"
- **Formats to**: MRN-ABA121

#### 2. With Context Words
Use natural language:
- **Say**: "The patient MRN is ABA 121"
- **Formats to**: MRN-ABA121

- **Say**: "Patient MRN number is ABA 121"
- **Formats to**: MRN-ABA121

#### 3. Spelled Out Letters
Spell each character individually:
- **Say**: "M R N zero zero one A B C"
- **Formats to**: MRN-001ABC

#### 4. Using Number Words
Speak numbers as words:
- **Say**: "MRN ABA one two one"
- **Formats to**: MRN-ABA121

- **Say**: "Patient MRN number is ABA one two one"
- **Formats to**: MRN-ABA121

#### 5. In Sentences
Include MRN anywhere in your dictation:
- **Say**: "Disrespected note should be in a consultation note. MRN ABA 121"
- **Formats to**: MRN-ABA121 (correctly extracted)

## How It Works

1. **Speak Naturally**: Use any of the formats above
2. **Automatic Formatting**: The system converts your speech to "MRN-XXXXXX" format
3. **Auto-Detection**: The formatted MRN is detected in the transcript
4. **Auto-Search**: The system automatically searches for the patient
5. **Results Display**: Patient information appears in the EHR sidebar

## Tips for Best Results

### DO:
✅ Speak clearly and at normal pace
✅ Use "MRN" before the code
✅ Separate letters and numbers with slight pauses
✅ Use number words ("one two one") or digits ("121")
✅ Include context if it helps ("patient MRN is...")

### DON'T:
❌ Rush through the MRN code
❌ Skip the "MRN" prefix
❌ Mix dictation styles mid-code
❌ Use very long pauses between characters

## Supported Number Words

The system understands these spoken numbers:
- "zero" → 0
- "one" → 1
- "two" → 2
- "three" → 3
- "four" → 4
- "five" → 5
- "six" → 6
- "seven" → 7
- "eight" → 8
- "nine" → 9

## Examples from Real Use

### Example 1: Quick Dictation
```
You say: "MRN ABA 121"
System hears: "mrn aba 121"
System formats: "MRN-ABA121"
System searches: ✅ Patient found
```

### Example 2: In Clinical Note
```
You say: "Patient presents with chest pain. MRN ABA 121. Recommend ECG."
System extracts: "MRN-ABA121"
System searches: ✅ Patient found
Note saved: "Patient presents with chest pain. MRN-ABA121. Recommend ECG."
```

### Example 3: Spelled Out
```
You say: "M R N A B A one two one"
System formats: "MRN-ABA121"
System searches: ✅ Patient found
```

## Troubleshooting

### MRN Not Detected?

**Check:**
1. Did you say "MRN" before the code?
2. Is the code between 3-12 characters?
3. Does the code contain only letters and numbers?

**Try:**
- Speaking more clearly
- Pausing briefly between "MRN" and the code
- Using "MRN is" format: "MRN is ABA 121"

### Wrong MRN Detected?

**Check:**
1. The transcript to see what was actually heard
2. If speech recognition misheard you

**Try:**
- Speaking more slowly
- Using spelled-out format: "M R N A B A one two one"
- Manually entering the MRN in the search box

### Patient Not Found?

**Check:**
1. The MRN is correct in your database
2. The format matches: "MRN-XXXXXX"

**Try:**
- Manually searching in the EHR sidebar
- Verifying the MRN with patient records

## Advanced Features

### Automatic Workflow
When an MRN is detected:
1. ✅ EHR sidebar opens automatically
2. ✅ Patient search executes automatically
3. ✅ Patient information displays
4. ✅ Summary tab is selected
5. ✅ Ready for note creation

### Context Preservation
The system remembers:
- Last detected MRN
- Won't re-trigger for the same MRN
- Clears on patient change

## Need Help?

If you're experiencing issues with MRN detection:
1. Check the transcript to see what was captured
2. Try the manual search in the EHR sidebar
3. Verify the MRN format in your database
4. Contact support if problems persist
