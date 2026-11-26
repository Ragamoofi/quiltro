import { ARMAS } from '../data/armas.ts';
import { EVOLUCIONES, type EvolutionDef } from '../data/evoluciones.ts';
import type { Build } from './build.ts';

export interface EvolutionProgress {
  evolution: EvolutionDef;
  level: number;
  maxLevel: number;
  hasTrait: boolean;
  status: 'evolved' | 'ready' | 'building' | 'missing';
}

/** Read-only recipe journal; never consumes a chest, alters a build or uses random numbers. */
export function evolutionProgress(build: Build): EvolutionProgress[] {
  const rank = { ready: 0, building: 1, evolved: 2, missing: 3 };
  return EVOLUCIONES.map(evolution => {
    const weapon = build.weapon(evolution.weapon);
    const level = weapon?.level ?? 0;
    const maxLevel = weapon?.def.maxLevel ?? ARMAS.find(w => w.id === evolution.weapon)?.maxLevel ?? 5;
    const hasTrait = !!build.trait(evolution.trait);
    const status: EvolutionProgress['status'] = build.evolved.has(evolution.weapon) ? 'evolved'
      : level >= maxLevel && hasTrait ? 'ready'
        : weapon || hasTrait ? 'building' : 'missing';
    return { evolution, level, maxLevel, hasTrait, status };
  }).sort((a, b) => rank[a.status] - rank[b.status]);
}
