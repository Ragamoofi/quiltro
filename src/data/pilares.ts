/**
 * Pilares: cada rasgo pertenece a un pilar, y los niveles que sumes en un pilar
 * (en todos sus rasgos) desbloquean bonos de set, como en Megabonk.
 * Con dos rasgos por pilar el máximo es 10 puntos (dos rasgos al nivel 5).
 */
export interface PillarBonus {
  /** Fractions: 0.1 = +10 %. */
  readonly critChance?: number;
  readonly maxHp?: number;
  readonly xpMult?: number;
  readonly areaMult?: number;
  /** Extra projectiles for every weapon. */
  readonly projectiles?: number;
  /** A shield that absorbs one hit, back every this many seconds. */
  readonly shieldEvery?: number;
}

export interface PillarDef {
  readonly id: string;
  /** i18n key under `pilares.` (nombre, bono1, bono2). */
  readonly i18n: string;
  /** Palette char for its colour in cards and the HUD. */
  readonly color: string;
  readonly traits: readonly string[];
  /** Bonus at each of the PILLAR_POINTS thresholds. Only the highest tier reached counts (it replaces the lower one, it does not add to it). */
  readonly tiers: readonly [PillarBonus, PillarBonus];
}

/** Points (summed trait levels) needed for each tier. */
export const PILLAR_POINTS = [3, 7] as const;

export const PILARES: readonly PillarDef[] = [
  {
    id: 'garra',
    i18n: 'pilares.garra',
    color: 'r',
    traits: ['choro', 'alTiro', 'colmillo'],
    tiers: [{ critChance: 0.1 }, { critChance: 0.25 }],
  },
  {
    id: 'aguante',
    i18n: 'pilares.aguante',
    color: 'T',
    traits: ['chalequito', 'laOnce', 'siesta'],
    tiers: [{ maxHp: 25 }, { maxHp: 50, shieldEvery: 40 }],
  },
  {
    id: 'olfato',
    i18n: 'pilares.olfato',
    color: 'A',
    traits: ['olfato', 'pataDePerro', 'hambreDeLunes', 'colaAlegre'],
    tiers: [{ xpMult: 0.1 }, { xpMult: 0.25 }],
  },
  {
    id: 'barrio',
    i18n: 'pilares.barrio',
    color: 'b',
    traits: ['laJauria', 'cachai', 'cascabel', 'manadaChica'],
    tiers: [{ areaMult: 0.12 }, { areaMult: 0.12, projectiles: 1 }],
  },
];

export function pillarOf(traitId: string): PillarDef | undefined {
  return PILARES.find((p) => p.traits.includes(traitId));
}

/** How many tiers a pillar has reached with this many points (0, 1 or 2). */
export function pillarTier(points: number): number {
  return PILLAR_POINTS.filter((p) => points >= p).length;
}
