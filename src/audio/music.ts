import type * as ToneNS from 'tone';
import type { AudioEngine, ToneModule } from './engine.ts';
import {
  BOSS,
  BOSS_DRUMS_6,
  BOSS_DRUMS_8,
  layerTargets,
  MUSICA,
  parseSteps,
  type InstId,
  type LayerId,
  type MusicSet,
  type SetId,
  type StepEvent,
} from './musicData.ts';

/** Seconds to crossfade between zones (GDD "Música"). */
export const CROSSFADE = 2;
/** How far ahead notes are scheduled (s). */
const LOOKAHEAD = 0.35;
/** The music sits under the effects. */
const MUSIC_LEVEL = 0.4;

type AmbientId = 'ladridoLejano' | 'pajaro' | 'bocina';

interface Voice {
  /** accent: 1 on strong steps, ~0.55 on weak ones (hi-hats, güira). */
  fire(notes: string[], duration: number, time: number, accent: number): void;
  nodes: ToneNS.ToneAudioNode[];
}

/** Builds one instrument (all synthesised: no samples, so the game stays tiny). */
function makeVoice(T: ToneModule, inst: InstId, dest: ToneNS.InputNode): Voice {
  const nodes: ToneNS.ToneAudioNode[] = [];
  const keep = <N extends ToneNS.ToneAudioNode>(n: N): N => {
    nodes.push(n);
    return n;
  };
  const chain = (...n: ToneNS.ToneAudioNode[]): void => {
    n.forEach(keep);
    for (let i = 0; i < n.length - 1; i++) n[i]?.connect(n[i + 1] as ToneNS.InputNode);
    n[n.length - 1]?.connect(dest);
  };

  switch (inst) {
    case 'bombo': {
      const s = new T.MembraneSynth({ pitchDecay: 0.05, octaves: 4, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 } });
      chain(s);
      return { nodes, fire: (_n, _d, t, a) => s.triggerAttackRelease('A1', 0.2, t, 0.9 * a) };
    }
    case 'timbal': {
      const s = new T.MembraneSynth({ pitchDecay: 0.08, octaves: 2, envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.2 } });
      chain(s);
      return { nodes, fire: (_n, _d, t, a) => s.triggerAttackRelease('D2', 0.3, t, 0.9 * a) };
    }
    case 'caja': {
      const s = new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0 } });
      chain(s, new T.Filter(1400, 'highpass'));
      return { nodes, fire: (_n, _d, t, a) => s.triggerAttackRelease(0.08, t, 0.8 * a) };
    }
    case 'guira': {
      const s = new T.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.04, sustain: 0 } });
      chain(s, new T.Filter(6500, 'highpass'));
      return { nodes, fire: (_n, _d, t, a) => s.triggerAttackRelease(0.03, t, a) };
    }
    case 'palma': {
      const s = new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.07, sustain: 0 } });
      chain(s, new T.Filter(1900, 'bandpass'));
      return { nodes, fire: (_n, _d, t, a) => s.triggerAttackRelease(0.05, t, 0.9 * a) };
    }
    case 'bajo': {
      const s = new T.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.25 } });
      chain(s, new T.Filter(700, 'lowpass'));
      return { nodes, fire: (n, d, t) => s.triggerAttackRelease(n[0] ?? 'A2', d, t, 0.9) };
    }
    case 'pad': {
      const s = new T.PolySynth(T.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.9, decay: 0.3, sustain: 0.8, release: 1.6 } });
      s.maxPolyphony = 6;
      chain(s, new T.Filter(1600, 'lowpass'));
      return { nodes, fire: (n, d, t) => s.triggerAttackRelease(n, d, t, 0.7) };
    }
    case 'cuerdas': {
      const s = new T.PolySynth(T.Synth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 25 },
        envelope: { attack: 0.6, decay: 0.4, sustain: 0.85, release: 1.2 },
      });
      s.maxPolyphony = 6;
      chain(s, new T.Filter(1900, 'lowpass'));
      return { nodes, fire: (n, d, t) => s.triggerAttackRelease(n, d, t, 0.7) };
    }
    case 'charango': {
      const s = new T.PluckSynth({ attackNoise: 1, dampening: 5200, resonance: 0.96 });
      chain(s);
      return { nodes, fire: (n, _d, t) => s.triggerAttack(n[0] ?? 'A4', t) };
    }
    case 'guitarra': {
      const s = new T.PolySynth(T.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.004, decay: 0.45, sustain: 0.05, release: 0.6 } });
      s.maxPolyphony = 8;
      chain(s, new T.Filter(3200, 'lowpass'));
      return { nodes, fire: (n, d, t) => s.triggerAttackRelease(n, Math.min(d, 1.2), t, 0.8) };
    }
    case 'acordeon': {
      const s = new T.PolySynth(T.Synth, {
        oscillator: { type: 'fatsawtooth', count: 2, spread: 14 },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.12 },
      });
      s.maxPolyphony = 6;
      chain(s, new T.Filter(2500, 'lowpass'));
      return { nodes, fire: (n, d, t) => s.triggerAttackRelease(n, d, t, 0.6) };
    }
    case 'quena': {
      const s = new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.08, decay: 0.1, sustain: 0.8, release: 0.3 } });
      chain(s, new T.Vibrato(5.2, 0.1));
      return { nodes, fire: (n, d, t) => s.triggerAttackRelease(n[0] ?? 'E5', d, t, 0.8) };
    }
    case 'campana': {
      const s = new T.PolySynth(T.FMSynth, {
        harmonicity: 3.01,
        modulationIndex: 10,
        envelope: { attack: 0.001, decay: 1.4, sustain: 0, release: 1 },
        modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.4 },
      });
      s.maxPolyphony = 6;
      chain(s);
      return { nodes, fire: (n, d, t) => s.triggerAttackRelease(n, Math.min(d, 1.5), t, 0.6) };
    }
  }
}

