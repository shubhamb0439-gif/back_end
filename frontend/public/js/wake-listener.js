export class WakeListener {
  constructor({ wakePhrase = 'hey rhea', onWake } = {}) {
    this._wakePhrase = wakePhrase.toLowerCase().trim();
    this._onWake = typeof onWake === 'function' ? onWake : () => {};

    this._enabled = false;
    this._cooldownMs = 2000;
    this._lastWakeAt = 0;
  }

  enable() {
    this._enabled = true;
    console.log('[WakeListener] Enabled - scanning transcripts for "' + this._wakePhrase + '"');
  }

  disable() {
    this._enabled = false;
    console.log('[WakeListener] Disabled');
  }

  isEnabled() { return this._enabled; }

  feedTranscript(text) {
    if (!this._enabled || !text) return false;

    const lower = text.toLowerCase().trim();
    if (!this._containsWakePhrase(lower)) return false;

    const now = Date.now();
    if (now - this._lastWakeAt < this._cooldownMs) return false;
    this._lastWakeAt = now;

    console.log('[WakeListener] Wake phrase detected in transcript:', text);
    this._onWake(text);
    return true;
  }

  _containsWakePhrase(text) {
    if (!text) return false;
    const normalized = text.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

    if (normalized.includes(this._wakePhrase)) return true;

    const variants = [
      'hey rhea', 'hey ria', 'hey reya', 'hey rea',
      'a rhea', 'hey rhia', 'hay rhea', 'hey riya',
      'he rhea', 'hey reia', 'hey rhee', 'hey ree',
      'hey rheia', 'hey reah', 'hey rhe', 'hey rear',
      'hey area', 'hey aria', 'hey rio', 'hey rio',
      'hey ria', 'hey rhia', 'hey raya', 'hey ria'
    ];
    for (const v of variants) {
      if (normalized.includes(v)) return true;
    }

    return false;
  }
}

export default WakeListener;
