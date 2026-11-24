/**
 * Sound effects synthesised with Web Audio (no files yet).
 * Mixing rules from the GDD: at most 24 voices, identical sounds within 30 ms
 * merge into one, per-sound concurrency limits, random pitch to avoid repetition.
 * The bark is synthesised for now; the CC0 sample replaces it in Phase 6.
 */
type SoundId =
  | 'golpe'
  | 'puf'
  | 'comida'
  | 'guau'
  | 'dano'
  | 'carga'
  | 'cargaLista'
  | 'aleteo'
  | 'bocina'
  | 'tuetue'
  | 'retumbo'
  | 'campana';

const MAX_VOICES = 24;
const MERGE_MS = 30;
const LIMITS: Partial<Record<SoundId, number>> = { golpe: 8, puf: 6, comida: 4, aleteo: 3, bocina: 2, tuetue: 1, retumbo: 1 };
/** Pentatonic scale steps (semitones) for the food jingle. */
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36];

export class Sfx {
  volume = 0.6;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private voices = 0;
  private readonly playing = new Map<SoundId, number>();
  private readonly lastAt = new Map<SoundId, number>();
  private comboStep = 0;
  private comboUntil = 0;
  private lastHurt = 0;
  private buzz: { osc: OscillatorNode; lfo: OscillatorNode; gain: GainNode } | null = null;

