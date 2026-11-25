import { Graphics, Texture } from 'pixi.js';
import { colorOf } from '../art/palette.ts';

/*
 * Fase 11.10 — the backdrop of the main menu: the whole of Chile in one postcard, drawn pixel by
 * pixel at the game's own resolution (no outside images): the snowy Andes, a smoking volcano of
 * the south, the granite towers of Patagonia, araucarias, the coloured houses of Valparaíso on
 * their hill and a meadow full of copihues where the Cucha stands.
 */

const hex = (ch: string): string => colorOf(ch)?.hex ?? '#FF00FF';

/** Periodic pseudo-noise so the shapes look hand-made but stay the same every time. */
const wave = (x: number, w: number, f: readonly number[], a: readonly number[]): number =>
  f.reduce((s, fi, i) => s + Math.sin((x / w) * Math.PI * 2 * fi + i * 1.9) * (a[i] ?? 0), 0);

export interface PanoramaLayout {
  /** Top of the meadow (where the Cucha and the dog stand). */
  groundY: number;
}

export function panoramaLayout(w: number, h: number): PanoramaLayout {
  return { groundY: Math.round(h > w ? h * 0.6 : h * 0.74) };
}

export function chilePanorama(w: number, h: number): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Texture.EMPTY;
  const fill = (color: string, x: number, y: number, rw = 1, rh = 1): void => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), rw, rh);
  };
  const { groundY } = panoramaLayout(w, h);
  const andesBase = Math.round(groundY - h * 0.13);

  // 1. Sky: clean bands from deep blue to a warm glow behind the mountains (no dithering).
  const sky = ['#2F5FB8', '#3D73CC', '#5089DB', '#679FE6', '#7FB8F5', '#A3CDF5', '#C9E1F2', '#F2E2C4'];
  const skyH = andesBase;
  sky.forEach((c, i) => fill(c, 0, Math.floor((i * skyH) / sky.length), w, Math.ceil(skyH / sky.length) + 1));
  fill(sky[sky.length - 1] ?? '#F2E2C4', 0, skyH, w, groundY - skyH);

  // 2. A few pixel clouds.
  const cloud = (cx: number, cy: number, s: number): void => {
    for (const [dx, dy, r] of [[0, 0, 5], [6, -2, 6], [13, 0, 5], [6, 2, 5]] as const) {
      const rr = r * s;
      for (let y = -rr; y <= rr; y++) for (let x = -rr * 1.6; x <= rr * 1.6; x++) if ((x / 1.6) ** 2 + y * y <= rr * rr) fill(y > rr * 0.4 ? '#DCE8F7' : '#FFFFFF', cx + dx * s + x, cy + dy * s + y);
    }
  };
  cloud(w * 0.08, h * 0.12, 0.9);
  cloud(w * 0.46, h * 0.07, 0.7);
  cloud(w * 0.7, h * 0.16, 1);

  // 3. The Andes: sharp peaks across the whole width, snow on the tops.
  const peak = (x: number): number => {
    const base = 26 + wave(x, w, [3, 7, 13], [7, 4, 2]);
    const saw = Math.abs(((x * 0.9) % 46) - 23);
    return Math.max(10, base + 18 - saw * 0.9);
  };
  for (let x = 0; x < w; x++) {
    const ph = Math.round(peak(x) * (h / 270));
    const top = andesBase - ph;
    for (let y = top; y < groundY; y++) {
      const d = y - top;
      let c = d < ph * 0.22 ? '#FFFFFF' : d < ph * 0.3 ? '#DDE6F2' : x % 7 < 3 && d > ph * 0.45 ? '#5B4F78' : '#6B5E8A';
      if (d < ph * 0.22 && (x + d) % 9 === 0) c = '#DDE6F2';
      fill(c, x, y);
    }
  }

  // 4. A volcano of the south (to the right), with its snowcap and a thin plume of smoke.
  const vx = w * 0.5;
  const vh = h * 0.27;
  const vTop = andesBase - vh + h * 0.04;
  for (let y = Math.round(vTop); y < groundY; y++) {
    const half = 3 + (y - vTop) * 1.25;
    for (let x = Math.round(vx - half); x <= vx + half; x++) {
      const snow = y - vTop < vh * 0.28 + Math.sin(x * 0.7) * 2;
      fill(snow ? '#FFFFFF' : x < vx ? '#4E4568' : '#5E5479', x, y);
    }
  }
  for (const [ox, oy, r] of [[0, -5, 3], [4, -10, 4], [9, -16, 5], [16, -21, 5]] as const) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) fill(y < 0 ? '#F2F2F2' : '#CFCFD8', vx + ox + x, vTop + oy + y);
  }

  // 5. The Torres del Paine (to the left): three granite needles with dark crowns.
  const tx = w * 0.16;
  const towers = [[-14, 0.27], [0, 0.33], [12, 0.25]] as const;
  for (const [dx, th] of towers) {
    const top = groundY - h * 0.12 - h * th;
    for (let y = Math.round(top); y < groundY; y++) {
      const half = 2 + (y - top) * 0.22;
      for (let x = Math.round(tx + dx - half); x <= tx + dx + half; x++) {
        const crown = y - top < h * 0.05;
        fill(crown ? '#3A3148' : x < tx + dx ? '#9C93AA' : '#B9B1C5', x, y);
      }
    }
  }

  // 6. Green hills in front, with araucarias on the left and a pale road.
  const hillTop = (x: number): number => groundY - h * 0.07 - wave(x, w, [2, 5], [h * 0.025, h * 0.012]);
  for (let x = 0; x < w; x++) for (let y = Math.round(hillTop(x)); y < groundY; y++) fill(y - hillTop(x) < 2 ? '#7DBD62' : '#4E8E4A', x, y);
  const araucaria = (ax: number, size: number): void => {
    const base = hillTop(ax) + 2;
    const trunk = 14 * size;
    fill('#5A3E2B', ax, base - trunk, 2, trunk);
    // Umbrella crown: stacked flat layers, widest on top (the araucaria's own shape).
    for (let i = 0; i < 4; i++) {
      const wd = Math.round((10 - i * 1.5) * size);
      const y = base - trunk - 2 - i * 3 * size;
      fill('#1B4235', ax - wd + 1, y, wd * 2, 2);
      fill('#2D6A4F', ax - wd + 2, y, wd * 2 - 2, 1);
    }
  };
  for (const [ax, s] of [[w * 0.05, 1], [w * 0.11, 0.8], [w * 0.27, 1.1], [w * 0.34, 0.85]] as const) araucaria(ax, s * (h / 270));

  // 7. Valparaíso: the coloured houses climbing their hill on the right, windows and tin roofs.
  const vpLeft = w * 0.56;
  const colours = ['#FFD166', '#F28CB1', '#6AD5C9', '#2F7DE1', '#E63946', '#FBF3E4', '#F5A524', '#2E9A93', '#A3D16B'];
  const hw = 13;
  for (let col = 0; col * hw < w - vpLeft; col++) {
    const x0 = vpLeft + col * hw;
    const rise = Math.min(h * 0.2, (col * hw) * 0.28);
    const top = groundY - h * 0.05 - rise;
    for (let row = 0; top + row * 11 < groundY; row++) {
      const y0 = top + row * 11;
      const c = colours[(col * 5 + row * 3) % colours.length] ?? '#FFD166';
      fill('#2A2233', x0, y0, hw, 11);
      fill(c, x0 + 1, y0 + 2, hw - 2, 9);
      fill('#9C93AA', x0, y0, hw, 2);
      fill('#B9B1C5', x0 + 1, y0, hw - 2, 1);
      fill('#2A2233', x0 + 3, y0 + 4, 2, 3);
      fill('#2A2233', x0 + 8, y0 + 4, 2, 3);
      if ((col + row) % 2 === 0) fill('#FFF3B0', x0 + 8, y0 + 4, 2, 2);
    }
  }

  // 8. The meadow: grass with stripes, copihues (red) and little yellow flowers.
  for (let y = groundY; y < h; y++) fill(y === groundY ? '#A3D16B' : (y - groundY) % 9 < 5 ? '#5FA35A' : '#56984F', 0, y, w, 1);
  for (let i = 0; i < Math.floor(w / 6); i++) {
    const x = (i * 97) % w;
    const y = groundY + 4 + ((i * 53) % Math.max(1, h - groundY - 6));
    if (i % 3 === 0) {
      fill('#2D6A4F', x, y + 2, 1, 2);
      fill(hex('r'), x - 1, y, 3, 2);
      fill('#9E1F35', x, y + 1, 1, 1);
    } else fill(i % 2 ? '#FFD166' : '#FBF3E4', x, y, 1, 1);
  }

  const tex = Texture.from(canvas);
  tex.source.scaleMode = 'nearest';
  return tex;
}

