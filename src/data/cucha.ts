/** La Cucha: permanent upgrades and idle neighbours (GDD "Meta incremental"). */
export interface UpgradeEffect {
  readonly maxHp?: number;
  readonly armor?: number;
  readonly speedMult?: number;
  readonly damageMult?: number;
  readonly pickupMult?: number;
  readonly cooldownMult?: number;
  readonly startingKites?: number;
  readonly luck?: number;
  readonly rerolls?: number;
  readonly cards?: number;
  readonly revives?: number;
  readonly lucasMult?: number;
}

export interface UpgradeDef {
  readonly id: string;
  /** i18n key under `cucha.` */
  readonly nameKey: string;
  /** What is drawn inside the Cucha. */
  readonly object: string;
  readonly maxLevel: number;
  readonly baseCost: number;
  readonly perLevel: UpgradeEffect;
}

export const MEJORAS: readonly UpgradeDef[] = [
  { id: 'platoLleno', nameKey: 'cucha.platoLleno', object: 'plato', maxLevel: 5, baseCost: 40, perLevel: { maxHp: 10 } },
  { id: 'frazada', nameKey: 'cucha.frazada', object: 'frazada', maxLevel: 3, baseCost: 120, perLevel: { armor: 1 } },
  { id: 'pelota', nameKey: 'cucha.pelota', object: 'pelota', maxLevel: 5, baseCost: 50, perLevel: { speedMult: 0.05 } },
  { id: 'huesoDeCaracu', nameKey: 'cucha.huesoDeCaracu', object: 'hueso', maxLevel: 5, baseCost: 60, perLevel: { damageMult: 0.06 } },
  { id: 'narizHumeda', nameKey: 'cucha.narizHumeda', object: 'cuadroNariz', maxLevel: 3, baseCost: 40, perLevel: { pickupMult: 0.15 } },
  { id: 'collarNuevo', nameKey: 'cucha.collarNuevo', object: 'collar', maxLevel: 3, baseCost: 150, perLevel: { cooldownMult: -0.05 } },
  { id: 'volantinExtra', nameKey: 'cucha.volantinExtra', object: 'volantinPared', maxLevel: 2, baseCost: 300, perLevel: { startingKites: 1 } },
  { id: 'buenaOnda', nameKey: 'cucha.buenaOnda', object: 'herradura', maxLevel: 5, baseCost: 80, perLevel: { luck: 1 } },
  { id: 'otraMano', nameKey: 'cucha.otraMano', object: 'naipe', maxLevel: 3, baseCost: 100, perLevel: { rerolls: 1 } },
  { id: 'cuartaCarta', nameKey: 'cucha.cuartaCarta', object: 'mesita', maxLevel: 1, baseCost: 600, perLevel: { cards: 1 } },
  { id: 'segundaVida', nameKey: 'cucha.segundaVida', object: 'medalla', maxLevel: 1, baseCost: 800, perLevel: { revives: 1 } },
  { id: 'cuentaRut', nameKey: 'cucha.cuentaRut', object: 'chanchito', maxLevel: 5, baseCost: 100, perLevel: { lucasMult: 0.1 } },
];

export interface NeighbourDef {
  readonly id: string;
  /** i18n key under `vecinos.` */
  readonly nameKey: string;
  /** Lucas to befriend. 0 = available from the start. Placeholder costs, tuned in Phase 4. */
  readonly cost: number;
  /** Lucas per hour this neighbour adds. */
  readonly lucasPerHour: number;
}

export const VECINOS: readonly NeighbourDef[] = [
  { id: 'almacen', nameKey: 'vecinos.almacen', cost: 0, lucasPerHour: 10 },
  { id: 'conserje', nameKey: 'vecinos.conserje', cost: 250, lucasPerHour: 8 },
  { id: 'feria', nameKey: 'vecinos.feria', cost: 600, lucasPerHour: 10 },
  { id: 'tiaOnce', nameKey: 'vecinos.tiaOnce', cost: 1200, lucasPerHour: 12 },
];

export const IDLE = {
  /** Hours of production stored while away. */
  maxHours: 8,
  /** Idle never yields more than this fraction of a good run. */
  maxFractionOfGoodRun: 0.3,
} as const;
