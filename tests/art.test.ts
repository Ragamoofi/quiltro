import { describe, expect, it } from 'vitest';
import { PALETTE } from '../src/art/palette.ts';
import { layoutSheet, rasterize, validateSprites } from '../src/art/sheet.ts';
import { SPRITES } from '../src/art/sprites/index.ts';

describe('palette', () => {
  it('has exactly 32 colours with unique characters and values', () => {
    expect(PALETTE).toHaveLength(32);
    expect(new Set(PALETTE.map((c) => c.char)).size).toBe(32);
    expect(new Set(PALETTE.map((c) => c.hex.toUpperCase())).size).toBe(32);
    for (const c of PALETTE) expect(c.hex).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('includes every base colour from the GDD', () => {
    const hexes = new Set(PALETTE.map((c) => c.hex));
    for (const base of [
      '#2A2233', '#E8A15C', '#2F7DE1', '#E63946', '#FBF3E4', '#E9A35B',
      '#FF8FAB', '#FFD166', '#6AD5C9', '#2D6A4F', '#A8E6F0', '#F4B942',
    ]) {
      expect(hexes.has(base)).toBe(true);
    }
  });
});

describe('sprites', () => {
  it('are all valid (sizes and palette)', () => {
    expect(validateSprites(SPRITES)).toEqual([]);
  });

  it('catches mistakes', () => {
    const bad = [
      {
        name: 'malo',
        group: 'ui' as const,
        width: 2,
        height: 3,
        animations: { a: { fps: 8, frames: [['kX', 'k']] } },
      },
    ];
    const errors = validateSprites(bad);
    expect(errors.some((e) => e.includes("'X'"))).toBe(true);
    expect(errors.some((e) => e.includes('filas'))).toBe(true);
    expect(errors.some((e) => e.includes('columnas'))).toBe(true);
  });

  it('use the ink outline (#2A2233) on characters', () => {
    for (const s of SPRITES.filter((x) => x.group === 'personajes')) {
      for (const [name, a] of Object.entries(s.animations)) {
        if (name === 'silueta' || name.endsWith('_sombra')) continue;
        for (const f of a.frames) expect(f.join('')).toContain('k');
      }
    }
  });

  it('pack without overlaps', () => {
    const layout = layoutSheet(SPRITES);
    // One flag per pixel of the sheet; a frame that lands on a used pixel is an overlap.
    const used = new Uint8Array(layout.width * layout.height);
    const problems: string[] = [];
    for (const f of layout.frames) {
      if (f.x + f.w > layout.width || f.y + f.h > layout.height) problems.push(`${f.key} se sale de la hoja`);
      for (let y = f.y; y < Math.min(layout.height, f.y + f.h); y++) {
        for (let x = f.x; x < Math.min(layout.width, f.x + f.w); x++) {
          const i = y * layout.width + x;
          if (used[i]) problems.push(`${f.key} pisa a otro cuadro en ${x},${y}`);
          used[i] = 1;
        }
      }
    }
    expect(problems.slice(0, 5)).toEqual([]);
    expect(rasterize(layout)).toHaveLength(layout.width * layout.height * 4);
  });
});
