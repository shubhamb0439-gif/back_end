# Audio Automation Fixes

## Problems Addressed

1. **Inconsistent first-time audio playback** - Audio wouldn't play automatically on first transcription
2. **Play button not reverting** - Button stayed in "Playing" state after audio completed
3. **No re-automation on second transcription** - System wouldn't auto-play on subsequent transcriptions

## Solutions Implemented

### 1. Increased Auto-Play Delay (scribe-cockpit.js)
**Location:** Lines 4575-4586, 4614-4625

**Change:** Increased delay from 500ms to 2000ms for both cached and fresh summary auto-play

**Reason:** The speaker button needs more time to be fully rendered and ready for interaction before auto-click

```javascript
// Before: setTimeout(..., 500)
// After: setTimeout(..., 2000)
```

### 2. Enhanced Audio Completion Event Handler (scribe-cockpit.js)
**Location:** Lines 3578-3606

**Changes:**
- Reset button text from "Generate Audio" to "Play"
- Added MRN automation state reset
- Enhanced logging for debugging

**Functionality:**
```javascript
state.socket.on('audio_playback_complete', (data) => {
  // Reset button to "Play" state
  speakerBtn.innerHTML = `...Play`;

  // Reset automation state for next transcription
  state.lastProcessedMrn = null;
  state.mrnAutomationInProgress = false;

  // Clear any pending timers
  if (state.mrnAutomationTimer) {
    clearTimeout(state.mrnAutomationTimer);
    state.mrnAutomationTimer = null;
  }
});
```

### 3. Backend Event Forwarding (server.js)
**Location:** Lines 6330-6373 (new handlers)

**Added Two New Handlers:**

#### audio_playback_complete
Forwards device audio completion event to cockpit in the same room
```javascript
socket.on('audio_playback_complete', (data) => {
  const roomId = socket.data?.roomId;
  io.to(roomId).emit('audio_playback_complete', {
    deviceId: data?.deviceId || socket.data?.xrId,
    timestamp: data?.timestamp || Date.now()
  });
});
```

#### audio_state_changed
Forwards device audio state changes (playing/paused) to cockpit
```javascript
socket.on('audio_state_changed', (data) => {
  const roomId = socket.data?.roomId;
  io.to(roomId).emit('audio_state_changed', {
    state: data?.state,
    deviceId: data?.deviceId || socket.data?.xrId,
    timestamp: data?.timestamp || Date.now()
  });
});
```

## Complete Audio Workflow

### First Transcription Flow:
1. User speaks MRN → MRN detected in transcript
2. EHR sidebar opens → MRN input filled → Search clicked
3. Summary tab clicked → Summary generated/loaded
4. **After 2000ms delay** → Speaker button clicked automatically
5. TTS audio generated → Sent to device via WebSocket
6. Device plays audio → Button shows "Playing"
7. **Audio completes** → Device emits `audio_playback_complete`
8. Server forwards event to cockpit room
9. Cockpit receives event → Button resets to "Play"
10. **MRN automation state reset** → Ready for next transcription

### Second+ Transcription Flow:
1. User speaks new MRN → Different MRN detected
2. Because automation state was reset, full workflow runs again
3. Audio auto-plays successfully
4. Cycle repeats

## Key State Management

The automation uses three state variables:
- `state.lastProcessedMrn` - Prevents duplicate processing of same MRN
- `state.mrnAutomationInProgress` - Prevents concurrent automation runs
- `state.mrnAutomationTimer` - Debounce timer for automation trigger

All three are reset when audio playback completes, enabling fresh automation for new transcriptions.

## Testing Checklist

- [x] First transcription auto-plays audio
- [x] Button shows "Playing" during playback
- [x] Button reverts to "Play" when audio completes
- [x] Second transcription auto-plays audio
- [x] Multiple transcriptions work consistently
- [x] Console logs show automation flow clearly

## Files Modified

1. `frontend/public/js/scribe-cockpit.js`
   - Increased auto-play delay
   - Enhanced audio_playback_complete handler
   - Added MRN state reset logic
   - Improved logging

2. `backend/server.js`
   - Added audio_playback_complete handler
   - Added audio_state_changed handler
   - Event forwarding to room members

## No Changes Needed

The following were already implemented correctly:
- Device-side audio playback (`ui.js`)
- Device-side `notifyCockpitPlaybackComplete()` function
- Device-side audio event listeners (`onended`, `onplay`)
- Cockpit-side socket event listeners
