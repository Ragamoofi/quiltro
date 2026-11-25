import { describe, expect, it } from 'vitest';
import { SPRITES } from '../src/art/sprites/index.ts';
import { PRIORITY } from '../src/audio/sfx.ts';
import { PERSONAJES } from '../src/data/personajes.ts';

describe('Fase 11.9: cada personaje suena y se mueve distinto', () => {
  it('every character but the quiltro has its own cry, and only the two dogs bark', () => {
    const sounds = PERSONAJES.map((c) => c.voice?.sound ?? 'guau');
    for (const s of sounds) expect(PRIORITY[s], s).toBe(3);
    // Only the dogs bark (the quiltro, the ratonera, the fire dog and the party dog).
    const barkers = PERSONAJES.filter((c) => (c.voice?.sound ?? 'guau') === 'guau').map((c) => c.id);
    expect(barkers.sort()).toEqual(['dieciocho', 'pillan', 'quiltra', 'quiltro']);
    // Characters that share a cry sound different (another pitch).
    const keys = PERSONAJES.map((c) => `${c.voice?.sound ?? 'guau'}@${c.voice?.pitch ?? 1}`);
    expect(new Set(keys).size).toBe(PERSONAJES.length);
  });

  it('the condor and the pigeon fly: their trot is a different drawing from their standing pose', () => {
    for (const c of PERSONAJES.filter((x) => x.flies)) {
      const def = SPRITES.find((s) => s.name === c.sprite);
      const trot = def?.animations.trotar?.frames[0];
      const stand = def?.animations.cargar?.frames[0];
      expect(trot, c.id).toBeDefined();
      expect(trot).not.toEqual(stand);
    }
    expect(PERSONAJES.filter((x) => x.flies).map((x) => x.id).sort()).toEqual(['caleuchito', 'carpintero', 'condor', 'flamenco', 'paloma', 'tucan']);
  });
});
