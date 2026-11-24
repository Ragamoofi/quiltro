import type { Rng } from '../core/rng.ts';
import { ARMAS, MAX_WEAPONS, type WeaponDef, type WeaponLevelUp } from '../data/armas.ts';
import { RARITY } from '../data/balance.ts';
import { EVOLUCIONES, type EvolutionDef } from '../data/evoluciones.ts';
import { MAX_TRAITS, RASGOS, type TraitDef } from '../data/rasgos.ts';

export type Rarity = (typeof RARITY)[number]['id'];

/** Totals of every passive bonus the dog has. Fractions: 0.1 = +10 %. */
export interface Stats {
  speedMult: number;
  armor: number;
  maxHp: number;
  regen: number;
  areaMult: number;
  damageMult: number;
  cooldownMult: number;
  pickupMult: number;
  /** Extra projectiles for every weapon (La jauría). */
  projectiles: number;
}

/** A weapon's numbers after its levels and the dog's passives. */
export interface WeaponNumbers {
  damage: number;
  count: number;
  cooldown: number;
  bounces: number;
  chains: number;
  duration: number;
  tick: number;
  slow: number;
  area: number;
}

export interface OwnedWeapon {
  readonly def: WeaponDef;
  level: number;
  /** Extra damage from rare cards (0.1 = +10 %). */
  rarityBonus: number;
}

export interface OwnedTrait {
  readonly def: TraitDef;
  level: number;
  /** Sum of the level-ups taken, each scaled by its card rarity. */
  totals: {
    speedMult: number;
    armor: number;
    maxHp: number;
    regen: number;
    areaMult: number;
    damageMult: number;
    cooldownMult: number;
    pickupMult: number;
  };
}

export type Offer =
  | { kind: 'evolution'; id: string; evolution: string; rarity: Rarity }
  | { kind: 'weapon'; id: string; rarity: Rarity; toLevel: number }
  | { kind: 'trait'; id: string; rarity: Rarity; toLevel: number }
  | { kind: 'heal'; rarity: Rarity }
  | { kind: 'lucas'; rarity: Rarity };

const RARITY_MULT: Record<Rarity, number> = Object.fromEntries(RARITY.map((r) => [r.id, r.mult])) as Record<
  Rarity,
  number
>;

/** Lowest a cooldown can go after every reduction. */
const MIN_COOLDOWN_MULT = 0.4;

/**
 * What the dog carries in this run: up to 4 weapons + ¡GUAU!, up to 4 traits.
 * Computes final numbers and the level-up offers. No rendering here.
 */
export class Build {
  readonly weapons: OwnedWeapon[] = [];
  readonly traits: OwnedTrait[] = [];
  readonly banished = new Set<string>();
  /** Weapon ids that have evolved. */
  readonly evolved = new Set<string>();
  /** "Buena onda": each point moves rarity odds toward the rare side. */
  luck = 0;

  constructor(startingWeapon = 'volantin') {
    this.addWeapon('guau');
    this.addWeapon(startingWeapon);
  }

  weapon(id: string): OwnedWeapon | undefined {
    return this.weapons.find((w) => w.def.id === id);
  }

  trait(id: string): OwnedTrait | undefined {
    return this.traits.find((t) => t.def.id === id);
  }

  get slotWeapons(): OwnedWeapon[] {
    return this.weapons.filter((w) => w.def.takesSlot);
  }

  private addWeapon(id: string): OwnedWeapon {
    const def = ARMAS.find((a) => a.id === id);
    if (!def) throw new Error(`Arma desconocida: ${id}`);
    const w: OwnedWeapon = { def, level: 1, rarityBonus: 0 };
    this.weapons.push(w);
    return w;
  }

