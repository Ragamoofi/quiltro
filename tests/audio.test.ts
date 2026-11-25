import { describe, expect, it } from 'vitest';
import { canPlay, LIMITS, MAX_VOICES, MERGE_MS, PRIORITY, type SoundId } from '../src/audio/sfx.ts';
import { BOSS, layerTargets, MUSICA, parseSteps, SET_IDS, setForZone, validateSet } from '../src/audio/musicData.ts';
import { ZONAS } from '../src/data/zonas.ts';

describe('music scores', () => {
  it('every set is well formed (note names, lengths, the three layers)', () => {
    for (const id of SET_IDS) expect(validateSet(MUSICA[id]), id).toEqual([]);
  });

  it('catches mistakes', () => {
    const bad = { ...MUSICA.norte, tracks: [{ inst: 'bajo' as const, layer: 'base' as const, steps: 'A2 . H9 .' }] };
    const errors = validateSet(bad);
    expect(errors.some((e) => e.includes('pasos'))).toBe(true);
    expect(errors.some((e) => e.includes('H9'))).toBe(true);
    expect(errors.some((e) => e.includes('ritmo'))).toBe(true);
  });

  it('parses steps, chords and lengths', () => {
    expect(parseSteps('A3+C4:4 . x')).toEqual([{ notes: ['A3', 'C4'], len: 4 }, null, { notes: ['x'], len: 1 }]);
  });

  it('has music for the menu and every zone of the trip', () => {
    for (const z of ZONAS) expect(SET_IDS).toContain(setForZone(z.id));
    expect(SET_IDS).toContain('menu');
    expect(MUSICA.menu.ambience).toBe('barrio');
  });

  it('follows the GDD styles: tempos, rain in the south, wind in Patagonia', () => {
    // Norte slow, Centro (cumbia) the fastest of the zones, Sur the slowest.
    expect(MUSICA.centro.bpm).toBeGreaterThan(MUSICA.norte.bpm);
    expect(MUSICA.sur.bpm).toBeLessThan(MUSICA.norte.bpm);
    expect(MUSICA.sur.ambience).toBe('lluvia');
    expect(MUSICA.patagonia.ambience).toBe('viento');
    expect(MUSICA.norte.tracks.some((t) => t.inst === 'charango')).toBe(true);
    expect(MUSICA.norte.tracks.some((t) => t.inst === 'bombo')).toBe(true);
    expect(MUSICA.centro.tracks.some((t) => t.inst === 'acordeon')).toBe(true);
    expect(MUSICA.sur.tracks.some((t) => t.inst === 'guitarra')).toBe(true);
    expect(MUSICA.patagonia.tracks.some((t) => t.inst === 'cuerdas')).toBe(true);
  });

  it('the cueca is 6/8 with palmas', () => {
    expect(MUSICA.cueca.stepsPerBar).toBe(6);
    expect(MUSICA.cueca.tracks.some((t) => t.inst === 'palma')).toBe(true);
  });
});

describe('layers follow the crowd', () => {
  it('the base always plays; rhythm from 8 enemies, melody from 35', () => {
    expect(layerTargets(0, false)).toEqual({ base: 1, ritmo: 0, melodia: 0 });
    expect(layerTargets(8, false)).toEqual({ base: 1, ritmo: 1, melodia: 0 });
    expect(layerTargets(35, false)).toEqual({ base: 1, ritmo: 1, melodia: 1 });
  });

  it('a boss fight brings everything in, even with an empty screen', () => {
    expect(layerTargets(0, true)).toEqual({ base: 1, ritmo: 1, melodia: 1 });
    expect(BOSS.tempoMult).toBeGreaterThan(1);
  });
});

describe('mix rules (GDD "Mezcla")', () => {
  it('merges the same sound within 30 ms into one', () => {
    expect(canPlay('golpe', 0, 0, MERGE_MS - 1)).toBe(false);
    expect(canPlay('golpe', 0, 0, MERGE_MS)).toBe(true);
  });

  it('caps the copies of one sound', () => {
    expect(canPlay('golpe', 0, LIMITS.golpe ?? 0, 1000)).toBe(false);
    expect(canPlay('golpe', 0, (LIMITS.golpe ?? 1) - 1, 1000)).toBe(true);
  });

  it('allows 24 voices at most, but the player and bosses always get through', () => {
    expect(canPlay('comida', MAX_VOICES, 0, 1000)).toBe(false);
    expect(canPlay('golpe', MAX_VOICES, 0, 1000)).toBe(false);
    expect(canPlay('guau', MAX_VOICES, 0, 1000)).toBe(true);
    expect(canPlay('dano', MAX_VOICES, 0, 1000)).toBe(true);
    expect(canPlay('jefe', MAX_VOICES, 0, 1000)).toBe(true);
  });

  it('near the cap, the background yields to the important cues', () => {
    const busy = MAX_VOICES - 4;
    expect(canPlay('puf', busy, 0, 1000)).toBe(false);
    expect(canPlay('bocina', busy, 0, 1000)).toBe(true);
    expect(canPlay('elite', busy, 0, 1000)).toBe(true);
  });

  it('player and boss sounds have the top priority', () => {
    for (const id of ['guau', 'dano', 'jefe', 'retumbo', 'latido'] as SoundId[]) expect(PRIORITY[id]).toBe(3);
    for (const id of ['golpe', 'puf', 'comida'] as SoundId[]) expect(PRIORITY[id]).toBe(1);
  });

  it('has a cue for everything you must notice without looking', () => {
    // Boss, micro, quake, elite, low health, ring wave, zone, level up, legendary card.
    for (const id of ['jefe', 'bocina', 'motor', 'retumbo', 'elite', 'latido', 'alarma', 'zona', 'guitarra', 'acordeon', 'bacan'] as SoundId[]) {
      expect(PRIORITY[id]).toBeGreaterThanOrEqual(2);
    }
  });
});
