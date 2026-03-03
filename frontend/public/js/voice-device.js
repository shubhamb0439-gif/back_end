import { SignalingClient } from './signaling.js';
import WebRtcStreamer from './device.js';
import TelemetryReporter from './telemetry.js';
import { VoiceController } from './voice.js';
import { Message, appendMessage } from './messages.js';

const SERVER_URL = window.SIGNAL_URL || location.origin;
const DEFAULT_DESKTOP_ID = window.XR_OPERATOR_ID || 'XR-1238';
const BATTERY_PUSH_MS = 5000;

function normalizeXrId(raw) {
  if (!raw) return '';
  const trimmed = String(raw).trim().toUpperCase();
  if (!trimmed) return '';
  if (trimmed.startsWith('XR-')) return trimmed;
  if (/^[0-9]+$/.test(trimmed)) return `XR-${trimmed}`;
  return trimmed;
}

async function fetchLoggedInXrIdFromSession() {
  const MAX_ATTEMPTS = 3;
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch('/api/platform/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!res.ok) {
        if ((res.status === 401 || res.status === 403) && attempt < MAX_ATTEMPTS) {
          await sleep(400 * attempt);
          continue;
        }
        return null;
      }

      const data = await res.json();
      const xr = (data?.xrId || '').trim();

      if (!xr && attempt < MAX_ATTEMPTS) {
        await sleep(400 * attempt);
        continue;
      }

      return xr || null;
    } catch (e) {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(400 * attempt);
        continue;
      }
      console.warn('[AUTO-XR] Failed to fetch:', e);
      return null;
    }
  }
  return null;
}

class VoiceDeviceUI {
  constructor() {
    this.btnPTT = document.getElementById('btnPTT');
    this.canvas = document.getElementById('waveformCanvas');
    this.orbText = document.getElementById('orbText');
    this.responseCard = document.getElementById('responseCard');
    this.responseText = document.getElementById('responseText');
    this.btnPlayResponse = document.getElementById('btnPlayResponse');
    this.statusIndicator = document.getElementById('status');
    this.preview = document.getElementById('preview');
    this.deviceXrIdInput = document.getElementById('deviceXrIdInput');

    this.ctx = this.canvas?.getContext('2d');
    this.isRecording = false;
    this.isConnected = false;
    this.streamActive = false;
    this.connectedDesktops = [];
    this.currentAudio = null;
    this.androidXrId = '';

    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.animationId = null;

    this.signaling = null;
    this.streamer = null;
    this.telemetry = null;
    this.voice = null;
    this.batteryTimer = null;

    this.init();
  }

  async init() {
    await this.loadXrId();
    this.setupEventListeners();
    this.setupVoiceController();
    this.autoConnect();
  }

  async loadXrId() {
    const sessionXrId = await fetchLoggedInXrIdFromSession();
    if (sessionXrId) {
      this.androidXrId = normalizeXrId(sessionXrId);
      if (this.deviceXrIdInput) {
        this.deviceXrIdInput.value = this.androidXrId;
      }
    }
  }

