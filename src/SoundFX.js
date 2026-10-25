/**
 * SoundFX.js - Procedural Web Audio API sound synthesis
 * Zero external audio files required.
 */

class SoundFX {
  constructor() {
    this.ctx = null;
    this.oceanGain = null;
    this.oceanFilter = null;
    this.oceanSource = null;
    this.initialized = false;
    this.isMuted = false;
    this.masterVolume = 1.0;
    this.masterGain = null;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initOceanAmbience();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported or blocked:", e);
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Helper to create a pure white noise buffer
   */
  createWhiteNoiseBuffer(duration = 0.5) {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Helper to create a noise buffer (Pink/Brown noise)
   */
  createNoiseBuffer(duration = 2.0) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    // Pink / brown noise generator
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    return buffer;
  }

  /**
   * Continuous ocean wave ambient generator
   */
  initOceanAmbience() {
    if (!this.ctx) return;
    try {
      const noiseBuffer = this.createNoiseBuffer(5.0);
      this.oceanSource = this.ctx.createBufferSource();
      this.oceanSource.buffer = noiseBuffer;
      this.oceanSource.loop = true;

      // Modulated bandpass filter for rolling ocean waves
      this.oceanFilter = this.ctx.createBiquadFilter();
      this.oceanFilter.type = 'lowpass';
      this.oceanFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
      this.oceanFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      // Low frequency oscillator for wave swells (in and out)
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime); // ~5.5s wave cycle

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(220, this.ctx.currentTime); // mod range

      lfo.connect(lfoGain);
      lfoGain.connect(this.oceanFilter.frequency);

      this.oceanGain = this.ctx.createGain();
      this.oceanGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.oceanSource.connect(this.oceanFilter);
      this.oceanFilter.connect(this.oceanGain);
      this.oceanGain.connect(this.masterGain);

      lfo.start();
      this.oceanSource.start();
    } catch (e) {
      console.warn("Ocean sound init failed:", e);
    }
  }

  /**
   * Adjust ocean volume based on player distance to water
   */
  updateOcean(distanceToSea) {
    if (!this.oceanGain || !this.ctx) return;
    // Louder near sea, softer inland
    const norm = Math.max(0.04, Math.min(0.28, 0.28 - (distanceToSea / 140) * 0.2));
    this.oceanGain.gain.setTargetAtTime(norm, this.ctx.currentTime, 0.5);
  }

  /**
   * Chipping wood / Chopping tree (playChopWoodSound)
   * Layer 1 (Thud): Triangle wave dropping rapidly from 220Hz to 60Hz in 0.12s
   * Layer 2 (Splinter): Noise buffer through lowpass filter (800Hz) decaying in 0.15s
   */
  playChopWoodSound() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const pitchFactor = 0.92 + Math.random() * 0.16;

    // Layer 1: Heavy resonant wooden thud
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(220 * pitchFactor, t);
    thudOsc.frequency.exponentialRampToValueAtTime(58 * pitchFactor, t + 0.12);

