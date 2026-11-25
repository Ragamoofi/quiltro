import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../../art/assets.ts';
import { colorOf, hexToNumber } from '../../art/palette.ts';
import { DECO_ZONA } from '../../art/sprites/decoracion2.ts';
import { DECO_AMBIENTE } from '../../art/sprites/mapas.ts';
import { POSTE_AISLADORES } from '../../art/sprites/decoracion.ts';
import { hash2 } from '../../core/rng.ts';

const CHUNK = 96;
const INK = hexToNumber(colorOf('k')?.hex ?? '#2A2233');
const INK_LIGHT = hexToNumber(colorOf('K')?.hex ?? '#4A3F5C');

interface Chunk {
  items: Sprite[];
  /** World position of this chunk's pole base, if it has one. */
  pole: { x: number; y: number } | null;
}

/**
 * Procedural decoration, different per zone. Centro: lines of poles along some
 * "streets" joined by sagging cables (drawn overhead, so the dog walks under
 * them), kiosks, sopaipilla carts and hydrants. Other zones scatter their own
 * big/medium/small props. Pure function of chunk coordinates + zone.
 */
export class Decor {
  /** Cables drawn above every entity. */
  readonly overhead = new Graphics();
  private readonly chunks = new Map<string, Chunk>();
  private readonly world: Container;
  private readonly seed: number;
  private zone = 'centro';
  private cityProp: string | null = null;
  /** The environment (Santiago has its own market stalls). */
  private env = '';
  private time = 0;

  constructor(world: Container, seed = 7) {
    this.world = world;
    this.seed = seed;
  }

  setZone(zone: string): void {
    if (zone === this.zone) return;
    this.zone = zone;
    // The environment is chosen again on the next step (La Antártica has none).
    this.env = '';
    this.clearChunks();
    this.overhead.clear();
  }

  /** Fase 10.6: Santiago is a busy market street, the rest of the Centro keeps the old props. */
  setEnv(id: string): void {
    if (id === this.env) return;
    this.env = id;
    this.clearChunks();
  }

  /** The ground prop of the city that is near (null: none); redraws the props around the view. */
  setCityProp(sprite: string | null): void {
    if (sprite === this.cityProp) return;
    this.cityProp = sprite;
    this.clearChunks();
  }

  private clearChunks(): void {
    for (const c of this.chunks.values()) for (const s of c.items) s.destroy();
    this.chunks.clear();
  }

  /** Santiago and the old Centro are a city of poles and cables; the coast (Valparaíso, Viña) has its own scenery. */
  private get urban(): boolean {
    return this.zone === 'centro' && this.env !== 'costa';
  }

  private isStreet(cy: number): boolean {
    return this.urban && ((cy % 3) + 3) % 3 === 1;
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
      chunk.items.push(s);
    };
    const h = hash2(cx, cy, this.seed);
    const ox = x0 + 20 + hash2(cx, cy, this.seed + 3) * (CHUNK - 40);
    const oy = y0 + 30 + hash2(cx, cy, this.seed + 4) * (CHUNK - 40);

    // The near city's own prop, scattered on top of the zone's decoration.
    if (this.cityProp && !nearOrigin && !this.isStreet(cy) && hash2(cx, cy, this.seed + 11) < 0.2) {
      add(this.cityProp, x0 + 14 + hash2(cx, cy, this.seed + 12) * (CHUNK - 28), y0 + 24 + hash2(cx, cy, this.seed + 13) * (CHUNK - 36));
    }

    if (this.urban) {
      if (this.isStreet(cy)) {
        const x = x0 + CHUNK / 2 + Math.round((hash2(cx, cy, this.seed + 1) - 0.5) * 16);
        const y = y0 + 24;
        chunk.pole = { x, y };
        add('poste', x, y);
        if (hash2(cx, cy, this.seed + 2) < 0.25) add('grifo', x + 14, y + 4);
        return chunk;
      }
      if (nearOrigin) return chunk;
      if (this.env === 'santiago') {
        // The market street: stalls under blue awnings, food carts, crates, kiosks.
        if (h < 0.14) add('puesto_toldo', ox, oy);
        else if (h < 0.21) add('puesto_comida', ox, oy);
        else if (h < 0.28) add('cajones', ox, oy);
        else if (h < 0.31) add('quiosco', ox, oy);
        else if (h < 0.35) add('carro_sopaipillas', ox, oy);
        else if (h < 0.4) add('grifo', ox, oy);
        return chunk;
      }
      if (h < 0.07) add('quiosco', ox, oy);
      else if (h < 0.13) add('carro_sopaipillas', ox, oy);
      else if (h < 0.24) add('grifo', ox, oy);
      return chunk;
    }

    if (nearOrigin) return chunk;
    // The environment's own props if it has them (desert, Valparaíso), else the zone's three.
    const own = DECO_AMBIENTE[this.env] ?? DECO_AMBIENTE[this.zone];
    const [zb, zm, zs] = DECO_ZONA[this.zone] ?? [];
    const pickFrom = (pool: readonly string[] | undefined, fallback: string | undefined, salt: number): string | undefined =>
      pool && pool.length > 0 ? pool[Math.floor(hash2(cx, cy, this.seed + salt) * pool.length)] : fallback;
    const cuts = own?.cuts ?? [0.06, 0.2, 0.42];
    const big = pickFrom(own?.big, zb, 21);
    const medium = pickFrom(own?.medium, zm, 22);
    const small = pickFrom(own?.small, zs, 23);
    if (big && h < cuts[0]) add(big, ox, oy);
    else if (medium && h < cuts[1]) add(medium, ox, oy);
    else if (small && h < cuts[2]) {
      add(small, ox, oy);
      if (hash2(cx, cy, this.seed + 5) < 0.5) add(small, ox + 12, oy + 7);
    }
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
      for (const s of chunk.items) s.destroy();
      this.chunks.delete(key);
    }

    const g = this.overhead;
    g.clear();
    if (!this.urban) return;
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
