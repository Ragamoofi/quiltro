import type { AudioEngine } from './engine.ts';

/**
 * Sound effects synthesised with Web Audio.
 * Mixing rules from the GDD (all in `canPlay`): at most 24 voices, identical
 * sounds within 30 ms merge into one, the player and the bosses have priority
 * (they can steal a voice from the rest), per-sound concurrency limits and a
 * random pitch to avoid repetition.
 *
 * The bark is synthesised: the GDD asks for a CC0 sample, which needs a file
 * download that has to be approved first (see docs/PENDIENTES.md).
 */
export type SoundId =
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
  | 'campana'
  | 'motor'
  | 'guitarra'
  | 'acordeon'
  | 'bacan'
  | 'jefe'
  | 'elite'
  | 'latido'
  | 'zona'
  | 'alarma'
  | 'evolucion'
  | 'victoria'
  | 'derrota'
  | 'pajaro'
  | 'ladridoLejano'
  | 'moneda'
  | 'ruleta'
  // Fase 11.9: every character has its own cry for the ¡GUAU!.
  | 'miau'
  | 'yip'
  | 'balido'
  | 'rebuzno'
  | 'arrullo'
  | 'siseo'
  | 'relincho'
  | 'bufido';

export const MAX_VOICES = 24;
export const MERGE_MS = 30;

/** 3 = player and bosses (never dropped), 2 = important cues, 1 = everything else. */
export const PRIORITY: Readonly<Record<SoundId, 1 | 2 | 3>> = {
  guau: 3,
  miau: 3,
  yip: 3,
  balido: 3,
  rebuzno: 3,
  arrullo: 3,
  siseo: 3,
  relincho: 3,
  bufido: 3,
  dano: 3,
  jefe: 3,
  retumbo: 3,
  derrota: 3,
  victoria: 3,
  latido: 3,
  bocina: 2,
  motor: 2,
  elite: 2,
  alarma: 2,
  evolucion: 2,
  bacan: 2,
  guitarra: 2,
  acordeon: 2,
  campana: 2,
  zona: 2,
  cargaLista: 2,
  tuetue: 2,
  aleteo: 2,
  golpe: 1,
  puf: 1,
  comida: 1,
  carga: 1,
  pajaro: 1,
  ladridoLejano: 1,
  moneda: 1,
  ruleta: 1,
};

/** Max overlapping copies of the same sound. */
export const LIMITS: Partial<Record<SoundId, number>> = {
  golpe: 8,
  puf: 6,
  comida: 4,
  aleteo: 3,
  bocina: 2,
  tuetue: 1,
  retumbo: 1,
  jefe: 1,
  latido: 1,
  ladridoLejano: 2,
  pajaro: 2,
  moneda: 3,
};

/**
 * Pure mixing decision (exported for the tests): may a sound start?
 * `playing` is the number of voices busy, `same` the copies of this sound.
 */
export function canPlay(id: SoundId, voices: number, same: number, sinceLast: number): boolean {
  if (sinceLast < MERGE_MS) return false;
  if (same >= (LIMITS[id] ?? 4)) return false;
  // Over the cap only the player's and the bosses' sounds get through (they steal a voice).
  if (voices >= MAX_VOICES && PRIORITY[id] < 3) return false;
  // Near the cap, background sounds yield to the important ones.
  if (voices >= MAX_VOICES - 6 && PRIORITY[id] < 2) return false;
  return true;
}

/** A voice: an oscillator whose pitch follows `freq` ([seconds, Hz] points), through an optional moving vowel filter. */
interface ToneSpec {
  type: OscillatorType;
  freq: readonly (readonly [number, number])[];
  formant?: readonly (readonly [number, number])[];
  q?: number;
  dur: number;
  gain: number;
  /** Pitch wobble (vibrato) and volume wobble (tremolo / trill). */
  vib?: { rate: number; depth: number };
  am?: { rate: number; depth: number };
  at?: number;
}

