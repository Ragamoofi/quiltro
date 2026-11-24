import type { Frame } from './types.ts';

/**
 * Tiny pixel-drawing helpers for building matrices from simple shapes
 * (icons, round items). The result is still a plain text frame.
 */
export class Pix {
  readonly w: number;
  readonly h: number;
  private readonly px: string[][];

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.px = Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
  }

  set(x: number, y: number, ch: string): this {
    const row = this.px[Math.round(y)];
    if (row && x >= 0 && x < this.w) row[Math.round(x)] = ch;
    return this;
  }

  rect(x: number, y: number, w: number, h: number, ch: string): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, ch);
    return this;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, ch: string): this {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, ch);
      }
    }
    return this;
  }

  disc(cx: number, cy: number, r: number, ch: string): this {
    return this.ellipse(cx, cy, r, r, ch);
  }

  /** Paints rows of text at (x, y); '.' leaves pixels untouched. */
  rows(x: number, y: number, rows: readonly string[]): this {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch && ch !== '.') this.set(x + i, y + j, ch);
      }
    });
    return this;
  }

  frame(): Frame {
    return this.px.map((r) => r.join(''));
  }
}