  /** Must be called from a user gesture (browsers block audio until then). */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    void this.ctx?.resume();
  }

  play(id: SoundId, opts: { pitch?: number; gain?: number } = {}): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || ctx.state !== 'running') return;
    const now = performance.now();
    if (now - (this.lastAt.get(id) ?? -1e9) < MERGE_MS) return;
    if (this.voices >= MAX_VOICES && id !== 'guau' && id !== 'dano') return;
    if ((this.playing.get(id) ?? 0) >= (LIMITS[id] ?? 4)) return;
    this.lastAt.set(id, now);

    const pitch = opts.pitch ?? 1;
    const gain = opts.gain ?? 1;
    const dur = this.synth(ctx, this.master, id, pitch, gain);
    this.voices++;
    this.playing.set(id, (this.playing.get(id) ?? 0) + 1);
    window.setTimeout(() => {
      this.voices--;
      this.playing.set(id, (this.playing.get(id) ?? 1) - 1);
    }, dur * 1000 + 20);
  }

  /** Food pickup: each piece in a streak climbs the pentatonic scale; resets after 1.5 s. */
  pickup(): void {
    const now = performance.now();
    this.comboStep = now < this.comboUntil ? Math.min(this.comboStep + 1, PENTA.length - 1) : 0;
    this.comboUntil = now + 1500;
    this.play('comida', { pitch: 2 ** ((PENTA[this.comboStep] ?? 0) / 12) });
  }

  /** Whimper, never more than once every 0.3 s. */
  hurt(): void {
    const now = performance.now();
    if (now - this.lastHurt < 300) return;
    this.lastHurt = now;
    this.play('dano', { pitch: 0.95 + Math.random() * 0.1 });
  }

  /** Mosquito drone whose volume follows how many zancudos are near (0..1). */
  setBuzz(level: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    if (!this.buzz) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 420;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 23;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 14;
      lfo.connect(lfoGain).connect(osc.frequency);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 900;
      filter.Q.value = 2;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(filter).connect(gain).connect(this.master);
      osc.start();
      lfo.start();
      this.buzz = { osc, lfo, gain };
    }
    this.buzz.gain.gain.setTargetAtTime(Math.min(1, level) * 0.05, ctx.currentTime, 0.2);
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  private noiseSource(ctx: AudioContext): AudioBufferSourceNode {
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    return src;
  }

  /** Builds and starts the sound; returns its duration in seconds. */
  private synth(ctx: AudioContext, out: AudioNode, id: SoundId, pitch: number, gainMul: number): number {
    const t = ctx.currentTime;
    const env = (g: GainNode, peak: number, attack: number, release: number): void => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak * gainMul, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
    };

    switch (id) {
      case 'golpe': {
        // "Fsst": paper being cut.
        const src = this.noiseSource(ctx);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(5200 * pitch, t);
        f.frequency.exponentialRampToValueAtTime(2400 * pitch, t + 0.07);
        f.Q.value = 1.4;
        const g = ctx.createGain();
        env(g, 0.18, 0.004, 0.07);
        src.connect(f).connect(g).connect(out);
        src.start(t, Math.random());
        src.stop(t + 0.09);
        return 0.09;
      }
      case 'puf': {
        const src = this.noiseSource(ctx);
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(1800 * pitch, t);
        f.frequency.exponentialRampToValueAtTime(300, t + 0.12);
        const g = ctx.createGain();
        env(g, 0.22, 0.005, 0.12);
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(320 * pitch, t);
        o.frequency.exponentialRampToValueAtTime(90 * pitch, t + 0.1);
        const og = ctx.createGain();
        env(og, 0.16, 0.003, 0.1);
        src.connect(f).connect(g).connect(out);
        o.connect(og).connect(out);
        src.start(t, Math.random());
        src.stop(t + 0.14);
        o.start(t);
        o.stop(t + 0.14);
        return 0.14;
      }
      case 'comida': {
        const o = ctx.createOscillator();
        o.type = 'square';
        o.frequency.value = 880 * pitch;
        const o2 = ctx.createOscillator();
        o2.type = 'sine';
        o2.frequency.value = 1760 * pitch;
        const g = ctx.createGain();
        env(g, 0.06, 0.003, 0.11);
        o.connect(g);
        o2.connect(g);
        g.connect(out);
        o.start(t);
        o2.start(t);
        o.stop(t + 0.13);
        o2.stop(t + 0.13);
        return 0.13;
      }
      case 'guau': {
        // Two-formant synthetic bark with a short echo ("¡GUAU!" = gu-AU).
        const dur = 0.32;
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(260 * pitch, t);
        o.frequency.linearRampToValueAtTime(520 * pitch, t + 0.05);
        o.frequency.exponentialRampToValueAtTime(210 * pitch, t + dur);
        const f1 = ctx.createBiquadFilter();
        f1.type = 'bandpass';
        f1.frequency.setValueAtTime(500, t);
        f1.frequency.linearRampToValueAtTime(900, t + 0.08);
        f1.Q.value = 4;
        const f2 = ctx.createBiquadFilter();
        f2.type = 'bandpass';
        f2.frequency.value = 1500;
        f2.Q.value = 6;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.9 * gainMul, t + 0.02);
        g.gain.setValueAtTime(0.9 * gainMul, t + 0.1);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const grit = this.noiseSource(ctx);
        const gg = ctx.createGain();
        env(gg, 0.25, 0.005, 0.12);
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.11;
        const fb = ctx.createGain();
        fb.gain.value = 0.28;
        o.connect(f1);
        o.connect(f2);
        f1.connect(g);
        f2.connect(g);
        grit.connect(gg).connect(f1);
        g.connect(out);
        g.connect(delay);
        delay.connect(fb).connect(delay);
        delay.connect(out);
        o.start(t);
        o.stop(t + dur);
        grit.start(t);
        grit.stop(t + 0.15);
        return dur + 0.5;
      }
      case 'dano': {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(1100 * pitch, t);
        o.frequency.exponentialRampToValueAtTime(620 * pitch, t + 0.16);
        const g = ctx.createGain();
        env(g, 0.25, 0.01, 0.16);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + 0.2);
        return 0.2;
      }
      case 'carga': {
        const o = ctx.createOscillator();
        o.type = 'square';
        o.frequency.value = 330 * pitch;
        const g = ctx.createGain();
        env(g, 0.03, 0.002, 0.03);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + 0.04);
        return 0.04;
      }
      case 'cargaLista': {
        const o = ctx.createOscillator();
        o.type = 'square';
        o.frequency.setValueAtTime(660, t);
        o.frequency.setValueAtTime(990, t + 0.05);
        const g = ctx.createGain();
        env(g, 0.06, 0.003, 0.1);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + 0.12);
        return 0.12;
      }
      case 'bocina': {
        // Bus horn: two detuned square waves, 0.8 s.
        const g = ctx.createGain();
        env(g, 0.12, 0.02, 0.7);
        for (const f of [311, 370]) {
          const o = ctx.createOscillator();
          o.type = 'square';
          o.frequency.value = f * pitch;
          o.connect(g);
          o.start(t);
          o.stop(t + 0.75);
        }
        g.connect(out);
        return 0.8;
      }
      case 'tuetue': {
        // The chonchón's call: two falling whistles.
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        const o = ctx.createOscillator();
        o.type = 'sine';
        for (let i = 0; i < 2; i++) {
          const s = t + i * 0.22;
          o.frequency.setValueAtTime(1500 * pitch, s);
          o.frequency.exponentialRampToValueAtTime(1100 * pitch, s + 0.15);
          g.gain.exponentialRampToValueAtTime(0.07 * gainMul, s + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, s + 0.16);
        }
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + 0.5);
        return 0.5;
      }
      case 'retumbo': {
        // Earthquake rumble and rattling glass.
        const src = this.noiseSource(ctx);
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 120 * pitch;
        const g = ctx.createGain();
        env(g, 0.9, 0.1, 1.6);
        src.connect(f).connect(g).connect(out);
        const glass = this.noiseSource(ctx);
        const gf = ctx.createBiquadFilter();
        gf.type = 'highpass';
        gf.frequency.value = 6000;
        const gg = ctx.createGain();
        gg.gain.setValueAtTime(0.0001, t);
        for (let i = 0; i < 8; i++) {
          gg.gain.exponentialRampToValueAtTime(0.05 * gainMul, t + 0.2 + i * 0.17);
          gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.26 + i * 0.17);
        }
        glass.connect(gf).connect(gg).connect(out);
        src.start(t, Math.random());
        src.stop(t + 1.8);
        glass.start(t, Math.random());
        glass.stop(t + 1.8);
        return 1.8;
      }
      case 'campana': {
        // Corner-shop bell.
        const g = ctx.createGain();
        env(g, 0.12, 0.002, 0.6);
        for (const f of [1318, 1976, 2637]) {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = f * pitch;
          o.connect(g);
          o.start(t);
          o.stop(t + 0.65);
        }
        g.connect(out);
        return 0.65;
      }
      case 'aleteo': {
        // A flock taking off: a few quick noise flutters.
        const src = this.noiseSource(ctx);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 1300;
        f.Q.value = 0.8;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        for (let i = 0; i < 6; i++) {
          g.gain.exponentialRampToValueAtTime(0.12 * gainMul, t + i * 0.06 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.05);
        }
        src.connect(f).connect(g).connect(out);
        src.start(t, Math.random());
        src.stop(t + 0.4);
        return 0.4;
      }
    }
  }
}
