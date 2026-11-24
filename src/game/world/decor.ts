import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../../art/assets.ts';
import { colorOf, hexToNumber } from '../../art/palette.ts';
import { POSTE_AISLADORES } from '../../art/sprites/decoracion.ts';
import { hash2 } from '../../core/rng.ts';

const CHUNK = 96;
const INK = hexToNumber(colorOf('k')?.hex ?? '#2A2233');
const INK_LIGHT = hexToNumber(colorOf('K')?.hex ?? '#4A3F5C');

interface Item {
  sprite: Sprite;
}
interface Chunk {
  items: Item[];
  /** World position of this chunk's pole base, if it has one. */
  pole: { x: number; y: number } | null;
}

/**
 * Procedural decoration for the Centro: lines of poles along some "streets"
 * joined by sagging cables (drawn overhead, so the dog walks under them),
 * plus kiosks, sopaipilla carts and hydrants. Everything is a pure function of
 * the chunk coordinates, so the same street always looks the same.
 */
export class Decor {
  /** Cables drawn above every entity. */
  readonly overhead = new Graphics();
  private readonly chunks = new Map<string, Chunk>();
  private readonly world: Container;
  private readonly seed: number;
  private time = 0;

  constructor(world: Container, seed = 7) {
    this.world = world;
    this.seed = seed;
  }

  private isStreet(cy: number): boolean {
    return ((cy % 3) + 3) % 3 === 1;
  }

  private build(cx: number, cy: number): Chunk {
    const chunk: Chunk = { items: [], pole: null };
    const x0 = cx * CHUNK;
    const y0 = cy * CHUNK;
    const nearOrigin = Math.abs(x0 + CHUNK / 2) < CHUNK && Math.abs(y0 + CHUNK / 2) < CHUNK;
    const add = (sprite: string, x: number, y: number): void => {
      const tex = anim(sprite, 'quieto').textures[0];
      if (!tex) return;
      const s = new Sprite(tex);
      s.anchor.set(tex.defaultAnchor?.x ?? 0.5, tex.defaultAnchor?.y ?? 1);
      s.position.set(Math.round(x), Math.round(y));
      s.zIndex = Math.round(y);
      this.world.addChild(s);
      chunk.items.push({ sprite: s });
    };

    if (this.isStreet(cy)) {
      const x = x0 + CHUNK / 2 + Math.round((hash2(cx, cy, this.seed + 1) - 0.5) * 16);
      const y = y0 + 24;
      chunk.pole = { x, y };
      add('poste', x, y);
      if (hash2(cx, cy, this.seed + 2) < 0.25) add('grifo', x + 14, y + 4);
      return chunk;
    }
    if (nearOrigin) return chunk;
    const h = hash2(cx, cy, this.seed);
    const ox = x0 + 20 + hash2(cx, cy, this.seed + 3) * (CHUNK - 40);
    const oy = y0 + 30 + hash2(cx, cy, this.seed + 4) * (CHUNK - 40);
    if (h < 0.07) add('quiosco', ox, oy);
    else if (h < 0.13) add('carro_sopaipillas', ox, oy);
    else if (h < 0.24) add('grifo', ox, oy);
    return chunk;
  }

  /** Keeps chunks around the view alive and draws the cables. */
  update(dt: number, originX: number, originY: number, viewW: number, viewH: number): void {
    this.time += dt;
    const cx0 = Math.floor((originX - CHUNK) / CHUNK);
    const cx1 = Math.floor((originX + viewW + CHUNK) / CHUNK);
    const cy0 = Math.floor((originY - CHUNK / 2) / CHUNK);
    const cy1 = Math.floor((originY + viewH + CHUNK) / CHUNK);
    const keep = new Set<string>();
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const key = `${cx},${cy}`;
        keep.add(key);
        if (!this.chunks.has(key)) this.chunks.set(key, this.build(cx, cy));
      }
    }
    for (const [key, chunk] of this.chunks) {
      if (keep.has(key)) continue;
      for (const it of chunk.items) it.sprite.destroy();
      this.chunks.delete(key);
    }

    // Cables between neighbouring poles of the same street.
    const g = this.overhead;
    g.clear();
    for (let cy = cy0; cy <= cy1; cy++) {
      if (!this.isStreet(cy)) continue;
      for (let cx = cx0; cx < cx1; cx++) {
        const a = this.chunks.get(`${cx},${cy}`)?.pole;
        const b = this.chunks.get(`${cx + 1},${cy}`)?.pole;
        if (!a || !b) continue;
        POSTE_AISLADORES.forEach((ins, i) => {
          const sway = Math.sin(this.time * 1.4 + cx * 0.9 + i) * 1.2;
          this.cable(a.x + ins.x, a.y + ins.y, b.x + ins.x, b.y + ins.y, 7 + i * 3 + sway, i === 1 ? INK_LIGHT : INK);
        });
        // The "maraña": a couple of extra loose wires on some spans.
        if (hash2(cx, cy, this.seed + 9) < 0.5) {
          const sway = Math.sin(this.time * 1.1 + cx) * 1.5;
          this.cable(a.x - 6, a.y - 36, b.x + 6, b.y - 36, 16 + sway, INK);
          this.cable(a.x, a.y - 37, b.x - 6, b.y - 37, 21 - sway, INK_LIGHT);
        }
      }
    }
  }

  private cable(x0: number, y0: number, x1: number, y1: number, sag: number, color: number): void {
    const g = this.overhead;
    const steps = 12;
    g.moveTo(Math.round(x0) + 0.5, Math.round(y0) + 0.5);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const x = Math.round(x0 + (x1 - x0) * t);
      const y = Math.round(y0 + (y1 - y0) * t + sag * 4 * t * (1 - t));
      g.lineTo(x + 0.5, y + 0.5);
    }
    g.stroke({ width: 1, color });
  }
}
