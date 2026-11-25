import { describe, expect, it } from 'vitest';
import { EVOLUCIONES } from '../src/data/evoluciones.ts';
import { LOGROS } from '../src/data/logros.ts';
import { PERSONAJES } from '../src/data/personajes.ts';
import { hasKey } from '../src/i18n/index.ts';
import { COMPUTED_IDS, tripAchievements } from '../src/meta/logros.ts';
import { applyRun, type RunResult } from '../src/meta/progress.ts';
import { defaultSave, migrate, type SaveData } from '../src/meta/save.ts';

/** A short trip that earns nothing by itself. */
const trip = (over: Partial<RunResult> = {}): RunResult => ({
  km: 100,
  kills: 200,
  bosses: 0,
  bossesBeaten: [],
  zones: ['norte'],
  killsBy: {},
  sopaipillas: 100,
  lucasInRun: 0,
  victory: false,
  achievements: [],
  seconds: 120,
  level: 5,
  character: 'quiltro',
  weapons: ['volantin'],
  evolutions: [],
  ...over,
});

const earned = (save: SaveData, run: RunResult): string[] => tripAchievements(save, run);

describe('logros', () => {
  it('there are many, each with a name and a description, and the secret ones are marked', () => {
    expect(LOGROS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(LOGROS.map((l) => l.id)).size).toBe(LOGROS.length);
    for (const l of LOGROS) {
      expect(hasKey(`${l.i18n}.nombre`), l.id).toBe(true);
      expect(hasKey(`${l.i18n}.desc`), l.id).toBe(true);
    }
    expect(LOGROS.filter((l) => l.secret).length).toBeGreaterThanOrEqual(3);
  });

  it('every achievement is either earned during the trip (the first seven) or has a condition at the end of it', () => {
    const inRun = ['niSeInmuto', 'laMicroSiParo', 'dieciochero', 'deAricaAPuntaArenas', 'puroAguante', 'paLaFoto', 'guardianes'];
    for (const l of LOGROS) expect(inRun.includes(l.id) || COMPUTED_IDS.includes(l.id), l.id).toBe(true);
    for (const id of COMPUTED_IDS) expect(LOGROS.some((l) => l.id === id), id).toBe(true);
  });

  it('a short, ordinary trip earns nothing by accident', () => {
    expect(earned(defaultSave(), trip())).toEqual([]);
  });

  it('cities: reaching each one earns its achievement, from the best km of the save', () => {
    const s = defaultSave();
    s.best.km = 1100;
    expect(earned(s, trip())).toEqual(expect.arrayContaining(['antofagasta', 'capitalino']));
    expect(earned(s, trip())).not.toContain('cerroArriba');
    s.best.km = 4300;
    expect(earned(s, trip())).toEqual(expect.arrayContaining(['cerroArriba', 'vinaDelMar', 'araucano', 'chilote', 'patagonico']));
  });

  it('bosses and the trip numbers', () => {
    const s = defaultSave();
    s.bossesBeaten.push('alicanto', 'taco', 'caleuche');
    expect(earned(s, trip())).toEqual(expect.arrayContaining(['matapajaros', 'tacoTaco', 'barcoFantasma']));
    expect(earned(s, trip({ bossesBeaten: ['alicanto', 'taco', 'caleuche'] }))).toContain('cazajefes');
    expect(earned(s, trip({ kills: 1000 }))).toContain('barrida');
    expect(earned(s, trip({ kills: 3000 }))).toEqual(expect.arrayContaining(['barrida', 'matanza']));
    expect(earned(s, trip({ level: 40 }))).toEqual(expect.arrayContaining(['nivel20', 'nivel40']));
    expect(earned(s, trip({ seconds: 900 }))).toEqual(expect.arrayContaining(['diezMinutos', 'maraton']));
    expect(earned(s, trip({ seconds: 599 }))).not.toContain('diezMinutos');
  });

  it('totals: enemies, sopaipillas, trips, characters, upgrades and neighbours', () => {
    const s = defaultSave();
    s.totals = { runs: 50, kills: 10_000, sopaipillas: 20_000, palomas: 0, lucasEarned: 0 };
    s.characters = PERSONAJES.map((p) => p.id);
    s.upgrades = { a: 30, b: 10 };
    s.vecinos = ['almacen', 'x', 'y', 'z'];
    expect(earned(s, trip())).toEqual(
      expect.arrayContaining(['milYUna', 'plagaDePlagas', 'sopaipillero', 'diezViajes', 'cincuentaViajes', 'manada', 'todaLaJauria', 'casaPropia', 'cuchaDeLujo', 'buenVecino']),
    );
  });

  it('weapons and evolutions come from the bestiary', () => {
    const s = defaultSave();
    s.bestiary.evolutions = EVOLUCIONES.slice(0, 5).map((e) => e.id);
    s.bestiary.weapons = Array.from({ length: 10 }, (_, i) => `arma${i}`);
    expect(earned(s, trip())).toEqual(expect.arrayContaining(['primeraEvolucion', 'coleccionista', 'armeria']));
    expect(earned(s, trip())).not.toContain('todasEvoluciones');
    s.bestiary.evolutions = EVOLUCIONES.map((e) => e.id);
    expect(earned(s, trip())).toContain('todasEvoluciones');
  });

  it('skill, the daily route and the secret ones', () => {
    const s = defaultSave();
    expect(earned(s, trip({ daily: true }))).toContain('deHoy');
    expect(earned(s, trip({ noHitToSantiago: true }))).toContain('nadaMeToca');
    expect(earned(s, trip({ victory: true, character: 'gato' }))).toContain('disfrazado');
    expect(earned(s, trip({ victory: true, character: 'quiltro' }))).not.toContain('disfrazado');
    expect(earned(s, trip({ killsBy: { paloma: 150 } }))).toContain('malDePalomas');
    expect(earned(s, trip({ km: 1100, kills: 100 }))).toContain('pacifista');
    expect(earned(s, trip({ km: 1100, kills: 500 }))).not.toContain('pacifista');
  });

  it('never earned twice, and the trip pays their lucas once', () => {
    const s = defaultSave();
    const a = applyRun(s, trip({ km: 1100, kills: 100 }));
    expect(a.newAchievements).toEqual(expect.arrayContaining(['antofagasta', 'capitalino', 'pacifista']));
    const b = applyRun(s, trip({ km: 1100, kills: 100 }));
    expect(b.newAchievements).not.toContain('antofagasta');
    expect(new Set(s.achievements).size).toBe(s.achievements.length);
  });
});

describe('bestiario', () => {
  it('a trip records who was beaten, the weapons used and the evolutions seen', () => {
    const s = defaultSave();
    applyRun(s, trip({ killsBy: { zancudo: 30, jote: 2 }, weapons: ['volantin', 'cables'], evolutions: ['apagon'] }));
    applyRun(s, trip({ killsBy: { zancudo: 10 }, weapons: ['cables', 'fuegos'], evolutions: ['apagon'] }));
    expect(s.bestiary.kills).toEqual({ zancudo: 40, jote: 2 });
    expect(s.bestiary.weapons.sort()).toEqual(['cables', 'fuegos', 'volantin']);
    expect(s.bestiary.evolutions).toEqual(['apagon']);
  });

  it('old saves get an empty bestiary', () => {
    expect(migrate({ version: 3, lucas: 5 }).bestiary).toEqual({ kills: {}, weapons: [], evolutions: [] });
  });
});
