// voice-ui.js - Simple push-to-talk interface
// No waveform, just button handling

class VoiceUI {
  constructor() {
    this.micButton = document.getElementById('micButton');
    this.responseText = document.getElementById('responseText');
    this.voiceChip = document.getElementById('chipLastCmd');
    this.statusElement = document.getElementById('status');
    this.voiceInterface = document.querySelector('.voice-interface');
    this.voiceOrb = document.querySelector('.voice-orb');

    this.isListening = false;

    this.setupMicButton();
    console.log('[VOICE-UI] Initialized');
  }

  setupMicButton() {
    if (!this.micButton) {
      console.warn('[VOICE-UI] Mic button not found');
      return;
    }

    let isPressed = false;

    const handlePressStart = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (isPressed) return;
      isPressed = true;

      console.log('[VOICE-UI] Button pressed');
      this.micButton.classList.add('active');
      this.voiceOrb?.classList.add('listening');
      this.startListening();
    };

    const handlePressEnd = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isPressed) return;
      isPressed = false;

      console.log('[VOICE-UI] Button released');
      this.micButton.classList.remove('active');
      this.voiceOrb?.classList.remove('listening');
      this.stopListening();
    };

    // Mouse events
    this.micButton.addEventListener('mousedown', handlePressStart);
    this.micButton.addEventListener('mouseup', handlePressEnd);
    this.micButton.addEventListener('mouseleave', (e) => {
      if (isPressed) handlePressEnd(e);
    });

    // Touch events
    this.micButton.addEventListener('touchstart', handlePressStart, { passive: false });
    this.micButton.addEventListener('touchend', handlePressEnd, { passive: false });
    this.micButton.addEventListener('touchcancel', handlePressEnd, { passive: false });

    // Prevent click event
    this.micButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    console.log('[VOICE-UI] Button handlers attached');
  }

  startListening() {
    if (this.isListening) {
      console.log('[VOICE-UI] Already listening');
      return;
    }

    console.log('[VOICE-UI] Starting...');

    // Wait for ui.js to load and export the function
    const tryStart = () => {
      if (typeof window !== 'undefined' && typeof window.startVoiceRecognition === 'function') {
        console.log('[VOICE-UI] Calling startVoiceRecognition()');
        const started = window.startVoiceRecognition();

        if (started) {
          this.isListening = true;
          this.voiceInterface?.classList.add('listening');

          if (this.responseText) {
            this.responseText.textContent = 'Listening...';
          }
          console.log('[VOICE-UI] ✓ Started');
        } else {
          console.log('[VOICE-UI] ✗ Failed to start');
          if (this.responseText) {
            this.responseText.textContent = 'Failed to start voice recognition';
          }
        }
      } else {
        console.log('[VOICE-UI] startVoiceRecognition not available yet, retrying...');
        setTimeout(tryStart, 50);
      }
    };

    tryStart();
  }

  stopListening() {
    if (!this.isListening) {
      console.log('[VOICE-UI] Not listening');
      return;
    }

    console.log('[VOICE-UI] Stopping...');

    if (typeof window !== 'undefined' && typeof window.stopVoiceRecognition === 'function') {
      console.log('[VOICE-UI] Calling stopVoiceRecognition()');
      window.stopVoiceRecognition();
    }

    this.isListening = false;
    this.voiceInterface?.classList.remove('listening');
    console.log('[VOICE-UI] ✓ Stopped');
  }

  showResponse(text) {
    if (this.responseText) {
      this.responseText.textContent = text;
    }
  }

  showCommand(command) {
    if (this.voiceChip) {
      this.voiceChip.textContent = command;
      this.voiceChip.hidden = false;

      setTimeout(() => {
        if (this.voiceChip) {
          this.voiceChip.hidden = true;
        }
      }, 3000);
    }
  }

  updateStatus(isConnected) {
    if (!this.statusElement) return;

    const statusText = this.statusElement.querySelector('.status-text');
    if (!statusText) return;

    if (isConnected) {
      this.statusElement.classList.remove('status-disconnected');
      this.statusElement.classList.add('status-connected');
      statusText.textContent = 'Connected';
    } else {
      this.statusElement.classList.add('status-disconnected');
      this.statusElement.classList.remove('status-connected');
      statusText.textContent = 'Disconnected';
    }
  }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  window.VoiceUI = VoiceUI;

  window.addEventListener('DOMContentLoaded', () => {
    console.log('[VOICE-UI] DOM ready, creating VoiceUI instance');
    window.voiceUI = new VoiceUI();
  });
}

export default VoiceUI;
