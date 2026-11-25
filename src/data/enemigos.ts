/**
 * Enemies (GDD "Enemigos"). Behaviour ids are implemented in game/systems.
 * Fase 9.2c: the micro's damage is 18 → 14 and the lobo marino's 20 → 15, HP 140 → 110: the bot
 * measured the Centro as the new wall and these two caused two thirds of the damage taken there.
 */
export type Drop = 'sopaipilla' | 'completo' | 'chorrillana' | 'robado';

export interface EnemyDef {
  readonly id: string;
  /** i18n key under `enemigos.` */
  readonly nameKey: string;
  readonly zone: 'norte' | 'centro' | 'sur' | 'patagonia';
  readonly behavior: string;
  readonly hp: number;
  /** px/s while moving normally. */
  readonly speed: number;
  /** px/s during a dive / charge, if any. */
  readonly attackSpeed?: number;
  readonly damage: number;
  readonly drop: Drop;
  /** Sprite size in px (collision radius derives from it). */
  readonly size: number;
  /** Behaviour-specific numbers. */
  readonly params?: Readonly<Record<string, number>>;
}

export const ENEMIGOS: readonly EnemyDef[] = [
  { id: 'zancudo', nameKey: 'enemigos.zancudo', zone: 'norte', behavior: 'perseguir', hp: 6, speed: 120, damage: 5, drop: 'sopaipilla', size: 12 },
  { id: 'jote', nameKey: 'enemigos.jote', zone: 'norte', behavior: 'picada', hp: 18, speed: 90, attackSpeed: 340, damage: 10, drop: 'sopaipilla', size: 16, params: { diveEvery: 4 } },
  { id: 'guanaco', nameKey: 'enemigos.guanaco', zone: 'norte', behavior: 'escupir', hp: 26, speed: 70, damage: 8, drop: 'completo', size: 24 },
  { id: 'paloma', nameKey: 'enemigos.paloma', zone: 'centro', behavior: 'bandada', hp: 10, speed: 140, damage: 6, drop: 'sopaipilla', size: 12, params: { flockMin: 8, flockMax: 15 } },
  { id: 'micro', nameKey: 'enemigos.micro', zone: 'centro', behavior: 'embestir', hp: 60, speed: 40, attackSpeed: 420, damage: 14, drop: 'completo', size: 32, params: { hornTime: 0.8 } },
  // Fase 10.4: Santiago.
  { id: 'colectivo', nameKey: 'enemigos.colectivo', zone: 'centro', behavior: 'embestir', hp: 40, speed: 70, attackSpeed: 380, damage: 12, drop: 'completo', size: 24, params: { hornTime: 0.55 } },
  { id: 'rata', nameKey: 'enemigos.rata', zone: 'centro', behavior: 'perseguir', hp: 8, speed: 115, damage: 5, drop: 'sopaipilla', size: 10 },
  { id: 'gaviota', nameKey: 'enemigos.gaviota', zone: 'centro', behavior: 'robar', hp: 20, speed: 160, damage: 4, drop: 'robado', size: 16 },
  { id: 'loboMarino', nameKey: 'enemigos.loboMarino', zone: 'centro', behavior: 'aplastar', hp: 110, speed: 45, damage: 15, drop: 'chorrillana', size: 32 },
  { id: 'chonchon', nameKey: 'enemigos.chonchon', zone: 'sur', behavior: 'ondas', hp: 22, speed: 130, damage: 8, drop: 'sopaipilla', size: 16 },
  { id: 'camahueto', nameKey: 'enemigos.camahueto', zone: 'sur', behavior: 'cargar', hp: 80, speed: 60, attackSpeed: 360, damage: 16, drop: 'completo', size: 24 },
  { id: 'basilisco', nameKey: 'enemigos.basilisco', zone: 'sur', behavior: 'mirada', hp: 50, speed: 75, damage: 10, drop: 'completo', size: 24, params: { slow: 0.3, gazeTime: 1 } },
  { id: 'tempano', nameKey: 'enemigos.tempano', zone: 'patagonia', behavior: 'partirse', hp: 120, speed: 40, damage: 14, drop: 'chorrillana', size: 24, params: { pieces: 3 } },
  { id: 'chingue', nameKey: 'enemigos.chingue', zone: 'patagonia', behavior: 'zigzag', hp: 35, speed: 150, damage: 8, drop: 'completo', size: 16, params: { cloudSeconds: 3 } },
];

/**
 * Enemies that never spawn on their own: the témpano's pieces and the puma
 * (Patagonia's elite). Values not in the GDD; chosen to match their roles.
 */
export const ENEMIGOS_ESPECIALES: readonly EnemyDef[] = [
  { id: 'tempanito', nameKey: 'enemigos.tempano', zone: 'patagonia', behavior: 'perseguir', hp: 25, speed: 70, damage: 7, drop: 'sopaipilla', size: 12 },
  { id: 'puma', nameKey: 'enemigos.puma', zone: 'patagonia', behavior: 'acechar', hp: 60, speed: 90, attackSpeed: 380, damage: 18, drop: 'chorrillana', size: 24 },
];

/** Boss hitboxes are enemies too, with this behaviour (moved by the boss). */
export const PARTE_DE_JEFE: EnemyDef = {
  id: 'parte',
  nameKey: 'enemigos.zancudo',
  zone: 'norte',
  behavior: 'parte',
  hp: 1e9,
  speed: 0,
  damage: 15,
  drop: 'sopaipilla',
  size: 24,
};

/** Elite rules (GDD "Élites"). */
export const ELITE = {
  hpMult: 5,
  sizeMult: 1.3,
  /** Seconds between elites. */
  every: 60,
  /** Patagonia's elite is a special enemy. */
  patagoniaElite: 'puma',
} as const;
