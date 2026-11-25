import { describe, expect, it } from 'vitest';
import { ARMAS, MAX_WEAPONS } from '../src/data/armas.ts';
import { RARITY } from '../src/data/balance.ts';
import { EVOLUCIONES } from '../src/data/evoluciones.ts';
import { ENEMIGOS } from '../src/data/enemigos.ts';
import { RASGOS } from '../src/data/rasgos.ts';
import { CIUDADES, ZONAS } from '../src/data/zonas.ts';
import { hasKey } from '../src/i18n/index.ts';

/** Checks on the game data that the balance bot and the card system rely on. */
describe('game data', () => {
  it('every weapon has an existing trait as its evolution partner, and the evolution exists', () => {
    for (const w of ARMAS) {
      expect(RASGOS.some((r) => r.id === w.evolvesWith), `${w.id} → ${w.evolvesWith}`).toBe(true);
      const evo = EVOLUCIONES.find((e) => e.weapon === w.id);
      expect(evo, `evolución de ${w.id}`).toBeDefined();
      expect(evo?.trait).toBe(w.evolvesWith);
    }
  });

  it('no two weapons share an evolution trait', () => {
    const traits = ARMAS.map((a) => a.evolvesWith);
    expect(new Set(traits).size).toBe(traits.length);
  });

  it('ids are unique', () => {
    for (const list of [ARMAS.map((a) => a.id), RASGOS.map((r) => r.id), ENEMIGOS.map((e) => e.id), ZONAS.map((z) => z.id)]) {
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it('every visible name has its text', () => {
    for (const w of ARMAS) expect(hasKey(w.i18n), w.i18n).toBe(true);
    for (const r of RASGOS) expect(hasKey(r.i18n), r.i18n).toBe(true);
    for (const e of EVOLUCIONES) expect(hasKey(e.nameKey), e.nameKey).toBe(true);
    for (const e of ENEMIGOS) expect(hasKey(e.nameKey), e.nameKey).toBe(true);
    for (const z of ZONAS) expect(hasKey(z.i18n), z.i18n).toBe(true);
    for (const c of CIUDADES) expect(hasKey(c.i18n), c.i18n).toBe(true);
    for (const r of RARITY) expect(hasKey(`rareza.${r.id}`), r.id).toBe(true);
  });

  it('every zone enemy exists and the zones follow each other without gaps', () => {
    const ids = new Set(ENEMIGOS.map((e) => e.id));
    for (const z of ZONAS) for (const e of z.enemies) expect(ids.has(e), `${z.id}: ${e}`).toBe(true);
    for (let i = 1; i < ZONAS.length; i++) expect(ZONAS[i]?.startMin).toBe(ZONAS[i - 1]?.endMin);
  });

  it('rarity odds add up to 1 and rarer means stronger', () => {
    expect(RARITY.reduce((a, r) => a + r.chance, 0)).toBeCloseTo(1, 5);
    for (let i = 1; i < RARITY.length; i++) {
      expect(RARITY[i]?.mult ?? 0).toBeGreaterThan(RARITY[i - 1]?.mult ?? 0);
      expect(RARITY[i]?.chance ?? 1).toBeLessThan(RARITY[i - 1]?.chance ?? 0);
    }
  });

  it('there are enough weapons and traits to fill every slot', () => {
    expect(ARMAS.filter((a) => a.takesSlot).length).toBeGreaterThanOrEqual(MAX_WEAPONS);
  });
});
