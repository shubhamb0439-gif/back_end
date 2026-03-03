class TextToSpeech {
  constructor() {
    this.apiKey = null;
    this.voiceId = 'EXAVITQu4vr4xnSDxMaL';
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.isPlaying = false;
    this.audioQueue = [];
    this.currentAudio = null;
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  setVoiceId(voiceId) {
    this.voiceId = voiceId;
  }

  async speak(text, options = {}) {
    if (!this.apiKey) {
      console.warn('[TTS] No API key set, using browser TTS fallback');
      return this.fallbackSpeak(text);
    }

    try {
      console.log('[TTS] Speaking:', text);

      const response = await fetch(`${this.baseUrl}/text-to-speech/${this.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: options.modelId || 'eleven_monolingual_v1',
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.75,
            style: options.style || 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      return this.playAudio(audioBlob);

    } catch (error) {
      console.error('[TTS] ElevenLabs failed, using fallback:', error);
      return this.fallbackSpeak(text);
    }
  }

  playAudio(blob) {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      this.currentAudio = audio;
      this.isPlaying = true;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.isPlaying = false;
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        this.isPlaying = false;
        this.currentAudio = null;
        reject(error);
      };

      audio.play().catch(reject);
    });
  }

  fallbackSpeak(text) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.error('[TTS] Speech synthesis not supported');
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice =>
        voice.name.includes('Female') ||
        voice.name.includes('Samantha') ||
        voice.name.includes('Victoria')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onend = () => {
        this.isPlaying = false;
        resolve();
      };

      utterance.onerror = (error) => {
        this.isPlaying = false;
        console.error('[TTS] Fallback error:', error);
        resolve();
      };

      this.isPlaying = true;
      speechSynthesis.speak(utterance);
    });
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    this.isPlaying = false;
  }

  async speakWithCallback(text, callback) {
    try {
      await this.speak(text);
      if (callback) callback();
    } catch (error) {
      console.error('[TTS] Speak with callback error:', error);
      if (callback) callback();
    }
  }
}

window.TextToSpeech = TextToSpeech;
