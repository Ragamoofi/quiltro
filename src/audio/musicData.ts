/**
 * The music, written as text (GDD "Música"): each zone has a loop of 4 bars
 * in 3 layers (base, ritmo, melodía) that join as the crowd grows. No audio
 * code here, so the scores can be validated by the tests.
 *
 * A track is a string of space-separated steps (one 8th note each):
 *   `.`            rest
 *   `x`            a hit (drums)
 *   `A3`           a note;   `A3+C4+E4` a chord;   `A3:4` lasts 4 steps
 */
export type InstId =
  | 'pad'
  | 'cuerdas'
  | 'bajo'
  | 'bombo'
  | 'timbal'
  | 'caja'
  | 'guira'
  | 'palma'
  | 'charango'
  | 'guitarra'
  | 'acordeon'
  | 'quena'
  | 'campana';

export type LayerId = 'base' | 'ritmo' | 'melodia';

export interface Track {
  inst: InstId;
  layer: LayerId;
  steps: string;
  /** 0..1 loudness inside the mix. */
  vel?: number;
}

export type AmbienceId = 'lluvia' | 'viento' | 'barrio';

export interface MusicSet {
  id: SetId;
  /** Quarter-note tempo; every step is an 8th note. */
  bpm: number;
  /** 8 for 4/4, 6 for the cueca's 6/8. */
  stepsPerBar: number;
  bars: number;
  /** Tonic, used for the boss drone. */
  root: string;
  tracks: Track[];
  ambience?: AmbienceId;
}

export type SetId = 'menu' | 'norte' | 'centro' | 'sur' | 'patagonia' | 'antartica' | 'cueca';

/** Joins bars written on separate lines. */
const bars = (...b: string[]): string => b.join(' ');

