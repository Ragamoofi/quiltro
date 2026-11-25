/**
 * Builds the promotional images from the game's own sprites, palette and font, so they
 * look exactly like the game. Output goes to promo/ (cover 1280×720, poster 1080×1920, square 1024×1024).
 * Usage: node scripts/make-promo.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { colorOf, hexToRgb } from '../src/art/palette.ts';
import { textRows } from '../src/art/font.ts';
import { layoutSheet } from '../src/art/sheet.ts';
import { SPRITES } from '../src/art/sprites/index.ts';
import { outlined } from '../src/art/types.ts';
import { encodePng } from './png.ts';

const frames = new Map(layoutSheet(SPRITES).frames.map((f) => [f.key, f.rows]));
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

class Canvas {
  readonly px: Uint8Array;
  readonly w: number;
  readonly h: number;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.px = new Uint8Array(w * h * 4);
  }
  set(x: number, y: number, code: string): void {
    const c = colorOf(code);
    if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px.set([...hexToRgb(c.hex), 255], (y * this.w + x) * 4);
  }
  rect(x: number, y: number, w: number, h: number, code: string): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, code);
  }
  /** Dithered vertical gradient between two palette colours. */
  sky(top: string, bottom: string, h: number): void {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < this.w; x++) {
        this.set(x, y, y / h > ((BAYER[(y % 4) * 4 + (x % 4)] ?? 0) + 0.5) / 16 ? bottom : top);
      }
    }
  }
  /** Draws rows of palette codes at an integer zoom; (x, y) is the bottom-centre. */
  sprite(key: string, x: number, y: number, zoom = 1, flip = false): void {
    const rows = frames.get(key);
    if (!rows) throw new Error(`sprite ${key} no existe`);
    this.rows(rows, x, y, zoom, flip);
  }
  rows(rows: readonly string[], x: number, y: number, zoom = 1, flip = false, anchorBottom = true): void {
    const w = rows[0]?.length ?? 0;
    const left = Math.round(x - (w * zoom) / 2);
    const top = anchorBottom ? Math.round(y - rows.length * zoom) : y;
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < w; rx++) {
        const ch = row[flip ? w - 1 - rx : rx] ?? '.';
        if (ch === '.') continue;
        this.rect(left + rx * zoom, top + ry * zoom, zoom, zoom, ch);
      }
    });
  }
  text(s: string, cx: number, y: number, color: string, zoom = 1): void {
    const rows = outlined(textRows(s, color, true), 'k');
    this.rows(rows, cx, y, zoom, false, false);
  }
  logo(cx: number, y: number, zoom: number): void {
    const rows = textRows('QUILTRO', 'a', true).map((r, ry) => (ry < 3 ? r.replace(/a/g, 'y') : r));
    const inner = outlined(outlined(rows, 'k'), 'k');
    const shadow = inner.map((r, ry) => r.replace(/./g, (c, rx) => (c === '.' && inner[ry - 1]?.[rx - 1] && inner[ry - 1]?.[rx - 1] !== '.' ? 'K' : c)));
    this.rows(shadow, cx, y, zoom, false, false);
  }
  save(path: string, scale: number): void {
    const W = this.w * scale;
    const H = this.h * scale;
    const out = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const so = (Math.floor(y / scale) * this.w + Math.floor(x / scale)) * 4;
        out.set(this.px.subarray(so, so + 4), (y * W + x) * 4);
      }
    }
    writeFileSync(path, encodePng(W, H, out));
    console.warn(`${path} ${W}×${H}`);
  }
}

/** Little deterministic scatter so the ground is not flat. */
function ground(c: Canvas, top: number): void {
  c.rect(0, top, c.w, c.h - top, 'v');
  for (let y = top; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (((x * 7 + y * 13) ^ (x >> 2)) % 11 === 0) c.set(x, y, 'F');
    }
  }
  c.rect(0, top, c.w, 1, 'k');
  c.rect(0, top + 1, c.w, 1, 'G');
}

function mountains(c: Canvas, base: number): void {
  for (let x = 0; x < c.w; x++) {
    const h = 26 + Math.round(18 * Math.sin(x / 23) + 10 * Math.sin(x / 7.3));
    c.rect(x, base - h, 1, h, 'B');
    c.set(x, base - h, 'W');
    if (h > 40) c.rect(x, base - h, 1, 3, 'w');
  }
}

mkdirSync('promo', { recursive: true });

// 1. Cover 1280×720 (320×180 native ×4).
{
  const c = new Canvas(320, 180);
  c.sky('b', 's', 120);
  mountains(c, 120);
  ground(c, 120);
  c.sprite('alicanto/volar/0', 262, 74, 2);
  c.sprite('paloma/volar/0', 190, 70, 2);
  c.sprite('paloma/volar/0', 226, 96, 1, true);
  c.sprite('zancudo/volar/0', 150, 84, 2);
  c.sprite('guanaco/caminar/0', 276, 150, 2, true);
  c.sprite('chingue/correr/0', 230, 156, 2, true);
  c.sprite('puma/caminar/0', 196, 144, 2, true);
  c.sprite('volantin/v1/0', 110, 62, 2);
  c.sprite('quiltro/trotar/0', 110, 150, 4);
  c.logo(110, 10, 4);
  c.text('4.300 KM DE PURO AGUANTE', 110, 52, 'w', 1);
  c.save('promo/portada-1280x720.png', 4);
}

// 2. Poster 1080×1920 (270×480 native ×4): portrait, for stories and the vertical thumbnail.
{
  const c = new Canvas(270, 480);
  c.sky('k', 'b', 330);
  for (let i = 0; i < 70; i++) c.set((i * 97) % 270, (i * 53) % 150, 'w');
  mountains(c, 330);
  ground(c, 330);
  c.logo(135, 24, 4);
  c.text('UN QUILTRO. 4.300 KM DE CHILE.', 135, 66, 'w', 1);
  c.sprite('alicanto/volar/0', 190, 170, 2);
  c.sprite('paloma/volar/0', 60, 140, 2);
  c.sprite('zancudo/volar/0', 220, 240, 2);
  c.sprite('guanaco/caminar/0', 215, 360, 2, true);
  c.sprite('puma/caminar/0', 60, 392, 2);
  c.sprite('chingue/correr/0', 190, 410, 2, true);
  c.sprite('volantin/v1/0', 100, 210, 3);
  c.sprite('quiltro/trotar/0', 135, 440, 5);
  c.text('PURO AGUANTE', 135, 454, 'a', 2);
  c.save('promo/poster-1080x1920.png', 4);
}

// 3. Square 1024×1024 (256×256 native ×4): store icons and social avatars.
{
  const c = new Canvas(256, 256);
  c.sky('b', 's', 170);
  mountains(c, 170);
  ground(c, 170);
  c.sprite('volantin/v1/0', 170, 82, 3);
  c.sprite('paloma/volar/0', 60, 98, 2);
  c.sprite('quiltro/trotar/0', 128, 215, 6);
  c.logo(128, 14, 4);
  c.save('promo/cuadrado-1024.png', 4);
}
