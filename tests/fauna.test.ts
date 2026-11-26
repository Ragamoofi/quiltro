import { describe, expect, it } from 'vitest';
import { SPRITES } from '../src/art/sprites/index.ts';
import { ART_PALETTE, colorOf } from '../src/art/palette.ts';
import { importedFauna } from '../src/art/sprites/faunaImported.ts';
import { validateSprites } from '../src/art/sheet.ts';

describe('fauna integrada', () => {
  it('has every player action and distinct movement frames for all replaced species', () => {
    for (const id of ['zorro', 'capibara', 'pumaPj', 'huemul', 'monito', 'chinchilla', 'vizcacha']) {
      const sprite = SPRITES.find(s => s.name === id);
      expect(sprite, id).toBeDefined();
      for (const action of ['quieto', 'trotar', 'cargar', 'ladrar', 'dano', 'muerte', 'dormir', 'estirar', 'silueta', 'parpadeo']) {
        expect(sprite?.animations[action]?.frames.length, `${id}/${action}`).toBeGreaterThan(0);
      }
      const movement = sprite?.animations.trotar?.frames ?? [];
      expect(new Set(movement.map(f => f.join(''))).size, id).toBeGreaterThanOrEqual(4);
      expect(sprite?.animations.muerte?.loop).toBe(false);
      expect(sprite?.animations.muerte?.frames.at(-1)).not.toEqual(sprite?.animations.quieto?.frames[0]);
    }
  });

  it('preserves source colors without conflicting palette keys or changing the sheet contract', () => {
    expect(new Set(ART_PALETTE.map(c => c.char)).size).toBe(ART_PALETTE.length);
    expect(validateSprites(importedFauna)).toEqual([]);
    for (const s of importedFauna) {
      expect(SPRITES.find(x => x.name === s.name)).toBe(s);
      expect(s.flash).toBe(true);
      expect(s.animations.parpadeo?.frames[0]).not.toEqual(s.animations.quieto?.frames[0]);
      for (const f of s.animations.trotar?.frames ?? []) for (const c of f.join('')) {
        if (c !== '.') expect(colorOf(c), c).toBeDefined();
      }
    }
  });
});
