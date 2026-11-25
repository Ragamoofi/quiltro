import { describe, expect, it } from 'vitest';
import { ARMAS } from '../src/data/armas.ts';
import {
  enemyDamageMult,
  enemyHpMult,
  kmAt,
  lucasForRun,
  spawnPerSecond,
  upgradeCost,
  xpToNext,
} from '../src/data/balance.ts';
import { MEJORAS } from '../src/data/cucha.ts';
import { ENEMIGOS } from '../src/data/enemigos.ts';
import { EVOLUCIONES } from '../src/data/evoluciones.ts';
import { JEFES } from '../src/data/jefes.ts';
import { LOGROS } from '../src/data/logros.ts';
import { PERSONAJES } from '../src/data/personajes.ts';
import { RASGOS } from '../src/data/rasgos.ts';
import { CIUDADES, ZONAS } from '../src/data/zonas.ts';
import { formatNumber, hasKey, t } from '../src/i18n/index.ts';

describe('balance formulas (GDD)', () => {
  it('xp to next level', () => {
    expect(xpToNext(1)).toBe(16); // 5 + 10 + 0.6
    expect(xpToNext(10)).toBe(165); // 5 + 100 + 60
  });

  it('spawn rate follows the formula', () => {
    expect(spawnPerSecond(0)).toBe(1.5);
    expect(spawnPerSecond(9)).toBeCloseTo(10.95);
  });

  it('enemy scaling', () => {
    expect(enemyHpMult(0)).toBe(1);
    expect(enemyHpMult(10)).toBeCloseTo(4.5);
    expect(enemyDamageMult(10)).toBeCloseTo(1.8);
  });

  it('minute 12 is Punta Arenas (4.300 km)', () => {
    expect(kmAt(12)).toBeCloseTo(4300);
    expect(kmAt(3)).toBeCloseTo(1075);
  });

  it('lucas and upgrade costs', () => {
    // GDD formula × LUCAS_SCALE (2).
    expect(lucasForRun(2000, 300, 1)).toBe((100 + 10 + 50) * 2);
    expect(lucasForRun(2000, 300, 1, 1.5)).toBe(480);
    expect(upgradeCost(40, 0)).toBe(40);
    expect(upgradeCost(40, 1)).toBe(65); // 64 → 65
    expect(upgradeCost(800, 0) % 5).toBe(0);
  });
});

describe('content data', () => {
  it('has the scoped amounts (GDD base plus the Fase 9.5 content)', () => {
    // GDD: 6 weapons, 8 traits, 7 evolutions. Fase 9.5 added 4 weapons, 6 traits and 4 evolutions.
    expect(ARMAS.filter((a) => a.takesSlot)).toHaveLength(10);
    expect(RASGOS).toHaveLength(14);
    expect(ENEMIGOS).toHaveLength(12);
    expect(JEFES).toHaveLength(4);
    expect(EVOLUCIONES).toHaveLength(11);
    expect(MEJORAS).toHaveLength(12);
    expect(PERSONAJES).toHaveLength(6);
  });

  it('evolutions reference real weapons and traits', () => {
    const weapons = new Set(ARMAS.map((a) => a.id));
    const traits = new Set(RASGOS.map((r) => r.id));
    for (const e of EVOLUCIONES) {
      expect(weapons.has(e.weapon)).toBe(true);
      expect(traits.has(e.trait)).toBe(true);
    }
    for (const a of ARMAS) expect(traits.has(a.evolvesWith)).toBe(true);
  });

  it('zones chain without gaps and every boss exists', () => {
    for (let i = 1; i < ZONAS.length; i++) expect(ZONAS[i]!.startMin).toBe(ZONAS[i - 1]!.endMin);
    const bosses = new Set(JEFES.map((j) => j.id));
    const enemies = new Set(ENEMIGOS.map((e) => e.id));
    for (const z of ZONAS) {
      if (z.boss) expect(bosses.has(z.boss)).toBe(true);
      for (const e of z.enemies) expect(enemies.has(e)).toBe(true);
    }
  });

  it('cities are ordered by km', () => {
    for (let i = 1; i < CIUDADES.length; i++) {
      expect(CIUDADES[i]!.km).toBeGreaterThan(CIUDADES[i - 1]!.km);
    }
  });
});

describe('i18n', () => {
  it('every content key has a text', () => {
    const keys = [
      ...ARMAS.flatMap((a) => [`${a.i18n}.nombre`, `${a.i18n}.efecto`]),
      ...RASGOS.flatMap((r) => [`${r.i18n}.nombre`, `${r.i18n}.carta`]),
      ...ENEMIGOS.map((e) => e.nameKey),
      ...JEFES.flatMap((j) => [`${j.i18n}.nombre`, `${j.i18n}.linea`]),
      ...ZONAS.flatMap((z) => [`${z.i18n}.titulo`, `${z.i18n}.subtitulo`]),
      ...CIUDADES.map((c) => c.i18n),
      ...EVOLUCIONES.map((e) => e.nameKey),
      ...MEJORAS.map((m) => m.nameKey),
      ...PERSONAJES.map((p) => p.nameKey),
      ...LOGROS.flatMap((l) => [`${l.i18n}.nombre`, `${l.i18n}.desc`]),
    ];
    const missing = keys.filter((k) => !hasKey(k));
    expect(missing).toEqual([]);
  });

  it('fills placeholders', () => {
    expect(t('ui.sinLucas', { n: 40 })).toBe('Te faltan 40 lucas, compadre');
    expect(t('no.existe')).toBe('no.existe');
  });

  it('formats numbers the Chilean way', () => {
    expect(formatNumber(4300)).toBe('4.300');
    expect(formatNumber(1234567)).toBe('1.234.567');
  });
});
