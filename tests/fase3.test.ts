import { describe, expect, it } from 'vitest';
import { Build } from '../src/game/build.ts';
import { bossHpMult } from '../src/game/bosses/boss.ts';
import { SpatialGrid } from '../src/game/systems/spatialGrid.ts';
import { inSegment } from '../src/game/systems/telegraphs.ts';
import { IMPLEMENTED_ENEMIES } from '../src/game/entities/enemies.ts';
import { ENEMIGOS } from '../src/data/enemigos.ts';
import { ZONAS } from '../src/data/zonas.ts';

describe('Fase 3 content', () => {
  it('every enemy in the GDD has art and behaviour', () => {
    for (const e of ENEMIGOS) expect(IMPLEMENTED_ENEMIES).toContain(e.id);
  });

  it('every zone but La Antártica has a boss', () => {
    for (const z of ZONAS) if (z.id !== 'antartica') expect(z.boss).toBeTruthy();
  });
});

describe('evolutions', () => {
  it('are ready with the weapon at level 5 plus its paired trait', () => {
    const b = new Build();
    for (let l = 2; l <= 5; l++) b.apply({ kind: 'weapon', id: 'volantin', rarity: 'comun', toLevel: l });
    expect(b.evolutionReady()).toBeUndefined();
    const card = { kind: 'trait' as const, id: 'laOnce', rarity: 'comun' as const, toLevel: 1 };
    expect(b.completesEvolution(card)).toBe(true);
    b.apply(card);
    expect(b.evolutionReady()?.id).toBe('cieloDelDieciocho');
    b.apply({ kind: 'evolution', id: 'volantin', evolution: 'cieloDelDieciocho', rarity: 'legendaria' });
    expect(b.evolved.has('volantin')).toBe(true);
    expect(b.evolutionReady()).toBeUndefined();
  });
});

describe('bosses', () => {
  it('grow gently with time and harder when they return in Antarctica', () => {
    expect(bossHpMult(0)).toBe(1);
    expect(bossHpMult(12)).toBeCloseTo(1.6);
    expect(bossHpMult(12, 1)).toBeCloseTo(2.4);
  });
});

describe('grid with big bodies', () => {
  it('finds a boss from any cell it covers, once', () => {
    const g = new SpatialGrid(64);
    g.insertCircle(7, 100, 100, 40);
    const out: number[] = [];
    g.query(70, 70, 5, out);
    expect(out).toEqual([7]);
    g.query(100, 100, 80, out);
    expect(out).toEqual([7]);
  });
});

describe('telegraph geometry', () => {
  it('detects points inside a thick line', () => {
    expect(inSegment(50, 3, 0, 0, 100, 0, 5)).toBe(true);
    expect(inSegment(50, 9, 0, 0, 100, 0, 5)).toBe(false);
    expect(inSegment(120, 0, 0, 0, 100, 0, 5)).toBe(false);
  });
});
