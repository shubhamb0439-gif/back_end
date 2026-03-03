// device-orb-ui.js - Orb UI Controller for XR Vision Device

/**
 * Manages the orb-based voice interface
 * - Desktop: Click to toggle voice on/off
 * - Mobile: Press and hold to activate, release to stop
 * - Integrates with existing voice.js module
 */

export class OrbUIController {
  constructor({ voiceButton, onVoiceToggle }) {
    this.voiceButton = voiceButton;
    this.onVoiceToggle = onVoiceToggle;

    this.micButton = document.getElementById('micButton');
    this.micInstruction = document.getElementById('micInstruction');
    this.orbVisual = document.getElementById('orbVisual');
    this.responseCard = document.getElementById('responseCard');
    this.responseText = document.getElementById('responseText');

    this.isListening = false;
    this.isMobile = this._detectMobile();
    this.pressTimer = null;
    this.isPressing = false;

    this._init();
  }

  _detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0)
    );
  }

  _init() {
    if (!this.micButton) {
      console.warn('[OrbUI] Mic button not found');
      return;
    }

    if (this.isMobile) {
      this._setupMobileEvents();
      if (this.micInstruction) {
        this.micInstruction.textContent = 'Hold to Speak';
      }
    } else {
      this._setupDesktopEvents();
      if (this.micInstruction) {
        this.micInstruction.textContent = 'Click to Speak';
      }
    }

    console.log('[OrbUI] Initialized in', this.isMobile ? 'MOBILE' : 'DESKTOP', 'mode');
  }

  _setupDesktopEvents() {
    this.micButton.addEventListener('click', () => {
      this._toggleVoice();
    });
  }

  _setupMobileEvents() {
    this.micButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._startVoice();
    }, { passive: false });

    this.micButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this._stopVoice();
    }, { passive: false });

    this.micButton.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this._stopVoice();
    }, { passive: false });
  }

  _toggleVoice() {
    if (this.isListening) {
      this._stopVoice();
    } else {
      this._startVoice();
    }
  }

  _startVoice() {
    if (this.isListening) return;

    console.log('[OrbUI] Starting voice...');

    if (this.voiceButton && typeof this.onVoiceToggle === 'function') {
      this.onVoiceToggle(true);
    } else if (this.voiceButton) {
      this.voiceButton.click();
    }

    this.isListening = true;
    this._updateUI(true);
  }

  _stopVoice() {
    if (!this.isListening) return;

    console.log('[OrbUI] Stopping voice...');

    if (!this.isMobile) {
      if (this.voiceButton && typeof this.onVoiceToggle === 'function') {
        this.onVoiceToggle(false);
      } else if (this.voiceButton) {
        this.voiceButton.click();
      }
    } else {
      if (this.voiceButton && typeof this.onVoiceToggle === 'function') {
        this.onVoiceToggle(false);
      } else if (this.voiceButton) {
        this.voiceButton.click();
      }
    }

    this.isListening = false;
    this._updateUI(false);
  }

  _updateUI(active) {
    if (this.micButton) {
      this.micButton.classList.toggle('active', active);
    }

    if (this.orbVisual) {
      this.orbVisual.classList.toggle('active', active);
    }

    if (this.responseCard) {
      this.responseCard.classList.toggle('active', active);
    }

    if (this.micInstruction) {
      this.micInstruction.classList.toggle('active', active);
      if (this.isMobile) {
        this.micInstruction.textContent = active ? 'Listening...' : 'Hold to Speak';
      } else {
        this.micInstruction.textContent = active ? 'Listening...' : 'Click to Speak';
      }
    }
  }

  updateResponse(text, isPlaceholder = false) {
    if (!this.responseText) return;

    this.responseText.textContent = text;
    this.responseText.classList.toggle('placeholder', isPlaceholder);
  }

  syncVoiceState(listening) {
    if (this.isListening !== listening) {
      this.isListening = listening;
      this._updateUI(listening);
    }
  }

  destroy() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
    }
  }
}
