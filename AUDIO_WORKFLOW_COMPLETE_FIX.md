# Complete Audio Workflow Fix

## Problem Analysis

### Original Issues
1. **First transcription**: Summary generated but audio didn't auto-play
2. **Second transcription**: Audio auto-played perfectly
3. **Root Cause**: `state.lastProcessedMrn` was being set BEFORE audio started playing, causing the automation to think it was "already processed"

### Why Second Transcription Worked
- By the time the second transcription came, the first audio had completed
- The completion event reset `state.lastProcessedMrn = null`
- So the second transcription was seen as "new" and auto-played correctly

## Complete Solution

### 1. Audio State Tracking (scribe-cockpit.js)

Added new state variables to track audio playback:
```javascript
// Audio playback state
audioPlaying: false,
currentPlayingMrn: null,
```

### 2. Timing Fix for MRN Processing

**CRITICAL CHANGE**: Moved `state.lastProcessedMrn` assignment from START of automation to WHEN AUDIO STARTS PLAYING

**Before:**
```javascript
async function automateEHRWorkflow(mrn) {
  state.mrnAutomationInProgress = true;
  state.lastProcessedMrn = mrn;  // ❌ TOO EARLY - set before audio plays
  // ... workflow continues
}
```

**After:**
```javascript
async function automateEHRWorkflow(mrn) {
  state.mrnAutomationInProgress = true;
  // DO NOT set lastProcessedMrn here
  // ... workflow continues
}

async function playSummaryAudio(text) {
  // ... TTS generation
  state.socket.emit('play_audio_on_device', {...});

  // ✅ Set states AFTER audio starts playing
  state.audioPlaying = true;
  state.currentPlayingMrn = state.currentPatient?.mrn_no;
  state.lastProcessedMrn = state.currentPlayingMrn;  // ✅ NOW it's marked as processed
}
```

### 3. Audio Playing Guard

Prevent concurrent audio playback:
```javascript
async function playSummaryAudio(text) {
  // Check if audio is currently playing
  if (state.audioPlaying) {
    console.warn('[playSummaryAudio] Audio already playing, blocking new playback');
    Swal.fire({
      icon: 'warning',
      title: 'Audio Playing',
      text: 'Please wait for current audio to finish.',
      timer: 2000
    });
    return;
  }
  // ... continue with playback
}
```

### 4. Block Automation During Audio Playback

```javascript
async function automateEHRWorkflow(mrn) {
  // Block if audio is currently playing
  if (state.audioPlaying) {
    console.log('[MRN Automation] ⏸️ BLOCKED - Audio currently playing');
    return;
  }
  // ... continue with automation
}
```

### 5. Complete State Reset on Audio Completion

```javascript
state.socket.on('audio_playback_complete', (data) => {
  // Reset audio state
  state.audioPlaying = false;
  state.currentPlayingMrn = null;

  // Reset button to "Play"
  speakerBtn.innerHTML = `...Play`;

  // Reset MRN automation to allow new transcription
  state.lastProcessedMrn = null;
  state.mrnAutomationInProgress = false;

  console.log('[SCRIBE] ✅ Ready for next transcription');
});
```

### 6. Auto-Play Safety Checks

Added checks to prevent auto-click if audio is already playing:
```javascript
if (autoPlay) {
  setTimeout(() => {
    const speakerBtn = document.getElementById('speakerBtn');
    if (speakerBtn && !state.audioPlaying) {  // ✅ Check audioPlaying state
      speakerBtn.click();
    } else if (state.audioPlaying) {
      console.log('[Load Summary] ⏸️ Audio already playing, skipping auto-play');
    }
  }, 1000);
}
```

## Complete Workflow - First Transcription

```
1. User speaks: "Medical record number 12345"
   └─> MRN detected: "12345"

2. automateEHRWorkflow("12345") called
   ├─> Check: audioPlaying = false ✅
   ├─> Check: lastProcessedMrn = null ✅
   └─> Continue automation

3. EHR sidebar opens
   └─> MRN input filled: "12345"
   └─> Search button clicked

4. Patient data loaded (1200ms delay)

5. Summary tab clicked
   └─> loadSummary(autoPlay=true) called

6. Summary generated/cached
   └─> renderSummaryDetail() creates speaker button

7. After 1000ms delay
   └─> Check: audioPlaying = false ✅
   └─> Speaker button clicked automatically

8. playSummaryAudio() called
   ├─> Check: audioPlaying = false ✅
   ├─> Generate TTS audio
   ├─> Emit 'play_audio_on_device' to room
   ├─> Set audioPlaying = true ✅
   ├─> Set currentPlayingMrn = "12345" ✅
   └─> Set lastProcessedMrn = "12345" ✅ [CRITICAL - HAPPENS HERE]

9. Device receives audio and plays it
   └─> Button shows "Playing"

10. Audio completes on device
    └─> Device emits 'audio_playback_complete'

11. Server forwards to cockpit room

12. Cockpit receives completion event
    ├─> audioPlaying = false
    ├─> currentPlayingMrn = null
    ├─> lastProcessedMrn = null
    ├─> mrnAutomationInProgress = false
    └─> Button resets to "Play"

13. ✅ READY FOR NEXT TRANSCRIPTION
```

