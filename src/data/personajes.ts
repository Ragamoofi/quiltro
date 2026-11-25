/** Player stats and playable characters (GDD "Estadísticas del Quiltro" y "Personajes"; Fase 10 amplía y reordena). */

export interface PlayerStats {
  readonly maxHp: number;
  /** px/s */
  readonly speed: number;
  /** Pickup radius in px ("olfato"). */
  readonly pickupRadius: number;
  readonly armor: number;
  /** 0..1 */
  readonly critChance: number;
  readonly critMultiplier: number;
  /** Seconds of invulnerability after a hit. */
  readonly invulnerability: number;
  /** Multipliers applied on top of everything else. */
  readonly areaMult: number;
}

export const PLAYER_BASE: PlayerStats = {
  maxHp: 100,
  speed: 210,
  pickupRadius: 60,
  armor: 0,
  critChance: 0.05,
  critMultiplier: 2,
  invulnerability: 0.5,
  areaMult: 1,
};

export type UnlockCondition =
  | { readonly kind: 'inicio' }
  | { readonly kind: 'llegarA'; readonly ciudad: string }
  | { readonly kind: 'total'; readonly stat: 'sopaipillas' | 'palomas' | 'kills'; readonly cantidad: number }
  | { readonly kind: 'vencer'; readonly jefe: string };

export interface CharacterDef {
  readonly id: string;
  /** i18n key under `personajes.` (the name); the passive's text is `personajesPasiva.<id>`. */
  readonly nameKey: string;
  /** Sprite sheet name. */
  readonly sprite: string;
  /** Fase 11.9: the cry of the ¡GUAU! (a sound id) and its pitch. */
  readonly voice?: { sound: 'guau' | 'miau' | 'yip' | 'balido' | 'rebuzno' | 'arrullo' | 'siseo' | 'relincho' | 'bufido'; pitch?: number };
  /** Fase 11.9: flies instead of walking (its shadow stays on the ground). */
  readonly flies?: boolean;
  readonly unlock: UnlockCondition;
  readonly startingWeapon: string;
  /** Changes relative to PLAYER_BASE (multipliers unless stated). */
  readonly mods: {
    readonly speedMult?: number;
    /** Absolute max HP (default 100). */
    readonly maxHp?: number;
    readonly critBonus?: number;
    readonly areaMult?: number;
    /** Added to the damage multiplier (0.2 = +20 %). */
    readonly damageMult?: number;
    /** Added to the cooldown multiplier (−0.12 = 12 % faster). */
    readonly cooldownMult?: number;
    readonly armor?: number;
    /** Added to the pickup radius multiplier (0.6 = ×1.6). */
    readonly pickupMult?: number;
    /** Smaller hitbox (Pudú). */
    readonly hitboxMult?: number;
    readonly startingTraits?: readonly { readonly id: string; readonly level: number }[];
    readonly slides?: boolean;
    readonly ignoresHazards?: boolean;
    // ---- Unique passives (Fase 10.1) ----
    /** Quiltro: the ¡GUAU! comes back this much faster (−0.2 = 20 % less cooldown). */
    readonly guauCooldownMult?: number;
    /** Quiltra: heals `amount` HP every `kills` enemies taken down. */
    readonly healEvery?: { readonly kills: number; readonly amount: number };
    /** Gato: extra second lives per trip. */
    readonly extraRevives?: number;
    /** Zorro and Pudú: chance (0..1) of dodging a hit altogether. */
    readonly dodgeChance?: number;
    /** Pingüino: not slowed by anything and not pushed by the wind. */
    readonly immuneSlow?: boolean;
    readonly immuneWind?: boolean;
    /** Chingue: enemies close to the dog take this much damage per second. */
    readonly aura?: { readonly dps: number; readonly radius: number };
    /** Guanaco: a free shield every this many seconds. */
    readonly shieldEvery?: number;
  };
}

/**
 * Ten characters, ordered from the easiest unlock to the hardest. Every one starts with a
 * different weapon and has a passive of its own; the costs (less HP, slower…) keep them even.
 */
