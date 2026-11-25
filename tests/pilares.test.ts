import { describe, expect, it } from 'vitest';
import { RARITY } from '../src/data/balance.ts';
import { PILARES, PILLAR_POINTS, pillarOf, pillarTier } from '../src/data/pilares.ts';
import { RASGOS } from '../src/data/rasgos.ts';
import { Build, type Rarity } from '../src/game/build.ts';
import { pillarLine } from '../src/ui/cardText.ts';

const trait = (b: Build, id: string, to: number, rarity: Rarity = 'comun'): void => {
  // Raises the trait up to level `to` (taking a card for each missing level).
  for (let l = (b.trait(id)?.level ?? 0) + 1; l <= to; l++) b.apply({ kind: 'trait', id, rarity, toLevel: l });
};

describe('pilares', () => {
  it('every trait belongs to exactly one pillar', () => {
    for (const r of RASGOS) {
      expect(PILARES.filter((p) => p.traits.includes(r.id)), r.id).toHaveLength(1);
      expect(pillarOf(r.id)).toBeDefined();
    }
  });

  it('tiers open at 3 and 7 points', () => {
    expect(PILLAR_POINTS).toEqual([3, 7]);
    expect([0, 2, 3, 6, 7, 10].map(pillarTier)).toEqual([0, 0, 1, 1, 2, 2]);
  });

  it('adds up the levels of both traits of a pillar and applies only the highest tier', () => {
    const b = new Build('volantin');
    trait(b, 'chalequito', 2);
    expect(b.pillarPoints('aguante')).toBe(2);
    expect(b.stats().maxHp).toBe(0);
    trait(b, 'laOnce', 1);
    // Aguante tier 1: +25 max HP (plus what the traits give: La once +20 per level).
    expect(b.pillarPoints('aguante')).toBe(3);
    const t1 = b.stats().maxHp;
    expect(t1).toBe(20 + 25);
    expect(b.stats().shieldEvery).toBe(0);
    // More levels: tier 2 replaces tier 1 (+50, not +75) and adds the shield.
    trait(b, 'chalequito', 5);
    trait(b, 'laOnce', 2);
    expect(b.pillarPoints('aguante')).toBe(5 + 2);
    expect(b.stats().maxHp).toBe(20 * 2 + 50);
    expect(b.stats().shieldEvery).toBe(40);
  });

  it('Garra gives crit, Olfato gives experience, Barrio gives area and a projectile', () => {
    const b = new Build('volantin');
    trait(b, 'choro', 3);
    expect(b.stats().critChance).toBeCloseTo(0.05 + 0.1);
    trait(b, 'olfato', 3);
    expect(b.stats().xpMult).toBeCloseTo(1.1);
    trait(b, 'cachai', 5);
    trait(b, 'laJauria', 2);
    // Cachai 5 × 10 % + Barrio tier 2 12 %.
    expect(b.stats().areaMult).toBeCloseTo(1 + 0.5 + 0.12);
    // La jauría gives +1 projectile at level 2, Barrio tier 2 another one.
    expect(b.stats().projectiles).toBe(2);
  });

  it('a card says how far the pillar is and whether it unlocks a bonus', () => {
    const b = new Build('volantin');
    trait(b, 'chalequito', 2);
    const line = pillarLine({ kind: 'trait', id: 'laOnce', rarity: 'comun', toLevel: 1 }, b);
    expect(line?.text).toBe('Aguante 3/3');
    expect(line?.unlocks).toBe(true);
    const none = pillarLine({ kind: 'weapon', id: 'volantin', rarity: 'comun', toLevel: 2 }, b);
    expect(none).toBeNull();
    const first = pillarLine({ kind: 'trait', id: 'choro', rarity: 'comun', toLevel: 1 }, new Build('volantin'));
    expect(first?.text).toBe('Garra 1/3');
    expect(first?.unlocks).toBe(false);
  });
});

describe('rarezas con efecto', () => {
  it('rarer cards are worth clearly more, and by the table', () => {
    for (let i = 1; i < RARITY.length; i++) {
      expect(RARITY[i]?.weaponDamage ?? 0).toBeGreaterThan(RARITY[i - 1]?.weaponDamage ?? 0);
    }
    // At least 3 times as much from a rare card to a legendary one.
    expect((RARITY[3]?.weaponDamage ?? 0) / (RARITY[1]?.weaponDamage ?? 1)).toBeGreaterThanOrEqual(3);
  });

  it('a legendary weapon card adds damage, speed and one more projectile', () => {
    const plain = new Build('volantin');
    plain.apply({ kind: 'weapon', id: 'fuegos', rarity: 'comun', toLevel: 1 });
    const gold = new Build('volantin');
    gold.apply({ kind: 'weapon', id: 'fuegos', rarity: 'legendaria', toLevel: 1 });
    const a = plain.numbers('fuegos');
    const b = gold.numbers('fuegos');
    expect(b.damage).toBeCloseTo(a.damage * 1.7);
    expect(b.cooldown).toBeCloseTo(a.cooldown * 0.85);
    expect(b.count).toBe(a.count + 1);
  });

  it('chain weapons get a chain instead, and weapons without cooldown ignore the speed bonus', () => {
    const plain = new Build('volantin');
    plain.apply({ kind: 'weapon', id: 'cables', rarity: 'comun', toLevel: 1 });
    const gold = new Build('volantin');
    gold.apply({ kind: 'weapon', id: 'cables', rarity: 'legendaria', toLevel: 1 });
    expect(gold.numbers('cables').chains).toBe(plain.numbers('cables').chains + 1);
    const kite = new Build('volantin');
    kite.apply({ kind: 'weapon', id: 'volantin', rarity: 'epica', toLevel: 2 });
    const base = new Build('volantin');
    base.apply({ kind: 'weapon', id: 'volantin', rarity: 'comun', toLevel: 2 });
    expect(kite.numbers('volantin').cooldown).toBeCloseTo(base.numbers('volantin').cooldown);
    expect(kite.numbers('volantin').damage).toBeCloseTo(base.numbers('volantin').damage * 1.35);
  });
});
