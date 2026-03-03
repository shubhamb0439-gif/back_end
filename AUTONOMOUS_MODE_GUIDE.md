# Autonomous Voice Mode - Complete Implementation Guide

## Overview

The XR Vision Device now supports **fully autonomous voice control** with wake word activation. Users can choose between:

1. **Manual Mode (Push-to-Talk)** - Press & hold button to speak (existing functionality)
2. **Autonomous Mode** - Say "Hey RHEA" to activate hands-free voice control

## Features

### Wake Word Activation
- Background listening for "Hey RHEA"
- Automatic activation with voice response
- Low CPU usage when idle

### Continuous Listening
- Mic stays ON after activation
- All voice commands work automatically
- Visual feedback showing active state

### Voice Responses
- Uses ElevenLabs TTS API (with browser fallback)
- "How can I help you?" on activation
- "Goodbye" when deactivating
- Optional command confirmations

### Auto-Sleep
- Automatic deactivation after 5 minutes of inactivity
- Resets timer on each voice command
- Returns to wake word listening

## User Workflow

### Scenario 1: Wake Word Usage

```
1. User: "Hey RHEA"
   → Orb glows bright blue
   → RHEA: "How can I help you?"

2. User: "Connect"
   → Executes connect command
   → Orb shows connected state
   → Mic stays ON

3. User: "Start stream"
   → Executes start stream
   → Continues listening

4. User: "Mute"
   → Executes mute command
   → Continues listening

5. User: "Goodbye"
   → RHEA: "Goodbye"
   → Returns to wake word listening
   → Orb dims to standby
```

### Scenario 2: Manual Button Still Works

```
1. User: [Press & hold button]
   → Works exactly as before
   → No interference with wake word
   → Can use button to exit autonomous mode
```

## Voice Commands Supported

All existing voice commands work in autonomous mode:

- **Connection**: "connect", "disconnect"
- **Streaming**: "start stream", "stop stream"
- **Audio**: "mute", "unmute"
- **Video**: "hide video", "show video"
- **Messages**: "send urgent message"
- **Notes**: "note" (start), "create" (stop)
- **Exit**: "goodbye", "sleep", "stop listening"

## Visual States

### IDLE MODE
- Orb: Soft pulse, blue/purple gradient
- Status: "Say 'Hey RHEA' or press button"
- Wake word listening active in background

### ACTIVATING
- Orb: Bright glow with scaling animation
- Status: "Activating RHEA..."
- Playing voice response

### AUTONOMOUS MODE
- Orb: Bright animated waveform
- Mic button: Shows "Listening..." with blue glow
- Status: "RHEA is listening..."
- Exit hint: "Say 'Goodbye' or press button to exit"

## Toggle Button

Small circular button below mic button:
- Click to enable/disable autonomous mode
- Blue when enabled
- Purple when disabled

## Technical Architecture

### New Files Created

```
frontend/public/js/
├── wake-word-detector.js      # Wake word detection engine
├── text-to-speech.js          # ElevenLabs TTS integration
└── autonomous-mode.js         # Mode controller & state machine
```

### Modified Files

```
frontend/public/js/
├── voice.js                   # Added continuous listening mode
├── device-orb-ui.js          # Added autonomous mode visuals
└── ui.js                     # Integrated autonomous mode

frontend/views/
└── device.html               # Added scripts & toggle button

frontend/public/css/
└── device-orb.css            # Added autonomous mode styles
```

## Configuration

### ElevenLabs API Key (Optional)

To enable premium voice responses:

1. Get API key from ElevenLabs
2. Add to code:
```javascript
textToSpeech.setApiKey('your-api-key-here');
```

If no API key is provided, the system automatically falls back to browser's built-in speech synthesis.

### Wake Word Variations

The detector recognizes these variations:
- "hey rhea"
- "hay rhea"
- "hey ria"
- "a rhea"

### Auto-Sleep Duration

Default: 5 minutes. To change:
```javascript
autonomousMode.setAutoSleepDuration(10); // 10 minutes
```

### Wake Word Sensitivity

Default: 0.7 (70% confidence). To adjust:
```javascript
wakeWordDetector.setSensitivity(0.8); // More strict
```

## Privacy & Security

- Wake word detection runs **100% client-side**
- No audio sent to servers during wake word listening
- Standard voice recognition only activates after wake word
- Same privacy model as manual button mode

## Browser Compatibility

- **Wake Word Detection**: Chrome, Edge, Safari (Web Speech API)
- **Voice Responses**: All modern browsers (with fallback)
- **Mobile**: Full support on iOS/Android

## Troubleshooting

### Wake Word Not Detected

1. Check microphone permissions
2. Speak clearly and wait 1 second
3. Try variations: "hey ria", "a rhea"
4. Lower sensitivity if needed

### Voice Response Not Playing

1. Check if ElevenLabs API key is set (optional)
2. Browser fallback should work automatically
3. Check browser console for errors

### Autonomous Mode Won't Activate

1. Ensure toggle button shows blue (enabled)
2. Check that wake word was detected (console logs)
3. Verify microphone permissions granted

## Testing

The autonomous mode has been tested with:
- Wake word detection accuracy
- Continuous listening reliability
- Voice command execution
- Auto-sleep functionality
- Manual button override
- Visual state transitions

## Future Enhancements

Potential additions:
- Custom wake words
- Multiple language support
- Voice command confirmations
- Context-aware responses
- Command history

## Summary

The autonomous mode provides a seamless, hands-free voice control experience while maintaining full backward compatibility with the existing push-to-talk functionality. Users can switch between modes at any time using the toggle button or by pressing the mic button to exit autonomous mode.
