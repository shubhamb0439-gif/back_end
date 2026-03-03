# Voice Commands Debugging Guide

## Quick Test Steps

### 1. Check Browser Compatibility
Open browser console (F12) and type:
```javascript
'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
```
Should return `true`. If false, try Chrome/Edge.

### 2. Test Voice Recognition Manually
In console, run:
```javascript
// Check if voice recognition is set up
console.log('Voice Recognition Available:', !!window.SpeechRecognition || !!window.webkitSpeechRecognition);

// Check current state
const btnVoice = document.getElementById('btnVoice');
console.log('Voice Button:', btnVoice?.textContent);
```

### 3. Enable Voice Listening
1. Click the microphone button OR
2. Click the hidden "Start Voice" button:
   ```javascript
   document.getElementById('btnVoice').click();
   ```

### 4. Check Console Logs
After speaking, you should see:
```
[VOICE] Recognition started
[VOICE] Recognized: [your words]
[VOICE] Processing: [your words]
[VOICE] Matched: [command]
```

## Supported Voice Commands

### Connection Commands
| Command | Action | Alternate Phrases |
|---------|--------|-------------------|
| "Connect" | Connect to server | - |
| "Disconnect" | Disconnect from server | - |

### Streaming Commands
| Command | Action | Alternate Phrases |
|---------|--------|-------------------|
| "Start stream" | Begin streaming | "Start streaming", "Start video", "Start camera" |
| "Stop stream" | Stop streaming | "Stop streaming", "Stop video", "Stop camera" |

### Microphone Commands
| Command | Action | Note |
|---------|--------|------|
| "Mute" | Mute microphone | - |
| "Unmute" | Unmute microphone | Say this BEFORE voice stops |

### Video Commands
| Command | Action | Alternate Phrases |
|---------|--------|-------------------|
| "Hide video" | Hide video preview | "Hide camera" |
| "Show video" | Show video preview | "Show camera" |

### Note Commands
| Command | Action | Note |
|---------|--------|------|
| "Note" | Start recording note | Continuous recording mode |
| "Create" | Save and send note | Stops recording |

## Common Issues & Solutions

### Issue 1: "Voice API not available"
**Cause**: Browser doesn't support Web Speech API
**Solution**:
- Use Chrome, Edge, or Safari
- Check if you're on HTTPS (required for some browsers)

### Issue 2: "Microphone permission denied"
**Cause**: Browser blocked microphone access
**Solution**:
1. Click the camera/microphone icon in address bar
2. Allow microphone access
3. Refresh the page
4. Try clicking mic button again

### Issue 3: Commands not recognized
**Causes & Solutions**:

1. **Voice not starting**:
   - Check console for errors
   - Look for "[VOICE] Recognition started" message
   - If missing, click the mic button again

2. **Speaking but no response**:
   - Speak clearly and at normal pace
   - Wait 1-2 seconds after speaking
   - Check console for "[VOICE] Recognized:" message
   - If you see the message but no match, check command format

3. **Command recognized but not executed**:
   - Check console for "[VOICE] Matched:" message
   - Verify connection state (must be connected for most commands)
   - Check permissions (READ-only users cannot execute commands)

### Issue 4: Waveform not showing
**Cause**: Audio visualization requires separate mic permission
**Solution**:
- This is cosmetic only - voice commands will still work
- Refresh page and allow microphone when prompted

### Issue 5: Voice stops after one command
**Causes**:
- This is normal behavior in hold-to-speak mode
- The continuous recognition mode is active in background

**Solution**:
- Hold mic button while speaking
- Release when done
- System will process the command

## Debug Commands (Console)

### Check Voice System Status
```javascript
// Check if listening
console.log('Is Listening:', window.isListening);

// Check current state
console.log('Connected:', window.isServerConnected);
console.log('Streaming:', window.streamActive);
console.log('Mic Muted:', window.micMuted);

// Force start voice
document.getElementById('btnVoice').click();
```