export const MUSICA: Readonly<Record<SetId, MusicSet>> = {
  // Charango and bombo: slow and mysterious.
  norte: {
    id: 'norte',
    bpm: 74,
    stepsPerBar: 8,
    bars: 4,
    root: 'A1',
    ambience: 'viento',
    tracks: [
      { inst: 'cuerdas', layer: 'base', vel: 0.5, steps: bars('A3+C4+E4:8 . . . . . . .', 'A3+C4+E4:8 . . . . . . .', 'F3+A3+C4:8 . . . . . . .', 'E3+G#3+B3:8 . . . . . . .') },
      { inst: 'bajo', layer: 'base', vel: 0.7, steps: bars('A2:8 . . . . . . .', 'A2:8 . . . . . . .', 'F2:8 . . . . . . .', 'E2:8 . . . . . . .') },
      { inst: 'bombo', layer: 'ritmo', vel: 0.9, steps: bars('x . . x . . x .', 'x . . x . . x .', 'x . . x . . x .', 'x . . x . x x x') },
      { inst: 'charango', layer: 'ritmo', vel: 0.6, steps: bars('A4 C5 E5 C5 A4 C5 E5 C5', 'A4 C5 E5 C5 A4 C5 E5 C5', 'F4 A4 C5 A4 F4 A4 C5 A4', 'E4 G#4 B4 G#4 E4 G#4 B4 G#4') },
      { inst: 'quena', layer: 'melodia', vel: 0.7, steps: bars('E5:2 . . G5:2 . A5:3 . .', 'G5:2 . E5:2 . . . . .', 'F5:2 . . A5:2 . C6:3 . .', 'B5:2 . G#5:2 . E5:4 . . .') },
    ],
  },
  // Accordion cumbia: cheerful and fast.
  centro: {
    id: 'centro',
    bpm: 94,
    stepsPerBar: 8,
    bars: 4,
    root: 'C2',
    tracks: [
      { inst: 'pad', layer: 'base', vel: 0.35, steps: bars('C4+E4+G4:8 . . . . . . .', 'F3+A3+C4:8 . . . . . . .', 'G3+B3+D4:8 . . . . . . .', 'C4+E4+G4:8 . . . . . . .') },
      { inst: 'bajo', layer: 'base', vel: 0.8, steps: bars('C2 . . C2 . G2 . .', 'F2 . . F2 . C3 . .', 'G2 . . G2 . D3 . .', 'C2 . . C2 . G2 C2 .') },
      { inst: 'bombo', layer: 'ritmo', vel: 0.8, steps: bars('x . . . x . . .', 'x . . . x . . .', 'x . . . x . . .', 'x . . . x . x .') },
      { inst: 'caja', layer: 'ritmo', vel: 0.6, steps: bars('. . x . . . x x', '. . x . . . x x', '. . x . . . x x', '. . x . . x x x') },
      { inst: 'guira', layer: 'ritmo', vel: 0.5, steps: bars('x x x x x x x x', 'x x x x x x x x', 'x x x x x x x x', 'x x x x x x x x') },
      { inst: 'guitarra', layer: 'ritmo', vel: 0.5, steps: bars('. C4+E4+G4 . C4+E4+G4 . C4+E4+G4 . C4+E4+G4', '. F4+A4+C5 . F4+A4+C5 . F4+A4+C5 . F4+A4+C5', '. G4+B4+D5 . G4+B4+D5 . G4+B4+D5 . G4+B4+D5', '. C4+E4+G4 . C4+E4+G4 . C4+E4+G4 . C4+E4+G4') },
      { inst: 'acordeon', layer: 'melodia', vel: 0.65, steps: bars('E5 . G5 E5 . C5 . .', 'F5 . A5 F5 . C5 . .', 'G5 . B5 G5 . D5 . .', 'E5 G5 E5 C5 D5 . C5 .') },
    ],
  },
  // Guitar and rain: melancholic.
  sur: {
    id: 'sur',
    bpm: 62,
    stepsPerBar: 8,
    bars: 4,
    root: 'E1',
    ambience: 'lluvia',
    tracks: [
      { inst: 'cuerdas', layer: 'base', vel: 0.45, steps: bars('E3+G3+B3:8 . . . . . . .', 'C3+E3+G3:8 . . . . . . .', 'G3+B3+D4:8 . . . . . . .', 'D3+F#3+A3:8 . . . . . . .') },
      { inst: 'bajo', layer: 'base', vel: 0.6, steps: bars('E2:8 . . . . . . .', 'C2:8 . . . . . . .', 'G2:8 . . . . . . .', 'D2:8 . . . . . . .') },
      { inst: 'guitarra', layer: 'ritmo', vel: 0.65, steps: bars('E3 B3 G4 B3 E3 B3 G4 B3', 'C3 G3 E4 G3 C3 G3 E4 G3', 'G2 D3 B3 D3 G2 D3 B3 D3', 'D3 A3 F#4 A3 D3 A3 F#4 A3') },
      { inst: 'guitarra', layer: 'melodia', vel: 0.7, steps: bars('B4:3 . . G4:2 . E4:3 . .', 'C5:3 . . B4:2 . G4:3 . .', 'D5:3 . . B4:2 . G4:3 . .', 'A4:3 . . F#4:2 . D4:3 . .') },
    ],
  },
  // Strings and wind: epic.
  patagonia: {
    id: 'patagonia',
    bpm: 82,
    stepsPerBar: 8,
    bars: 4,
    root: 'D1',
    ambience: 'viento',
    tracks: [
      { inst: 'cuerdas', layer: 'base', vel: 0.55, steps: bars('D3+F3+A3:8 . . . . . . .', 'A#2+D3+F3:8 . . . . . . .', 'F3+A3+C4:8 . . . . . . .', 'C3+E3+G3:8 . . . . . . .') },
      { inst: 'bajo', layer: 'base', vel: 0.8, steps: bars('D2:8 . . . . . . .', 'A#1:8 . . . . . . .', 'F2:8 . . . . . . .', 'C2:8 . . . . . . .') },
      { inst: 'timbal', layer: 'ritmo', vel: 0.9, steps: bars('x . . . x . x .', 'x . . . x . x .', 'x . . . x . x .', 'x . x . x x x x') },
      { inst: 'cuerdas', layer: 'melodia', vel: 0.7, steps: bars('D5:3 . . A4 . D5:3 . .', 'F5:3 . . D5 . A#4:3 . .', 'A5:3 . . F5 . C5:3 . .', 'G5:2 . E5:2 . C5:4 . . .') },
    ],
  },
  // Ice and aurora: glassy bells over a slow pad.
  antartica: {
    id: 'antartica',
    bpm: 66,
    stepsPerBar: 8,
    bars: 4,
    root: 'E1',
    ambience: 'viento',
    tracks: [
      { inst: 'pad', layer: 'base', vel: 0.5, steps: bars('E3+G3+B3+F#4:8 . . . . . . .', 'C3+E3+G3+B3:8 . . . . . . .', 'G3+B3+D4+F#4:8 . . . . . . .', 'D3+F#3+A3+C4:8 . . . . . . .') },
      { inst: 'bajo', layer: 'base', vel: 0.5, steps: bars('E2:8 . . . . . . .', 'C2:8 . . . . . . .', 'G2:8 . . . . . . .', 'D2:8 . . . . . . .') },
      { inst: 'campana', layer: 'ritmo', vel: 0.5, steps: bars('B5 . . E6 . . G6 .', 'G5 . . B5 . . E6 .', 'D6 . . B5 . . G5 .', 'A5 . . D6 . . F#6 .') },
      { inst: 'campana', layer: 'melodia', vel: 0.6, steps: bars('E6:4 . . . B5:4 . . .', 'G6:4 . . . E6:4 . . .', 'D6:4 . . . G5:4 . . .', 'F#6:4 . . . A5:4 . . .') },
    ],
  },
  // Menu: calm guitar with the neighbourhood in the background.
  menu: {
    id: 'menu',
    bpm: 70,
    stepsPerBar: 8,
    bars: 4,
    root: 'C2',
    ambience: 'barrio',
    tracks: [
      { inst: 'pad', layer: 'base', vel: 0.3, steps: bars('C4+E4+G4:8 . . . . . . .', 'A3+C4+E4:8 . . . . . . .', 'F3+A3+C4:8 . . . . . . .', 'G3+B3+D4:8 . . . . . . .') },
      { inst: 'bajo', layer: 'base', vel: 0.5, steps: bars('C2:8 . . . . . . .', 'A1:8 . . . . . . .', 'F1:8 . . . . . . .', 'G1:8 . . . . . . .') },
      { inst: 'guitarra', layer: 'ritmo', vel: 0.7, steps: bars('C3 G3 C4 E4 C4 G3 C4 E4', 'A2 E3 A3 C4 A3 E3 A3 C4', 'F2 C3 F3 A3 F3 C3 F3 A3', 'G2 D3 G3 B3 G3 D3 G3 B3') },
      { inst: 'quena', layer: 'melodia', vel: 0.5, steps: bars('E5:3 . . D5 . C5:3 . .', 'C5:3 . . E5 . A4:3 . .', 'A4:3 . . C5 . F4:3 . .', 'D5:3 . . B4 . G4:3 . .') },
    ],
  },
  // 20 seconds of cueca in 6/8 while Cielo del Dieciocho lasts: palmas and guitar.
  cueca: {
    id: 'cueca',
    bpm: 150,
    stepsPerBar: 6,
    bars: 4,
    root: 'D2',
    tracks: [
      { inst: 'bajo', layer: 'base', vel: 0.8, steps: bars('D2 . . D3 . .', 'A1 . . A2 . .', 'D2 . . D3 . .', 'A1 . . A2 . .') },
      { inst: 'palma', layer: 'ritmo', vel: 0.9, steps: bars('x . x . x x', 'x . x . x x', 'x . x . x x', 'x . x . x x') },
      { inst: 'guitarra', layer: 'ritmo', vel: 0.6, steps: bars('D4+F#4+A4 . . D4+F#4+A4 . D4+F#4+A4', 'A3+C#4+E4 . . A3+C#4+E4 . A3+C#4+E4', 'D4+F#4+A4 . . D4+F#4+A4 . D4+F#4+A4', 'A3+C#4+E4 . . A3+C#4+E4 . A3+C#4+E4') },
      { inst: 'acordeon', layer: 'melodia', vel: 0.7, steps: bars('F#5:2 . A5:2 . D6:2 .', 'C#6:2 . A5:2 . E5:2 .', 'D5:2 . F#5:2 . A5:2 .', 'E5:2 . C#5:2 . A4:2 .') },
    ],
  },
};