/** The flag of Chile waving on its pole (redrawn every frame). Pole base at (x, y). */
export function drawFlag(g: Graphics, x: number, y: number, time: number, scale = 1): void {
  const pole = Math.round(44 * scale);
  g.rect(x, y - pole, 2, pole).fill(0x2a2233);
  g.rect(x - 1, y - pole - 2, 4, 2).fill(0xffd166);
  const fw = Math.round(24 * scale);
  const fh = Math.round(16 * scale);
  const top = y - pole + 1;
  for (let c = 0; c < fw; c++) {
    const dy = Math.round(Math.sin(time * 4 - c * 0.35) * 1.4 * (c / fw));
    const cx = x + 2 + c;
    for (let r = 0; r < fh; r++) {
      const inSquare = c < fh / 2 && r < fh / 2;
      let color = r < fh / 2 ? 0xfbf3e4 : 0xe63946;
      if (inSquare) color = 0x1d4e9e;
      g.rect(cx, top + r + dy, 1, 1).fill(color);
    }
  }
  // The white star in the blue square.
  const sx = x + 2 + Math.round(fh / 4);
  const sy = top + Math.round(fh / 4) + Math.round(Math.sin(time * 4 - (fh / 4) * 0.35) * 1.4 * (fh / 4 / fw));
  g.rect(sx - 1, sy, 3, 1).fill(0xffffff);
  g.rect(sx, sy - 1, 1, 3).fill(0xffffff);
  g.rect(sx - 1, sy + 1, 1, 1).fill(0xffffff);
  g.rect(sx + 1, sy + 1, 1, 1).fill(0xffffff);
}
