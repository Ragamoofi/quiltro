import { describe, expect, it } from 'vitest';
import { ENEMIGOS } from '../src/data/enemigos.ts';
import { AMBIENTES, ambienteAt, TOTAL_KM, ZONAS } from '../src/data/zonas.ts';
import { Spawner } from '../src/game/systems/spawner.ts';

describe('ambientes por kilómetro (Fase 10.4)', () => {
  it('the environments of a zone follow each other without gaps and cover the whole trip', () => {
    for (const z of ZONAS.filter((x) => x.id !== 'antartica')) {
      const list = AMBIENTES.filter((a) => a.zone === z.id);
      expect(list.length, z.id).toBeGreaterThan(0);
      for (let i = 1; i < list.length; i++) expect(list[i]?.desdeKm).toBe(list[i - 1]?.hastaKm);
    }
    expect(AMBIENTES[0]?.desdeKm).toBe(0);
    expect(AMBIENTES[AMBIENTES.length - 1]?.hastaKm).toBe(TOTAL_KM);
  });

  it('every enemy in an environment exists and belongs to its zone list', () => {
    const ids = new Set(ENEMIGOS.map((e) => e.id));
    for (const a of AMBIENTES) {
      const zone = ZONAS.find((z) => z.id === a.zone);
      for (const e of a.enemies) {
        expect(ids.has(e), `${a.id}: ${e}`).toBe(true);
        expect(zone?.enemies.includes(e), `${a.id}: ${e} en ${a.zone}`).toBe(true);
      }
    }
  });

  it('Santiago has no gulls or sea lions; the coast has them; the lakes have the sea lions too', () => {
    const santiago = ambienteAt('centro', 1200)?.enemies ?? [];
    expect(santiago).not.toContain('gaviota');
    expect(santiago).not.toContain('loboMarino');
    expect(santiago).toContain('colectivo');
    expect(santiago).toContain('rata');
    const costa = ambienteAt('centro', 1800)?.enemies ?? [];
    expect(costa).toContain('gaviota');
    expect(costa).toContain('loboMarino');
    expect(ambienteAt('sur', 3000)?.enemies).toContain('loboMarino');
    expect(ambienteAt('sur', 2300)?.enemies).not.toContain('loboMarino');
  });

  it('the spawner draws from the environment at that kilometre (never the flock-only pigeon)', () => {
    const s = new Spawner();
    const santiago = s.pool('centro', 1200);
    expect(santiago.sort()).toEqual(['colectivo', 'micro', 'rata']);
    const costa = s.pool('centro', 1800);
    expect(costa.sort()).toEqual(['gaviota', 'loboMarino']);
    // Without a kilometre it falls back to the whole zone, as before.
    expect(s.pool('centro')).toContain('gaviota');
    expect(s.pool('norte', 500).sort()).toEqual(['guanaco', 'jote', 'zancudo']);
  });
});
