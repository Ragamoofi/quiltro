import { Sprite } from 'pixi.js';
import { textRows } from '../art/font.ts';
import { outlined, type Frame } from '../art/types.ts';
import { frameTexture } from './text.ts';

/**
 * The QUILTRO logo: the pixel font letters, two-tone (yellow top, gold
 * bottom) with a double ink outline and a drop shadow, as one texture.
 */
export function logoFrame(text = 'QUILTRO'): Frame {
  const rows = textRows(text, 'a', true).map((r, y) => (y < 3 ? r.replace(/a/g, 'y') : r));
  const inner = outlined(outlined(rows, 'k'), 'k');
  // Drop shadow: the outline shape shifted 1 px down-right in tinta clara.
  const h = inner.length + 1;
  const w = (inner[0]?.length ?? 0) + 1;
  const out: string[] = [];
  for (let y = 0; y < h; y++) {
    let line = '';
    for (let x = 0; x < w; x++) {
      const c = inner[y]?.[x];
      const shadow = inner[y - 1]?.[x - 1];
      line += c && c !== '.' ? c : shadow && shadow !== '.' ? 'K' : '.';
    }
    out.push(line);
  }
  return out;
}

export function logoSprite(scale: number): Sprite {
  const s = new Sprite(frameTexture(logoFrame()));
  s.scale.set(scale);
  return s;
}
