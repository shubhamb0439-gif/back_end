// public/js/voice.js
// VoiceController: Web Speech API wrapper matching your Android SpeechRecognizer flow.
// - Commands recognized (case-insensitive):
//   connect, disconnect
//   start stream, stop stream
//   mute (mic), unmute (mic)
//   hide video, show video
//   send urgent message / urgent message
//   note  -> starts note-taking mode (partial transcripts throttled)
//   create -> stops note-taking mode and emits final note
//
// Callbacks:
//   onCommand(action, rawText)       action ∈ ['connect','disconnect','start_stream','stop_stream','mute','unmute','hide_video','show_video','urgent','start_note','stop_note']
//   onTranscript(text, isFinal)      partial/final transcript text
//   onListenStateChange(isListening) true/false when recognition starts/stops
//   onError(error)                   string message/code
//
// Usage example:
//   import { VoiceController } from '/public/js/voice.js';
//   const voice = new VoiceController({
//     onCommand: (a, t) => console.log(a, t),
//     onTranscript: (txt, fin) => console.log(fin ? 'FINAL' : 'PART', txt),
//   });
//   voice.start(); // must be triggered from a user gesture in most browsers

export class VoiceController {
  /**
   * @param {Object} opts
   * @param {string} [opts.lang='en-US']
   * @param {boolean} [opts.continuous=true]
   * @param {boolean} [opts.interimResults=true]
   * @param {number} [opts.partialThrottleMs=800]
   * @param {(action:string, rawText:string)=>void} [opts.onCommand]
   * @param {(text:string, isFinal:boolean)=>void} [opts.onTranscript]
   * @param {(isListening:boolean)=>void} [opts.onListenStateChange]
   * @param {(err:string)=>void} [opts.onError]
   * @param {Array<{re:RegExp, action:string}>} [opts.customMap]  // optional extra phrases
   */
  constructor(opts = {}) {
    this.lang = opts.lang || 'en-US';
    this.continuous = opts.continuous !== false;
    this.interimResults = opts.interimResults !== false;
    this.partialThrottleMs = Number.isFinite(opts.partialThrottleMs)
      ? opts.partialThrottleMs : 800;

    this.onCommand = typeof opts.onCommand === 'function' ? opts.onCommand : () => { };
    this.onTranscript = typeof opts.onTranscript === 'function' ? opts.onTranscript : () => { };
    this.onListenStateChange = typeof opts.onListenStateChange === 'function' ? opts.onListenStateChange : () => { };
    this.onError = typeof opts.onError === 'function' ? opts.onError : () => { };

    this._customMap = Array.isArray(opts.customMap) ? opts.customMap : [];

    this._SR = (typeof window !== 'undefined')
      ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
      : null;

    this._rec = null;
    this._listening = false;
    this._lastPartialAt = 0;

    this._noteMode = false;
    this._noteBuffer = '';

    this._bindHandlers();
  }

