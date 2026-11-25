import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng.ts';
import { Build } from '../src/game/build.ts';
import { describe as cardText } from '../src/ui/cardText.ts';

const levelUp = (b: Build, id: string, kind: 'weapon' | 'trait' = 'weapon', rarity: 'comun' | 'rara' = 'comun'): void => {
  const owned = kind === 'weapon' ? b.weapon(id) : b.trait(id);
  b.apply({ kind, id, rarity, toLevel: owned ? owned.level + 1 : 1 } as never);
};

describe('build', () => {
  it('starts with the volantín and the ¡GUAU!', () => {
    const b = new Build();
    expect(b.weapons.map((w) => w.def.id).sort()).toEqual(['guau', 'volantin']);
    expect(b.slotWeapons).toHaveLength(1);
  });

  it('applies the volantín level table (Fase 11.10: one kite to start, one more every level)', () => {
    const b = new Build();
    expect(b.numbers('volantin').count).toBe(1);
    levelUp(b, 'volantin'); // nv 2: +1
    expect(b.numbers('volantin').count).toBe(2);
    levelUp(b, 'volantin'); // nv 3: +1 and +25 % damage
    expect(b.numbers('volantin').damage).toBeCloseTo(20 * 1.25);
    levelUp(b, 'volantin');
    levelUp(b, 'volantin');
    expect(b.weapon('volantin')?.level).toBe(5);
    expect(b.numbers('volantin').count).toBe(5);
    expect(b.numbers('volantin').damage).toBeCloseTo(20 * 1.25 * 1.35);
  });

  it('traits stack, rarity scales them, cooldowns have a floor', () => {
    const b = new Build();
    levelUp(b, 'pataDePerro', 'trait');
    levelUp(b, 'pataDePerro', 'trait', 'rara');
    expect(b.stats().speedMult).toBeCloseTo(1 + 0.08 + 0.12);
    for (let i = 0; i < 5; i++) levelUp(b, 'alTiro', 'trait');
    expect(b.stats().cooldownMult).toBeCloseTo(0.6);
  });

  it('La jauría gives +1 at levels 2 and 4 to every weapon, also the ones without projectiles', () => {
    const b = new Build();
    levelUp(b, 'laJauria', 'trait');
    expect(b.stats().projectiles).toBe(0);
    levelUp(b, 'laJauria', 'trait');
    expect(b.stats().projectiles).toBe(1);
    expect(b.numbers('volantin').count).toBe(2);
    for (const id of ['pandero', 'cacerola', 'cables', 'chaya']) expect(b.numbers(id).count, id).toBe(2);
    levelUp(b, 'laJauria', 'trait');
    levelUp(b, 'laJauria', 'trait');
    expect(b.stats().projectiles).toBe(2);
    // The bark throws nothing: it barks harder instead.
    expect(b.numbers('guau').count).toBe(1);
    expect(b.numbers('guau').damage).toBeGreaterThan(new Build().numbers('guau').damage);
  });

  it('offers distinct cards and respects the 4 + 4 slots', () => {
    const b = new Build();
    const rng = new Rng(3);
    for (const id of ['trompo', 'cables', 'chaya']) levelUp(b, id);
    for (const id of ['choro', 'cachai', 'olfato', 'alTiro']) levelUp(b, id, 'trait');
    for (let i = 0; i < 50; i++) {
      const offers = b.offers(rng, 3);
      expect(offers).toHaveLength(3);
      const ids = offers.map((o) => ('id' in o ? o.id : o.kind));
      expect(new Set(ids).size).toBe(3);
      for (const o of offers) {
        if (o.kind === 'weapon') expect(b.weapon(o.id)).toBeDefined();
        if (o.kind === 'trait') expect(b.trait(o.id)).toBeDefined();
      }
    }
  });

  it('never offers banished options', () => {
    const b = new Build();
    b.banished.add('volantin');
    b.banished.add('trompo');
    const rng = new Rng(9);
    for (let i = 0; i < 50; i++) {
      for (const o of b.offers(rng, 3)) if ('id' in o) expect(['volantin', 'trompo']).not.toContain(o.id);
    }
  });

  it('fills with food and lucas when everything is maxed', () => {
    const b = new Build();
    for (const w of b.weapons) w.level = w.def.maxLevel;
    for (const id of ['trompo', 'cables', 'chaya']) {
      levelUp(b, id);
      const w = b.weapon(id);
      if (w) w.level = w.def.maxLevel;
    }
    for (const id of ['choro', 'cachai', 'olfato', 'alTiro']) {
      levelUp(b, id, 'trait');
      const t = b.trait(id);
      if (t) t.level = t.def.maxLevel;
    }
    const kinds = b.offers(new Rng(1), 3).map((o) => o.kind);
    expect(kinds.every((k) => k === 'heal' || k === 'lucas')).toBe(true);
  });

  it('rarity follows the GDD odds roughly', () => {
    const b = new Build();
    const rng = new Rng(77);
    const n = 20000;
    let legend = 0;
    let common = 0;
    for (let i = 0; i < n; i++) {
      const r = b.rollRarity(rng);
      if (r === 'legendaria') legend++;
      if (r === 'comun') common++;
    }
    expect(common / n).toBeGreaterThan(0.67);
    expect(common / n).toBeLessThan(0.73);
    expect(legend / n).toBeLessThan(0.02);
  });
});

describe('card texts', () => {
  it('shows exact numbers scaled by rarity', () => {
    expect(cardText({ kind: 'trait', id: 'pataDePerro', rarity: 'comun', toLevel: 1 }).effect).toBe('+8% velocidad');
    expect(cardText({ kind: 'trait', id: 'pataDePerro', rarity: 'epica', toLevel: 2 }).effect).toBe('+16% velocidad');
    expect(cardText({ kind: 'trait', id: 'laOnce', rarity: 'comun', toLevel: 1 }).effect).toBe(
      '+20 vida máxima, +0,3 vida/s',
    );
    expect(cardText({ kind: 'weapon', id: 'volantin', rarity: 'comun', toLevel: 2 }).effect).toBe('+1 volantín');
    expect(cardText({ kind: 'weapon', id: 'volantin', rarity: 'comun', toLevel: 3 }).level).toBe('Nivel 2 → 3');
  });
});
