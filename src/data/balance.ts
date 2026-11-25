/**
 * Balance formulas and global numbers from the GDD. Pure functions, covered by tests.
 * `t` is always minutes since the start of the run.
 */
import { KM_PER_MINUTE } from './zonas.ts';

/**
 * The GDD's pixel distances and speeds read like a ~800×450 view; the game
 * renders at 480×270. Every px value from the data files (speeds, radii,
 * orbits) is multiplied by this so proportions match the design.
 * Tunable live from the F1 panel.
 */
export const TUNING = {
  worldScale: 0.6,
};

/** px value from the GDD → native pixels. */
export function px(value: number): number {
  return value * TUNING.worldScale;
}

/** XP needed to go from `level` to `level + 1`: 5 + nivel × 10 + nivel² × 0,6. */
export function xpToNext(level: number): number {
  return Math.round(5 + level * 10 + level * level * 0.6);
}

/** Enemies spawned per second: 1,5 + 0,6·t + 0,05·t². */
export function spawnPerSecond(t: number): number {
  return 1.5 + 0.6 * t + 0.05 * t * t;
}

/** Enemy HP multiplier: 1 + 0,15·t + 0,02·t². */
export function enemyHpMult(t: number): number {
  return 1 + 0.15 * t + 0.02 * t * t;
}

/** Enemy damage multiplier: 1 + 0,08·t. */
export function enemyDamageMult(t: number): number {
  return 1 + 0.08 * t;
}

export function kmAt(t: number): number {
  return t * KM_PER_MINUTE;
}

/**
 * Lucas at the end of a run: GDD formula (km/20 + enemigos/30 + 50 por jefe,
 * × Cuenta RUT) times LUCAS_SCALE. With the GDD values a run bought ~1
 * upgrade and 10 simulated runs never reached the final boss, so rewards are
 * doubled (Phase 4 balance).
 */
export const LUCAS_SCALE = 2;

export function lucasForRun(km: number, kills: number, bosses: number, lucasMult = 1): number {
  return Math.floor((km / 20 + kills / 30 + 50 * bosses) * lucasMult * LUCAS_SCALE);
}

/** Upgrade cost: base × 1,6^nivel, rounded to the nearest 5. */
export function upgradeCost(baseCost: number, level: number): number {
  return Math.round((baseCost * 1.6 ** level) / 5) * 5;
}

export const ENEMY_CAP = { desktop: 300, mobile: 180 } as const;
/** Minutes with a "¡Te rodearon!" ring wave. */
export const RING_WAVES_MIN = [2, 5, 8, 11] as const;
/** Temblor event: once per run, at a random time in this range (minutes). */
export const TEMBLOR_WINDOW_MIN = [4, 10] as const;

export const FOOD = {
  sopaipilla: { xp: 1 },
  completo: { xp: 5 },
  chorrillana: { xp: 25 },
  /** Above this many on the floor, new drops merge into existing ones. */
  mergeAbove: 300,
} as const;

export const PICKUPS = {
  moteConHuesillo: { heal: 30 },
} as const;

export const LEVEL_UP = {
  slowMoScale: 0.3,
  slowMoSeconds: 0.4,
  cards: 3,
  startingRerolls: 2,
  /** Lucas for "Paso". */
  skipLucas: 5,
  /** Cards cannot be picked during this many seconds. */
  pickLockSeconds: 0.4,
  /** Delay between card entrances. */
  cardStaggerSeconds: 0.08,
} as const;

/**
 * `mult` scales trait cards. `weapon*` is what a weapon card of that rarity adds to the weapon
 * for good: damage (0,35 = +35 %), cooldown (−0,1 = 10 % faster, only weapons with a cooldown) and
 * `extra` (+1 projectile / chain, only weapons that have them). It used to be just +10/20/40 %
 * damage, which nobody noticed.
 */
export const RARITY = [
  { id: 'comun', chance: 0.7, mult: 1, weaponDamage: 0, weaponCooldown: 0, weaponExtra: 0 },
  { id: 'rara', chance: 0.22, mult: 1.5, weaponDamage: 0.15, weaponCooldown: 0, weaponExtra: 0 },
  { id: 'epica', chance: 0.07, mult: 2, weaponDamage: 0.35, weaponCooldown: -0.1, weaponExtra: 0 },
  { id: 'legendaria', chance: 0.01, mult: 3, weaponDamage: 0.7, weaponCooldown: -0.15, weaponExtra: 1 },
] as const;

export const CAJA = {
  spinSeconds: 2.5,
  /** Rewards: 1, 3 or 5 upgrades with these odds. */
  rewards: [
    { count: 1, chance: 0.7 },
    { count: 3, chance: 0.25 },
    { count: 5, chance: 0.05 },
  ],
} as const;

export const FIRST_ZONE_BONUS_LUCAS = 100;