interface ActiveSet {
  def: MusicSet;
  out: ToneNS.Gain;
  layers: Record<LayerId, ToneNS.Gain>;
  voices: Voice[];
  parsed: (StepEvent | null)[][];
  total: number;
  step: number;
  /** Audio-clock time of the next step. */
  next: number;
  /** Tempo multiplier (1 normally, +12 % in boss fights), eased toward `tempoTarget`. */
  tempo: number;
  tempoTarget: number;
  boss: { gain: ToneNS.Gain; drums: Voice; drone: Voice; pattern: string[] };
  nodes: ToneNS.ToneAudioNode[];
}

/**
 * The music player (GDD "Música"): composed in code, synthesised with Tone.js.
 *
 *  - Each zone has a loop in 3 layers: the base always plays, the rhythm joins
 *    from 8 enemies on screen and the melody from 35.
 *  - Changing zone crossfades the old and the new set over 2 s.
 *  - Boss fights add heavy drums and a low drone, and speed the tempo up.
 *  - Cielo del Dieciocho swaps in 20 s of cueca (6/8 with palmas).
 *  - The pause and the card screens muffle the music.
 *
 * Notes are scheduled ahead of time on the audio clock by a small timer, so
 * the beat never wobbles with the frame rate, and every set has its own tempo.
 */
export class Music {
  private readonly engine: AudioEngine;
  private tone: ToneModule | null = null;
  private master: ToneNS.Gain | null = null;
  private lowpass: ToneNS.Filter | null = null;
  private current: ActiveSet | null = null;
  private readonly fading: ActiveSet[] = [];
  private timer = 0;
  private failed = false;
  private nextAmbient = 0;

  private want: SetId | null = null;
  private boss = false;
  private enemies = 0;
  private volume = 0.6;
  private cuecaUntil = 0;
  private cuecaBack: SetId | null = null;

  /** Neighbourhood background sounds for the menu (the owner plays them as effects). */
  onAmbient: ((id: AmbientId, pan: number) => void) | null = null;

  constructor(engine: AudioEngine) {
    this.engine = engine;
    engine.onReady(() => this.setup());
  }

  private setup(): void {
    const T = this.engine.tone;
    const out = this.engine.musicOut;
    if (!T || !out) return;
    this.tone = T;
    this.master = new T.Gain(1);
    this.lowpass = new T.Filter(20000, 'lowpass');
    this.master.connect(this.lowpass);
    this.lowpass.connect(out);
    out.gain.value = this.volume * MUSIC_LEVEL;
    this.timer = window.setInterval(() => this.tick(), 40);
    this.apply();
  }

