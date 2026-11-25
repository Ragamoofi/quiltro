import { describe, expect, it } from 'vitest';
import { GUARDIAN } from '../src/data/enemigos.ts';
import { ZONAS } from '../src/data/zonas.ts';
import { hasKey } from '../src/i18n/index.ts';

describe('guardianes de zona', () => {
  it('arrive inside every zone of the trip, after the start and before the boss', () => {
    for (const z of ZONAS.filter((it) => it.id !== 'antartica')) {
      const at = z.startMin + GUARDIAN.atMinutes;
      expect(at).toBeGreaterThan(z.startMin);
      expect(at).toBeLessThan(z.endMin - 0.5);
    }
  });

  it('their stomp is announced longer than a dodge takes and never lands without a warning', () => {
    expect(GUARDIAN.stompWarning).toBeGreaterThanOrEqual(0.8);
    expect(GUARDIAN.stompEvery).toBeGreaterThan(GUARDIAN.stompWarning * 2);
    expect(GUARDIAN.stompRadius).toBeGreaterThan(30);
  });

  it('every text they need exists', () => {
    for (const key of ['ui.guardian', 'ui.guardianVencido', 'ui.guardianLucas']) expect(hasKey(key), key).toBe(true);
  });
});
