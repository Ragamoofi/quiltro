import { describe, expect, it } from 'vitest';
import { SPRITES } from '../src/art/sprites/index.ts';
import { CIUDAD_AVISO_KM, CIUDAD_VENTANA, ESCENARIOS } from '../src/data/escenarios.ts';
import { CIUDADES } from '../src/data/zonas.ts';
import { Cities } from '../src/game/world/cities.ts';
import { HORIZON_H } from '../src/game/world/horizon.ts';
import { hasKey } from '../src/i18n/index.ts';

const sprite = (name: string) => SPRITES.find((s) => s.name === name);

describe('escenarios de ciudad', () => {
  it('every scene points at a real city, landmark, prop and text', () => {
    for (const e of ESCENARIOS) {
      expect(CIUDADES.some((c) => c.id === e.id), e.id).toBe(true);
      expect(sprite(e.landmark), e.landmark).toBeDefined();
      if (e.prop) expect(sprite(e.prop), e.prop).toBeDefined();
      expect(hasKey(`ciudadesLinea.${e.id}`), e.id).toBe(true);
    }
  });

  it('landmarks fit the horizon strip', () => {
    for (const e of ESCENARIOS) {
      const frame = sprite(e.landmark)?.animations.quieto?.frames[0];
      expect(frame?.length ?? 99, e.landmark).toBeLessThanOrEqual(HORIZON_H);
    }
  });

  it('windows never overlap, so one city is on screen at a time', () => {
    const km = ESCENARIOS.map((e) => CIUDADES.find((c) => c.id === e.id)?.km ?? 0).sort((a, b) => a - b);
    for (let i = 1; i < km.length; i++) {
      expect((km[i] ?? 0) - CIUDAD_VENTANA.despues).toBeGreaterThan((km[i - 1] ?? 0) - CIUDAD_VENTANA.antes - 1);
      expect((km[i] ?? 0) - CIUDAD_VENTANA.antes).toBeGreaterThan(km[i - 1] ?? 0);
    }
    // The cartel comes before the city and still inside its window.
    expect(CIUDAD_AVISO_KM).toBeLessThan(CIUDAD_VENTANA.antes);
  });

  it('the landmark enters at the right edge and leaves at the left as the km go by', () => {
    const cities = new Cities();
    const valpo = CIUDADES.find((c) => c.id === 'valparaiso')?.km ?? 0;
    expect(cities.view(valpo - CIUDAD_VENTANA.antes - 1)).toBeNull();
    expect(cities.view(valpo - CIUDAD_VENTANA.antes)?.progress).toBeCloseTo(0);
    const middle = cities.view(valpo);
    expect(middle?.scene.id).toBe('valparaiso');
    expect(middle?.progress ?? 0).toBeGreaterThan(0.3);
    expect(cities.view(valpo + CIUDAD_VENTANA.despues)?.progress).toBeCloseTo(1);
    expect(cities.view(valpo + CIUDAD_VENTANA.despues + 1)).toBeNull();
  });
});