function tone(ctx: AudioContext, out: AudioNode, t0: number, s: ToneSpec, pitch: number, gainMul: number): void {
  const t = t0 + (s.at ?? 0);
  const o = ctx.createOscillator();
  o.type = s.type;
  s.freq.forEach(([dt, hz], i) => {
    if (i === 0) o.frequency.setValueAtTime(hz * pitch, t + dt);
    else o.frequency.linearRampToValueAtTime(hz * pitch, t + dt);
  });
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(s.gain * gainMul, t + Math.min(0.04, s.dur * 0.2));
  g.gain.setValueAtTime(s.gain * gainMul, t + s.dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + s.dur);
  let node: AudioNode = o;
  if (s.formant) {
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = s.q ?? 3;
    s.formant.forEach(([dt, hz], i) => {
      if (i === 0) f.frequency.setValueAtTime(hz, t + dt);
      else f.frequency.linearRampToValueAtTime(hz, t + dt);
    });
    o.connect(f);
    node = f;
  }
  const extra: OscillatorNode[] = [];
  if (s.vib) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = s.vib.rate;
    const lg = ctx.createGain();
    lg.gain.value = s.vib.depth * pitch;
    lfo.connect(lg).connect(o.frequency);
    extra.push(lfo);
  }
  if (s.am) {
    const trem = ctx.createGain();
    trem.gain.value = 1 - s.am.depth;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = s.am.rate;
    const lg = ctx.createGain();
    lg.gain.value = s.am.depth;
    lfo.connect(lg).connect(trem.gain);
    node.connect(trem);
    node = trem;
    extra.push(lfo);
  }
  node.connect(g).connect(out);
  for (const n of [o, ...extra]) {
    n.start(t);
    n.stop(t + s.dur + 0.02);
  }
}

/** Pentatonic scale steps (semitones) for the food jingle. */
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36];

export class Sfx {
  volume = 0.7;
  private readonly engine: AudioEngine;
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
  /** Sound ids played since the last `drainLog()` (tests and F1). */
  private readonly log: SoundId[] = [];
  private logging = false;

  constructor(engine: AudioEngine) {
    this.engine = engine;
    engine.onReady(() => this.setup());
  }

  private setup(): void {
    const ctx = this.engine.ctx;
    if (!ctx || !this.engine.sfxIn) return;
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.engine.sfxIn);
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  /** Must be called from a user gesture (browsers block audio until then). */
  unlock(): void {
    this.engine.unlock();
  }

  suspend(): void {
    this.engine.suspend();
  }

  resume(): void {
    this.engine.resume();
  }

  /** Start/stop recording which sounds play (the audio tests read it). */
  record(on: boolean): void {
    this.logging = on;
    this.log.length = 0;
  }

  drainLog(): SoundId[] {
    return this.log.splice(0);
  }

