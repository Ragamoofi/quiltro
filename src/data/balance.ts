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

/** Lucas at the end of a run: km/20 + enemigos/30 + 50 por jefe, × Cuenta RUT. */
export function lucasForRun(km: number, kills: number, bosses: number, lucasMult = 1): number {
  return Math.floor((km / 20 + kills / 30 + 50 * bosses) * lucasMult);
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

export const RARITY = [
  { id: 'comun', chance: 0.7, mult: 1 },
  { id: 'rara', chance: 0.22, mult: 1.5 },
  { id: 'epica', chance: 0.07, mult: 2 },
  { id: 'legendaria', chance: 0.01, mult: 3 },
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
