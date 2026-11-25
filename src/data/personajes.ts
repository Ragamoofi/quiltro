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
  | { readonly kind: 'vencer'; readonly jefe: string }
  /** Fase 11.14: win the pasaje of this index (1 = Normal, 2 = Hora punta, 3 = Último bus). */
  | { readonly kind: 'pasaje'; readonly ganados: number };

/** The cries a character can have (sound ids of audio/sfx.ts). */
export type VoiceSound = 'guau' | 'miau' | 'yip' | 'balido' | 'rebuzno' | 'arrullo' | 'siseo' | 'relincho' | 'bufido' | 'rugido' | 'bramido' | 'chillido' | 'graznido' | 'ladridoMarino' | 'tamborileo' | 'silbido' | 'chasquido' | 'zumbido' | 'aullido' | 'risa';

export interface CharacterDef {
  readonly id: string;
  /** i18n key under `personajes.` (the name); the passive's text is `personajesPasiva.<id>`. */
  readonly nameKey: string;
  /** Sprite sheet name. */
  readonly sprite: string;
  /** Fase 11.9: the cry of the ¡GUAU! (a sound id) and its pitch. */
  readonly voice?: { sound: VoiceSound; pitch?: number };
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
    mods: { speedMult: 1.05, maxHp: 108, cooldownMult: -0.12, dodgeChance: 0.1 },
  },
  {
    id: 'pudu',
    nameKey: 'personajes.pudu',
    sprite: 'pudu',
    voice: { sound: 'balido' },
    unlock: { kind: 'llegarA', ciudad: 'chiloe' },
    startingWeapon: 'rayuela',
    mods: { speedMult: 1.2, hitboxMult: 0.75, maxHp: 118, damageMult: 0.3, dodgeChance: 0.15 },
  },
  {
    id: 'pinguino',
    nameKey: 'personajes.pinguino',
    sprite: 'pinguino',
    voice: { sound: 'rebuzno' },
    unlock: { kind: 'vencer', jefe: 'caleuche' },
    startingWeapon: 'chaya',
    mods: { areaMult: 1.25, maxHp: 140, armor: 1, slides: true, immuneSlow: true, immuneWind: true },
  },
  {
    id: 'chingue',
    nameKey: 'personajes.chingue',
    sprite: 'chinguePj',
    voice: { sound: 'bufido' },
    unlock: { kind: 'total', stat: 'sopaipillas', cantidad: 5000 },
    startingWeapon: 'elastico',
    mods: { speedMult: 0.95, maxHp: 115, aura: { dps: 12, radius: 36 } },
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
  // ---------------- Fase 11.14: animals of Chile ----------------
  {
    id: 'flamenco',
    nameKey: 'personajes.flamenco',
    sprite: 'flamenco',
    voice: { sound: 'graznido' }, flies: true,
    unlock: { kind: 'llegarA', ciudad: 'antofagasta' },
    startingWeapon: 'chaya',
    mods: { speedMult: 1.05, maxHp: 90, areaMult: 1.2, immuneSlow: true },
  },
  {
    id: 'loboMarino',
    nameKey: 'personajes.loboMarino',
    sprite: 'loboMarinoPj',
    voice: { sound: 'ladridoMarino' },
    unlock: { kind: 'llegarA', ciudad: 'valparaiso' },
    startingWeapon: 'cacerola',
    mods: { speedMult: 0.82, maxHp: 170, armor: 2, slides: true },
  },
  {
    id: 'puma',
    nameKey: 'personajes.puma',
    sprite: 'pumaPj',
    voice: { sound: 'rugido' },
    unlock: { kind: 'vencer', jefe: 'alicanto' },
    startingWeapon: 'pandero',
    mods: { speedMult: 1.12, maxHp: 100, damageMult: 0.25, critBonus: 0.1 },
  },
  {
    id: 'monito',
    nameKey: 'personajes.monito',
    sprite: 'monito',
    voice: { sound: 'chillido' },
    unlock: { kind: 'llegarA', ciudad: 'puertoMontt' },
    startingWeapon: 'bolitas',
    mods: { speedMult: 1.1, maxHp: 65, hitboxMult: 0.7, dodgeChance: 0.2 },
  },
  {
    id: 'chinchilla',
    nameKey: 'personajes.chinchilla',
    sprite: 'chinchilla',
    voice: { sound: 'chillido', pitch: 1.4 },
    unlock: { kind: 'total', stat: 'sopaipillas', cantidad: 2000 },
    startingWeapon: 'trompo',
    mods: { speedMult: 1.25, maxHp: 78, hitboxMult: 0.7, dodgeChance: 0.15 },
  },
  {
    id: 'vizcacha',
    nameKey: 'personajes.vizcacha',
    sprite: 'vizcacha',
    voice: { sound: 'silbido' },
    unlock: { kind: 'total', stat: 'palomas', cantidad: 300 },
    startingWeapon: 'emboque',
    mods: { speedMult: 1.05, maxHp: 90, dodgeChance: 0.15, pickupMult: 0.3 },
  },
  {
    id: 'huemul',
    nameKey: 'personajes.huemul',
    sprite: 'huemul',
    voice: { sound: 'bramido' },
    unlock: { kind: 'llegarA', ciudad: 'coyhaique' },
    startingWeapon: 'boleadora',
    mods: { speedMult: 0.95, maxHp: 130, armor: 2 },
  },
  {
    id: 'carpintero',
    nameKey: 'personajes.carpintero',
    sprite: 'carpintero',
    voice: { sound: 'tamborileo' }, flies: true,
    unlock: { kind: 'total', stat: 'kills', cantidad: 8000 },
    startingWeapon: 'choripan',
    mods: { speedMult: 1.05, maxHp: 80, cooldownMult: -0.15 },
  },
  // ---------------- Fase 11.14: from the rest of the continent ----------------
  {
    id: 'capibara',
    nameKey: 'personajes.capibara',
    sprite: 'capibara',
    voice: { sound: 'chasquido' },
    unlock: { kind: 'llegarA', ciudad: 'chiloe' },
    startingWeapon: 'sopaipillaCaliente',
    mods: { speedMult: 0.9, maxHp: 130, armor: 1, startingTraits: [{ id: 'siesta', level: 2 }], healEvery: { kills: 60, amount: 4 } },
  },
  {
    id: 'llama',
    nameKey: 'personajes.llama',
    sprite: 'llamaPj',
    voice: { sound: 'zumbido' },
    unlock: { kind: 'total', stat: 'kills', cantidad: 15000 },
    startingWeapon: 'bolitas',
    mods: { speedMult: 1, maxHp: 140, damageMult: 0.2, pickupMult: 0.3 },
  },
  {
    id: 'tucan',
    nameKey: 'personajes.tucan',
    sprite: 'tucan',
    voice: { sound: 'graznido', pitch: 1.5 }, flies: true,
    unlock: { kind: 'total', stat: 'sopaipillas', cantidad: 10000 },
    startingWeapon: 'fuegos',
    mods: { speedMult: 1.1, maxHp: 100, critBonus: 0.1, ignoresHazards: true },
  },
  {
    id: 'jaguar',
    nameKey: 'personajes.jaguar',
    sprite: 'jaguar',
    voice: { sound: 'rugido', pitch: 0.8 },
    unlock: { kind: 'total', stat: 'kills', cantidad: 30000 },
    startingWeapon: 'elastico',
    mods: { speedMult: 1.05, maxHp: 112, damageMult: 0.35, critBonus: 0.1 },
  },
  // ---------------- Fase 11.14: special ones (myth and folklore), opened by the pasajes ----------------
  {
    id: 'caleuchito',
    nameKey: 'personajes.caleuchito',
    sprite: 'caleuchito',
    voice: { sound: 'aullido' }, flies: true,
    unlock: { kind: 'pasaje', ganados: 1 },
    startingWeapon: 'cables',
    mods: { speedMult: 1.05, maxHp: 70, dodgeChance: 0.25, ignoresHazards: true },
  },
  {
    id: 'dieciocho',
    nameKey: 'personajes.dieciocho',
    sprite: 'dieciocho',
    voice: { sound: 'guau', pitch: 1.1 },
    unlock: { kind: 'total', stat: 'sopaipillas', cantidad: 30000 },
    startingWeapon: 'volantin',
    mods: { maxHp: 100, startingTraits: [{ id: 'laJauria', level: 2 }] },
  },
  {
    id: 'pillan',
    nameKey: 'personajes.pillan',
    sprite: 'pillan',
    voice: { sound: 'guau', pitch: 0.7 },
    unlock: { kind: 'pasaje', ganados: 2 },
    startingWeapon: 'sopaipillaCaliente',
    mods: { maxHp: 100, damageMult: 0.1, aura: { dps: 14, radius: 38 } },
  },
  {
    id: 'trauco',
    nameKey: 'personajes.trauco',
    sprite: 'trauco',
    voice: { sound: 'risa' },
    unlock: { kind: 'pasaje', ganados: 3 },
    startingWeapon: 'pandero',
    mods: { speedMult: 0.9, maxHp: 110, hitboxMult: 0.8, damageMult: 0.3 },
  },
];
