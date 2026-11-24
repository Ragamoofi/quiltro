/** Weapon level 5 + paired trait (any level) → evolution at the next Caja del Almacén. */
export interface EvolutionDef {
  readonly id: string;
  /** i18n key under `evoluciones.` */
  readonly nameKey: string;
  readonly weapon: string;
  readonly trait: string;
  /** Free-form numbers the evolution system reads. */
  readonly params: Readonly<Record<string, number>>;
}

export const EVOLUCIONES: readonly EvolutionDef[] = [
  {
    id: 'cieloDelDieciocho',
    nameKey: 'evoluciones.cieloDelDieciocho',
    weapon: 'volantin',
    trait: 'laOnce',
    params: { kites: 8, healPerKill: 1, cuecaSeconds: 20 },
  },
  { id: 'trompoTornado', nameKey: 'evoluciones.trompoTornado', weapon: 'trompo', trait: 'laJauria', params: {} },
  { id: 'apagon', nameKey: 'evoluciones.apagon', weapon: 'cables', trait: 'cachai', params: {} },
  { id: 'carnaval', nameKey: 'evoluciones.carnaval', weapon: 'chaya', trait: 'chalequito', params: {} },
  {
    id: 'anoNuevoEnValpo',
    nameKey: 'evoluciones.anoNuevoEnValpo',
    weapon: 'fuegos',
    trait: 'choro',
    params: { extraRockets: 3 },
  },
  { id: 'persigueAutos', nameKey: 'evoluciones.persigueAutos', weapon: 'rayuela', trait: 'pataDePerro', params: {} },
  { id: 'aullidoDeLas12', nameKey: 'evoluciones.aullidoDeLas12', weapon: 'guau', trait: 'alTiro', params: {} },
];
