import { describe, expect, it } from 'vitest';
import { causeName, statLines, topOf } from '../src/ui/achievementsView.ts';
import { hasKey } from '../src/i18n/index.ts';
import { applyRun, type RunResult } from '../src/meta/progress.ts';
import { defaultSave } from '../src/meta/save.ts';

const trip = (extra: Partial<RunResult> = {}): RunResult => ({
  km: 500,
  kills: 100,
  bosses: 0,
  bossesBeaten: [],
  zones: [],
  killsBy: {},
  sopaipillas: 0,
  lucasInRun: 0,
  victory: false,
  achievements: [],
  ...extra,
});

describe('Fase 11.7: marcas', () => {
  it('counts trips per character and deaths per cause, and finds the most common', () => {
    const save = defaultSave();
    applyRun(save, trip({ character: 'quiltro', deathBy: 'micro' }));
    applyRun(save, trip({ character: 'quiltro', deathBy: 'micro' }));
    applyRun(save, trip({ character: 'gato', deathBy: 'jefe' }));
    // A victory is not a death, and the second report of a continued trip is not a new trip.
    applyRun(save, trip({ character: 'gato', victory: true, deathBy: 'jefe' }));
    applyRun(save, trip({ character: 'gato', continued: true, deathBy: 'proyectil' }));
    expect(topOf(save.stats.characters)).toEqual({ id: 'quiltro', n: 2 });
    expect(save.stats.characters.gato).toBe(2);
    expect(topOf(save.stats.deaths)).toEqual({ id: 'micro', n: 2 });
    expect(save.stats.deaths.jefe).toBe(1);
  });

  it('names causes: enemies, bosses and the dangers of the road, never a raw id for the known ones', () => {
    for (const id of ['micro', 'chingue', 'alicanto', 'jefe', 'proyectil', 'microQueNoPara', 'otro']) expect(causeName(id), id).not.toBe(id);
    expect(causeName('algoRaro')).toBe('algoRaro');
    expect(hasKey('estadisticas.causa.jefe')).toBe(true);
  });

  it('the lines read the save, and an empty save shows dashes instead of failing', () => {
    const lines = statLines(defaultSave());
    expect(lines).toHaveLength(9);
    expect(lines.find((l) => l.label === 'Personaje más usado')?.value).toBe('-');
    const save = defaultSave();
    save.totals.runs = 12;
    expect(statLines(save).find((l) => l.label === 'Viajes')?.value).toBe('12');
  });
});
