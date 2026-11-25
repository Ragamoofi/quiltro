import { describe, expect, it } from 'vitest';
import { ARMAS, MAX_WEAPONS } from '../src/data/armas.ts';
import { EVOLUCIONES } from '../src/data/evoluciones.ts';
import { RASGOS } from '../src/data/rasgos.ts';
import { Build, type Rarity } from '../src/game/build.ts';

const raise = (b: Build, id: string, kind: 'weapon' | 'trait', to: number, rarity: Rarity = 'comun'): void => {
  for (let l = (kind === 'weapon' ? b.weapon(id)?.level : b.trait(id)?.level) ?? 0; l < to; l++) {
    b.apply({ kind, id, rarity, toLevel: l + 1 });
  }
};

describe('Fase 9.5: armas nuevas', () => {
  it('there are ten weapons for the slots, and each new one has its own evolution and trait', () => {
    expect(ARMAS.filter((a) => a.takesSlot).length).toBeGreaterThanOrEqual(MAX_WEAPONS);
    for (const id of ['bolitas', 'emboque', 'elastico', 'ronda']) {
      const def = ARMAS.find((a) => a.id === id);
      expect(def, id).toBeDefined();
      expect(def?.takesSlot).toBe(true);
      expect(def?.maxLevel).toBe(5);
      expect(EVOLUCIONES.find((e) => e.weapon === id)?.trait).toBe(def?.evolvesWith);
    }
  });

  it('levels add what each card says', () => {
    const b = new Build('bolitas');
    expect(b.numbers('bolitas').count).toBe(4);
    raise(b, 'bolitas', 'weapon', 5);
    expect(b.numbers('bolitas').count).toBe(8);
    // +15 % per level, compounding.
    expect(b.numbers('bolitas').damage).toBeCloseTo(11 * 1.15 ** 4);

    const e = new Build('emboque');
    raise(e, 'emboque', 'weapon', 3);
    expect(e.numbers('emboque').count).toBe(2);
    raise(e, 'emboque', 'weapon', 5);
    expect(e.numbers('emboque').count).toBe(3);
    expect(e.numbers('emboque').area).toBeCloseTo(150 * 1.15);

    const el = new Build('elastico');
    raise(el, 'elastico', 'weapon', 5);
    expect(el.numbers('elastico').count).toBe(3);
    expect(el.numbers('elastico').duration).toBeCloseTo(1.2 * 1.2);

    const r = new Build('ronda');
    raise(r, 'ronda', 'weapon', 5);
    expect(r.numbers('ronda').count).toBe(3);
  });
});

describe('Fase 9.5: pasivas nuevas', () => {
  it('each one adds up through the build stats', () => {
    const b = new Build('volantin');
    raise(b, 'colmillo', 'trait', 2);
    raise(b, 'colaAlegre', 'trait', 3);
    raise(b, 'siesta', 'trait', 2);
    raise(b, 'hambreDeLunes', 'trait', 1);
    const s = b.stats();
    // Colmillo ×2 = +10 points of crit on top of the base 5 (Garra has only 2 points: no bonus yet).
    expect(s.critChance).toBeCloseTo(0.05 + 0.1);
    expect(s.killHaste).toBeCloseTo(0.18);
    expect(s.restRegen).toBeCloseTo(3);
    // Hambre de lunes +8 %, and the Olfato pillar wakes up (1 + 3 = 4 points): +10 %.
    expect(s.xpMult).toBeCloseTo(1 + 0.08 + 0.1);
  });

  it('rarity scales them like the other traits', () => {
    const b = new Build('volantin');
    b.apply({ kind: 'trait', id: 'siesta', rarity: 'epica', toLevel: 1 });
    expect(b.stats().restRegen).toBeCloseTo(3);
    b.apply({ kind: 'trait', id: 'cascabel', rarity: 'rara', toLevel: 1 });
    expect(b.stats().bell).toBeCloseTo(1.5);
  });

  it('Manada chica brings a dog at levels 1, 3 and 5', () => {
    const b = new Build('volantin');
    const pets: number[] = [];
    for (let l = 1; l <= 5; l++) {
      raise(b, 'manadaChica', 'trait', l);
      pets.push(b.stats().pets);
    }
    expect(pets).toEqual([1, 1, 2, 2, 3]);
  });

  it('the new traits all have a card text and belong to a pillar', () => {
    for (const id of ['colmillo', 'colaAlegre', 'siesta', 'hambreDeLunes', 'cascabel', 'manadaChica']) {
      expect(RASGOS.some((r) => r.id === id), id).toBe(true);
    }
  });
});
