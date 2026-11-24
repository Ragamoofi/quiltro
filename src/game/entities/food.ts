import { Container, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { FOOD, px } from '../../data/balance.ts';
import type { Drop } from '../../data/enemigos.ts';
import { PLAYER_BASE } from '../../data/personajes.ts';
import type { RunContext } from '../context.ts';

interface Piece {
  active: boolean;
  xp: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  /** Pop-out velocity right after dropping, then magnet speed. */
  vx: number;
  vy: number;
  t: number;
  pulled: boolean;
  sprite: Sprite;
}

/**
 * Food on the floor (sopaipillas for now). Pops out of the enemy, then the
 * dog's nose ("olfato") pulls it in with acceleration. Past 300 pieces new
 * drops merge into an existing one (GDD).
 */
export class Food {
  readonly root = new Container();
  private readonly pool: Piece[] = [];
  private readonly shine: Anim;
  private count = 0;
  pickupMult = 1;

  constructor(capacity = 400) {
    this.shine = anim('sopaipilla', 'brillo');
    for (let i = 0; i < capacity; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.root.addChild(sprite);
      this.pool.push({ active: false, xp: 0, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, t: 0, pulled: false, sprite });
    }
  }

  drop(kind: Drop, x: number, y: number, ctx: RunContext): void {
    const xp = kind === 'completo' ? FOOD.completo.xp : kind === 'chorrillana' ? FOOD.chorrillana.xp : FOOD.sopaipilla.xp;
    if (this.count >= FOOD.mergeAbove) {
      const target = this.pool.find((p) => p.active && !p.pulled);
      if (target) {
        target.xp += xp;
        return;
      }
    }
    const p = this.pool.find((it) => !it.active);
    if (!p) return;
    const a = ctx.rng.range(0, Math.PI * 2);
    p.active = true;
    p.xp = xp;
    p.x = p.prevX = x;
    p.y = p.prevY = y;
    p.vx = Math.cos(a) * 40;
    p.vy = Math.sin(a) * 40;
    p.t = ctx.rng.range(0, 1);
    p.pulled = false;
    p.sprite.visible = true;
    this.count++;
  }

  update(dt: number, ctx: RunContext): void {
    const pl = ctx.player;
    const radius = px(PLAYER_BASE.pickupRadius) * this.pickupMult;
    const drag = Math.exp(-dt / 0.08);
    for (const p of this.pool) {
      if (!p.active) continue;
      p.prevX = p.x;
      p.prevY = p.y;
      p.t += dt;
      const dx = pl.x - p.x;
      const dy = pl.y - 8 - p.y;
      const d = Math.hypot(dx, dy);
      if (!pl.dead && (p.pulled || d < radius)) {
        p.pulled = true;
        // Accelerate toward the nose; always faster than the dog.
        const speed = Math.min(420, 60 + p.t * 600);
        p.vx += ((dx / (d || 1)) * speed - p.vx) * 0.35;
        p.vy += ((dy / (d || 1)) * speed - p.vy) * 0.35;
        if (d < 7) {
          this.collect(p, ctx);
          continue;
        }
      } else {
        p.vx *= drag;
        p.vy *= drag;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private collect(p: Piece, ctx: RunContext): void {
    p.active = false;
    p.sprite.visible = false;
    this.count--;
    ctx.stats.food += p.xp;
    ctx.sfx.pickup();
    ctx.particles.burst(ctx.rng, p.x, p.y, 3, ['y', 'W', 'a'], 30, 0.2);
  }

  /** Silbido de la vecina: everything on the floor flies to the dog. */
  pullAll(): void {
    for (const p of this.pool) if (p.active) p.pulled = true;
  }

  render(alpha: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      const tex = this.shine.textures[frameAt(this.shine, p.t)];
      if (tex) p.sprite.texture = tex;
      p.sprite.position.set(
        Math.round(p.prevX + (p.x - p.prevX) * alpha),
        Math.round(p.prevY + (p.y - p.prevY) * alpha),
      );
    }
  }
}