    thudGain.gain.setValueAtTime(0.70, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    thudOsc.connect(thudGain);
    thudGain.connect(this.masterGain);
    thudOsc.start(t);
    thudOsc.stop(t + 0.14);

    // Layer 2: Wood fiber cracking & splinter noise
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createWhiteNoiseBuffer(0.20);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800 * pitchFactor, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.52, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.16);
  }

  playChop() {
    this.playChopWoodSound();
  }

  /**
   * Striking stone / Mining rock (playMineRockSound)
   * Layer 1 (Clang): High-frequency oscillator (800Hz - 1200Hz) decaying in 0.08s
   * Layer 2 (Crunch): White noise through bandpass (1500Hz - 2500Hz, Q=3.0) decaying in 0.2s
   * Pitch variation: ±10% per strike
   */
  playMineRockSound() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    // Pitch variation ±10%
    const pitchFactor = 0.90 + Math.random() * 0.20;

    // Layer 1: Sharp metallic pick clang (800Hz - 1200Hz, exponential decay in 0.08s)
    const clangOsc = this.ctx.createOscillator();
    const clangGain = this.ctx.createGain();
    clangOsc.type = 'sine';
    const clangFreq = (950 + (Math.random() - 0.5) * 200) * pitchFactor;
    clangOsc.frequency.setValueAtTime(clangFreq, t);
    clangOsc.frequency.exponentialRampToValueAtTime(clangFreq * 0.65, t + 0.08);

    clangGain.gain.setValueAtTime(0.55, t);
    clangGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    clangOsc.connect(clangGain);
    clangGain.connect(this.masterGain);
    clangOsc.start(t);
    clangOsc.stop(t + 0.09);

    // Harmonic overtone for crisp metal-on-stone ring
    const harmonicOsc = this.ctx.createOscillator();
    const harmonicGain = this.ctx.createGain();
    harmonicOsc.type = 'triangle';
    harmonicOsc.frequency.setValueAtTime(clangFreq * 1.85, t);
    harmonicGain.gain.setValueAtTime(0.22, t);
    harmonicGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(this.masterGain);
    harmonicOsc.start(t);
    harmonicOsc.stop(t + 0.07);

    // Layer 2: Stone fracture crunch (White noise through bandpass 1500Hz - 2500Hz, Q = 3.0, decay in 0.2s)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createWhiteNoiseBuffer(0.25);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime((1850 + (Math.random() - 0.5) * 400) * pitchFactor, t);
    filter.Q.setValueAtTime(3.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.22);
  }

  /**
   * Dull metallic clang when axe hits rock
   */
  playDullClangSound() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  /**
   * Low wooden thud when pickaxe hits tree
   */
  playThudSound() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.14);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playMine() {
    this.playMineRockSound();
  }

  /**
   * Tool air swing whoosh (playSwingSound)
   * White noise through bandpass sliding from 400Hz up to 800Hz, decaying in 0.1s
   */
  playSwingSound() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createWhiteNoiseBuffer(0.15);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(820, t + 0.08);
    filter.Q.setValueAtTime(2.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.12);
  }

  /**
   * Item pickup: Ascending 2-tone chime
   */
  playPickup() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Tone 1: 587 Hz (D5), Tone 2: 880 Hz (A5)
    osc.frequency.setValueAtTime(587.33, t);
    osc.frequency.setValueAtTime(880.00, t + 0.08);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.setValueAtTime(0.35, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  /**
   * Crafting sound: short rhythmic hammer taps + melodic chime
   */
  playCraft() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // 2 Quick hammer strikes
    [0, 0.12].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420 + idx * 80, t + offset);
      osc.frequency.exponentialRampToValueAtTime(110, t + offset + 0.08);

      gain.gain.setValueAtTime(0.4, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.1);
    });

    // Resolving chime
    const chime = this.ctx.createOscillator();
    const cGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(987.77, t + 0.24); // B5
    cGain.gain.setValueAtTime(0.3, t + 0.24);
    cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    chime.connect(cGain);
    cGain.connect(this.masterGain);
    chime.start(t + 0.24);
    chime.stop(t + 0.6);
  }

  /**
   * Footstep: soft organic rustle / thud
   */
  playStep(isWater = false) {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    if (isWater) {
      // Splash sound
      const splash = this.ctx.createBufferSource();
      splash.buffer = this.createNoiseBuffer(0.18);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      splash.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      splash.start(t);
      splash.stop(t + 0.2);
      return;
    }

    // Ground tap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95 + Math.random() * 20, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.06);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Eat food: crunchy bite
   */
  playEat() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    [0, 0.09, 0.18].forEach((offset) => {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.08);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800 + Math.random() * 400, t + offset);
      filter.Q.setValueAtTime(4.0, t + offset);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.07);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(t + offset);
      noise.stop(t + offset + 0.08);
    });
  }

  /**
   * Drink water: refreshing gulp
   */
  playDrink() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.22);

    gain.gain.setValueAtTime(0.26, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.28);
  }

  /**
   * Building placement thump
   */
  playBuild() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.18);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  /**
   * Jump whoosh
   */
  playJump() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }
}

export const soundFX = new SoundFX();
