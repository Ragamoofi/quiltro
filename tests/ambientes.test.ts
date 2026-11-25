import { describe, expect, it } from 'vitest';
import { SUELO_PESOS } from '../src/art/sprites/suelos.ts';
import { SPRITES } from '../src/art/sprites/index.ts';
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

  it('every environment has its own floor, with one weight per variant', () => {
    for (const a of AMBIENTES) {
      const sprite = SPRITES.find((s) => s.name === `suelo_${a.floor}`);
      expect(sprite, a.id).toBeDefined();
      const variants = sprite?.animations.variantes?.frames.length ?? 0;
      expect((SUELO_PESOS[a.floor] ?? []).length, a.id).toBe(variants);
    }
    // Santiago, the coast and the lakes no longer share a floor.
    expect(new Set(['santiago', 'costa', 'lagos'].map((id) => AMBIENTES.find((a) => a.id === id)?.floor)).size).toBe(3);
  });

  it('the sprites of the street life and the market stalls exist', () => {
    const names = ['puesto_toldo', 'puesto_comida', 'cajones', 'moto', 'peaton1', 'peaton2', 'peaton3', 'peaton4', 'mariposa', 'sombra', 'gaviota', 'auto', 'hito_santiago'];
    for (const n of names) expect(SPRITES.some((s) => s.name === n), n).toBe(true);
    const auto = SPRITES.find((s) => s.name === 'auto');
    for (const colour of ['rojo', 'azul', 'turquesa', 'rosado']) expect(auto?.animations[colour], colour).toBeDefined();
    // The walkers and the bike have the animation the ambient system asks for.
    expect(SPRITES.find((s) => s.name === 'moto')?.animations.correr).toBeDefined();
    expect(SPRITES.find((s) => s.name === 'peaton1')?.animations.caminar).toBeDefined();
    expect(SPRITES.find((s) => s.name === 'mariposa')?.animations.aletear).toBeDefined();
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
