import type { SaveData } from './save.ts';

export const OBJECTIVES = [
  { id: 'temuco', name: 'Camino al sur', target: 2200, reward: 180, progress: (s: SaveData) => Math.floor(s.best.km) },
  { id: 'weapons', name: 'Maestro de armas', target: 3, reward: 240, progress: (s: SaveData) => s.bestiary.evolutions.length },
  { id: 'crew', name: 'La jauría crece', target: 6, reward: 300, progress: (s: SaveData) => s.characters.length },
] as const;

export function rewardObjectives(save: SaveData): number {
  const claimed = new Set(Array.isArray(save.claimedObjectives) ? save.claimedObjectives : []);
  let reward = 0;
  for (const goal of OBJECTIVES) {
    if (claimed.has(goal.id) || goal.progress(save) < goal.target) continue;
    claimed.add(goal.id);
    reward += goal.reward;
  }
  save.claimedObjectives = [...claimed];
  return reward;
}