  static isAvailable() {
    return !!(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));
    // For broader coverage, consider swapping to Azure/Vosk when unavailable.
  }

  isListening() { return this._listening; }

  setLanguage(lang) {
    this.lang = lang || 'en-US';
    if (this._rec) this._rec.lang = this.lang;
  }

  start() {
    if (!this._SR) { this.onError('speech_api_unavailable'); return false; }
    if (this._listening) return true;

    if (!this._rec) this._setup();

    try {
      this._rec.start();
      this._listening = true;
      this.onListenStateChange(true);
      return true;
    } catch (e) {
      this._listening = false;
      this.onListenStateChange(false);
      this.onError(this._errString(e));
      return false;
    }
  }

  stop() {
    if (!this._rec) return;
    try { this._rec.stop(); } catch { }
    this._listening = false;
    this.onListenStateChange(false);
    // If we were in note mode, finalize
    if (this._noteMode) this._emitStopNote();
  }

  destroy() {
    try { this.stop(); } catch { }
    this._rec = null;
  }

  // ---------------------- internals ----------------------

  _bindHandlers() {
    this._onResult = this._onResult.bind(this);
    this._onError = this._onError.bind(this);
    this._onEnd = this._onEnd.bind(this);
  }

  _setup() {
    this._rec = new this._SR();
    this._rec.lang = this.lang;
    this._rec.continuous = this.continuous;
    this._rec.interimResults = this.interimResults;

    this._rec.onresult = this._onResult;
    this._rec.onerror = this._onError;
    this._rec.onend = this._onEnd;
  }

  _onResult(e) {
    // Aggregate interim + final across results block
    let interim = '';
    let finalTxt = '';

    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      const txt = (res[0]?.transcript || '').toLowerCase().trim();
      if (!txt) continue;

      if (res.isFinal) finalTxt += (finalTxt ? ' ' : '') + txt;
      else interim += (interim ? ' ' : '') + txt;
    }

    // Partial transcript throttling
    if (interim) {
      const now = Date.now();
      if (now - this._lastPartialAt >= this.partialThrottleMs) {
        this._lastPartialAt = now;
        // Apply MRN formatting to interim transcripts
        const formattedInterim = this._formatMRN(interim);
        if (this._noteMode) {
          // Note mode buffers partials locally, still notify UI
          this.onTranscript(formattedInterim, false);
        } else {
          this.onTranscript(formattedInterim, false);
        }
      }
    }

    if (finalTxt) {
      // Apply MRN formatting to final transcript
      const formattedFinal = this._formatMRN(finalTxt);

      // If in note mode, buffer AND do not treat as a command
      if (this._noteMode) {
        this._noteBuffer += (this._noteBuffer ? ' ' : '') + formattedFinal;
        this.onTranscript(formattedFinal, true);
        // "create" stops note mode
        if (/\bcreate\b/.test(finalTxt)) {
          this._emitStopNote(); // includes final note buffer
        }
        return;
      }

      // Normal command mode
      const action = this._parseCommand(finalTxt);
      if (action) {
        this.onCommand(action, formattedFinal);
      } else {
        // Deliver final transcript even if no command matched
        this.onTranscript(formattedFinal, true);
      }
    }
  }

  _onError(ev) {
    const code = ev?.error || ev?.message || 'speech_error';
    this.onError(String(code));

    // Auto-restart on recoverable errors
    const recoverable = ['no-speech', 'aborted', 'audio-capture', 'network'];
    if (this._listening && recoverable.includes(code)) {
      try { this._rec.start(); } catch { }
    }
  }

  _onEnd() {
    // Chrome fires onend frequently; auto-restart if we want to keep listening
    if (this._listening) {
      try { this._rec.start(); } catch { }
    } else {
      this.onListenStateChange(false);
    }
  }

  _errString(e) {
    if (!e) return 'speech_error';
    if (typeof e === 'string') return e;
    return e.message || e.name || 'speech_error';
  }

  /**
   * Format MRN numbers in transcript text
   * Converts spoken MRN patterns to formatted MRN-XXXXXX format (NO SPACES)
   * Examples: "mrn aba 121" -> "MRN-ABA121"
   *           "MRNA BA121" -> "MRN-BA121"
   *           "m r n zero zero one a b c" -> "MRN-001ABC"
   *
   * CRITICAL: Output format is ALWAYS "MRN-" + alphanumeric code with NO SPACES
   */
  _formatMRN(text) {
    if (!text) return text;

    const numberWords = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
      'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
    };

    // Exclude common words that shouldn't be part of MRN
    const excludeWords = /^(is|the|number|patient|id|medical|record|an|dash|hyphen|mrn|hi|doctor|hello)$/i;

    let formatted = text;

    // Pattern 0: "MRNA BA121" - handle speech recognition mishearing "MRN A" as "MRNA"
    formatted = formatted.replace(
      /\bMRNA\s+([A-Z0-9]+(?:\s+[A-Z0-9]+)*)\b/gi,
      (match, code) => {
        const cleanCode = code.trim().replace(/\s+/g, '').toUpperCase();
        if (cleanCode.length >= 3 && cleanCode.length <= 12 && !excludeWords.test(cleanCode)) {
          return `MRN-${cleanCode}`;
        }
        return match;
      }
    );

    // Pattern 1: "MRN number is MRN ABA121" - handle redundant MRN
    formatted = formatted.replace(
      /\b(?:m\s*r\s*n|mrn)\s+number\s+is\s+(?:m\s*r\s*n|mrn)\s+([a-z0-9\s]+)\b/gi,
      (match, code) => {
        const cleanCode = code.trim().replace(/\s+/g, '').toUpperCase();
        if (cleanCode.length >= 3 && cleanCode.length <= 12 && !excludeWords.test(cleanCode)) {
          return `MRN-${cleanCode}`;
        }
        return match;
      }
    );

    // Pattern 2: "MRN is ABA121" or "MRN number is ABA121" (with number words)
    formatted = formatted.replace(
      /\b(m\s*r\s*n|mrn)\s+(?:number\s+)?is\s+((?:(?:zero|one|two|three|four|five|six|seven|eight|nine|[a-z0-9])[\s]*)+)\b/gi,
      (match, prefix, code) => {
        const words = code.trim().split(/\s+/);
        const converted = words
          .filter(w => w && !excludeWords.test(w))
          .map(w => {
            const lower = w.toLowerCase();
            if (numberWords[lower]) return numberWords[lower];
            return w.toUpperCase();
          })
          .join('');

        if (converted.length >= 3 && converted.length <= 12) {
          return `MRN-${converted}`;
        }
        return match;
      }
    );

    // Pattern 3: "mrn" or "m r n" followed by alphanumeric code or number words
    // Limit to 3-12 alphanumeric tokens to avoid capturing too much
    formatted = formatted.replace(
      /\b(m\s*r\s*n|mrn)\s+((?:(?:zero|one|two|three|four|five|six|seven|eight|nine|[a-z]{1,3}|\d+)[\s\-]*){1,12})/gi,
      (match, prefix, codeRaw) => {
        // Split into individual characters/words
        const words = codeRaw.trim().split(/[\s\-]+/);

        // Stop at common stop words
        const stopWords = /^(on|in|at|to|for|with|from|by|of|off|file|patient|arrived|was|has|note|consultation|and|or|the|hi|doctor|hello)$/i;
        const validWords = [];

        for (const w of words) {
          if (!w) continue;
          if (stopWords.test(w)) break; // Stop collecting at stop words
          if (!excludeWords.test(w)) validWords.push(w);
        }

        // Convert number words and single letters - JOIN WITH NO SPACES
        const cleanCode = validWords
          .map(w => {
            const lower = w.toLowerCase();
            // Check if it's a number word
            if (numberWords[lower]) return numberWords[lower];
            // Single letter - keep as is
            if (w.length === 1) return w.toUpperCase();
            // Multi-character string - keep all characters
            return w.toUpperCase();
          })
          .join('') // JOIN WITH NO SPACES - CRITICAL!
          .replace(/[^A-Z0-9]/g, ''); // Remove any non-alphanumeric chars

        // Only format if we have a valid code (3-12 chars)
        if (cleanCode.length >= 3 && cleanCode.length <= 12) {
          return `MRN-${cleanCode}`; // Format: MRN-XXXXXX (no spaces)
        }
        return match; // Return original if invalid
      }
    );

    return formatted;
  }

  _emitStartNote() {
    if (this._noteMode) return;
    this._noteMode = true;
    this._noteBuffer = '';
    this.onCommand('start_note', 'note');
  }

  _emitStopNote() {
    if (!this._noteMode) return;
    this._noteMode = false;
    const finalNote = this._noteBuffer.trim();
    this._noteBuffer = '';
    // Emit final transcript of the note and a stop_note command
    if (finalNote) this.onTranscript(finalNote, true);
    this.onCommand('stop_note', 'create');
  }

  // ------------------ command parsing ------------------

  _parseCommand(s) {
    const text = String(s || '').toLowerCase().trim();
    if (!text) return null;

    // Custom overrides first
    for (const { re, action } of this._customMap) {
      if (re.test(text)) return action;
    }

    // Note-taking first (so "note" doesn't hit other rules)
    if (/\bnote\b/.test(text)) return (this._emitStartNote(), 'start_note');
    if (/\bcreate\b/.test(text)) return (this._emitStopNote(), 'stop_note');

    // Connect / disconnect
    if (/\bdisconnect\b/.test(text)) return 'disconnect';
    if (/\bconnect\b/.test(text)) return 'connect';

    // Unmute before mute to avoid matching "unmute" as "mute"
    if (/\bunmute(\s+mic(rophone)?)?\b/.test(text)) return 'unmute';
    if (/\bmute(\s+mic(rophone)?)?\b/.test(text)) return 'mute';

    // Start/Stop stream
    if (/\bstart( the)? (stream|video|camera)\b/.test(text)) return 'start_stream';
    if (/\bstop( the)? (stream|video|camera)\b/.test(text)) return 'stop_stream';

    // Hide/Show video
    if (/\bhide( the)? (video|camera|preview)?\b/.test(text)) return 'hide_video';
    if (/\bshow( the)? (video|camera|preview)?\b/.test(text)) return 'show_video';

    // Urgent message
    if (/\bsend( an)? urgent (message|alert)\b/.test(text)) return 'urgent';
    if (/\burgent\b.*\bmessage\b/.test(text)) return 'urgent';

    return null;
  }
}

// ---- ASR control helpers for UI (safe, additive) ----
// Allow UI to start/stop recognition without needing a direct ref.
// We look for a globally stored instance: window.voiceController or window.voice.
export function startRecognition() {
  try {
    const inst = (typeof window !== 'undefined') && (window.voiceController || window.voice);
    if (inst && typeof inst.start === 'function') inst.start();
  } catch { }
}

export function stopRecognition() {
  try {
    const inst = (typeof window !== 'undefined') && (window.voiceController || window.voice);
    if (inst && typeof inst.stop === 'function') inst.stop();
  } catch { }
}

// Optional: if a voice instance already exists on window, add helpers onto it.
// This does not override existing start()/stop(); it just adds new methods.
try {
  if (typeof window !== 'undefined') {
    const inst = window.voiceController || window.voice;
    if (inst && typeof inst === 'object') {
      inst.startRecognition = startRecognition;
      inst.stopRecognition = stopRecognition;
    }
  }
} catch { }


export default VoiceController;