export const SET_IDS = Object.keys(MUSICA) as SetId[];

// ------------------------------------------------------------------- parsing

export interface StepEvent {
  notes: string[];
  /** Length in steps (1 by default). */
  len: number;
}

const NOTE = /^[A-G][#b]?-?\d$/;

/** Parses a track string into one entry per step (null = rest). */
export function parseSteps(steps: string): (StepEvent | null)[] {
  return steps
    .trim()
    .split(/\s+/)
    .map((tok): StepEvent | null => {
      if (tok === '.') return null;
      const [what = '', len] = tok.split(':');
      const notes = what === 'x' ? ['x'] : what.split('+');
      return { notes, len: len ? Number(len) : 1 };
    });
}

/** Problems in a score; empty means it is well formed. */
export function validateSet(set: MusicSet): string[] {
  const errors: string[] = [];
  const total = set.stepsPerBar * set.bars;
  if (!NOTE.test(set.root)) errors.push(`${set.id}: raíz inválida ${set.root}`);
  for (const layer of ['base', 'ritmo', 'melodia'] as const) {
    if (!set.tracks.some((t) => t.layer === layer)) errors.push(`${set.id}: falta la capa ${layer}`);
  }
  set.tracks.forEach((t, i) => {
    const where = `${set.id} pista ${i} (${t.inst})`;
    const steps = parseSteps(t.steps);
    if (steps.length !== total) errors.push(`${where}: ${steps.length} pasos, se esperaban ${total}`);
    steps.forEach((s, n) => {
      if (!s) return;
      if (s.len < 1 || !Number.isInteger(s.len)) errors.push(`${where} paso ${n}: largo inválido`);
      for (const note of s.notes) {
        if (note !== 'x' && !NOTE.test(note)) errors.push(`${where} paso ${n}: nota inválida "${note}"`);
      }
    });
  });
  return errors;
}

/** Which layers play for a number of enemies on screen (0 = only the base). */
export function layerTargets(enemies: number, boss: boolean): Record<LayerId, number> {
  return {
    base: 1,
    ritmo: boss || enemies >= 8 ? 1 : 0,
    melodia: boss || enemies >= 35 ? 1 : 0,
  };
}

/** Zone id → the music set that plays there. */
export function setForZone(zone: string): SetId {
  return zone === 'norte' || zone === 'centro' || zone === 'sur' || zone === 'patagonia' || zone === 'antartica' ? zone : 'norte';
}

/** Boss drone and drums over any set: heavier percussion, a faster tempo (+12 %). */
export const BOSS = { tempoMult: 1.12, drumsHeavy: '. x x . x x . x' };
export const BOSS_DRUMS_6 = 'x . x x . x';
export const BOSS_DRUMS_8 = 'x . x x x . x x';
