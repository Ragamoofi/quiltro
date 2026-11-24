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
];