### Manual Command Test
```javascript
// Simulate voice command (for testing)
const testCommand = 'connect';
window.processVoiceCommand(testCommand);
```

### Check Button States
```javascript
const btns = {
  connect: document.getElementById('btnConnect')?.textContent,
  stream: document.getElementById('btnStream')?.textContent,
  mute: document.getElementById('btnMute')?.textContent,
  voice: document.getElementById('btnVoice')?.textContent,
  video: document.getElementById('btnVideo')?.textContent
};
console.table(btns);
```

## Testing Workflow

### Test 1: Basic Voice Setup
1. Open device page
2. Open console (F12)
3. Look for any errors
4. Click microphone button
5. Should see "Listening for voice commands..." message
6. Should see green "listening" state in UI

### Test 2: Simple Connect Command
1. Ensure voice is active (mic button held or clicked)
2. Say clearly: **"Connect"**
3. Wait 2 seconds
4. Console should show:
   ```
   [VOICE] Recognized: connect
   [VOICE] Processing: connect
   [VOICE] Matched: connect
   ```
5. Status should change to "Connected"

### Test 3: Stream Command
1. Ensure connected (green status)
2. Say: **"Start stream"**
3. Console should show match
4. Video preview should appear (if camera available)

### Test 4: Multiple Commands
1. Say: **"Connect"** → wait for confirmation
2. Say: **"Start stream"** → wait for confirmation
3. Say: **"Mute"** → wait for confirmation
4. Each should execute in sequence

## Expected Console Output (Success)

```
[VOICE] Starting voice recognition...
[VOICE] Voice recognition started successfully
[VOICE] Recognition started
[user speaks "connect"]
[VOICE] Recognized: connect | Lower: connect
[VOICE] Processing command: connect
[VOICE] Processing: connect
[VOICE] Matched: connect
```

## Expected Console Output (Failure)

### No Speech API
```
[VOICE] Speech Recognition API not available
```

### Permission Denied
```
[VOICE] Error: not-allowed
```

### Command Not Recognized
```
[VOICE] Recognized: [your words]
[VOICE] Processing: [your words]
[VOICE] No command matched for: [your words]
```

## Troubleshooting Checklist

- [ ] Using supported browser (Chrome/Edge/Safari)
- [ ] Microphone permission granted
- [ ] Voice button clicked / mic button held
- [ ] Console shows "[VOICE] Recognition started"
- [ ] Speaking clearly after clicking button
- [ ] Waiting 1-2 seconds after speaking
- [ ] Using exact command phrases from table above
- [ ] Connected to server (for stream/mute commands)
- [ ] Not in READ-only mode

## Advanced Debugging

### Enable Verbose Logging
In console:
```javascript
// Override recognition to log everything
const originalOnResult = rec.onresult;
rec.onresult = function(e) {
  console.log('RAW RESULT:', e.results);
  for (let i = 0; i < e.results.length; i++) {
    console.log(`Result ${i}:`, {
      transcript: e.results[i][0].transcript,
      confidence: e.results[i][0].confidence,
      isFinal: e.results[i].isFinal
    });
  }
  originalOnResult.call(this, e);
};
```

### Test Without UI
```javascript
// Direct test of speech recognition
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const test = new SR();
test.continuous = false;
test.interimResults = false;
test.onresult = (e) => {
  console.log('TEST HEARD:', e.results[0][0].transcript);
};
test.start();
// Now speak
```

## Support Information

If voice commands still don't work after trying all above:

1. **Capture these details**:
   - Browser name and version
   - Operating system
   - Console errors (screenshot)
   - Output of: `navigator.userAgent`

2. **Try fallback**:
   - Use hidden button controls (developer console)
   - All functions work via `document.getElementById('btnConnect').click()` etc.

3. **Verify microphone hardware**:
   - Test in another app (Zoom, Google Meet, etc.)
   - Check system sound settings
   - Try different microphone if available
