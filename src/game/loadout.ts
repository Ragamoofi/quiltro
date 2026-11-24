import { PERSONAJES, PLAYER_BASE, type CharacterDef } from '../data/personajes.ts';
import type { MetaBonus } from '../meta/progress.ts';
import type { BaseMods } from './build.ts';

/** What a run starts with: the chosen character, La Cucha's upgrades and the bandana. */
export interface Loadout {
  character: CharacterDef;
  meta: MetaBonus;
  bandana: string;
  /** Achievements already earned (so they are not announced again). */
  known: readonly string[];
}

export const NO_META: MetaBonus = {
  maxHp: 0,
  armor: 0,
  speedMult: 0,
  damageMult: 0,
  pickupMult: 0,
  cooldownMult: 0,
  startingKites: 0,
  luck: 0,
  rerolls: 0,
  cards: 0,
  revives: 0,
  lucasMult: 0,
};

export function defaultLoadout(): Loadout {
  return { character: PERSONAJES[0] as CharacterDef, meta: NO_META, bandana: 'b', known: [] };
}

/** Character traits + permanent upgrades as the build's starting bonuses. */
export function baseMods(l: Loadout): BaseMods {
  const c = l.character.mods;
  return {
    speedMult: l.meta.speedMult + ((c.speedMult ?? 1) - 1),
    armor: l.meta.armor,
    maxHp: l.meta.maxHp + ((c.maxHp ?? PLAYER_BASE.maxHp) - PLAYER_BASE.maxHp),
    areaMult: (c.areaMult ?? 1) - 1,
    damageMult: l.meta.damageMult,
    cooldownMult: l.meta.cooldownMult,
    pickupMult: l.meta.pickupMult,
    critChance: c.critBonus ?? 0,
    startingKites: l.meta.startingKites,
  };
}
