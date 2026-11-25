import { Container, Graphics } from 'pixi.js';
import { px } from '../../data/balance.ts';
import { C } from '../../ui/widgets.ts';
import type { RunContext } from '../context.ts';
import { Cooldown, type Weapon } from './weapon.ts';

/** Radians per second the bands turn. */
const TURN = 4.2;

/** Distance from a point to a segment. */
function distToSegment(x: number, y: number, x0: number, y0: number, x1: number, y1: number): number {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / len2));
  return Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy));
}

/**
 * Elástico: a stretched band that sweeps around the dog for a while, hitting what it touches
 * and pushing it away, then rests. More levels: longer, longer lasting, more bands. Elástico
 * sin Fin (evolution): the bands never rest.
 */
export class Elastico implements Weapon {
  readonly id = 'elastico';
  readonly root = new Container();
  private readonly g = new Graphics();
  private readonly cd = new Cooldown();
  private readonly near: number[] = [];
  private readonly lastHit = new Map<number, number>();
  private angle = 0;
  private sweep = 0;
  private clock = 0;
  /** What render draws: the dog's centre and the band tips (world coordinates). */
  private tips: { x: number; y: number }[] = [];

  constructor() {
    this.root.addChild(this.g);
  }

  update(dt: number, ctx: RunContext): void {
    this.clock += dt;
    const p = ctx.player;
    const n = ctx.build.numbers(this.id, ctx.mods);
    const endless = ctx.build.evolved.has(this.id);
    if (!endless && this.sweep <= 0 && !p.dead && this.cd.tick(dt, n.cooldown)) {
      this.sweep = n.duration;
      ctx.sfx.play('golpe', { pitch: 0.9, gain: 0.8 });
    }
    this.tips = [];
    if (!endless && this.sweep <= 0) return;
    this.sweep -= dt;
    this.angle += TURN * dt;
    const length = px(n.area) * (endless ? 1.3 : 1);
    const bands = Math.max(1, n.count);
    const cx = p.x;
    const cy = p.y - 8;
    for (let b = 0; b < bands; b++) {
      const a = this.angle + (b / bands) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * length;
      const y1 = cy + Math.sin(a) * length;
      this.tips.push({ x: x1, y: y1 });
      ctx.grid.query((cx + x1) / 2, (cy + y1) / 2, length / 2 + 14, this.near);
      for (const id of this.near) {
        const e = ctx.enemies.get(id);
        if (!e?.active) continue;
        if (this.clock - (this.lastHit.get(id) ?? -9) < n.tick) continue;
        if (distToSegment(e.x, e.y, cx, cy, x1, y1) > e.radius + 3) continue;
        this.lastHit.set(id, this.clock);
        ctx.enemies.hit(e, n.damage, cx, cy, 130, ctx, this.id);
      }
    }
    if (this.lastHit.size > 200) {
      for (const [id, t] of this.lastHit) if (this.clock - t > 2) this.lastHit.delete(id);
    }
  }

  render(alpha: number, ctx: RunContext): void {
    const g = this.g;
    g.clear();
    if (this.tips.length === 0) return;
    const p = ctx.player;
    const cx = Math.round(p.prevX + (p.x - p.prevX) * alpha);
    const cy = Math.round(p.prevY + (p.y - p.prevY) * alpha) - 8;
    for (const tip of this.tips) {
      const dx = Math.round(tip.x - p.x) + cx;
      const dy = Math.round(tip.y - (p.y - 8)) + cy;
      // Ink edge, pink band and a bright core, like a stretched rubber band.
      g.moveTo(cx + 0.5, cy + 0.5).lineTo(dx + 0.5, dy + 0.5).stroke({ width: 3, color: C('k') });
      g.moveTo(cx + 0.5, cy + 0.5).lineTo(dx + 0.5, dy + 0.5).stroke({ width: 2, color: C('p') });
      g.moveTo(cx + 0.5, cy + 0.5).lineTo(dx + 0.5, dy + 0.5).stroke({ width: 1, color: C('W') });
      g.rect(dx - 1, dy - 1, 3, 3).fill(C('y'));
    }
  }
}
