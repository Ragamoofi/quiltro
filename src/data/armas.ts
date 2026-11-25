/**
 * Weapons ("juegos típicos"). Values from the GDD table; systems read only this.
 * `perLevel` is applied once for every level above 1 (levels 2..5) unless a
 * weapon lists explicit `levels`.
 */
export interface WeaponStats {
  readonly damage: number;
  /** Projectiles / kites / sparks fired together. */
  readonly count?: number;
  /** Seconds between shots. */
  readonly cooldown?: number;
  readonly bounces?: number;
  readonly chains?: number;
  /** Seconds a trail or effect lasts. */
  readonly duration?: number;
  /** Seconds between damage ticks. */
  readonly tick?: number;
  /** 0..1 slow applied to enemies. */
  readonly slow?: number;
  /** Radius in px. */
  readonly area?: number;
  readonly knockback?: number;
}

/** Increments per level: additive for counts, multipliers for the rest (0.2 = +20 %). */
export interface WeaponLevelUp {
  readonly count?: number;
  readonly bounces?: number;
  readonly chains?: number;
  readonly damageMult?: number;
  readonly cooldownMult?: number;
  readonly durationMult?: number;
  readonly areaMult?: number;
}

export interface WeaponDef {
  readonly id: string;
  /** i18n keys under `armas.<id>` */
  readonly i18n: string;
  readonly maxLevel: number;
  /** ¡GUAU! is always equipped and takes no slot. */
  readonly takesSlot: boolean;
  readonly base: WeaponStats;
  readonly perLevel?: WeaponLevelUp;
  /** Explicit increments for level 2, 3, 4, 5 (index 0 = level 2). */
  readonly levels?: readonly WeaponLevelUp[];
  /** Trait that evolves it (see evoluciones.ts). */
  readonly evolvesWith: string;
}

export const MAX_WEAPONS = 4;

/** Volantín orbit numbers (GDD "Dar hilo y el ¡GUAU!"). */
export const VOLANTIN_ORBIT = {
  shortRadius: 70,
  shortTurnsPerSecond: 2.4,
  /** Extra damage while the line is short. */
  shortDamageBonus: 0.25,
  longRadius: 180,
  longTurnsPerSecond: 1.1,
  /** Seconds to open the orbit when holding. */
  openTime: 0.35,
  /** Camera zooms out this much while holding. */
  cameraZoomOut: 0.15,
  /** Player speed multiplier while holding. */
  holdSpeedMult: 0.85,
} as const;

export const GUAU = {
  /** Seconds holding to fill the charge ring. */
  chargeTime: 1.5,
  radius: 220,
  damage: 30,
  cooldown: 6,
} as const;

