import { describe, expect, it } from 'vitest';
import { PASAJES, pasajeAt, pasajesOpen } from '../src/data/pasajes.ts';
import { hasKey } from '../src/i18n/index.ts';
import { applyRun, type RunResult } from '../src/meta/progress.ts';
import { defaultSave, migrate } from '../src/meta/save.ts';

const trip = (extra: Partial<RunResult> = {}): RunResult => ({
  km: 1000,
  kills: 300,
  bosses: 4,
  bossesBeaten: [],
  zones: [],
  killsBy: {},
  sopaipillas: 0,
  lucasInRun: 0,
  victory: false,
  achievements: [],
  ...extra,
});

describe('Fase 11.6: pasajes', () => {
  it('each pasaje is harder and pays more than the one before, and all have their texts', () => {
    expect(PASAJES).toHaveLength(3);
    for (let i = 1; i < PASAJES.length; i++) {
      const a = PASAJES[i - 1];
      const b = PASAJES[i];
      expect(b?.hp ?? 0).toBeGreaterThan(a?.hp ?? 0);
      expect(b?.damage ?? 0).toBeGreaterThan(a?.damage ?? 0);
      expect(b?.spawn ?? 0).toBeGreaterThan(a?.spawn ?? 0);
      expect(b?.lucas ?? 0).toBeGreaterThan(a?.lucas ?? 0);
    }
    for (const p of PASAJES) for (const k of ['nombre', 'desc']) expect(hasKey(`${p.i18n}.${k}`), p.id).toBe(true);
    expect(pasajeAt(0).id).toBe('normal');
    expect(pasajeAt(99).id).toBe('ultimoBus');
  });

  it('only the next pasaje opens, never more than three', () => {
    expect(pasajesOpen(0)).toBe(1);
    expect(pasajesOpen(1)).toBe(2);
    expect(pasajesOpen(2)).toBe(3);
    expect(pasajesOpen(3)).toBe(3);
  });

  it('winning a pasaje opens the next one; losing or the daily run do not', () => {
    const save = defaultSave();
    expect(applyRun(save, trip({ pasaje: 0 })).newPasaje).toBeUndefined();
    expect(save.pasajesGanados).toBe(0);
    expect(applyRun(save, trip({ victory: true, pasaje: 0, daily: true })).newPasaje).toBeUndefined();
    expect(save.pasajesGanados).toBe(0);
    expect(applyRun(save, trip({ victory: true, pasaje: 0 })).newPasaje).toBe(1);
    expect(save.pasajesGanados).toBe(1);
    // Winning the same pasaje again opens nothing new; the next one does.
    expect(applyRun(save, trip({ victory: true, pasaje: 0 })).newPasaje).toBeUndefined();
    expect(applyRun(save, trip({ victory: true, pasaje: 1 })).newPasaje).toBe(2);
    expect(applyRun(save, trip({ victory: true, pasaje: 2 })).newPasaje).toBeUndefined();
    expect(save.pasajesGanados).toBe(3);
  });

  it('a harder pasaje pays its multiplier', () => {
    const a = applyRun(defaultSave(), trip({ pasaje: 0 })).runLucas;
    const b = applyRun(defaultSave(), trip({ pasaje: 2 })).runLucas;
    expect(b).toBeGreaterThan(a * 2);
    expect(b).toBeLessThanOrEqual(Math.ceil(a * 2.5) + 1);
  });

  it('old saves get the first pasaje as won only if they had beaten the final boss', () => {
    const old = { ...defaultSave(), version: 4, antartica: true } as Record<string, unknown>;
    delete old.pasajesGanados;
    delete old.pasaje;
    expect(migrate(old).pasajesGanados).toBe(1);
    const fresh = { ...defaultSave(), version: 4 } as Record<string, unknown>;
    delete fresh.pasajesGanados;
    delete fresh.pasaje;
    expect(migrate(fresh).pasajesGanados).toBe(0);
    expect(migrate(fresh).pasaje).toBe(0);
  });
});