  // ------------------------------------------------------------------ control

  /** The set that should be playing (null = silence). Safe to call before the audio is unlocked. */
  setScene(id: SetId | null): void {
    // A running cueca overlay remembers where to return to.
    if (this.cuecaBack !== null && id !== 'cueca') {
      this.cuecaBack = id;
      return;
    }
    this.want = id;
    this.apply();
  }

  setBoss(on: boolean): void {
    this.boss = on;
    this.refreshLayers();
  }

  /** Enemies on screen: decides how many layers play. */
  setIntensity(enemies: number): void {
    this.enemies = enemies;
    this.refreshLayers();
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.engine.musicOut) this.engine.musicOut.gain.rampTo(v * MUSIC_LEVEL, 0.1);
  }

  /** Pause and level-up screens: the music goes behind a door. */
  setMuffled(on: boolean): void {
    this.lowpass?.frequency.rampTo(on ? 450 : 20000, 0.25);
  }

  /** Cielo del Dieciocho: `seconds` of cueca in 6/8 with palmas, then back to the zone. */
  startCueca(seconds: number): void {
    const ctx = this.engine.ctx;
    if (!ctx || this.cuecaBack !== null) return;
    this.cuecaBack = this.want;
    this.cuecaUntil = ctx.currentTime + seconds;
    this.want = 'cueca';
    this.apply();
  }

  /** Fades out everything. */
  stop(): void {
    this.setScene(null);
  }

  /** What is playing (tests and F1). */
  state(): { set: SetId | null; boss: boolean; layers: Record<LayerId, number>; cueca: boolean } {
    const g = (l: LayerId): number => this.current?.layers[l].gain.value ?? 0;
    return { set: this.current?.def.id ?? null, boss: this.boss, layers: { base: g('base'), ritmo: g('ritmo'), melodia: g('melodia') }, cueca: this.cuecaBack !== null };
  }

  // ------------------------------------------------------------------ internals

  private apply(): void {
    const T = this.tone;
    if (!T || !this.master) return;
    if (this.current?.def.id === this.want) {
      this.refreshLayers();
      return;
    }
    const old = this.current;
    if (old) {
      old.out.gain.rampTo(0, CROSSFADE);
      this.fading.push(old);
      window.setTimeout(() => this.release(old), (CROSSFADE + 1.5) * 1000);
    }
    this.current = null;
    if (!this.want) return;
    const next = this.build(T, MUSICA[this.want]);
    this.current = next;
    next.out.gain.rampTo(1, CROSSFADE);
    this.refreshLayers();
  }

  private release(set: ActiveSet): void {
    const i = this.fading.indexOf(set);
    if (i >= 0) this.fading.splice(i, 1);
    for (const n of set.nodes) {
      try {
        n.dispose();
      } catch {
        // Already disposed.
      }
    }
  }

  private refreshLayers(): void {
    const set = this.current;
    if (!set) return;
    // The cueca is a show of its own: palmas and melody always play, whatever is on screen.
    const target = layerTargets(set.def.id === 'cueca' ? 99 : this.enemies, this.boss);
    for (const l of ['base', 'ritmo', 'melodia'] as const) set.layers[l].gain.rampTo(target[l], 1.2);
    set.boss.gain.gain.rampTo(this.boss ? 1 : 0, 0.6);
    set.tempoTarget = this.boss ? BOSS.tempoMult : 1;
  }

  private build(T: ToneModule, def: MusicSet): ActiveSet {
    const nodes: ToneNS.ToneAudioNode[] = [];
    const keep = <N extends ToneNS.ToneAudioNode>(n: N): N => {
      nodes.push(n);
      return n;
    };
    const out = keep(new T.Gain(0));
    out.connect(this.master as ToneNS.Gain);
    const layers = {
      base: keep(new T.Gain(0)),
      ritmo: keep(new T.Gain(0)),
      melodia: keep(new T.Gain(0)),
    };
    for (const l of Object.values(layers)) l.connect(out);

    const voices = def.tracks.map((tr) => {
      const trackGain = keep(new T.Gain(tr.vel ?? 0.7));
      trackGain.connect(layers[tr.layer]);
      const v = makeVoice(T, tr.inst, trackGain);
      nodes.push(...v.nodes);
      return v;
    });

    // Boss extras: heavy drums + a low drone on the tonic.
    const bossGain = keep(new T.Gain(0));
    bossGain.connect(out);
    const drums = makeVoice(T, 'timbal', bossGain);
    const drone = makeVoice(T, 'bajo', bossGain);
    nodes.push(...drums.nodes, ...drone.nodes);

    // Ambience (rain, wind) is continuous and ignores the layers.
    if (def.ambience === 'lluvia') {
      const n = keep(new T.Noise('pink'));
      const f = keep(new T.Filter(3500, 'bandpass'));
      const g = keep(new T.Gain(0.1));
      n.connect(f);
      f.connect(g);
      g.connect(out);
      n.start();
    } else if (def.ambience === 'viento') {
      const n = keep(new T.Noise('brown'));
      const f = keep(new T.AutoFilter({ frequency: 0.07, baseFrequency: 260, octaves: 3 }).start());
      const g = keep(new T.Gain(0.22));
      n.connect(f);
      f.connect(g);
      g.connect(out);
      n.start();
    }

    const ctx = this.engine.ctx as AudioContext;
    return {
      def,
      out,
      layers,
      voices,
      parsed: def.tracks.map((t) => parseSteps(t.steps)),
      total: def.stepsPerBar * def.bars,
      step: 0,
      next: ctx.currentTime + 0.12,
      tempo: 1,
      tempoTarget: 1,
      boss: { gain: bossGain, drums, drone, pattern: (def.stepsPerBar === 6 ? BOSS_DRUMS_6 : BOSS_DRUMS_8).split(' ') },
      nodes,
    };
  }

  private playStep(set: ActiveSet): void {
    const stepDur = 60 / (set.def.bpm * set.tempo) / 2;
    const t = set.next;
    const s = set.step;
    set.def.tracks.forEach((_tr, i) => {
      const ev = set.parsed[i]?.[s];
      if (!ev) return;
      set.voices[i]?.fire(ev.notes, ev.len * stepDur * 0.95, t, s % 2 === 0 ? 1 : 0.55);
    });
    const inBar = s % set.def.stepsPerBar;
    if (set.boss.pattern[inBar] === 'x') set.boss.drums.fire([], 0.2, t, 1);
    if (inBar === 0) set.boss.drone.fire([set.def.root], set.def.stepsPerBar * stepDur * 0.98, t, 1);
    set.next += stepDur;
    set.step = (s + 1) % set.total;
    set.tempo += (set.tempoTarget - set.tempo) * 0.04;
  }

  private tick(): void {
    const ctx = this.engine.ctx;
    if (!ctx || this.failed) return;
    try {
      const now = ctx.currentTime;
      if (this.cuecaBack !== null && now >= this.cuecaUntil) {
        const back = this.cuecaBack;
        this.cuecaBack = null;
        this.want = back;
        this.apply();
      }
      for (const set of this.current ? [this.current, ...this.fading] : this.fading) {
        // After a long suspension (hidden tab) skip ahead instead of replaying the backlog.
        if (set.next < now - 0.5) set.next = now + 0.05;
        let guard = 0;
        while (set.next < now + LOOKAHEAD && guard++ < 16) this.playStep(set);
      }
      if (this.current?.def.ambience === 'barrio' && this.onAmbient && performance.now() > this.nextAmbient) {
        this.nextAmbient = performance.now() + 3500 + Math.random() * 5000;
        const r = Math.random();
        this.onAmbient(r < 0.4 ? 'ladridoLejano' : r < 0.85 ? 'pajaro' : 'bocina', Math.random() * 1.6 - 0.8);
      }
    } catch (err) {
      // A music bug must never take the game down: report once and stay silent.
      this.failed = true;
      console.error('Música desactivada por un error:', err);
    }
  }

  dispose(): void {
    window.clearInterval(this.timer);
    if (this.current) this.release(this.current);
    for (const f of [...this.fading]) this.release(f);
    this.current = null;
  }
}
