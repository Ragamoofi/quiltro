import { describe as group, expect, it } from 'vitest';
import { ARMAS } from '../src/data/armas.ts';
import { EVOLUCIONES } from '../src/data/evoluciones.ts';
import { RASGOS } from '../src/data/rasgos.ts';
import { describe } from '../src/ui/cardText.ts';

group('cartas', () => {
  it('every weapon card, at every level, says what it does (no empty text, no missing words)', () => {
    for (const w of ARMAS) {
      for (let lv = 1; lv <= w.maxLevel; lv++) {
        const c = describe({ kind: 'weapon', id: w.id, rarity: 'comun', toLevel: lv });
        expect(c.effect.trim().length, `${w.id} nv ${lv}`).toBeGreaterThan(0);
        expect(c.effect, `${w.id} nv ${lv}`).not.toMatch(/unidades\.|efectos\.|armas\./);
      }
    }
  });

  it('every passive card, at every level, says what it gives', () => {
    for (const r of RASGOS) {
      for (let lv = 1; lv <= r.maxLevel; lv++) {
        const c = describe({ kind: 'trait', id: r.id, rarity: 'comun', toLevel: lv });
        expect(c.effect.trim().length, `${r.id} nv ${lv}`).toBeGreaterThan(0);
        expect(c.effect, `${r.id} nv ${lv}`).not.toMatch(/efectos\./);
      }
    }
  });

  it('every evolution card says what it does', () => {
    for (const e of EVOLUCIONES) {
      const c = describe({ kind: 'evolution', id: e.weapon, evolution: e.id, rarity: 'comun' });
      expect(c.effect, e.id).not.toMatch(/evolucionesEfecto\./);
    }
  });
});