export const ARMAS: readonly WeaponDef[] = [
  {
    id: 'volantin',
    i18n: 'armas.volantin',
    maxLevel: 5,
    takesSlot: true,
    // Fase 9.2: 8 → 12 and +20 % → +40 % per damage level. The bot measured the kite at ~1/25 of
    // the fireworks' damage and ~1/5 of the average weapon.
    // Fase 11.10: one kite to start; every level adds one (five at level 5), and La jauría more.
    base: { damage: 20, count: 1 },
    levels: [{ count: 1 }, { count: 1, damageMult: 0.25 }, { count: 1 }, { count: 1, damageMult: 0.35 }],
    evolvesWith: 'laOnce',
  },
  {
    id: 'trompo',
    i18n: 'armas.trompo',
    maxLevel: 5,
    takesSlot: true,
    base: { damage: 14, count: 1, cooldown: 1.2, bounces: 2 },
    perLevel: { count: 1, bounces: 1, cooldownMult: -0.1 },
    evolvesWith: 'laJauria',
  },
  {
    id: 'cables',
    i18n: 'armas.cables',
    maxLevel: 5,
    takesSlot: true,
    base: { damage: 18, chains: 3, cooldown: 2.2 },
    perLevel: { chains: 1, damageMult: 0.15 },
    evolvesWith: 'cachai',
  },
  {
    id: 'chaya',
    i18n: 'armas.chaya',
    maxLevel: 5,
    takesSlot: true,
    base: { damage: 5, tick: 0.25, duration: 2, slow: 0.4 },
    perLevel: { durationMult: 0.3, damageMult: 0.25 },
    evolvesWith: 'chalequito',
  },
  {
    id: 'fuegos',
    i18n: 'armas.fuegos',
    maxLevel: 5,
    takesSlot: true,
    // Fase 9.2: 20 → 14. The bot measured ~50.000 damage per minute, 25 times the kite.
    base: { damage: 14, count: 2, cooldown: 1.6, area: 40 },
    perLevel: { count: 1, areaMult: 0.2 },
    evolvesWith: 'choro',
  },
  {
    id: 'rayuela',
    i18n: 'armas.rayuela',
    maxLevel: 5,
    takesSlot: true,
    base: { damage: 36, count: 1, cooldown: 1.8 },
    perLevel: { count: 1, damageMult: 0.2 },
    evolvesWith: 'pataDePerro',
  },
  // Fase 9.5: cuatro juegos de barrio más.
  {
    id: 'bolitas',
    i18n: 'armas.bolitas',
    maxLevel: 5,
    takesSlot: true,
    base: { damage: 11, count: 4, cooldown: 1.4, bounces: 1 },
    perLevel: { count: 1, damageMult: 0.15 },
    evolvesWith: 'colmillo',
  },
  {
    id: 'emboque',
    i18n: 'armas.emboque',
    maxLevel: 5,
    takesSlot: true,
    base: { damage: 22, count: 1, cooldown: 2, area: 150 },
    levels: [{ damageMult: 0.2 }, { count: 1, cooldownMult: -0.08 }, { damageMult: 0.2 }, { count: 1, areaMult: 0.15 }],
    evolvesWith: 'hambreDeLunes',
  },
  {
    id: 'elastico',
    i18n: 'armas.elastico',
    maxLevel: 5,
    takesSlot: true,
    base: { damage: 15, count: 1, cooldown: 2.4, duration: 1.2, area: 70, tick: 0.3 },
    levels: [{ areaMult: 0.15 }, { count: 1, damageMult: 0.15 }, { durationMult: 0.2 }, { count: 1, areaMult: 0.15 }],
    evolvesWith: 'cascabel',
  },
  {
    id: 'ronda',
    i18n: 'armas.ronda',
    maxLevel: 5,
    takesSlot: true,
    base: { damage: 17, count: 1, cooldown: 2.6, area: 90 },
    levels: [{ areaMult: 0.15, damageMult: 0.1 }, { count: 1 }, { damageMult: 0.2 }, { count: 1, areaMult: 0.15 }],
    evolvesWith: 'manadaChica',
  },
  // Fase 11.5
  {
    id: 'choripan',
    i18n: 'armas.choripan',
    maxLevel: 5,
    takesSlot: true,
    base: { damage: 16, count: 1, cooldown: 1.9, bounces: 2 },
    levels: [{ damageMult: 0.15 }, { count: 1 }, { bounces: 1, damageMult: 0.1 }, { count: 1, damageMult: 0.15 }],
    evolvesWith: 'mate',
  },
  {
    id: 'pandero',
    i18n: 'armas.pandero',
    maxLevel: 5,
    takesSlot: true,
    base: { damage: 40, cooldown: 2.2, area: 95 },
    levels: [{ areaMult: 0.15 }, { damageMult: 0.2 }, { cooldownMult: -0.1, areaMult: 0.15 }, { damageMult: 0.25 }],
    evolvesWith: 'cucharaDePalo',
  },
  {
    id: 'cacerola',
    i18n: 'armas.cacerola',
    maxLevel: 5,
    takesSlot: true,
    base: { damage: 52, cooldown: 2.6, area: 85 },
    levels: [{ areaMult: 0.15 }, { damageMult: 0.2 }, { cooldownMult: -0.12 }, { areaMult: 0.2, damageMult: 0.2 }],
    evolvesWith: 'poncho',
  },
  {
    id: 'boleadora',
    i18n: 'armas.boleadora',
    maxLevel: 5,
    takesSlot: true,
    base: { damage: 26, count: 1, cooldown: 3.2, duration: 3, tick: 0.3, area: 95, slow: 0.35 },
    levels: [{ damageMult: 0.2 }, { count: 1 }, { durationMult: 0.25 }, { count: 1, damageMult: 0.2 }],
    evolvesWith: 'cachana',
  },
  {
    id: 'sopaipillaCaliente',
    i18n: 'armas.sopaipillaCaliente',
    maxLevel: 5,
    takesSlot: true,
    base: { damage: 6.5, count: 2, cooldown: 2.6, duration: 3, tick: 0.4, area: 26 },
    levels: [{ damageMult: 0.2 }, { count: 1 }, { areaMult: 0.2, durationMult: 0.2 }, { count: 1, damageMult: 0.2 }],
    evolvesWith: 'chasquilla',
  },
  {
    id: 'guau',
    i18n: 'armas.guau',
    maxLevel: 5,
    takesSlot: false,
    base: { damage: GUAU.damage, cooldown: GUAU.cooldown, area: GUAU.radius },
    // −0.6 s per level expressed as a fraction of the 6 s base.
    perLevel: { damageMult: 0.25, areaMult: 0.25, cooldownMult: -0.1 },
    evolvesWith: 'alTiro',
  },
];