  /** Plays a sound. `pan` is -1 (left) … 1 (right): where the thing is relative to the dog. */
  play(id: SoundId, opts: { pitch?: number; gain?: number; pan?: number } = {}): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || ctx.state !== 'running') return;
    const now = performance.now();
    if (!canPlay(id, this.voices, this.playing.get(id) ?? 0, now - (this.lastAt.get(id) ?? -1e9))) return;
    this.lastAt.set(id, now);
    if (this.logging) this.log.push(id);

    const pitch = opts.pitch ?? 1;
    const gain = opts.gain ?? 1;
    let out: AudioNode = this.master;
    if (opts.pan !== undefined && typeof ctx.createStereoPanner === 'function') {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, opts.pan));
      p.connect(this.master);
      out = p;
    }
    const dur = this.synth(ctx, out, id, pitch, gain);
    this.voices++;
    this.playing.set(id, (this.playing.get(id) ?? 0) + 1);
    window.setTimeout(() => {
      this.voices--;
      this.playing.set(id, (this.playing.get(id) ?? 1) - 1);
    }, dur * 1000 + 20);
  }

  /** Lowers the effects 30 % for a moment (a big banner or a boss intro is on screen). */
  duck(seconds: number): void {
    this.engine.duckSfx(seconds);
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
      // ---- Fase 11.9: the cries ----
      case 'miau': {
        // "Mi-AAU": a nasal voice whose vowel opens (i → a) and closes (u), with a little vibrato.
        tone(ctx, out, t, { type: 'sawtooth', freq: [[0, 620], [0.12, 900], [0.42, 560]], formant: [[0, 2300], [0.15, 1500], [0.42, 800]], q: 5, dur: 0.48, gain: 0.55, vib: { rate: 6, depth: 18 } }, pitch, gainMul);
        tone(ctx, out, t, { type: 'triangle', freq: [[0, 1240], [0.12, 1800], [0.42, 1120]], dur: 0.45, gain: 0.08 }, pitch, gainMul);
        return 0.5;
      }
      case 'yip': {
        // The culpeo fox: two sharp, high yips ("¡kak-kak!").
        for (const at of [0, 0.13]) tone(ctx, out, t, { type: 'square', freq: [[0, 1150], [0.08, 700]], formant: [[0, 1900]], q: 2, dur: 0.09, gain: 0.45, at }, pitch, gainMul);
        return 0.25;
      }
      case 'balido': {
        // The pudú bleats: "beeeh", with a fast quaver.
        tone(ctx, out, t, { type: 'sawtooth', freq: [[0, 480], [0.45, 430]], formant: [[0, 1100], [0.45, 900]], q: 4, dur: 0.5, gain: 0.5, vib: { rate: 17, depth: 40 } }, pitch, gainMul);
        return 0.52;
      }
      case 'rebuzno': {
        // The Humboldt penguin calls like a small donkey: "jii-AAA".
        tone(ctx, out, t, { type: 'sawtooth', freq: [[0, 620], [0.18, 700]], formant: [[0, 1400]], q: 3, dur: 0.2, gain: 0.45 }, pitch, gainMul);
        tone(ctx, out, t, { type: 'sawtooth', freq: [[0, 330], [0.3, 280]], formant: [[0, 800], [0.3, 650]], q: 3, dur: 0.32, gain: 0.55, am: { rate: 22, depth: 0.5 }, at: 0.18 }, pitch, gainMul);
        return 0.52;
      }
      case 'arrullo': {
        // The pigeon: "rruu-rru", a soft throaty coo with a trill.
        tone(ctx, out, t, { type: 'sine', freq: [[0, 360], [0.28, 300]], dur: 0.3, gain: 0.6, am: { rate: 26, depth: 0.6 } }, pitch, gainMul);
        tone(ctx, out, t, { type: 'sine', freq: [[0, 330], [0.2, 280]], dur: 0.22, gain: 0.5, am: { rate: 26, depth: 0.6 }, at: 0.34 }, pitch, gainMul);
        return 0.58;
      }
      case 'siseo': {
        // The condor has no song: a strong hiss and a gust of its great wings.
        const src = this.noiseSource(ctx);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(3200, t);
        f.frequency.exponentialRampToValueAtTime(1400, t + 0.4);
        f.Q.value = 1.5;
        const g = ctx.createGain();
        env(g, 0.5, 0.03, 0.4);
        src.connect(f).connect(g).connect(out);
        src.start(t, Math.random());
        src.stop(t + 0.45);
        const gust = this.noiseSource(ctx);
        const lf = ctx.createBiquadFilter();
        lf.type = 'lowpass';
        lf.frequency.value = 420;
        const gg = ctx.createGain();
        gg.gain.setValueAtTime(0.0001, t);
        gg.gain.exponentialRampToValueAtTime(0.9 * gainMul, t + 0.08);
        gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        gust.connect(lf).connect(gg).connect(out);
        gust.start(t, Math.random());
        gust.stop(t + 0.36);
        tone(ctx, out, t, { type: 'triangle', freq: [[0, 1500], [0.3, 900]], dur: 0.32, gain: 0.12 }, pitch, gainMul);
        return 0.46;
      }
      case 'relincho': {
        // The guanaco's alarm call: a high laughing trill that falls ("jiji-ji-ji").
        tone(ctx, out, t, { type: 'square', freq: [[0, 1250], [0.5, 760]], formant: [[0, 2000], [0.5, 1300]], q: 2, dur: 0.55, gain: 0.35, am: { rate: 13, depth: 0.85 } }, pitch, gainMul);
        return 0.58;
      }
      case 'bufido': {
        // The chingue: an angry snort and a hiss.
        tone(ctx, out, t, { type: 'sawtooth', freq: [[0, 170], [0.12, 120]], formant: [[0, 500]], q: 2, dur: 0.14, gain: 0.6 }, pitch, gainMul);
        const src = this.noiseSource(ctx);
        const f = ctx.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.value = 2200;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t + 0.1);
        g.gain.exponentialRampToValueAtTime(0.35 * gainMul, t + 0.14);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        src.connect(f).connect(g).connect(out);
        src.start(t + 0.1, Math.random());
        src.stop(t + 0.46);
        return 0.48;
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
      case 'motor': {
        // Bus engine revving up while the horn warns of the charge.
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(48 * pitch, t);
        o.frequency.exponentialRampToValueAtTime(96 * pitch, t + 0.8);
        const vib = ctx.createOscillator();
        vib.frequency.value = 22;
        const vg = ctx.createGain();
        vg.gain.value = 5;
        vib.connect(vg).connect(o.frequency);
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(220, t);
        f.frequency.linearRampToValueAtTime(520, t + 0.8);
        const g = ctx.createGain();
        env(g, 0.3, 0.1, 0.75);
        o.connect(f).connect(g).connect(out);
        o.start(t);
        vib.start(t);
        o.stop(t + 0.9);
        vib.stop(t + 0.9);
        return 0.9;
      }
      case 'guitarra': {
        // Ascending strum (level up): Em chord plucked low to high.
        const notes = [164.8, 246.9, 329.6, 392, 493.9, 659.3];
        notes.forEach((f0, i) => {
          const s = t + i * 0.045;
          const o = ctx.createOscillator();
          o.type = 'triangle';
          o.frequency.value = f0 * pitch;
          const o2 = ctx.createOscillator();
          o2.type = 'sawtooth';
          o2.frequency.value = f0 * pitch * 2.003;
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(3600, s);
          lp.frequency.exponentialRampToValueAtTime(700, s + 0.5);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, s);
          g.gain.exponentialRampToValueAtTime(0.11 * gainMul, s + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, s + 0.7);
          o.connect(lp);
          o2.connect(lp);
          lp.connect(g).connect(out);
          o.start(s);
          o2.start(s);
          o.stop(s + 0.72);
          o2.stop(s + 0.72);
        });
        return 1;
      }
      case 'acordeon': {
        // Cheerful reed arpeggio (legendary card).
        [523.3, 659.3, 784, 1046.5].forEach((f0, i) => {
          const s = t + i * 0.09;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, s);
          g.gain.exponentialRampToValueAtTime(0.1 * gainMul, s + 0.02);
          g.gain.setValueAtTime(0.1 * gainMul, s + (i === 3 ? 0.3 : 0.07));
          g.gain.exponentialRampToValueAtTime(0.0001, s + (i === 3 ? 0.55 : 0.12));
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 2600;
          for (const det of [-6, 0, 7]) {
            const o = ctx.createOscillator();
            o.type = 'sawtooth';
            o.frequency.value = f0 * pitch;
            o.detune.value = det;
            o.connect(lp);
            o.start(s);
            o.stop(s + 0.6);
          }
          lp.connect(g).connect(out);
        });
        return 0.7;
      }
      case 'bacan': {
        // "¡Ba-cán!": two vowel-like syllables (formant bandpass pairs), the second one higher.
        const syl = (start: number, f0: number, f1: number, f2: number, len: number): void => {
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(f0 * pitch, start);
          o.frequency.linearRampToValueAtTime(f0 * pitch * 1.12, start + len);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, start);
          g.gain.exponentialRampToValueAtTime(0.35 * gainMul, start + 0.02);
          g.gain.setValueAtTime(0.35 * gainMul, start + len * 0.7);
          g.gain.exponentialRampToValueAtTime(0.0001, start + len);
          for (const [freq, q] of [[f1, 7], [f2, 9]] as const) {
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = freq;
            bp.Q.value = q;
            o.connect(bp).connect(g);
          }
          g.connect(out);
          o.start(start);
          o.stop(start + len + 0.02);
        };
        syl(t, 200, 800, 1250, 0.13);
        syl(t + 0.16, 250, 760, 1180, 0.26);
        return 0.5;
      }
      case 'jefe': {
        // Boss intro: low brass swell and a timpani roll. Impossible to miss with eyes closed.
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.28 * gainMul, t + 0.6);
        g.gain.setValueAtTime(0.28 * gainMul, t + 1.3);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(180, t);
        lp.frequency.exponentialRampToValueAtTime(1400, t + 1.1);
        for (const f0 of [55, 55.4, 82.4]) {
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.value = f0 * pitch;
          o.connect(lp);
          o.start(t);
          o.stop(t + 2.1);
        }
        lp.connect(g).connect(out);
        for (let i = 0; i < 14; i++) {
          const s = t + i * 0.09;
          const to = ctx.createOscillator();
          to.type = 'sine';
          to.frequency.setValueAtTime(110 * pitch, s);
          to.frequency.exponentialRampToValueAtTime(60 * pitch, s + 0.12);
          const tg = ctx.createGain();
          tg.gain.setValueAtTime(0.0001, s);
          tg.gain.exponentialRampToValueAtTime((0.12 + i * 0.012) * gainMul, s + 0.005);
          tg.gain.exponentialRampToValueAtTime(0.0001, s + 0.14);
          to.connect(tg).connect(out);
          to.start(s);
          to.stop(s + 0.16);
        }
        return 2.1;
      }
      case 'elite': {
        // Gong: inharmonic partials with a long tail.
        const g = ctx.createGain();
        env(g, 0.18, 0.004, 1.5);
        for (const f0 of [170, 285, 417, 560]) {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = f0 * pitch;
          o.connect(g);
          o.start(t);
          o.stop(t + 1.6);
        }
        g.connect(out);
        return 1.6;
      }
      case 'latido': {
        // Heartbeat: low health. Two soft thumps.
        for (const s of [0, 0.17]) {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.setValueAtTime(75, t + s);
          o.frequency.exponentialRampToValueAtTime(42, t + s + 0.14);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t + s);
          g.gain.exponentialRampToValueAtTime((s === 0 ? 0.5 : 0.35) * gainMul, t + s + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + s + 0.16);
          o.connect(g).connect(out);
          o.start(t + s);
          o.stop(t + s + 0.18);
        }
        return 0.4;
      }
      case 'zona': {
        // New zone: three rising quena-like notes with vibrato.
        [392, 523.3, 659.3].forEach((f0, i) => {
          const s = t + i * 0.22;
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = f0 * pitch;
          const vib = ctx.createOscillator();
          vib.frequency.value = 5.5;
          const vg = ctx.createGain();
          vg.gain.value = 5;
          vib.connect(vg).connect(o.frequency);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, s);
          g.gain.exponentialRampToValueAtTime(0.14 * gainMul, s + 0.05);
          g.gain.exponentialRampToValueAtTime(0.0001, s + (i === 2 ? 0.6 : 0.3));
          o.connect(g).connect(out);
          o.start(s);
          vib.start(s);
          o.stop(s + 0.65);
          vib.stop(s + 0.65);
        });
        return 1.3;
      }
      case 'alarma': {
        // "¡Te rodearon!": a rising two-tone siren, three times.
        const o = ctx.createOscillator();
        o.type = 'square';
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        for (let i = 0; i < 3; i++) {
          const s = t + i * 0.26;
          o.frequency.setValueAtTime(466 * pitch, s);
          o.frequency.setValueAtTime(622 * pitch, s + 0.13);
          g.gain.exponentialRampToValueAtTime(0.09 * gainMul, s + 0.01);
          g.gain.setValueAtTime(0.09 * gainMul, s + 0.22);
          g.gain.exponentialRampToValueAtTime(0.0001, s + 0.25);
        }
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + 0.8);
        return 0.8;
      }
      case 'evolucion': {
        // Evolution fanfare: a rising major arpeggio with a shimmering top.
        [262, 330, 392, 523, 659, 784, 1047].forEach((f0, i) => {
          const s = t + i * 0.075;
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.value = f0 * pitch;
          const o2 = ctx.createOscillator();
          o2.type = 'sine';
          o2.frequency.value = f0 * pitch * 2;
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 3200;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, s);
          g.gain.exponentialRampToValueAtTime(0.09 * gainMul, s + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, s + (i === 6 ? 1 : 0.35));
          o.connect(lp);
          o2.connect(lp);
          lp.connect(g).connect(out);
          o.start(s);
          o2.start(s);
          o.stop(s + 1.05);
          o2.stop(s + 1.05);
        });
        return 1.6;
      }
      case 'victoria': {
        // Victory: a bright cueca-flavoured fanfare in D major.
        [[587, 0], [740, 0.16], [880, 0.32], [1175, 0.48], [880, 0.8], [1175, 0.96], [1480, 1.12], [1175, 1.5]].forEach(([f0, off], i, all) => {
          const s = t + (off ?? 0);
          const o = ctx.createOscillator();
          o.type = 'square';
          o.frequency.value = (f0 ?? 440) * pitch;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, s);
          g.gain.exponentialRampToValueAtTime(0.09 * gainMul, s + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, s + (i === all.length - 1 ? 1 : 0.28));
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 2800;
          o.connect(lp).connect(g).connect(out);
          o.start(s);
          o.stop(s + 1.1);
        });
        return 2.6;
      }
      case 'derrota': {
        // "Se te fue la micro": three falling wah-wah notes, cumbia style.
        [330, 294, 247].forEach((f0, i) => {
          const s = t + i * 0.3;
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(f0 * pitch, s);
          o.frequency.exponentialRampToValueAtTime(f0 * pitch * 0.93, s + (i === 2 ? 0.9 : 0.28));
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(500, s);
          lp.frequency.linearRampToValueAtTime(1500, s + 0.15);
          lp.frequency.linearRampToValueAtTime(500, s + 0.28);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, s);
          g.gain.exponentialRampToValueAtTime(0.14 * gainMul, s + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, s + (i === 2 ? 1 : 0.3));
          o.connect(lp).connect(g).connect(out);
          o.start(s);
          o.stop(s + 1.05);
        });
        return 1.9;
      }
      case 'pajaro': {
        for (const [s, f0] of [[0, 3100], [0.13, 3700]] as const) {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.setValueAtTime(f0 * pitch, t + s);
          o.frequency.exponentialRampToValueAtTime(f0 * pitch * 1.35, t + s + 0.07);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t + s);
          g.gain.exponentialRampToValueAtTime(0.05 * gainMul, t + s + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + s + 0.09);
          o.connect(g).connect(out);
          o.start(t + s);
          o.stop(t + s + 0.1);
        }
        return 0.3;
      }
      case 'ladridoLejano': {
        // A dog barking far away: dull, filtered, with a long echo.
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(190 * pitch, t);
        o.frequency.linearRampToValueAtTime(340 * pitch, t + 0.04);
        o.frequency.exponentialRampToValueAtTime(170 * pitch, t + 0.22);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 650;
        bp.Q.value = 2;
        const g = ctx.createGain();
        env(g, 0.2, 0.01, 0.22);
        const d = ctx.createDelay();
        d.delayTime.value = 0.28;
        const fb = ctx.createGain();
        fb.gain.value = 0.35;
        o.connect(bp).connect(g);
        g.connect(out);
        g.connect(d);
        d.connect(fb).connect(d);
        d.connect(out);
        o.start(t);
        o.stop(t + 0.3);
        return 1.2;
      }
      case 'moneda': {
        const o = ctx.createOscillator();
        o.type = 'square';
        o.frequency.setValueAtTime(988 * pitch, t);
        o.frequency.setValueAtTime(1319 * pitch, t + 0.05);
        const g = ctx.createGain();
        env(g, 0.045, 0.002, 0.11);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + 0.12);
        return 0.12;
      }
      case 'ruleta': {
        const src = this.noiseSource(ctx);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 2400 * pitch;
        f.Q.value = 4;
        const g = ctx.createGain();
        env(g, 0.3, 0.001, 0.03);
        src.connect(f).connect(g).connect(out);
        src.start(t, Math.random());
        src.stop(t + 0.04);
        return 0.04;
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
