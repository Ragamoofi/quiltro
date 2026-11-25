import type * as ToneNS from 'tone';

export type ToneModule = typeof ToneNS;

/** Effects duck by 30 % while a big banner or a boss intro speaks (GDD "Mezcla"). */
export const DUCK_AMOUNT = 0.3;

/**
 * One shared audio context for effects (raw Web Audio) and music (Tone.js).
 *
 * Tone.js is downloaded in the background right after boot (`preload`) but no
 * AudioContext exists until the first touch or key (`unlock`), so browsers
 * never print the "AudioContext was not allowed to start" warning and the
 * first playable frame does not wait for the audio library.
 *
 *   sfx ─▶ duck ─▶ compressor ─┐
 *                              ├─▶ destination
 *   music ─▶ Tone destination ─┘   (both also feed an analyser for tests)
 */
export class AudioEngine {
  tone: ToneModule | null = null;
  ctx: AudioContext | null = null;
  /** Effects connect here. */
  sfxIn: GainNode | null = null;
  /** Music connects here (a Tone node). */
  musicOut: ToneNS.Gain | null = null;

  private modulePromise: Promise<ToneModule> | null = null;
  private starting: Promise<void> | null = null;
  private duck: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private buffer: Float32Array<ArrayBuffer> | null = null;
  private readonly listeners: (() => void)[] = [];
  private duckUntil = 0;

  get ready(): boolean {
    return this.ctx !== null && this.tone !== null;
  }

  /** Starts downloading Tone.js without creating any audio context. */
  preload(): void {
    // Tone.js prints a banner in the console when it loads; the game keeps the console clean.
    (window as unknown as { TONE_SILENCE_LOGGING: boolean }).TONE_SILENCE_LOGGING = true;
    this.modulePromise ??= import('tone');
  }

  /** Runs `fn` once the engine is ready (immediately if it already is). */
  onReady(fn: () => void): void {
    if (this.ready) fn();
    else this.listeners.push(fn);
  }

  /** Must be called from a user gesture. Safe to call on every touch. */
  unlock(): void {
    this.preload();
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    this.starting ??= this.init();
  }

  private async init(): Promise<void> {
    const mod = this.modulePromise;
    if (!mod) return;
    const tone = await mod;
    await tone.start();
    const ctx = tone.getContext().rawContext as AudioContext;
    this.tone = tone;
    this.ctx = ctx;

    this.duck = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 12;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
    this.duck.connect(comp).connect(ctx.destination);
    this.sfxIn = ctx.createGain();
    this.sfxIn.connect(this.duck);

    this.musicOut = new tone.Gain(0.6).toDestination();
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.buffer = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4));
    this.duck.connect(this.analyser);
    tone.connect(this.musicOut, this.analyser);

    for (const fn of this.listeners.splice(0)) fn();
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    void this.ctx?.resume();
  }

  /** Lowers the effects 30 % for `seconds` (banner, boss intro). */
  duckSfx(seconds: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.duck) return;
    const now = ctx.currentTime;
    this.duckUntil = Math.max(this.duckUntil, now + seconds);
    this.duck.gain.cancelScheduledValues(now);
    this.duck.gain.setTargetAtTime(1 - DUCK_AMOUNT, now, 0.05);
    this.duck.gain.setTargetAtTime(1, this.duckUntil, 0.25);
  }

  /** Current output level (RMS 0..1) of everything that is playing: used by the tests and F1. */
  level(): number {
    if (!this.analyser || !this.buffer) return 0;
    this.analyser.getFloatTimeDomainData(this.buffer);
    let sum = 0;
    for (const v of this.buffer) sum += v * v;
    return Math.sqrt(sum / this.buffer.length);
  }
}
