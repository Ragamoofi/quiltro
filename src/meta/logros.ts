import { EVOLUCIONES } from '../data/evoluciones.ts';
import { LOGROS } from '../data/logros.ts';
import { PERSONAJES } from '../data/personajes.ts';
import { CIUDADES } from '../data/zonas.ts';
import type { RunResult } from './progress.ts';
import type { SaveData } from './save.ts';

/** Km of a city, by id. */
const kmOf = (id: string): number => CIUDADES.find((c) => c.id === id)?.km ?? Number.POSITIVE_INFINITY;

/** Distinct weapons that can be used (the slot weapons are the ones that count for "Armería"). */
const ARMAS_PARA_ARMERIA = 10;

interface Ctx {
  /** The save AFTER this trip was added to it (totals, best km, bestiary...). */
  readonly save: SaveData;
  readonly run: RunResult;
}

const levelsBought = (s: SaveData): number => Object.values(s.upgrades).reduce((a, b) => a + b, 0);

/**
 * Conditions of the achievements that are worked out when a trip ends. Each reads the trip and
 * the whole save, so a player who already did it earns it on their next trip.
 */
const CONDITIONS: Readonly<Record<string, (c: Ctx) => boolean>> = {
  antofagasta: ({ save }) => save.best.km >= kmOf('antofagasta'),
  capitalino: ({ save }) => save.best.km >= kmOf('santiago'),
  cerroArriba: ({ save }) => save.best.km >= kmOf('valparaiso'),
  vinaDelMar: ({ save }) => save.best.km >= kmOf('vina'),
  araucano: ({ save }) => save.best.km >= kmOf('temuco'),
  chilote: ({ save }) => save.best.km >= kmOf('chiloe'),
  patagonico: ({ save }) => save.best.km >= kmOf('coyhaique'),
  antartico: ({ save }) => save.antartica || save.zonesReached.includes('antartica'),
  matapajaros: ({ save }) => save.bossesBeaten.includes('alicanto'),
  tacoTaco: ({ save }) => save.bossesBeaten.includes('taco'),
  barcoFantasma: ({ save }) => save.bossesBeaten.includes('caleuche'),
  cazajefes: ({ run }) => new Set(run.bossesBeaten).size >= 3,
  milYUna: ({ save }) => save.totals.kills >= 1000,
  plagaDePlagas: ({ save }) => save.totals.kills >= 10_000,
  barrida: ({ run }) => run.kills >= 1000,
  matanza: ({ run }) => run.kills >= 3000,
  sopaipillero: ({ save }) => save.totals.sopaipillas >= 20_000,
  nivel20: ({ run }) => (run.level ?? 0) >= 20,
  nivel40: ({ run }) => (run.level ?? 0) >= 40,
  diezMinutos: ({ run }) => (run.seconds ?? 0) >= 600,
  maraton: ({ run }) => (run.seconds ?? 0) >= 900,
  diezViajes: ({ save }) => save.totals.runs >= 10,
  cincuentaViajes: ({ save }) => save.totals.runs >= 50,
  manada: ({ save }) => save.characters.length >= 5,
  todaLaJauria: ({ save }) => save.characters.length >= PERSONAJES.length,
  disfrazado: ({ run }) => run.victory && !run.continued && run.character !== undefined && run.character !== 'quiltro',
  primeraEvolucion: ({ save }) => save.bestiary.evolutions.length >= 1,
  coleccionista: ({ save }) => save.bestiary.evolutions.length >= 5,
  todasEvoluciones: ({ save }) => EVOLUCIONES.every((e) => save.bestiary.evolutions.includes(e.id)),
  armeria: ({ save }) => save.bestiary.weapons.length >= ARMAS_PARA_ARMERIA,
  casaPropia: ({ save }) => levelsBought(save) >= 10,
  cuchaDeLujo: ({ save }) => levelsBought(save) >= 40,
  buenVecino: ({ save }) => save.vecinos.length >= 4,
  deHoy: ({ run }) => run.daily === true,
  nadaMeToca: ({ run }) => run.noHitToSantiago === true,
  malDePalomas: ({ run }) => (run.killsBy.paloma ?? 0) >= 150,
  pacifista: ({ run }) => (run.bestKm ?? run.km) >= kmOf('santiago') && run.kills < 150,
};

/** Achievements this trip earns that the save does not have yet (call after updating the save with the trip). */
export function tripAchievements(save: SaveData, run: RunResult): string[] {
  const out: string[] = [];
  for (const l of LOGROS) {
    const check = CONDITIONS[l.id];
    if (!check || save.achievements.includes(l.id) || run.achievements.includes(l.id)) continue;
    if (check({ save, run })) out.push(l.id);
  }
  return out;
}

/** Ids of the achievements that are worked out at the end of a trip (for the tests). */
export const COMPUTED_IDS: readonly string[] = Object.keys(CONDITIONS);
