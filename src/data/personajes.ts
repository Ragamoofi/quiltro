/** Player stats and playable characters (GDD "Estadísticas del Quiltro" y "Personajes"). */

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
  | { readonly kind: 'total'; readonly stat: 'sopaipillas' | 'palomas'; readonly cantidad: number }
  | { readonly kind: 'vencer'; readonly jefe: string };

export interface CharacterDef {
  readonly id: string;
  /** i18n key under `personajes.` */
  readonly nameKey: string;
  readonly unlock: UnlockCondition;
  readonly startingWeapon: string;
  /** Changes relative to PLAYER_BASE (multipliers unless stated). */
  readonly mods: {
    readonly speedMult?: number;
    readonly maxHp?: number;
    readonly critBonus?: number;
    readonly areaMult?: number;
    /** Smaller hitbox (Pudú). */
    readonly hitboxMult?: number;
    readonly startingTraits?: readonly { readonly id: string; readonly level: number }[];
    readonly slides?: boolean;
    readonly ignoresHazards?: boolean;
  };
}

export const PERSONAJES: readonly CharacterDef[] = [
  { id: 'quiltro', nameKey: 'personajes.quiltro', unlock: { kind: 'inicio' }, startingWeapon: 'volantin', mods: {} },
  {
    id: 'quiltra',
    nameKey: 'personajes.quiltra',
    unlock: { kind: 'llegarA', ciudad: 'santiago' },
    startingWeapon: 'volantin',
    mods: { speedMult: 0.9, startingTraits: [{ id: 'chalequito', level: 2 }] },
  },
  {
    id: 'gato',
    nameKey: 'personajes.gato',
    unlock: { kind: 'total', stat: 'sopaipillas', cantidad: 5000 },
    startingWeapon: 'cables',
    mods: { critBonus: 0.15, maxHp: 70 },
  },
  {
    id: 'pudu',
    nameKey: 'personajes.pudu',
    unlock: { kind: 'llegarA', ciudad: 'chiloe' },
    startingWeapon: 'rayuela',
    mods: { speedMult: 1.25, hitboxMult: 0.75 },
  },
  {
    id: 'pinguino',
    nameKey: 'personajes.pinguino',
    unlock: { kind: 'vencer', jefe: 'caleuche' },
    startingWeapon: 'chaya',
    mods: { areaMult: 1.3, slides: true },
  },
  {
    id: 'paloma',
    nameKey: 'personajes.paloma',
    unlock: { kind: 'total', stat: 'palomas', cantidad: 10000 },
    startingWeapon: 'fuegos',
    mods: { ignoresHazards: true },
  },
];
