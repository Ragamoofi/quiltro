import { Container, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { px } from '../../data/balance.ts';
import type { RunContext } from '../context.ts';
import type { Enemy } from '../entities/enemies.ts';
import { Cooldown, type Weapon } from './weapon.ts';

const SPEED = 260;
const LIFE = 2.6;
const RADIUS = 5;
/** Max distance to look for the next enemy after a bounce. */
const BOUNCE_RANGE = 140;

interface Top {
  active: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  life: number;
  bounces: number;
  lastHit: number;
  sprite: Sprite;
}

/** Trompo: spinning tops that fly at an enemy and bounce from one to the next. */
export class Trompo implements Weapon {
  readonly id = 'trompo';
  readonly root = new Container();
  private readonly pool: Top[] = [];
  private readonly cd = new Cooldown();
  private readonly spin: Anim;
  private readonly near: number[] = [];
  private time = 0;
  private tornado = false;

  constructor() {
    this.spin = anim('trompo', 'girar');
    for (let i = 0; i < 40; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.root.addChild(sprite);
      this.pool.push({ active: false, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, life: 0, bounces: 0, lastHit: -1, sprite });
    }
  }

  update(dt: number, ctx: RunContext): void {
    this.time += dt;
    const p = ctx.player;
    const n = ctx.build.numbers(this.id, ctx.mods);
    if (!p.dead && this.cd.tick(dt, n.cooldown)) {
      for (let i = 0; i < n.count; i++) {
        const target = ctx.enemies.nearest(p.x, p.y - 8, 220, i);
        const a = target ? Math.atan2(target.y - (p.y - 8), target.x - p.x) : ctx.rng.range(0, Math.PI * 2);
        this.launch(p.x, p.y - 8, a + (i - (n.count - 1) / 2) * 0.25, n.bounces);
      }
    }
    const speed = px(SPEED);
    // Trompo Tornado: giant tops that drag enemies around them in a spiral.
    const tornado = ctx.build.evolved.has(this.id);
    this.tornado = tornado;
    const radius = tornado ? RADIUS * 2 : RADIUS;
    for (const t of this.pool) {
      if (!t.active) continue;
      t.prevX = t.x;
      t.prevY = t.y;
      t.life -= dt;
      if (t.life <= 0) {
        this.end(t, ctx);
        continue;
      }
      t.x += (t.vx + ctx.wind.x * 0.4) * dt;
      t.y += (t.vy + ctx.wind.y * 0.4) * dt;
      if (tornado) {
        ctx.grid.query(t.x, t.y, 48, this.near);
        for (const id of this.near) {
          const e = ctx.enemies.get(id);
          if (!e?.active || e.boss || e.elite) continue;
          const dx = t.x - e.x;
          const dy = t.y - e.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d > 48) continue;
          e.kx += ((dx / d) * 120 - (dy / d) * 160) * dt * 6;
          e.ky += ((dy / d) * 120 + (dx / d) * 160) * dt * 6;
        }
      }
      ctx.grid.query(t.x, t.y, radius + 12, this.near);
      for (const id of this.near) {
        const e = ctx.enemies.get(id);
        if (!e?.active || id === t.lastHit) continue;
        const rr = radius + e.radius;
        if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 > rr * rr) continue;
        // A charging camahueto smashes the top.
        if (e.def.behavior === 'cargar' && e.state === 'carga' && !tornado) {
          this.end(t, ctx);
          ctx.sfx.play('puf', { pitch: 1.6 });
          break;
        }
        ctx.enemies.hit(e, n.damage, t.x, t.y, 90, ctx, this.id);
        ctx.sfx.play('golpe', { pitch: 1.3 + ctx.rng.range(0, 0.2) });
        t.lastHit = id;
        if (t.bounces <= 0) {
          this.end(t, ctx);
        } else {
          t.bounces--;
          this.retarget(t, e, speed, ctx);
        }
        break;
      }
    }
  }

  private launch(x: number, y: number, a: number, bounces: number): void {
    const t = this.pool.find((it) => !it.active);
    if (!t) return;
    const s = px(SPEED);
    t.active = true;
    t.x = t.prevX = x;
    t.y = t.prevY = y;
    t.vx = Math.cos(a) * s;
    t.vy = Math.sin(a) * s;
    t.life = this.tornado ? LIFE * 1.6 : LIFE;
    t.bounces = bounces;
    t.sprite.scale.set(this.tornado ? 2 : 1);
    t.lastHit = -1;
    t.sprite.visible = true;
  }

  private retarget(t: Top, from: Enemy, speed: number, ctx: RunContext): void {
    const next = ctx.enemies.nearest(t.x, t.y, BOUNCE_RANGE, 0, from.id);
    const a = next ? Math.atan2(next.y - t.y, next.x - t.x) : Math.atan2(-t.vy, -t.vx) + ctx.rng.range(-1, 1);
    t.vx = Math.cos(a) * speed;
    t.vy = Math.sin(a) * speed;
    t.life = Math.max(t.life, 0.8);
  }

  private end(t: Top, ctx: RunContext): void {
    t.active = false;
    t.sprite.visible = false;
    ctx.particles.burst(ctx.rng, t.x, t.y, 4, ['o', 'r', 'd'], 40, 0.25);
  }

  render(alpha: number): void {
    for (const t of this.pool) {
      if (!t.active) continue;
      const tex = this.spin.textures[frameAt(this.spin, this.time)];
      if (tex) t.sprite.texture = tex;
      t.sprite.position.set(Math.round(t.prevX + (t.x - t.prevX) * alpha), Math.round(t.prevY + (t.y - t.prevY) * alpha));
    }
  }
}
