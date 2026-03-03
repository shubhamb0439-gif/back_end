// voice-ui.js - Voice-centric UI enhancements for device.html
// Adds waveform visualization and touch interactions to the new voice interface

class VoiceUI {
  constructor() {
    this.canvas = document.getElementById('waveformCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.micButton = document.getElementById('micButton');
    this.responseText = document.getElementById('responseText');
    this.voiceChip = document.getElementById('chipLastCmd');
    this.statusElement = document.getElementById('status');
    this.voiceInterface = document.querySelector('.voice-interface');

    this.isListening = false;
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.animationId = null;
    this.dataArray = null;

    this.setupCanvas();
    this.setupMicButton();
    this.setupWaveform();
  }

  setupCanvas() {
    if (!this.canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx.scale(dpr, dpr);

    this.drawIdleWaveform();

    window.addEventListener('resize', () => {
      this.setupCanvas();
    });
  }

  setupMicButton() {
    if (!this.micButton) return;

    let pressTimer;
    let isPressed = false;

    const handlePressStart = (e) => {
      e.preventDefault();
      isPressed = true;
      this.micButton.classList.add('active');

      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => {
        if (isPressed) {
          this.startListening();
        }
      }, 150);
    };

    const handlePressEnd = (e) => {
      e.preventDefault();
      isPressed = false;
      this.micButton.classList.remove('active');

      clearTimeout(pressTimer);

      if (this.isListening) {
        setTimeout(() => {
          this.stopListening();
        }, 300);
      }
    };

    this.micButton.addEventListener('mousedown', handlePressStart);
    this.micButton.addEventListener('mouseup', handlePressEnd);
    this.micButton.addEventListener('mouseleave', handlePressEnd);

    this.micButton.addEventListener('touchstart', handlePressStart, { passive: false });
    this.micButton.addEventListener('touchend', handlePressEnd, { passive: false });
    this.micButton.addEventListener('touchcancel', handlePressEnd, { passive: false });

    this.micButton.addEventListener('click', (e) => {
      e.preventDefault();
    });
  }

  async setupWaveform() {
    if (!this.canvas) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch (err) {
      console.warn('[VOICE-UI] Audio context setup failed:', err);
    }
  }

  async startListening() {
    if (this.isListening) return;

    try {
      // Start the actual voice recognition system
      const btnVoice = document.getElementById('btnVoice');
      if (btnVoice && btnVoice.textContent === 'Start Voice') {
        btnVoice.click();
      }

      // Start waveform visualization with a separate audio stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        if (this.audioContext && this.analyser) {
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }

          this.microphone = this.audioContext.createMediaStreamSource(stream);
          this.microphone.connect(this.analyser);
        }
      } catch (audioErr) {
        console.warn('[VOICE-UI] Waveform visualization unavailable:', audioErr);
        // Continue anyway - voice recognition might still work
      }

      this.isListening = true;
      this.voiceInterface?.classList.add('listening');
      this.animate();

      if (this.responseText) {
        this.responseText.textContent = 'Listening...';
      }

    } catch (err) {
      console.error('[VOICE-UI] Failed to start listening:', err);
      this.showResponse('Microphone access denied. Please enable microphone permissions.');
    }
  }

  stopListening() {
    if (!this.isListening) return;

    if (this.microphone) {
      try {
        this.microphone.disconnect();
        this.microphone.mediaStream.getTracks().forEach(track => track.stop());
        this.microphone = null;
      } catch (err) {
        console.warn('[VOICE-UI] Error stopping microphone:', err);
      }
    }

    this.isListening = false;
    this.voiceInterface?.classList.remove('listening');

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.drawIdleWaveform();

    const btnVoice = document.getElementById('btnVoice');
    if (btnVoice && btnVoice.textContent === 'Stop Voice') {
      setTimeout(() => {
        btnVoice.click();
      }, 100);
    }
  }

  animate() {
    if (!this.isListening || !this.ctx || !this.analyser) return;

    this.animationId = requestAnimationFrame(() => this.animate());

    this.analyser.getByteFrequencyData(this.dataArray);

    this.drawWaveform(this.dataArray);
  }

  drawWaveform(frequencyData) {
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.getBoundingClientRect().width;
    const height = this.canvas.getBoundingClientRect().height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    this.ctx.clearRect(0, 0, width, height);

    const sliceWidth = (Math.PI * 2) / frequencyData.length;
    let angle = 0;

    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(0.5, '#0080ff');
    gradient.addColorStop(1, '#00d4ff');

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = 'rgba(0, 212, 255, 0.5)';

    this.ctx.beginPath();

    for (let i = 0; i < frequencyData.length; i++) {
      const v = frequencyData[i] / 255.0;
      const amplitude = v * 30 + 5;

      const x = centerX + Math.cos(angle) * (radius + amplitude);
      const y = centerY + Math.sin(angle) * (radius + amplitude);

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      angle += sliceWidth;
    }

    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;
  }

  drawIdleWaveform() {
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.getBoundingClientRect().width;
    const height = this.canvas.getBoundingClientRect().height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    this.ctx.clearRect(0, 0, width, height);

    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
    gradient.addColorStop(0.5, 'rgba(0, 128, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0.3)');

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = 'rgba(0, 212, 255, 0.3)';

    this.ctx.beginPath();

    const points = 60;
    const sliceWidth = (Math.PI * 2) / points;

    for (let i = 0; i <= points; i++) {
      const angle = i * sliceWidth;
      const amplitude = Math.sin(i * 0.3) * 8 + 3;

      const x = centerX + Math.cos(angle) * (radius + amplitude);
      const y = centerY + Math.sin(angle) * (radius + amplitude);

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
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

  destroy() {
    this.stopListening();

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (err) {
        console.warn('[VOICE-UI] Error closing audio context:', err);
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.VoiceUI = VoiceUI;

  window.addEventListener('DOMContentLoaded', () => {
    window.voiceUI = new VoiceUI();
  });
}

export default VoiceUI;