  setupEventListeners() {
    if (this.btnPTT) {
      this.btnPTT.addEventListener('mousedown', (e) => this.handlePressStart(e));
      this.btnPTT.addEventListener('touchstart', (e) => this.handlePressStart(e));
      this.btnPTT.addEventListener('mouseup', () => this.handlePressEnd());
      this.btnPTT.addEventListener('touchend', () => this.handlePressEnd());
      this.btnPTT.addEventListener('mouseleave', () => {
        if (this.isRecording) this.handlePressEnd();
      });
      this.btnPTT.addEventListener('click', (e) => e.preventDefault());
    }

    if (this.btnPlayResponse) {
      this.btnPlayResponse.addEventListener('click', () => this.toggleAudioPlayback());
    }

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        this.handlePressStart(e);
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handlePressEnd();
      }
    });
  }

  setupVoiceController() {
    this.voice = new VoiceController({
      continuous: false,
      interimResults: true,
      onTranscript: (text, isFinal) => this.handleTranscript(text, isFinal),
      onCommand: (action, rawText) => this.handleVoiceCommand(action, rawText),
      onError: (err) => console.warn('[VOICE] Error:', err),
      onListenStateChange: (listening) => {
        if (!listening && this.isRecording) {
          this.isRecording = false;
          this.deactivateOrb();
        }
      }
    });
  }

  async autoConnect() {
    if (!this.androidXrId) {
      console.warn('[VOICE-DEVICE] No XR ID available for auto-connect');
      return;
    }

    this.signaling = new SignalingClient({
      url: SERVER_URL,
      xrId: this.androidXrId
    });

    this.streamer = new WebRtcStreamer({
      signaling: this.signaling,
      androidXrId: this.androidXrId
    });

    this.telemetry = new TelemetryReporter({
      signaling: this.signaling,
      deviceId: this.androidXrId
    });

    if (this.preview) {
      this.streamer.attachVideo(this.preview);
    }

    this.setupSignalingEvents();

    try {
      await this.signaling.connect();
      this.isConnected = true;
      this.updateStatusIndicator();
      this.startBatteryPush();
    } catch (e) {
      console.error('[VOICE-DEVICE] Auto-connect failed:', e);
      this.updateOrbText('Connection failed. Tap to retry.');
    }
  }

  setupSignalingEvents() {
    this.signaling.on('room_joined', (data) => {
      const members = data?.members || [];
      this.connectedDesktops = members.filter(m => m !== this.androidXrId);
      console.log('[VOICE-DEVICE] Room joined, desktops:', this.connectedDesktops);

      if (this.connectedDesktops.length > 0 && !this.streamActive) {
        this.startStreaming();
      }
    });

    this.signaling.on('peer_joined', (data) => {
      const peerId = data?.xrId;
      if (peerId && !this.connectedDesktops.includes(peerId)) {
        this.connectedDesktops.push(peerId);
        console.log('[VOICE-DEVICE] Peer joined:', peerId);

        if (!this.streamActive) {
          this.startStreaming();
        }
      }
    });

    this.signaling.on('peer_left', (data) => {
      const peerId = data?.xrId;
      this.connectedDesktops = this.connectedDesktops.filter(d => d !== peerId);
      console.log('[VOICE-DEVICE] Peer left:', peerId);
    });

    this.signaling.on('offer', (data) => {
      this.streamer.onRemoteOfferReceived(data, data.from);
    });

    this.signaling.on('answer', (data) => {
      this.streamer.onRemoteAnswerReceived(data, data.from);
    });

    this.signaling.on('ice_candidate', (data) => {
      this.streamer.onRemoteIceCandidate(data, data.from);
    });

    this.signaling.on('play_audio', (data) => {
      this.handleIncomingAudio(data);
    });

    this.signaling.on('message', (data) => {
      console.log('[VOICE-DEVICE] Message:', data);
    });
  }

  async startStreaming() {
    if (this.streamActive) return;

    try {
      await this.streamer.startStreaming(this.connectedDesktops);
      this.streamActive = true;
      this.streamer.muteMic();
      console.log('[VOICE-DEVICE] Stream started');
    } catch (e) {
      console.error('[VOICE-DEVICE] Stream start failed:', e);
    }
  }

  async stopStreaming() {
    if (!this.streamActive) return;

    try {
      await this.streamer.stopStreaming();
      this.streamActive = false;
      console.log('[VOICE-DEVICE] Stream stopped');
    } catch (e) {
      console.error('[VOICE-DEVICE] Stream stop failed:', e);
    }
  }

  handlePressStart(e) {
    e.preventDefault();
    if (this.isRecording) return;

    this.isRecording = true;
    this.activateOrb();
    this.startVoiceRecognition();
    this.startWaveformVisualization();

    if (this.btnPTT) {
      this.btnPTT.classList.add('active');
    }

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  handlePressEnd() {
    if (!this.isRecording) return;

    this.isRecording = false;
    this.stopVoiceRecognition();
    this.deactivateOrb();

    if (this.btnPTT) {
      this.btnPTT.classList.remove('active');
    }

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }

  startVoiceRecognition() {
    if (this.streamActive) {
      this.streamer.muteMic();
    }

    if (this.voice) {
      this.voice.start();
    }
  }

  stopVoiceRecognition() {
    if (this.voice) {
      this.voice.stop();
    }
  }

  handleTranscript(text, isFinal) {
    this.updateOrbText(text);

    if (isFinal) {
      this.sendTranscriptToScribe(text);
    }
  }

  handleVoiceCommand(action, rawText) {
    console.log('[VOICE-CMD]', action, rawText);
    this.updateOrbText(`Command: ${action}`);

    setTimeout(() => {
      this.updateOrbText('');
    }, 2000);

    switch (action) {
      case 'start_stream':
        this.startStreaming();
        break;
      case 'stop_stream':
        this.stopStreaming();
        break;
      case 'mute':
        if (this.streamer) this.streamer.muteMic();
        break;
      case 'unmute':
        if (this.streamer) this.streamer.unmuteMic();
        break;
      case 'connect':
        if (!this.isConnected) this.autoConnect();
        break;
      case 'disconnect':
        this.disconnect();
        break;
    }
  }

  sendTranscriptToScribe(text) {
    if (!this.signaling || !this.isConnected) return;

    const payload = {
      type: 'scribe_transcript',
      deviceId: this.androidXrId,
      transcript: text,
      timestamp: new Date().toISOString()
    };

    try {
      this.signaling.sendRaw(JSON.stringify(payload));
      console.log('[VOICE-DEVICE] Sent transcript to scribe:', text);
    } catch (e) {
      console.error('[VOICE-DEVICE] Failed to send transcript:', e);
    }
  }

  async startWaveformVisualization() {
    if (!this.canvas || !this.ctx) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      this.drawWaveform();
    } catch (e) {
      console.error('[WAVEFORM] Failed to start:', e);
    }
  }

  drawWaveform() {
    if (!this.isRecording || !this.analyser || !this.ctx) {
      this.stopWaveform();
      return;
    }

    this.animationId = requestAnimationFrame(() => this.drawWaveform());

    this.analyser.getByteFrequencyData(this.dataArray);

    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#3b82f6';

    this.ctx.beginPath();

    const sliceWidth = width / this.dataArray.length;
    let x = 0;

    for (let i = 0; i < this.dataArray.length; i++) {
      const v = this.dataArray[i] / 255.0;
      const y = height / 2 + (v - 0.5) * height * 0.8;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.stroke();
  }

  stopWaveform() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  activateOrb() {
    if (this.orbText) {
      this.orbText.textContent = 'Listening...';
    }
  }

  deactivateOrb() {
    this.stopWaveform();

    if (this.orbText) {
      setTimeout(() => {
        if (!this.isRecording) {
          this.orbText.textContent = '';
        }
      }, 500);
    }
  }

  updateOrbText(text) {
    if (this.orbText) {
      this.orbText.textContent = text;
    }
  }

  handleIncomingAudio(data) {
    const audioBase64 = data?.audio;
    const transcript = data?.transcript || 'Your XR assistant response appears here...';

    if (!audioBase64) return;

    try {
      const audioData = atob(audioBase64);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }

      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      this.currentAudio = new Audio(url);
      this.currentAudio.onended = () => {
        this.hideResponseCard();
      };

      if (this.responseText) {
        this.responseText.textContent = transcript;
      }

      this.showResponseCard();
      this.currentAudio.play();
    } catch (e) {
      console.error('[AUDIO] Playback failed:', e);
    }
  }

  showResponseCard() {
    if (this.responseCard) {
      this.responseCard.hidden = false;
    }
  }

  hideResponseCard() {
    if (this.responseCard) {
      this.responseCard.hidden = true;
    }
  }

  toggleAudioPlayback() {
    if (!this.currentAudio) return;

    if (this.currentAudio.paused) {
      this.currentAudio.play();
    } else {
      this.currentAudio.pause();
    }
  }

  updateStatusIndicator() {
    if (!this.statusIndicator) return;

    if (this.isConnected) {
      this.statusIndicator.classList.add('connected');
    } else {
      this.statusIndicator.classList.remove('connected');
    }
  }

  startBatteryPush() {
    if (this.batteryTimer) return;

    this.batteryTimer = setInterval(() => {
      if (!this.telemetry || !this.isConnected) return;
      this.telemetry.sendBatteryUpdate();
    }, BATTERY_PUSH_MS);
  }

  stopBatteryPush() {
    if (this.batteryTimer) {
      clearInterval(this.batteryTimer);
      this.batteryTimer = null;
    }
  }

  disconnect() {
    this.stopBatteryPush();
    this.stopStreaming();

    if (this.signaling) {
      this.signaling.disconnect();
    }

    this.isConnected = false;
    this.updateStatusIndicator();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.voiceDeviceUI = new VoiceDeviceUI();
});
