export class Sonifier {
  constructor() {
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.isEnabled = false;
    this.lastFrequency = 440;
  }

  init() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    this.oscillator = this.audioCtx.createOscillator();
    this.gainNode = this.audioCtx.createGain();
    
    this.oscillator.type = 'sine'; // Smooth sound
    this.oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime);
    
    this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
    
    this.oscillator.start();
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (enabled) {
      this.init();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } else {
      if (this.gainNode) {
        this.gainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
      }
    }
  }

  update(yValue) {
    if (!this.isEnabled || !this.audioCtx) return;

    // Map y-value to frequency
    // Let's say y=0 is 440Hz (A4)
    // Each unit of y shifts frequency
    // freq = 440 * 2^(y/12) - loosely following octaves if y was a semi-tone
    // But for a graph, let's just do a direct mapping for better "feel"
    const baseFreq = 440;
    const frequency = baseFreq * Math.pow(2, yValue / 5); // 5 units = 1 octave

    // Clamp frequency to audible/pleasant range
    const clampedFreq = Math.min(Math.max(frequency, 20), 2000);

    const now = this.audioCtx.currentTime;
    this.oscillator.frequency.setTargetAtTime(clampedFreq, now, 0.05);
    
    // Vary gain slightly based on frequency to normalize perceived loudness
    const volume = 0.1; 
    this.gainNode.gain.setTargetAtTime(volume, now, 0.05);
  }

  stop() {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
    }
  }
}
