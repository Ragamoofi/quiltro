import { describe, expect, it } from 'vitest';
import { Build } from '../src/game/build.ts';
import { EVOLUCIONES } from '../src/data/evoluciones.ts';
import { evolutionProgress } from '../src/game/evolutionGuide.ts';

describe('guía de evoluciones', () => {
  it('shows every real recipe and puts the current weapons before missing recipes', () => {
    const build = new Build();
    const rows = evolutionProgress(build);
    expect(rows).toHaveLength(EVOLUCIONES.length);
    expect(rows[0]?.status).toBe('building');
    const kite = rows.find(r => r.evolution.weapon === 'volantin');
    expect(kite?.level).toBe(1);
    expect(kite?.hasTrait).toBe(false);
    expect(rows.find(r => r.evolution.weapon === 'trompo')?.status).toBe('missing');
  });

  it('agrees with the actual chest rules and does not change the build', () => {
    const build = new Build();
    const weapon = build.weapon('volantin');
    if (!weapon) throw new Error('volantin');
    weapon.level = weapon.def.maxLevel;
    expect(evolutionProgress(build).find(r => r.evolution.weapon === 'volantin')?.status).toBe('building');
    build.apply({ kind: 'trait', id: 'laOnce', rarity: 'comun', toLevel: 1 });
    const before = JSON.stringify({ weapons: build.weapons, traits: build.traits, evolved: [...build.evolved] });
    const ready = evolutionProgress(build)[0];
    expect(ready?.status).toBe('ready');
    expect(ready?.evolution.id).toBe(build.evolutionReady()?.id);
    expect(JSON.stringify({ weapons: build.weapons, traits: build.traits, evolved: [...build.evolved] })).toBe(before);
    build.apply({ kind: 'evolution', id: 'volantin', evolution: 'cieloDelDieciocho', rarity: 'legendaria' });
    expect(evolutionProgress(build).find(r => r.evolution.weapon === 'volantin')?.status).toBe('evolved');
  });
});
