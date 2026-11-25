import { describe, expect, it } from 'vitest';
import { ARMAS } from '../src/data/armas.ts';
import { JEFES } from '../src/data/jefes.ts';
import { PERSONAJES } from '../src/data/personajes.ts';
import { CIUDADES } from '../src/data/zonas.ts';
import { Build } from '../src/game/build.ts';
import { baseMods, defaultLoadout } from '../src/game/loadout.ts';
import { hasKey } from '../src/i18n/index.ts';
import { checkUnlocks } from '../src/meta/progress.ts';
import { defaultSave } from '../src/meta/save.ts';

const build = (id: string): Build => {
  const c = PERSONAJES.find((p) => p.id === id);
  if (!c) throw new Error(id);
  return new Build(c.startingWeapon, baseMods({ ...defaultLoadout(), character: c }));
};

describe('personajes', () => {
  it('there are ten, each with its own starting weapon, name and passive text', () => {
    expect(PERSONAJES).toHaveLength(10);
    expect(new Set(PERSONAJES.map((p) => p.id)).size).toBe(10);
    const weapons = PERSONAJES.map((p) => p.startingWeapon);
    expect(new Set(weapons).size).toBe(10);
    for (const p of PERSONAJES) {
      expect(ARMAS.find((a) => a.id === p.startingWeapon)?.takesSlot, p.id).toBe(true);
      expect(hasKey(p.nameKey), p.id).toBe(true);
      expect(hasKey(`personajesPasiva.${p.id}`), p.id).toBe(true);
    }
  });

  it('every unlock condition points at something that exists', () => {
    for (const p of PERSONAJES) {
      const u = p.unlock;
      if (u.kind === 'llegarA') expect(CIUDADES.some((c) => c.id === u.ciudad), p.id).toBe(true);
      if (u.kind === 'vencer') expect(JEFES.some((j) => j.id === u.jefe), p.id).toBe(true);
    }
  });

  it('unlocks by the new conditions, in order of difficulty', () => {
    const s = defaultSave();
    s.best.km = 1100; // Santiago
    expect(checkUnlocks(s)).toEqual(['quiltra']);
    s.totals.kills = 3000;
    expect(checkUnlocks(s)).toEqual(['gato']);
    s.best.km = 2200; // Temuco
    expect(checkUnlocks(s)).toEqual(['zorro']);
    s.best.km = 2950; // Chiloé
    expect(checkUnlocks(s)).toEqual(['pudu']);
    s.totals.sopaipillas = 5000;
    s.bossesBeaten.push('caleuche', 'taco');
    expect(checkUnlocks(s).sort()).toEqual(['chingue', 'condor', 'pinguino']);
    s.best.km = 4300; // Punta Arenas
    expect(checkUnlocks(s)).toEqual(['guanaco']);
    s.bossesBeaten.push('caiCai');
    expect(checkUnlocks(s)).toEqual(['paloma']);
    expect(s.characters).toHaveLength(10);
  });

  it('the unique passives reach the build', () => {
    // Quiltro: the ¡GUAU! comes back 20 % faster (6 s → 4,8 s).
    expect(build('quiltro').numbers('guau').cooldown).toBeCloseTo(4.8);
    // Guanaco: a shield every 30 s, more armour and life.
    const g = build('guanaco');
    expect(g.stats().shieldEvery).toBe(30);
    expect(g.stats().armor).toBe(1);
    expect(g.stats().maxHp).toBe(40);
    // Cóndor: +20 % damage and a pickup radius ×1,6.
    const c = build('condor');
    expect(c.stats().damageMult).toBeCloseTo(1.2);
    expect(c.stats().pickupMult).toBeCloseTo(1.6);
    // Zorro: 12 % faster weapons. Pingüino: one point of armour. Paloma: 10 % faster.
    expect(build('zorro').stats().cooldownMult).toBeCloseTo(0.88);
    expect(build('pinguino').stats().armor).toBe(1);
    expect(build('paloma').stats().speedMult).toBeCloseTo(1.1);
  });
});