  stats(): Stats {
    const s: Stats = {
      speedMult: 1,
      armor: 0,
      maxHp: 0,
      regen: 0,
      areaMult: 1,
      damageMult: 1,
      cooldownMult: 1,
      pickupMult: 1,
      projectiles: 0,
    };
    for (const t of this.traits) {
      s.speedMult += t.totals.speedMult;
      s.armor += t.totals.armor;
      s.maxHp += t.totals.maxHp;
      s.regen += t.totals.regen;
      s.areaMult += t.totals.areaMult;
      s.damageMult += t.totals.damageMult;
      s.cooldownMult += t.totals.cooldownMult;
      s.pickupMult += t.totals.pickupMult;
      const at = t.def.perLevel.projectilesAtLevels;
      if (at) s.projectiles += at.filter((l) => t.level >= l).length;
    }
    s.cooldownMult = Math.max(MIN_COOLDOWN_MULT, s.cooldownMult);
    return s;
  }

  /** Final numbers for an owned weapon (or its level-1 numbers if not owned). */
  numbers(id: string, stats: Stats = this.stats()): WeaponNumbers {
    const owned = this.weapon(id);
    const def = owned?.def ?? ARMAS.find((a) => a.id === id);
    if (!def) throw new Error(`Arma desconocida: ${id}`);
    const b = def.base;
    const n: WeaponNumbers = {
      damage: b.damage,
      count: b.count ?? 1,
      cooldown: b.cooldown ?? 1,
      bounces: b.bounces ?? 0,
      chains: b.chains ?? 0,
      duration: b.duration ?? 0,
      tick: b.tick ?? 0.25,
      slow: b.slow ?? 0,
      area: b.area ?? 0,
    };
    const level = owned?.level ?? 1;
    for (let l = 2; l <= level; l++) applyLevel(n, levelUp(def, l));
    n.damage *= stats.damageMult * (1 + (owned?.rarityBonus ?? 0));
    n.cooldown *= stats.cooldownMult;
    n.area *= stats.areaMult;
    if (def.takesSlot && b.count !== undefined) n.count += stats.projectiles;
    return n;
  }

  /** Level-up choices: `count` different cards. */
  offers(rng: Rng, count: number): Offer[] {
    const pool: { offer: { kind: 'weapon' | 'trait'; id: string; toLevel: number }; weight: number }[] = [];
    for (const w of this.weapons) {
      if (w.level < w.def.maxLevel && !this.banished.has(w.def.id)) {
        pool.push({ offer: { kind: 'weapon', id: w.def.id, toLevel: w.level + 1 }, weight: 1.2 });
      }
    }
    if (this.slotWeapons.length < MAX_WEAPONS) {
      for (const def of ARMAS) {
        if (this.weapon(def.id) || this.banished.has(def.id)) continue;
        pool.push({ offer: { kind: 'weapon', id: def.id, toLevel: 1 }, weight: 1 });
      }
    }
    for (const t of this.traits) {
      if (t.level < t.def.maxLevel && !this.banished.has(t.def.id)) {
        pool.push({ offer: { kind: 'trait', id: t.def.id, toLevel: t.level + 1 }, weight: 1.2 });
      }
    }
    if (this.traits.length < MAX_TRAITS) {
      for (const def of RASGOS) {
        if (this.trait(def.id) || this.banished.has(def.id)) continue;
        pool.push({ offer: { kind: 'trait', id: def.id, toLevel: 1 }, weight: 1 });
      }
    }

    const out: Offer[] = [];
    while (out.length < count && pool.length > 0) {
      const i = rng.weighted(pool.map((p) => p.weight));
      const [picked] = pool.splice(i, 1);
      if (picked) out.push({ ...picked.offer, rarity: this.rollRarity(rng) });
    }
    // Everything maxed: fill with food and lucas.
    while (out.length < count) {
      out.push(out.length % 2 === 0 ? { kind: 'heal', rarity: 'comun' } : { kind: 'lucas', rarity: 'comun' });
    }
    return out;
  }

