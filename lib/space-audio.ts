/**
 * lib/space-audio.ts
 * Procedural Web Audio Engine for 3D Deep Space Combat
 * Generates continuous ion thrusters, laser blasts, warp drive booms, and cosmic resonance.
 */

class SpaceAudioEngine {
  private ctx: AudioContext | null = null;
  private thrusterOsc: OscillatorNode | null = null;
  private thrusterGain: GainNode | null = null;
  private thrusterFilter: BiquadFilterNode | null = null;
  private isThrusterRunning = false;
  private isMuted = false;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.thrusterGain) {
      this.thrusterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx?.currentTime || 0);
    }
    return this.isMuted;
  }

  public startThrusterLoop() {
    if (this.isThrusterRunning || this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    this.thrusterOsc = this.ctx.createOscillator();
    this.thrusterGain = this.ctx.createGain();
    this.thrusterFilter = this.ctx.createBiquadFilter();

    this.thrusterOsc.type = 'sawtooth';
    this.thrusterOsc.frequency.setValueAtTime(65, t);

    this.thrusterFilter.type = 'lowpass';
    this.thrusterFilter.frequency.setValueAtTime(140, t);

    this.thrusterGain.gain.setValueAtTime(0.08, t);

    this.thrusterOsc.connect(this.thrusterFilter);
    this.thrusterFilter.connect(this.thrusterGain);
    this.thrusterGain.connect(this.ctx.destination);

    this.thrusterOsc.start(t);
    this.isThrusterRunning = true;
  }

  public updateThrusterPitch(speedRatio: number) {
    if (!this.thrusterOsc || !this.thrusterFilter || !this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const targetFreq = 55 + speedRatio * 85;
    const targetCutoff = 120 + speedRatio * 450;
    this.thrusterOsc.frequency.setTargetAtTime(targetFreq, t, 0.08);
    this.thrusterFilter.frequency.setTargetAtTime(targetCutoff, t, 0.08);
  }

  /**
   * Dual Twin Plasma Laser Peal
   */
  public playLaser(isAlt = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isAlt ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.14);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Asteroid / Drone Explosion
   */
  public playExplosion() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);
    filter.frequency.exponentialRampToValueAtTime(45, t + 0.44);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.44);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.45);
  }

  /**
   * Warp Drive Relativistic Surge
   */
  public playWarp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.5);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.56);
  }

  /**
   * Target Lock-on Acoustic Ping
   */
  public playTargetLock() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }
}

export const spaceAudio = new SpaceAudioEngine();
