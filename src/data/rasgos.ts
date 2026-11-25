/** Traits (pasivas). Effect per level, up to 5 (GDD "Rasgos"). */
export interface TraitEffect {
  /** Multipliers as fractions: 0.08 = +8 %. */
  readonly speedMult?: number;
  readonly armor?: number;
  readonly maxHp?: number;
  /** HP per second. */
  readonly regen?: number;
  readonly areaMult?: number;
  readonly damageMult?: number;
  readonly cooldownMult?: number;
  readonly pickupMult?: number;
  /** Extra projectiles for all weapons, only at the listed levels. */
  readonly projectilesAtLevels?: readonly number[];
  /** Added to the critical chance (0.05 = +5 points). */
  readonly critChance?: number;
  /** Speed bonus for 2 s after every enemy taken down (Cola alegre). */
  readonly killHaste?: number;
  /** HP per second while standing still (Siesta). */
  readonly restRegen?: number;
  /** Extra experience from food (Hambre de lunes). */
  readonly xpMult?: number;
  /** Cascabel: each point widens the ring in which enemies are pushed away. */
  readonly bell?: number;
  /** Manada chica: one more friendly dog (bites on its own) at each listed level. */
  readonly petsAtLevels?: readonly number[];
}

export interface TraitDef {
  readonly id: string;
  /** i18n keys under `rasgos.<id>` (nombre, carta). */
  readonly i18n: string;
  readonly maxLevel: number;
  readonly perLevel: TraitEffect;
}

export const MAX_TRAITS = 4;

export const RASGOS: readonly TraitDef[] = [
  { id: 'pataDePerro', i18n: 'rasgos.pataDePerro', maxLevel: 5, perLevel: { speedMult: 0.08 } },
  { id: 'chalequito', i18n: 'rasgos.chalequito', maxLevel: 5, perLevel: { armor: 1 } },
  { id: 'laOnce', i18n: 'rasgos.laOnce', maxLevel: 5, perLevel: { maxHp: 20, regen: 0.3 } },
  { id: 'cachai', i18n: 'rasgos.cachai', maxLevel: 5, perLevel: { areaMult: 0.1 } },
  { id: 'choro', i18n: 'rasgos.choro', maxLevel: 5, perLevel: { damageMult: 0.1 } },
  { id: 'laJauria', i18n: 'rasgos.laJauria', maxLevel: 5, perLevel: { projectilesAtLevels: [2, 4] } },
  { id: 'alTiro', i18n: 'rasgos.alTiro', maxLevel: 5, perLevel: { cooldownMult: -0.08 } },
  { id: 'olfato', i18n: 'rasgos.olfato', maxLevel: 5, perLevel: { pickupMult: 0.25 } },
  // Fase 9.5
  { id: 'colmillo', i18n: 'rasgos.colmillo', maxLevel: 5, perLevel: { critChance: 0.05 } },
  { id: 'colaAlegre', i18n: 'rasgos.colaAlegre', maxLevel: 5, perLevel: { killHaste: 0.06 } },
  { id: 'siesta', i18n: 'rasgos.siesta', maxLevel: 5, perLevel: { restRegen: 1.5 } },
  { id: 'hambreDeLunes', i18n: 'rasgos.hambreDeLunes', maxLevel: 5, perLevel: { xpMult: 0.08 } },
  { id: 'cascabel', i18n: 'rasgos.cascabel', maxLevel: 5, perLevel: { bell: 1 } },
  { id: 'manadaChica', i18n: 'rasgos.manadaChica', maxLevel: 5, perLevel: { petsAtLevels: [1, 3, 5] } },
];
