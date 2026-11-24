import { describe, expect, it } from 'vitest';
import { GLYPHS, outlinedText, textRows } from '../src/art/font.ts';
import { outlined, recolor, silhouette } from '../src/art/types.ts';
import { px, TUNING } from '../src/data/balance.ts';
import { Shake } from '../src/game/fx/shake.ts';
import { SpatialGrid } from '../src/game/systems/spatialGrid.ts';

describe('spatial grid', () => {
  it('finds neighbours across cell borders and ignores far ones', () => {
    const g = new SpatialGrid(64);
    g.insert(1, 63, 63);
    g.insert(2, 65, 65);
    g.insert(3, 500, 500);
    const out: number[] = [];
    g.query(64, 64, 10, out);
    expect(out.sort()).toEqual([1, 2]);
    g.clear();
    expect(g.query(64, 64, 10, out)).toEqual([]);
  });
});

describe('shake', () => {
  it('moves in whole pixels and calms down', () => {
    const s = new Shake();
    s.add(1);
    for (let i = 0; i < 10; i++) {
      s.update(1 / 60);
      expect(Number.isInteger(s.x)).toBe(true);
      expect(Number.isInteger(s.y)).toBe(true);
      expect(Math.abs(s.x)).toBeLessThanOrEqual(s.maxOffset);
    }
    for (let i = 0; i < 120; i++) s.update(1 / 60);
    expect(s.trauma).toBe(0);
    expect(s.x === 0 && s.y === 0).toBe(true);
  });

  it('respects the options slider', () => {
    const s = new Shake();
    s.amount = 0;
    s.add(1);
    s.update(1 / 60);
    expect(Math.abs(s.x) + Math.abs(s.y)).toBe(0);
  });
});

describe('pixel helpers and font', () => {
  it('every glyph is 5 rows of equal width', () => {
    for (const [ch, rows] of Object.entries(GLYPHS)) {
      expect(rows, ch).toHaveLength(5);
      expect(new Set(rows.map((r) => r.length)).size, ch).toBe(1);
    }
  });

  it('outlines text with ink', () => {
    const f = outlinedText('GUAU', 'r');
    expect(f).toHaveLength(7);
    expect(f.join('')).toContain('k');
    expect(f.join('')).toContain('r');
    expect(textRows('A', 'w', true)[0]).toBe('.w.');
    // Accent row + gap + letter.
    const acc = textRows('Á', 'w');
    expect(acc).toHaveLength(7);
    expect(acc[0]).toBe('..w');
    expect(textRows('ñ', 'w')[0]).toBe('.ww.');
  });

  it('outlined, silhouette and recolor keep sizes', () => {
    const base = ['.r.', 'rrr'];
    expect(outlined(base)).toEqual(['..k..', '.krk.', 'krrrk', '.kkk.']);
    expect(silhouette(base, 'W')).toEqual(['.W.', 'WWW']);
    expect(recolor(base, { r: 'b' })).toEqual(['.b.', 'bbb']);
  });
});

describe('world scale', () => {
  it('converts GDD px to native px', () => {
    const before = TUNING.worldScale;
    TUNING.worldScale = 0.5;
    expect(px(220)).toBe(110);
    TUNING.worldScale = before;
  });
});