## Complete Workflow - Second Transcription (During Audio)

```
1. User speaks: "Medical record number 67890"
   └─> MRN detected: "67890"

2. automateEHRWorkflow("67890") called
   ├─> Check: audioPlaying = true ❌
   └─> BLOCKED - returns immediately

3. Console log: "⏸️ BLOCKED - Audio currently playing"

4. No action taken - user must wait for audio to finish
```

## Complete Workflow - Second Transcription (After Audio Completes)

```
1. Previous audio completes
   └─> All states reset (see step 12 above)

2. User speaks: "Medical record number 67890"
   └─> MRN detected: "67890"

3. automateEHRWorkflow("67890") called
   ├─> Check: audioPlaying = false ✅
   ├─> Check: lastProcessedMrn = null ✅
   └─> Continue automation

4. Full workflow repeats (steps 3-12 from first transcription)

5. ✅ Audio auto-plays successfully
```

## State Management Timeline

### First Transcription
```
Time | Action                        | audioPlaying | lastProcessedMrn | mrnInProgress
-----|-------------------------------|--------------|------------------|---------------
T0   | MRN detected                  | false        | null             | false
T1   | automateEHRWorkflow starts    | false        | null             | true
T2   | Summary loaded                | false        | null             | true
T3   | Auto-play triggered           | false        | null             | false
T4   | playSummaryAudio starts       | false        | null             | false
T5   | Audio sent to device          | TRUE ✅      | "12345" ✅       | false
T6   | Audio playing on device       | true         | "12345"          | false
T7   | Audio completes               | FALSE ✅     | NULL ✅          | false
T8   | Ready for next                | false        | null             | false
```

### Second Transcription (after first completes)
```
Time | Action                        | audioPlaying | lastProcessedMrn | mrnInProgress
-----|-------------------------------|--------------|------------------|---------------
T0   | New MRN detected              | false        | null             | false
T1   | automateEHRWorkflow starts    | false        | null             | true
T2   | Summary loaded                | false        | null             | true
T3   | Auto-play triggered           | false        | null             | false
T4   | Audio sent to device          | TRUE ✅      | "67890" ✅       | false
T5   | Audio completes               | FALSE ✅     | NULL ✅          | false
T6   | Ready for next                | false        | null             | false
```

## Files Modified

### 1. frontend/public/js/scribe-cockpit.js

**State Variables Added (lines 167-174):**
- `audioPlaying: false`
- `currentPlayingMrn: null`

**Changes to automateEHRWorkflow():**
- Added audio playing check at start
- Removed `state.lastProcessedMrn = mrn` assignment
- Enhanced logging

**Changes to playSummaryAudio():**
- Added audio playing guard at start
- Set `audioPlaying = true` when audio starts
- Set `currentPlayingMrn` when audio starts
- Set `lastProcessedMrn` when audio starts (CRITICAL FIX)

**Changes to loadSummary():**
- Added `!state.audioPlaying` check before auto-click
- Reduced delay from 2000ms to 1000ms (now safe with proper state management)

**Changes to audio_playback_complete handler:**
- Reset `audioPlaying = false`
- Reset `currentPlayingMrn = null`
- Reset `lastProcessedMrn = null`
- Reset `mrnAutomationInProgress = false`

### 2. backend/server.js

**Added Event Handlers (lines 6330-6373):**
- `audio_playback_complete` - forwards device completion to cockpit
- `audio_state_changed` - forwards device state changes to cockpit

## Testing Checklist

- [x] First transcription generates summary
- [x] First transcription auto-plays audio
- [x] Button shows "Playing" during playback
- [x] Button reverts to "Play" when complete
- [x] Second transcription (during audio) is blocked
- [x] Second transcription (after audio) auto-plays
- [x] Multiple transcriptions work consistently
- [x] No duplicate MRN processing
- [x] Console logs show clear workflow
- [x] Manual play button works during auto-play delay

## Key Insights

1. **Timing is Everything**: Setting `lastProcessedMrn` must happen WHEN audio starts, not when automation starts
2. **State Guards**: Using `audioPlaying` flag prevents race conditions
3. **Complete Resets**: All states must reset together when audio completes
4. **Defensive Checks**: Always check `audioPlaying` before auto-clicking
5. **Logging**: Comprehensive logs make debugging workflow issues trivial

## User Experience

### Expected Behavior
1. Speak first MRN → Summary appears → Audio plays automatically
2. While audio playing, speak second MRN → Blocked (audio must finish first)
3. After audio finishes → System ready for new transcription
4. Speak new MRN → Summary appears → Audio plays automatically
5. Cycle repeats indefinitely

### User Feedback
- Warning message if trying to play while audio is active
- Success message when audio starts
- Button state clearly shows: Play / Generating / Playing
- Console logs available for debugging
