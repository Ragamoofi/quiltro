import { describe, expect, it } from 'vitest';
import { hasKey } from '../src/i18n/index.ts';
import { BLESSINGS, SHRINE } from '../src/game/systems/shrines.ts';

describe('Fase 11.10: animitas como altares', () => {
  it('ask you to stay a few seconds inside a circle big enough to dodge in', () => {
    expect(SHRINE.seconds).toBeGreaterThanOrEqual(3);
    expect(SHRINE.seconds).toBeLessThanOrEqual(6);
    expect(SHRINE.radius).toBeGreaterThan(40);
    expect(SHRINE.every).toBeGreaterThan(SHRINE.seconds * 4);
  });

  it('every blessing changes a real number and has its text', () => {
    for (const b of BLESSINGS) {
      expect(Object.values(b.apply).some((v) => v !== 0), b.id).toBe(true);
      expect(hasKey(`animitas.${b.id}`), b.id).toBe(true);
    }
    for (const k of ['aparece', 'bendicion', 'lista']) expect(hasKey(`animitas.${k}`)).toBe(true);
  });
});
