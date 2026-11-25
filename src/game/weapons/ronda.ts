import { Container, Sprite, type Texture } from 'pixi.js';
import { anim } from '../../art/assets.ts';
import { px } from '../../data/balance.ts';
import type { RunContext } from '../context.ts';
import { Cooldown, type Weapon } from './weapon.ts';

const SPEED = 230;
/** Thickness of the ring that hurts, and the pause between rings of one burst. */
const BAND = 7;
const GAP = 0.28;
/** A ring never draws more dots than this, however wide it grows. */
const MAX_DOTS = 160;

interface Ring {
  r: number;
  max: number;
  /** Seconds before it starts to expand (the rings of a burst follow each other). */
  delay: number;
  damage: number;
  hit: Set<number>;
}

/**
 * Ronda: a ring of colour that grows out from the dog like the circle of the game, hurting
 * every enemy it crosses and pushing it outward. More levels: more rings in a row, wider and
 * stronger. Ronda de la Manada (evolution): two more rings every time.
 *
 * The dots are pooled sprites (one 3×3 texture per handkerchief colour). They used to be
 * thousands of separate `Graphics` rectangles per frame, which made this the most expensive
 * thing on screen once the ring count and the area grew.
 */
export class Ronda implements Weapon {
  readonly id = 'ronda';
  readonly root = new Container();
  private readonly dots: Sprite[] = [];
  private readonly textures: readonly Texture[] = anim('rondaPunto', 'punto').textures;
  private readonly cd = new Cooldown();
  private readonly near: number[] = [];
  private rings: Ring[] = [];
  private time = 0;

  update(dt: number, ctx: RunContext): void {
    this.time += dt;
    const p = ctx.player;
    const n = ctx.build.numbers(this.id, ctx.mods);
    const herd = ctx.build.evolved.has(this.id);
    if (!p.dead && this.cd.tick(dt, n.cooldown)) {
      const rings = n.count + (herd ? 2 : 0);
      for (let i = 0; i < rings; i++) {
        this.rings.push({ r: 0, max: px(n.area), delay: i * GAP, damage: n.damage * (herd ? 1.3 : 1), hit: new Set() });
      }
      ctx.sfx.play('guau', { pitch: 1.6, gain: 0.4 });
    }
    const cx = p.x;
    const cy = p.y - 8;
    for (const ring of this.rings) {
      if (ring.delay > 0) {
        ring.delay -= dt;
        continue;
      }
      ring.r += px(SPEED) * dt;
      ctx.grid.query(cx, cy, ring.r + BAND + 16, this.near);
      for (const id of this.near) {
        const e = ctx.enemies.get(id);
        if (!e?.active || ring.hit.has(id)) continue;
        const d = Math.hypot(e.x - cx, e.y - cy);
        if (Math.abs(d - ring.r) > BAND / 2 + e.radius) continue;
        ring.hit.add(id);
        ctx.enemies.hit(e, ring.damage, cx, cy, 150, ctx, this.id);
      }
    }
    this.rings = this.rings.filter((r) => r.r < r.max);
  }

  render(alpha: number, ctx: RunContext): void {
    const p = ctx.player;
    const cx = Math.round(p.prevX + (p.x - p.prevX) * alpha);
    const cy = Math.round(p.prevY + (p.y - p.prevY) * alpha) - 8;
    // Dotted in the colours of the handkerchiefs; fades into dither near its end.
    const spin = this.time * 0.8;
    let used = 0;
    for (const ring of this.rings) {
      if (ring.delay > 0 || ring.r < 2) continue;
      const steps = Math.min(MAX_DOTS, Math.max(12, Math.round(ring.r * 0.9)));
      const fading = ring.r / ring.max > 0.8;
      for (let i = 0; i < steps; i++) {
        if (fading && i % 2 === 0) continue;
        const a = (i / steps) * Math.PI * 2 + spin;
        const s = this.dot(used++);
        s.texture = this.textures[i % this.textures.length] as Texture;
        s.position.set(Math.round(cx + Math.cos(a) * ring.r) - 1, Math.round(cy + Math.sin(a) * ring.r) - 1);
      }
    }
    for (let i = used; i < this.dots.length; i++) {
      const s = this.dots[i] as Sprite;
      if (!s.visible) break;
      s.visible = false;
    }
  }

  /** The i-th dot sprite (created on demand, kept for good). */
  private dot(i: number): Sprite {
    let s = this.dots[i];
    if (!s) {
      s = new Sprite();
      this.dots.push(s);
      this.root.addChild(s);
    }
    s.visible = true;
    return s;
  }
}