export const PERSONAJES: readonly CharacterDef[] = [
  {
    id: 'quiltro',
    nameKey: 'personajes.quiltro',
    sprite: 'quiltro',
    unlock: { kind: 'inicio' },
    startingWeapon: 'volantin',
    mods: { guauCooldownMult: -0.2 },
  },
  {
    id: 'quiltra',
    nameKey: 'personajes.quiltra',
    sprite: 'quiltra',
    voice: { sound: 'guau', pitch: 1.25 },
    unlock: { kind: 'llegarA', ciudad: 'santiago' },
    startingWeapon: 'ronda',
    mods: { speedMult: 0.92, maxHp: 100, startingTraits: [{ id: 'chalequito', level: 1 }], healEvery: { kills: 40, amount: 5 } },
  },
  {
    id: 'gato',
    nameKey: 'personajes.gato',
    sprite: 'gato',
    voice: { sound: 'miau' },
    unlock: { kind: 'total', stat: 'kills', cantidad: 3000 },
    startingWeapon: 'cables',
    mods: { critBonus: 0.15, maxHp: 70, extraRevives: 1 },
  },
  {
    id: 'zorro',
    nameKey: 'personajes.zorro',
    sprite: 'zorro',
    voice: { sound: 'yip' },
    unlock: { kind: 'llegarA', ciudad: 'temuco' },
    startingWeapon: 'emboque',
    mods: { speedMult: 1.05, maxHp: 95, cooldownMult: -0.12, dodgeChance: 0.1 },
  },
  {
    id: 'pudu',
    nameKey: 'personajes.pudu',
    sprite: 'pudu',
    voice: { sound: 'balido' },
    unlock: { kind: 'llegarA', ciudad: 'chiloe' },
    startingWeapon: 'rayuela',
    mods: { speedMult: 1.2, hitboxMult: 0.75, maxHp: 105, damageMult: 0.3, dodgeChance: 0.15 },
  },
  {
    id: 'pinguino',
    nameKey: 'personajes.pinguino',
    sprite: 'pinguino',
    voice: { sound: 'rebuzno' },
    unlock: { kind: 'vencer', jefe: 'caleuche' },
    startingWeapon: 'chaya',
    mods: { areaMult: 1.25, maxHp: 115, armor: 1, slides: true, immuneSlow: true, immuneWind: true },
  },
  {
    id: 'chingue',
    nameKey: 'personajes.chingue',
    sprite: 'chinguePj',
    voice: { sound: 'bufido' },
    unlock: { kind: 'total', stat: 'sopaipillas', cantidad: 5000 },
    startingWeapon: 'elastico',
    mods: { speedMult: 0.95, maxHp: 100, aura: { dps: 10, radius: 34 } },
  },
  {
    id: 'condor',
    nameKey: 'personajes.condor',
    sprite: 'condor',
    voice: { sound: 'siseo' }, flies: true,
    unlock: { kind: 'vencer', jefe: 'taco' },
    startingWeapon: 'trompo',
    mods: { speedMult: 0.9, maxHp: 75, damageMult: 0.2, pickupMult: 0.6 },
  },
  {
    id: 'guanaco',
    nameKey: 'personajes.guanaco',
    sprite: 'guanacoPj',
    voice: { sound: 'relincho' },
    unlock: { kind: 'llegarA', ciudad: 'puntaArenas' },
    startingWeapon: 'bolitas',
    mods: { speedMult: 0.88, maxHp: 140, armor: 1, shieldEvery: 30 },
  },
  {
    id: 'paloma',
    nameKey: 'personajes.paloma',
    sprite: 'palomaRebelde',
    voice: { sound: 'arrullo' }, flies: true,
    unlock: { kind: 'vencer', jefe: 'caiCai' },
    startingWeapon: 'fuegos',
    mods: { speedMult: 1.1, maxHp: 110, damageMult: 0.15, ignoresHazards: true },
  },
];
