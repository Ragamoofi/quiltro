import { PASAJES, pasajeAt } from '../data/pasajes.ts';
import { FIRST_ZONE_BONUS_LUCAS, lucasForRun, upgradeCost } from '../data/balance.ts';
import { CUCHA_PILARES, CUCHA_PILAR_NIVELES, IDLE, MEJORAS, VECINOS, type UpgradeDef } from '../data/cucha.ts';
import { LOGROS } from '../data/logros.ts';
import { tripAchievements } from './logros.ts';
import { PERSONAJES } from '../data/personajes.ts';
import { CIUDADES } from '../data/zonas.ts';
import type { SaveData } from './save.ts';

/**
 * Everything La Cucha decides: upgrade costs and effects, run rewards
 * (lucas, first-time zones, achievements, unlocked characters) and the
 * neighbours' idle lucas. Pure functions over SaveData, covered by tests.
 */

/** Totals of the permanent upgrades, applied when a run starts. */
export interface MetaBonus {
  maxHp: number;
  armor: number;
  speedMult: number;
  damageMult: number;
  pickupMult: number;
  cooldownMult: number;
  startingKites: number;
  luck: number;
  rerolls: number;
  cards: number;
  revives: number;
  lucasMult: number;
  /** From the pillar perks. */
  critChance: number;
  xpMult: number;
}

export function level(save: SaveData, id: string): number {
  return save.upgrades[id] ?? 0;
}

export function nextCost(save: SaveData, def: UpgradeDef): number | null {
  const l = level(save, def.id);
  return l >= def.maxLevel ? null : upgradeCost(def.baseCost, l);
}

export function canBuy(save: SaveData, id: string): boolean {
  const def = MEJORAS.find((m) => m.id === id);
  if (!def) return false;
  const cost = nextCost(save, def);
  return cost !== null && save.lucas >= cost;
}

export function buy(save: SaveData, id: string): boolean {
  const def = MEJORAS.find((m) => m.id === id);
  if (!def) return false;
  const cost = nextCost(save, def);
  if (cost === null || save.lucas < cost) return false;
  save.lucas -= cost;
  save.upgrades[id] = level(save, id) + 1;
  return true;
}

/** Cheapest upgrade the player can afford right now ("Te alcanza para…"). */
export function affordable(save: SaveData): UpgradeDef | null {
  let best: UpgradeDef | null = null;
  let bestCost = Number.POSITIVE_INFINITY;
  for (const def of MEJORAS) {
    const c = nextCost(save, def);
    if (c !== null && c <= save.lucas && c < bestCost) {
      best = def;
      bestCost = c;
    }
  }
  return best;
}

export function metaBonus(save: SaveData): MetaBonus {
  const b: MetaBonus = {
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
    critChance: 0,
    xpMult: 0,
  };
  for (const def of MEJORAS) {
    const l = level(save, def.id);
    if (l === 0) continue;
    for (const [k, v] of Object.entries(def.perLevel) as [keyof MetaBonus, number][]) b[k] += v * l;
  }
  for (const pillar of CUCHA_PILARES) {
    const tier = pillarTier(save, pillar.id);
    const perk = tier > 0 ? pillar.tiers[tier - 1] : undefined;
    if (!perk) continue;
    b.critChance += perk.critChance ?? 0;
    b.maxHp += perk.maxHp ?? 0;
    b.xpMult += perk.xpMult ?? 0;
    b.lucasMult += perk.lucasMult ?? 0;
  }
  return b;
}

/** Levels bought across a pillar's upgrades. */
export function pillarLevels(save: SaveData, pillarId: string): number {
  return MEJORAS.filter((m) => m.pillar === pillarId).reduce((a, m) => a + level(save, m.id), 0);
}

/** Perk tiers a pillar has reached (0, 1 or 2). */
export function pillarTier(save: SaveData, pillarId: string): number {
  const n = pillarLevels(save, pillarId);
  return CUCHA_PILAR_NIVELES.filter((t) => n >= t).length;
}

// ---------------------------------------------------------------- run results

export interface RunResult {
  /** Km that count for lucas (new since the last report of this run). */
  km: number;
  /** Total km reached (for the record). Defaults to `km`. */
  bestKm?: number;
  /** Second report of the same run (after continuing to Antarctica). */
  continued?: boolean;
  kills: number;
  bosses: number;
  bossesBeaten: readonly string[];
  /** Zone ids reached during the run (in order). */
  zones: readonly string[];
  killsBy: Readonly<Record<string, number>>;
  sopaipillas: number;
  /** Lucas picked up during the run (Paso, cards). */
  lucasInRun: number;
  victory: boolean;
  /** Achievement ids earned during the run. */
  achievements: readonly string[];
  /** Fase 11.2: details the new achievements and the bestiary read (all optional). */
  seconds?: number;
  level?: number;
  character?: string;
  /** Weapons the dog had at the end, and the evolutions it reached. */
  weapons?: readonly string[];
  evolutions?: readonly string[];
  /** A counted Ruta del día. */
  daily?: boolean;
  /** Reached Santiago without taking damage. */
  noHitToSantiago?: boolean;
  /** Fase 11.6: the pasaje (difficulty index) of the trip. */
  pasaje?: number;
  /** What dealt the last hit, when the trip ended in a death (Fase 11.7). */
  deathBy?: string | undefined;
}

export interface RunRewards {
  lucas: number;
  runLucas: number;
  zoneBonus: number;
  newZones: string[];
  newAchievements: string[];
  achievementLucas: number;
  newCharacters: string[];
  newRecord: boolean;
  /** The pasaje that this victory opened, if it was a new one (index). */
  newPasaje?: number | undefined;
}

export function cityAt(km: number): string {
  let id = CIUDADES[0]?.id ?? 'arica';
  for (const c of CIUDADES) if (km >= c.km) id = c.id;
  return id;
}

