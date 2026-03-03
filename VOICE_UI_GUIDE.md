# Voice UI Quick Reference Guide

## Interface Overview

The XR Vision device interface has been redesigned with a voice-first approach:

```
┌─────────────────────────────┐
│      [XR Vision Logo]       │
│   ● Connected/Disconnected  │
├─────────────────────────────┤
│                             │
│                             │
│       ╭─────────╮          │
│       │         │          │
│       │  ┌───┐  │          │ ← Animated Voice Orb
│       │  │~~~│  │          │   with Waveform
│       │  └───┘  │          │
│       │         │          │
│       ╰─────────╯          │
│                             │
├─────────────────────────────┤
│  ▶  Response text here...   │ ← Assistant Response
├─────────────────────────────┤
│                             │
│         ╭─────╮            │
│         │  🎤  │            │ ← Hold to Speak
│         ╰─────╯            │
│      Hold to Speak          │
└─────────────────────────────┘
```

## How to Use

### 1. Connect to Server
- Hold microphone button and say: **"Connect"**
- Or manually enter device ID in hidden input (accessible via developer tools)

### 2. Start Voice Commands
- **Hold** the microphone button at the bottom
- Speak your command clearly
- Release when done
- See the waveform animate as you speak

### 3. Available Voice Commands

#### Connection
- "Connect" - Connect to the server
- "Disconnect" - Disconnect from server

#### Streaming
- "Start stream" - Begin video streaming
- "Stop stream" - Stop video streaming

#### Audio Control
- "Mute" - Mute microphone
- "Unmute" - Unmute microphone

#### Video Control
- "Hide video" - Hide video preview
- "Show video" - Show video preview

#### Note Taking
- "Note" - Start recording a note
- "Create" - Save and send the note

#### MRN Detection
- Say "MRN" followed by letters/numbers
- Example: "MRN ABA 121" → formats as "MRN-ABA121"
- Works in continuous speech

## Visual Indicators

### Status Dot (Top)
- 🔴 **Red pulsing** = Disconnected
- 🟢 **Green pulsing** = Connected

### Voice Orb (Center)
- **Subtle glow** = Idle, ready to listen
- **Intense glow + animation** = Actively listening
- **Circular waveform** = Real-time audio visualization

### Microphone Button (Bottom)
- **Normal state** = Ready
- **Pressed + glowing** = Listening
- **Blue glow animation** = Processing voice input

### Response Area
- Shows system messages
- Displays command confirmations
- Provides feedback on actions

## Tips for Best Experience

### Voice Recognition
1. **Hold button first**, then speak
2. Speak clearly and at normal pace
3. Wait for visual confirmation
4. Release button when finished

### Mobile Usage
- Works on touch screens
- Hold with finger or thumb
- Visual feedback confirms input
- Optimized for one-handed use

### Connection Status
- Always check status indicator before commands
- Green dot = Ready for commands
- Red dot = Connect first

### Waveform Display
- Shows real-time audio levels
- Helps confirm microphone is working
- Visual feedback while speaking
- Circular animation for modern look

## Troubleshooting

### No Waveform Animation
- Check microphone permissions in browser
- Ensure microphone is not blocked
- Try refreshing the page

### Commands Not Working
- Ensure status is "Connected" (green dot)
- Hold button before speaking
- Speak clearly and wait for response

### Button Not Responding
- Check if READ permission is active
- Some accounts may have read-only access
- Contact admin if needed

## Technical Notes

### Browser Requirements
- Modern browser with Web Speech API
- Microphone permission required
- Web Audio API support needed
- Canvas support for waveform

### Performance
- Optimized for 60fps animation
- Low CPU usage on idle
- Efficient audio processing
- Works on mobile devices

### Privacy
- Microphone only active when button held
- No audio recorded without permission
- Visual indicator shows active state
- All processing follows existing security model

## Hidden Functionality

All original features remain accessible:
- Manual controls (hidden, but functional)
- Message sending
- Video preview
- Audio playback
- All settings and permissions

Access via browser developer console if needed for advanced usage.