  rollRarity(rng: Rng): Rarity {
    const shift = Math.min(0.3, this.luck * 0.02);
    const weights = RARITY.map((r) => (r.id === 'comun' ? r.chance - shift : r.chance + (shift * r.chance) / 0.3));
    return RARITY[rng.weighted(weights)]?.id ?? 'comun';
  }

  /** An evolution ready to happen: weapon at max level + its paired trait (any level). */
  evolutionReady(): EvolutionDef | undefined {
    return EVOLUCIONES.find((ev) => {
      const w = this.weapon(ev.weapon);
      return w && w.level >= w.def.maxLevel && this.trait(ev.trait) && !this.evolved.has(ev.weapon);
    });
  }

  /** Would taking this card make an evolution ready? (for the "¡Evoluciona!" stamp) */
  completesEvolution(offer: Offer): boolean {
    if (offer.kind !== 'weapon' && offer.kind !== 'trait') return false;
    return EVOLUCIONES.some((ev) => {
      if (this.evolved.has(ev.weapon)) return false;
      const w = this.weapon(ev.weapon);
      const maxAfter = offer.kind === 'weapon' && offer.id === ev.weapon ? offer.toLevel : (w?.level ?? 0);
      const hasTrait = !!this.trait(ev.trait) || (offer.kind === 'trait' && offer.id === ev.trait);
      const max = w?.def.maxLevel ?? 5;
      const readyBefore = (w?.level ?? 0) >= max && !!this.trait(ev.trait);
      return !readyBefore && maxAfter >= max && hasTrait;
    });
  }

  /** Applies a weapon/trait/evolution card. Heal and lucas are handled by the run. */
  apply(offer: Offer): void {
    const mult = RARITY_MULT[offer.rarity];
    if (offer.kind === 'evolution') {
      this.evolved.add(offer.id);
      return;
    }
    if (offer.kind === 'weapon') {
      const w = this.weapon(offer.id) ?? (offer.toLevel === 1 ? this.addWeapon(offer.id) : undefined);
      if (!w) return;
      if (offer.toLevel > 1) w.level = Math.min(w.def.maxLevel, w.level + 1);
      w.rarityBonus += (mult - 1) * 0.2;
    } else if (offer.kind === 'trait') {
      let t = this.trait(offer.id);
      if (!t) {
        const def = RASGOS.find((r) => r.id === offer.id);
        if (!def) return;
        t = {
          def,
          level: 0,
          totals: { speedMult: 0, armor: 0, maxHp: 0, regen: 0, areaMult: 0, damageMult: 0, cooldownMult: 0, pickupMult: 0 },
        };
        this.traits.push(t);
      }
      t.level = Math.min(t.def.maxLevel, t.level + 1);
      const p = t.def.perLevel;
      t.totals.speedMult += (p.speedMult ?? 0) * mult;
      t.totals.armor += Math.round((p.armor ?? 0) * mult);
      t.totals.maxHp += (p.maxHp ?? 0) * mult;
      t.totals.regen += (p.regen ?? 0) * mult;
      t.totals.areaMult += (p.areaMult ?? 0) * mult;
      t.totals.damageMult += (p.damageMult ?? 0) * mult;
      t.totals.cooldownMult += (p.cooldownMult ?? 0) * mult;
      t.totals.pickupMult += (p.pickupMult ?? 0) * mult;
    }
  }
}

export function levelUp(def: WeaponDef, level: number): WeaponLevelUp {
  return def.levels?.[level - 2] ?? def.perLevel ?? {};
}

function applyLevel(n: WeaponNumbers, up: WeaponLevelUp): void {
  n.count += up.count ?? 0;
  n.bounces += up.bounces ?? 0;
  n.chains += up.chains ?? 0;
  n.damage *= 1 + (up.damageMult ?? 0);
  n.cooldown *= 1 + (up.cooldownMult ?? 0);
  n.duration *= 1 + (up.durationMult ?? 0);
  n.area *= 1 + (up.areaMult ?? 0);
}
