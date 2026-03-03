class AutonomousMode {
  constructor() {
    this.isActive = false;
    this.isEnabled = true;
    this.wakeWordDetector = null;
    this.tts = null;
    this.voiceHandler = null;
    this.autoSleepTimeout = null;
    this.autoSleepDuration = 5 * 60 * 1000;
    this.onModeChange = null;
    this.onCommandDetected = null;
  }

  initialize(wakeWordDetector, tts, voiceHandler) {
    this.wakeWordDetector = wakeWordDetector;
    this.tts = tts;
    this.voiceHandler = voiceHandler;

    console.log('[Autonomous Mode] Initialized');
  }

  async startWakeWordListening() {
    if (!this.isEnabled || !this.wakeWordDetector) {
      console.log('[Autonomous Mode] Wake word listening disabled or not initialized');
      return;
    }

    if (this.isActive) {
      console.log('[Autonomous Mode] Already in autonomous mode');
      return;
    }

    console.log('[Autonomous Mode] Starting wake word detection');

    const started = await this.wakeWordDetector.start(() => {
      this.onWakeWordDetected();
    });

    if (started) {
      this.notifyModeChange('wake-word-listening');
    }
  }

  async onWakeWordDetected() {
    console.log('[Autonomous Mode] Wake word detected! Activating autonomous mode');

    this.notifyModeChange('activating');

    if (this.tts) {
      await this.tts.speak('How can I help you?');
    }

    this.activateAutonomousMode();
  }

  activateAutonomousMode() {
    console.log('[Autonomous Mode] Entering autonomous mode');

    this.isActive = true;

    this.notifyModeChange('active');

    if (this.voiceHandler) {
      this.voiceHandler.startContinuousListening((command) => {
        this.handleVoiceCommand(command);
      });
    }

    this.resetAutoSleep();
  }

  async deactivateAutonomousMode(skipGoodbye = false) {
    console.log('[Autonomous Mode] Exiting autonomous mode');

    this.isActive = false;

    if (this.voiceHandler) {
      this.voiceHandler.stopContinuousListening();
    }

    if (this.autoSleepTimeout) {
      clearTimeout(this.autoSleepTimeout);
      this.autoSleepTimeout = null;
    }

    if (!skipGoodbye && this.tts) {
      await this.tts.speak('Goodbye');
    }

    this.notifyModeChange('deactivated');

    setTimeout(() => {
      this.startWakeWordListening();
    }, 1000);
  }

  handleVoiceCommand(command) {
    console.log('[Autonomous Mode] Command received:', command);

    const lowerCommand = command.toLowerCase().trim();

    if (this.isSleepCommand(lowerCommand)) {
      this.deactivateAutonomousMode();
      return;
    }

    this.resetAutoSleep();

    if (this.onCommandDetected) {
      this.onCommandDetected(command);
    }
  }

  isSleepCommand(command) {
    const sleepCommands = [
      'goodbye',
      'good bye',
      'bye',
      'sleep',
      'go to sleep',
      'stop listening',
      'that\'s all',
      'thats all',
      'thank you',
      'thanks'
    ];

    return sleepCommands.some(cmd => command.includes(cmd));
  }

  resetAutoSleep() {
    if (this.autoSleepTimeout) {
      clearTimeout(this.autoSleepTimeout);
    }

    this.autoSleepTimeout = setTimeout(() => {
      console.log('[Autonomous Mode] Auto-sleep timeout reached');
      this.deactivateAutonomousMode();
    }, this.autoSleepDuration);
  }

  setAutoSleepDuration(minutes) {
    this.autoSleepDuration = minutes * 60 * 1000;
    if (this.isActive) {
      this.resetAutoSleep();
    }
  }

  toggleEnabled() {
    this.isEnabled = !this.isEnabled;

    if (!this.isEnabled) {
      if (this.isActive) {
        this.deactivateAutonomousMode(true);
      }
      if (this.wakeWordDetector) {
        this.wakeWordDetector.stop();
      }
    } else {
      this.startWakeWordListening();
    }

    return this.isEnabled;
  }

  notifyModeChange(state) {
    if (this.onModeChange) {
      this.onModeChange(state);
    }
  }

  getState() {
    return {
      isActive: this.isActive,
      isEnabled: this.isEnabled,
      isWakeWordListening: this.wakeWordDetector?.isListening || false
    };
  }
}

window.AutonomousMode = AutonomousMode;
