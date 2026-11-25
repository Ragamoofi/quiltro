import { describe, expect, it } from 'vitest';
import {
  applyRun,
  befriend,
  buy,
  canBuy,
  checkUnlocks,
  collectIdle,
  idleEarnings,
  metaBonus,
  nextCost,
  pillarLevels,
  pillarTier,
  type RunResult,
} from '../src/meta/progress.ts';
import { defaultSave, exportCode, importCode, load, migrate, save, type Store } from '../src/meta/save.ts';
import { CUCHA_PILARES, MEJORAS } from '../src/data/cucha.ts';

class MemoryStore implements Store {
  readonly map = new Map<string, string>();
  getItem(k: string): string | null {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.map.set(k, v);
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
}

const run = (over: Partial<RunResult> = {}): RunResult => ({
  km: 1200,
  kills: 600,
  bosses: 1,
  bossesBeaten: ['alicanto'],
  zones: ['norte', 'centro'],
  killsBy: { paloma: 40 },
  sopaipillas: 500,
  lucasInRun: 10,
  victory: false,
  achievements: [],
  ...over,
});

describe('save', () => {
  it('migrates old or partial saves and fills defaults', () => {
    const s = migrate({ lucas: 50 });
    expect(s.version).toBe(5);
    expect(s.lucas).toBe(50);
    expect(s.characters).toContain('quiltro');
    expect(s.totals.runs).toBe(0);
    expect(s.settings.shake).toBe(1);
    expect(migrate(null).lucas).toBe(0);
  });

  it('v1 → v2 adds options; players who already played skip the intro', () => {
    const v1 = { version: 1, lucas: 10, totals: { runs: 3, kills: 0, sopaipillas: 0, palomas: 0, lucasEarned: 0 } };
    const s = migrate(v1);
    expect(s.version).toBe(5);
    expect(s.daily.counted).toBe(false);
    expect(s.introSeen).toBe(true);
    expect(s.settings.holdMode).toBe('mantener');
    expect(migrate({ version: 1, lucas: 0 }).introSeen).toBe(false);
  });

  it('keeps a backup and falls back to it when the main copy is corrupted', () => {
    const store = new MemoryStore();
    const a = defaultSave();
    a.lucas = 10;
    save(a, store);
    a.lucas = 20;
    save(a, store);
    store.setItem('quiltro.save', '{broken');
    expect(load(store).lucas).toBe(10);
  });

  it('exports and imports a text code, rejecting tampered ones', () => {
    const s = defaultSave();
    s.lucas = 1234;
    s.achievements.push('dieciochero');
    const code = exportCode(s);
    expect(importCode(code)?.lucas).toBe(1234);
    expect(importCode(code.replace(/.$/, code.endsWith('A') ? 'B' : 'A'))).toBeNull();
    expect(importCode('hola')).toBeNull();
  });
});

describe('La Cucha', () => {
  it('costs follow base × 1,6^level rounded to 5 and buying applies the effect', () => {
    const s = defaultSave();
    const plato = MEJORAS.find((m) => m.id === 'platoLleno');
    if (!plato) throw new Error();
    expect(nextCost(s, plato)).toBe(40);
    expect(canBuy(s, 'platoLleno')).toBe(false);
    s.lucas = 1000;
    expect(buy(s, 'platoLleno')).toBe(true);
    expect(s.lucas).toBe(960);
    expect(nextCost(s, plato)).toBe(65);
    expect(metaBonus(s).maxHp).toBe(10);
    for (let i = 0; i < 10; i++) buy(s, 'platoLleno');
    expect(s.upgrades.platoLleno).toBe(5);
    expect(nextCost(s, plato)).toBeNull();
  });

  it('each upgrade belongs to a pillar, three per pillar', () => {
    for (const p of CUCHA_PILARES) expect(MEJORAS.filter((m) => m.pillar === p.id), p.id).toHaveLength(3);
    expect(MEJORAS.every((m) => CUCHA_PILARES.some((p) => p.id === m.pillar))).toBe(true);
  });

  it('pillar perks wake up at 4 and 8 levels and only the highest tier counts', () => {
    const s = defaultSave();
    s.lucas = 100_000;
    // Aguante: Plato lleno ×3 (+30 HP) is 3 levels, nothing yet beyond the upgrade itself.
    for (let i = 0; i < 3; i++) buy(s, 'platoLleno');
    expect(pillarLevels(s, 'aguante')).toBe(3);
    expect(metaBonus(s).maxHp).toBe(30);
    buy(s, 'platoLleno'); // 4 levels: +15 perk
    expect(pillarTier(s, 'aguante')).toBe(1);
    expect(metaBonus(s).maxHp).toBe(40 + 15);
    for (let i = 0; i < 4; i++) buy(s, i < 1 ? 'platoLleno' : 'frazada'); // plato 5, frazada 3 → 8 levels
    expect(pillarLevels(s, 'aguante')).toBe(8);
    expect(pillarTier(s, 'aguante')).toBe(2);
    // The tier-2 perk replaces tier 1 (+30, not +45): 5 plates = 50 HP.
    expect(metaBonus(s).maxHp).toBe(50 + 30);
    // Barrio feeds lucas, Garra the crit, Olfato the experience.
    for (let i = 0; i < 4; i++) buy(s, 'cuentaRut');
    expect(metaBonus(s).lucasMult).toBeCloseTo(0.4 + 0.05);
    for (let i = 0; i < 4; i++) buy(s, 'huesoDeCaracu');
    expect(metaBonus(s).critChance).toBeCloseTo(0.03);
    for (let i = 0; i < 4; i++) buy(s, 'buenaOnda');
    expect(metaBonus(s).xpMult).toBeCloseTo(0.05);
  });

  it('a run pays lucas, first-time zones, achievements and Cuenta RUT', () => {
    const s = defaultSave();
    const r = applyRun(s, run({ achievements: ['laMicroSiParo'] }));
    // (1200/20 + 600/30 + 50) × 2 (LUCAS_SCALE) = 260, + 10 in-run; 2 new zones = 200.
    // Achievements: La micro sí paró (100, earned in the run) + the ones worked out at the end:
    // Rumbo al sur (60, 1.200 km), Capitalino (80) and Se le acabó el oro (100, the trip beat the Alicanto).
    expect(r.runLucas).toBe(270);
    expect(r.zoneBonus).toBe(200);
    expect(r.achievementLucas).toBe(340);
    expect(s.lucas).toBe(810);
    const again = applyRun(s, run({ achievements: ['laMicroSiParo'] }));
    expect(again.zoneBonus).toBe(0);
    // Nothing earned twice; only Mil y una (80) is new, with 1.200 enemies in total.
    expect(again.achievementLucas).toBe(80);
    s.upgrades.cuentaRut = 5;
    // Cuenta RUT ×5 = +50 %, plus the Barrio pillar perk (+5 % from 4 levels).
    expect(applyRun(s, run()).runLucas).toBe(Math.floor(130 * 1.55 * 2) + 10);
  });

  it('unlocks characters by the GDD conditions', () => {
    const s = defaultSave();
    applyRun(s, run({ km: 1100 }));
    expect(s.characters).toContain('quiltra');
    s.totals.sopaipillas = 5000;
    s.bossesBeaten.push('caleuche');
    // The Gato now asks for 3.000 enemies, the Chingue for the 5.000 sopaipillas (and the Chinchilla for 2.000).
    expect(checkUnlocks(s).sort()).toEqual(['chinchilla', 'chingue', 'pinguino']);
  });

  it('neighbours: 10 lucas/h, max 8 h, never more than 30 % of a good run', () => {
    const s = defaultSave(0);
    expect(idleEarnings(s, 3 * 3_600_000).lucas).toBe(30);
    expect(idleEarnings(s, 48 * 3_600_000).lucas).toBe(80);
    s.lucas = 10_000;
    for (const id of ['conserje', 'feria', 'tiaOnce']) expect(befriend(s, id)).toBe(true);
    // 40 lucas/h × 8 h = 320, capped at 30 % of a good run (300 → 90).
    expect(idleEarnings(s, 48 * 3_600_000).lucas).toBe(90);
    expect(collectIdle(s, 48 * 3_600_000)).toBe(90);
    expect(idleEarnings(s, 48 * 3_600_000).lucas).toBe(0);
  });
});
