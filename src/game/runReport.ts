import { EVOLUCIONES } from '../data/evoluciones.ts';
import { CIUDADES } from '../data/zonas.ts';
import { t } from '../i18n/index.ts';
import type { DailyRun, ShareInfo } from '../meta/daily.ts';
import { cityAt as cityId, type RunResult } from '../meta/progress.ts';
import type { RunContext } from './context.ts';
import type { Loadout } from './loadout.ts';

/** What was already reported to the save (a run that continued into Antarctica reports twice). */
export interface Reported {
  km: number;
  kills: number;
  bosses: number;
  food: number;
  lucas: number;
  killsBy: Record<string, number>;
}

export const emptyReport = (): Reported => ({ km: 0, kills: 0, bosses: 0, food: 0, lucas: 0, killsBy: {} });

/** Name of the last city reached at this kilometre. */
export function cityName(km: number): string {
  let city = CIUDADES[0];
  for (const c of CIUDADES) if (km >= c.km) city = c;
  return city ? t(city.i18n) : '';
}

/** Only what is new since the last report counts. */
/** What the achievements and the bestiary read besides the numbers of the trip. */
export interface TripExtras {
  character: string;
  daily: boolean;
  noHitToSantiago: boolean;
  pasaje: number;
}

export function runResult(ctx: RunContext, km: number, zones: string[], victory: boolean, earned: Iterable<string>, r: Reported, extras: TripExtras): RunResult {
  const killsBy: Record<string, number> = {};
  for (const [k, v] of Object.entries(ctx.stats.killsBy)) killsBy[k] = v - (r.killsBy[k] ?? 0);
  return {
    km: km - r.km,
    bestKm: km,
    kills: ctx.stats.kills - r.kills,
    bosses: ctx.progress.bosses - r.bosses,
    bossesBeaten: ctx.stats.bossesBeaten,
    zones,
    killsBy,
    sopaipillas: ctx.stats.food - r.food,
    lucasInRun: ctx.progress.lucas - r.lucas,
    victory,
    achievements: [...earned],
    continued: r.km > 0,
    seconds: ctx.time,
    level: ctx.progress.level,
    character: extras.character,
    relics: [...(ctx.fair?.owned ?? [])],
    weapons: ctx.build.slotWeapons.map((w) => w.def.id),
    evolutions: EVOLUCIONES.filter((e) => ctx.build.evolved.has(e.weapon)).map((e) => e.id),
    daily: extras.daily,
    noHitToSantiago: extras.noHitToSantiago,
    pasaje: extras.pasaje,
    deathBy: !victory && ctx.player.dead && ctx.stats.lastHit ? ctx.stats.lastHit : undefined,
  };
}

/** The snapshot to remember for the next report. */
export function snapshot(ctx: RunContext, km: number): Reported {
  return {
    km,
    kills: ctx.stats.kills,
    bosses: ctx.progress.bosses,
    food: ctx.stats.food,
    lucas: ctx.progress.lucas,
    killsBy: { ...ctx.stats.killsBy },
  };
}

/** What the share text and the image card say about this trip. */
export function shareInfo(ctx: RunContext, loadout: Loadout, daily: DailyRun | null, km: number, victory: boolean): ShareInfo {
  const b = ctx.build;
  const evo = EVOLUCIONES.find((e) => b.evolved.has(e.weapon));
  let strongest = loadout.character.startingWeapon;
  let most = -1;
  for (const w of b.slotWeapons) {
    const dealt = ctx.stats.damageBy[w.def.id] ?? 0;
    if (dealt > most) {
      most = dealt;
      strongest = w.def.id;
    }
  }
  const weapon = b.weapon(strongest);
  const label = evo
    ? t(evo.nameKey)
    : weapon
      ? `${t(`${weapon.def.i18n}.nombre`)} ${t('ui.nivelCorto', { n: weapon.level })}`
      : '';
  const city = CIUDADES.find((c) => c.id === cityId(km));
  return {
    km,
    city: city ? t(city.i18n) : '',
    build: label,
    icons: [...b.slotWeapons.map((w) => w.def.id), ...b.traits.map((tr) => tr.def.id)],
    character: loadout.character.id,
    daily: daily ? { number: daily.number, counted: daily.counted } : null,
    victory,
    link: `${location.origin}${location.pathname}`,
  };
}
