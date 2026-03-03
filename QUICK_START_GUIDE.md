# Quick Start Guide - Voice Commands

## How to Use Voice Commands (Step by Step)

### Step 1: Open the Device Page
1. Navigate to `/device` in your browser
2. You'll see the new voice-centric interface with:
   - XR Vision logo at top
   - Connection status (red = disconnected)
   - Large voice orb in center
   - Microphone button at bottom

### Step 2: Enable Microphone
1. Click or tap the microphone button at the bottom
2. Your browser will ask for microphone permission
3. Click **Allow** or **Yes**
4. You should see a message: "Listening for voice commands..."

### Step 3: Speak Your First Command
1. Say clearly: **"Connect"**
2. Wait 1-2 seconds
3. The status at the top should turn green
4. You'll see: "Connected" message

### Step 4: Try More Commands
Once connected, you can use:
- **"Start stream"** - Begin video streaming
- **"Mute"** - Mute your microphone
- **"Unmute"** - Unmute your microphone
- **"Hide video"** - Hide video preview
- **"Show video"** - Show video preview

## Quick Reference Card

### Essential Commands
```
"Connect"      → Connect to server
"Disconnect"   → Disconnect from server
"Start stream" → Begin streaming
"Stop stream"  → Stop streaming
"Mute"         → Mute mic
"Unmute"       → Unmute mic
```

### Visual Indicators

**Status Dot (Top)**
- 🔴 Red pulsing = Disconnected
- 🟢 Green pulsing = Connected

**Voice Orb (Center)**
- Subtle glow = Idle
- Intense glow + waveform = Listening

**Response Area**
- Shows system messages
- Displays command confirmations

## Troubleshooting

### "Voice API not available"
➜ Use Chrome, Edge, or Safari browser

### "Microphone permission denied"
1. Click the 🔒 lock icon in address bar
2. Find "Microphone" permission
3. Change to "Allow"
4. Refresh the page

### Commands not working
1. Open browser console (Press F12)
2. Click microphone button
3. Look for: `[VOICE] Recognition started`
4. Speak a command
5. Look for: `[VOICE] Recognized: [your words]`
6. If you see it, check if the command matched

### Still not working?
Check the detailed guide: `VOICE_COMMANDS_DEBUG.md`

## Tips for Best Results

1. **Speak Clearly**: Use normal speaking voice
2. **Wait**: Pause 1-2 seconds after speaking
3. **Quiet Environment**: Reduce background noise
4. **Exact Phrases**: Use commands from the reference card
5. **Check Status**: Ensure green status before streaming commands

## Example Session

```
1. Open /device page
2. Click microphone button → "Listening for voice commands..."
3. Say "Connect" → Status turns green ✓
4. Say "Start stream" → Video stream begins ✓
5. Say "Mute" → Microphone muted ✓
6. Continue using voice commands...
```

## Need Help?

See detailed documentation:
- `VOICE_COMMANDS_DEBUG.md` - Troubleshooting guide
- `VOICE_FIXES_APPLIED.md` - Technical details
- `VOICE_UI_GUIDE.md` - Complete user guide

Or check browser console (F12) for diagnostic messages.