/** Adds a finished run to the save and returns what was earned. */
export function applyRun(save: SaveData, r: RunResult): RunRewards {
  const bonus = metaBonus(save);
  const pasaje = pasajeAt(r.pasaje ?? 0);
  const runLucas = Math.floor(Math.floor(lucasForRun(r.km, r.kills, r.bosses, 1 + bonus.lucasMult)) * pasaje.lucas) + Math.floor(r.lucasInRun * pasaje.lucas);
  const newZones = r.zones.filter((z) => !save.zonesReached.includes(z));
  const zoneBonus = newZones.length * FIRST_ZONE_BONUS_LUCAS;
  save.zonesReached.push(...newZones);

  const newAchievements = r.achievements.filter((a) => !save.achievements.includes(a));
  save.achievements.push(...newAchievements);

  for (const b of r.bossesBeaten) if (!save.bossesBeaten.includes(b)) save.bossesBeaten.push(b);
  if (r.victory) save.antartica = true;
  let newPasaje: number | undefined;
  if (r.victory && !r.daily) {
    const index = Math.max(0, Math.min(PASAJES.length - 1, Math.floor(r.pasaje ?? 0)));
    if (save.pasajesGanados < index + 1) {
      save.pasajesGanados = index + 1;
      if (index + 1 < PASAJES.length) newPasaje = index + 1;
    }
  }

  if (!r.continued) {
    save.totals.runs++;
    if (r.character) save.stats.characters[r.character] = (save.stats.characters[r.character] ?? 0) + 1;
  }
  if (r.deathBy && !r.victory) save.stats.deaths[r.deathBy] = (save.stats.deaths[r.deathBy] ?? 0) + 1;
  save.totals.kills += r.kills;
  save.totals.sopaipillas += r.sopaipillas;
  save.totals.palomas += r.killsBy.paloma ?? 0;
  // The bestiary: who was beaten, which weapons were used, which evolutions were seen.
  for (const [id, n] of Object.entries(r.killsBy)) save.bestiary.kills[id] = (save.bestiary.kills[id] ?? 0) + n;
  for (const w of r.weapons ?? []) if (!save.bestiary.weapons.includes(w)) save.bestiary.weapons.push(w);
  for (const e of r.evolutions ?? []) if (!save.bestiary.evolutions.includes(e)) save.bestiary.evolutions.push(e);

  const reached = r.bestKm ?? r.km;
  const newRecord = reached > save.best.km;
  if (newRecord) save.best = { km: reached, city: cityAt(reached) };

  // Achievements that are worked out now (from this trip and the whole save).
  const computed = tripAchievements(save, r);
  save.achievements.push(...computed);
  newAchievements.push(...computed);
  const achievementLucas = newAchievements.reduce((s, id) => s + (LOGROS.find((l) => l.id === id)?.lucas ?? 0), 0);

  const lucas = runLucas + zoneBonus + achievementLucas;
  save.lucas += lucas;
  save.totals.lucasEarned += lucas;
  save.bestRunLucas = Math.max(save.bestRunLucas, runLucas);

  const newCharacters = checkUnlocks(save);
  return { lucas, runLucas, zoneBonus, newZones, newAchievements, achievementLucas, newCharacters, newRecord, newPasaje };
}

/** Unlocks characters whose condition is now met; returns the new ones. */
export function checkUnlocks(save: SaveData): string[] {
  const fresh: string[] = [];
  for (const c of PERSONAJES) {
    if (save.characters.includes(c.id)) continue;
    const u = c.unlock;
    const ok =
      u.kind === 'inicio' ||
      (u.kind === 'llegarA' && save.best.km >= (CIUDADES.find((x) => x.id === u.ciudad)?.km ?? Infinity)) ||
      (u.kind === 'total' && save.totals[u.stat] >= u.cantidad) ||
      (u.kind === 'vencer' && save.bossesBeaten.includes(u.jefe)) ||
      (u.kind === 'pasaje' && save.pasajesGanados >= u.ganados);
    if (ok) {
      save.characters.push(c.id);
      fresh.push(c.id);
    }
  }
  return fresh;
}

// ---------------------------------------------------------------- neighbours

export function lucasPerHour(save: SaveData): number {
  return VECINOS.filter((v) => save.vecinos.includes(v.id)).reduce((s, v) => s + v.lucasPerHour, 0);
}

/** Lucas left by the neighbours since `save.lastSeen` (max 8 h, max 30 % of a good run). */
export function idleEarnings(save: SaveData, now: number): { lucas: number; hours: number } {
  const hours = Math.min(IDLE.maxHours, Math.max(0, (now - save.lastSeen) / 3_600_000));
  const goodRun = Math.max(300, save.bestRunLucas);
  const lucas = Math.floor(Math.min(hours * lucasPerHour(save), goodRun * IDLE.maxFractionOfGoodRun));
  return { lucas, hours };
}

export function collectIdle(save: SaveData, now: number): number {
  const { lucas } = idleEarnings(save, now);
  save.lucas += lucas;
  save.lastSeen = now;
  return lucas;
}

export function befriend(save: SaveData, id: string): boolean {
  const v = VECINOS.find((n) => n.id === id);
  if (!v || save.vecinos.includes(id) || save.lucas < v.cost) return false;
  save.lucas -= v.cost;
  save.vecinos.push(id);
  return true;
}

/** The befriended neighbour with the biggest production (for the "te dejó" line). */
export function mainNeighbour(save: SaveData): string {
  const owned = VECINOS.filter((v) => save.vecinos.includes(v.id));
  return [...owned].sort((a, b) => b.lucasPerHour - a.lucasPerHour)[0]?.nameKey ?? 'vecinos.almacen';
}
