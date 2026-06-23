// Test delayed terminal state transition after audio completion

const assert = require('assert');

class AudioPlaybackSimulator {
  constructor() {
    this.isTerminal = false;
    this.callSummary = null;
    this.pendingTerminalState = null;
    this.audioPlayCount = 0;
  }

  // Mimics handleUserMessage reply handler logic
  handleReply(is_terminal, nextState) {
    if (is_terminal) {
      this.pendingTerminalState = nextState;
    } else {
      this.pendingTerminalState = null;
    }
    // Simulate playing audio
    this.playBotAudio();
  }

  playBotAudio() {
    this.audioPlayCount++;
  }

  // Mimics handleAudioPlayEnded / utterance.onend handler
  handleAudioPlayEnded() {
    if (this.pendingTerminalState) {
      const termState = this.pendingTerminalState;
      this.pendingTerminalState = null;
      this.isTerminal = true;
      this.generateCallSummary(termState);
    }
  }

  generateCallSummary(termState) {
    this.callSummary = {
      outcome: termState === 'PAYMENT_CONFIRM' ? 'Payment Link Dispatched' : 'Customer Refused',
      duration: '00:15'
    };
  }
}

console.log("Running Delayed Call Termination tests...\n");

const sim = new AudioPlaybackSimulator();

// 1. Simulating a terminal reply from the engine
console.log("Simulating receiving a terminal reply from the state engine...");
sim.handleReply(true, 'PAYMENT_CONFIRM');

// Assert that the overlay is NOT shown yet
assert.strictEqual(sim.isTerminal, false, "UI must not show terminal overlay immediately when API returns");
assert.strictEqual(sim.pendingTerminalState, 'PAYMENT_CONFIRM', "Pending terminal state must be stored");
assert.strictEqual(sim.callSummary, null, "Call summary must not be generated yet");
console.log("✔ Pass: Call overlay remains hidden and state is pending during audio playback.");

// 2. Simulating audio playback ending
console.log("Simulating bot audio ending (utterance.onend / handleAudioPlayEnded)...");
sim.handleAudioPlayEnded();

// Assert that the overlay is now shown
assert.strictEqual(sim.isTerminal, true, "UI must transition to terminal overlay after audio ends");
assert.strictEqual(sim.pendingTerminalState, null, "Pending terminal state must be cleared");
assert.ok(sim.callSummary !== null, "Call summary must be generated after audio ends");
console.log("✔ Pass: Call overlay transitions to terminal successfully after audio concludes.");

console.log("\nALL DELAYED CALL TERMINATION TESTS PASSED SUCCESSFULLY!");
