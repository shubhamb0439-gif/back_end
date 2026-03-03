class WakeWordDetector {
  constructor() {
    this.isListening = false;
    this.recognition = null;
    this.onWakeWordDetected = null;
    this.wakeWord = 'hey rhea';
    this.sensitivity = 0.7;
  }

  async start(onDetected) {
    if (this.isListening) return;

    this.onWakeWordDetected = onDetected;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        const confidence = event.results[i][0].confidence;

        console.log('[Wake Word] Heard:', transcript, 'Confidence:', confidence);

        if (this.matchesWakeWord(transcript) && confidence >= this.sensitivity) {
          console.log('[Wake Word] DETECTED! Triggering autonomous mode');
          this.stop();
          if (this.onWakeWordDetected) {
            this.onWakeWordDetected();
          }
          break;
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('[Wake Word] Error:', event.error);
      if (event.error === 'no-speech') {
        return;
      }
      setTimeout(() => {
        if (this.isListening) {
          this.recognition.start();
        }
      }, 1000);
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch (e) {
            console.error('[Wake Word] Restart failed:', e);
          }
        }, 100);
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('[Wake Word] Started listening for "hey rhea"');
      return true;
    } catch (error) {
      console.error('[Wake Word] Failed to start:', error);
      return false;
    }
  }

  matchesWakeWord(transcript) {
    const normalized = transcript.toLowerCase().replace(/[^\w\s]/g, '').trim();

    const variations = [
      'hey rhea',
      'hay rhea',
      'hey ria',
      'hay ria',
      'hey riya',
      'hey real',
      'a rhea',
      'ey rhea'
    ];

    for (const variation of variations) {
      if (normalized.includes(variation)) {
        return true;
      }
    }

    const words = normalized.split(/\s+/);
    if (words.length >= 2) {
      const lastTwo = words.slice(-2).join(' ');
      if (variations.some(v => lastTwo === v)) {
        return true;
      }
    }

    return false;
  }

  stop() {
    if (this.recognition) {
      this.isListening = false;
      try {
        this.recognition.stop();
      } catch (e) {
        console.error('[Wake Word] Stop error:', e);
      }
      this.recognition = null;
    }
    console.log('[Wake Word] Stopped listening');
  }

  setSensitivity(value) {
    this.sensitivity = Math.max(0, Math.min(1, value));
  }
}

window.WakeWordDetector = WakeWordDetector;
