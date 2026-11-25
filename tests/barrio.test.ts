import { describe, expect, it } from 'vitest';
import { ICON_IDS } from '../src/art/sprites/iconos.ts';
import { ARMAS } from '../src/data/armas.ts';
import { EVOLUCIONES } from '../src/data/evoluciones.ts';
import { PILARES } from '../src/data/pilares.ts';
import { RASGOS } from '../src/data/rasgos.ts';
import { Build, type Rarity } from '../src/game/build.ts';
import { hasKey } from '../src/i18n/index.ts';

const NEW_WEAPONS = ['choripan', 'pandero', 'cacerola', 'boleadora', 'sopaipillaCaliente'];
const NEW_TRAITS = ['mate', 'poncho', 'chasquilla', 'gorroDeLana', 'cucharaDePalo', 'cachana'];

const raise = (b: Build, id: string, kind: 'weapon' | 'trait', to: number, rarity: Rarity = 'comun'): void => {
  for (let l = (kind === 'weapon' ? b.weapon(id)?.level : b.trait(id)?.level) ?? 0; l < to; l++) {
    b.apply({ kind, id, rarity, toLevel: l + 1 });
  }
};

describe('Fase 11.5: armas y pasivas del barrio', () => {
  it('there are fifteen weapons and twenty traits', () => {
    expect(ARMAS.filter((a) => a.takesSlot)).toHaveLength(15);
    expect(RASGOS).toHaveLength(20);
  });

  it('every new weapon and trait has icon, text, pillar and (for weapons) an evolution of its own', () => {
    for (const id of [...NEW_WEAPONS, ...NEW_TRAITS]) expect(ICON_IDS, id).toContain(id);
    for (const id of NEW_WEAPONS) {
      const def = ARMAS.find((a) => a.id === id);
      expect(def, id).toBeDefined();
      expect(hasKey(`armas.${id}.nombre`), id).toBe(true);
      const evo = EVOLUCIONES.find((e) => e.weapon === id);
      expect(evo?.trait).toBe(def?.evolvesWith);
      expect(hasKey(`evoluciones.${evo?.id}`)).toBe(true);
      expect(hasKey(`evolucionesEfecto.${evo?.id}`)).toBe(true);
    }
    for (const id of NEW_TRAITS) {
      expect(hasKey(`rasgos.${id}.nombre`), id).toBe(true);
      expect(PILARES.some((p) => p.traits.includes(id)), `pilar de ${id}`).toBe(true);
    }
  });

  it('levels give what the cards promise', () => {
    const c = new Build('choripan');
    expect(c.numbers('choripan').count).toBe(1);
    expect(c.numbers('choripan').bounces).toBe(2);
    raise(c, 'choripan', 'weapon', 5);
    expect(c.numbers('choripan').count).toBe(3);
    expect(c.numbers('choripan').bounces).toBe(3);
    const b = new Build('boleadora');
    raise(b, 'boleadora', 'weapon', 5);
    expect(b.numbers('boleadora').count).toBe(3);
    expect(b.numbers('boleadora').duration).toBeCloseTo(3 * 1.25);
  });

  it('each passive changes its own number and only that', () => {
    const b = new Build('pandero');
    const base = b.stats();
    raise(b, 'mate', 'trait', 5);
    raise(b, 'poncho', 'trait', 5);
    raise(b, 'chasquilla', 'trait', 5);
    raise(b, 'gorroDeLana', 'trait', 5);
    raise(b, 'cucharaDePalo', 'trait', 5);
    const s = b.stats();
    expect(s.foodHeal - base.foodHeal).toBeCloseTo(0.2);
    expect(s.shotArmor - base.shotArmor).toBeCloseTo(0.6);
    expect(s.critDamage - base.critDamage).toBeCloseTo(1);
    expect(s.invulnerability - base.invulnerability).toBeCloseTo(0.5);
    expect(s.knockMult - base.knockMult).toBeCloseTo(0.75);
    expect(s.damageMult).toBe(base.damageMult);
  });

  it('Cachaña makes the rare cards likelier', () => {
    const luckless = new Build('pandero');
    const lucky = new Build('pandero');
    raise(lucky, 'cachana', 'trait', 5);
    const rolls = (b: Build): number => {
      let rare = 0;
      let seed = 1;
      const rng = { weighted: (w: number[]): number => { seed = (seed * 16807) % 2147483647; let x = (seed / 2147483647) * w.reduce((a, c) => a + c, 0); for (let i = 0; i < w.length; i++) { x -= w[i] ?? 0; if (x <= 0) return i; } return 0; } };
      for (let i = 0; i < 4000; i++) if (b.rollRarity(rng as never) !== 'comun') rare++;
      return rare;
    };
    expect(rolls(lucky)).toBeGreaterThan(rolls(luckless));
  });
});
