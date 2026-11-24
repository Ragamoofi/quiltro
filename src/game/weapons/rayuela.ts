import { Container, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { px } from '../../data/balance.ts';
import type { RunContext } from '../context.ts';
import { Cooldown, type Weapon } from './weapon.ts';

const SPEED = 380;
const RANGE = 420;
const RADIUS = 5;
/** Spread between tejos in the fan (radians). */
const FAN = 0.18;

interface Tejo {
  active: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  travelled: number;
  hit: Set<number>;
  sprite: Sprite;
}

/** Rayuela: throws the tejo straight where you walk; it goes through everything. */
export class Rayuela implements Weapon {
  readonly id = 'rayuela';
  readonly root = new Container();
  private readonly pool: Tejo[] = [];
  private readonly cd = new Cooldown();
  private readonly spin: Anim;
  private readonly near: number[] = [];
  private time = 0;
  private readonly dashCd = new Cooldown();
  private readonly dashHits = new Set<number>();
  private aimX = 1;
  private aimY = 0;

  constructor() {
    this.spin = anim('tejo', 'girar');
    for (let i = 0; i < 30; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.root.addChild(sprite);
      this.pool.push({ active: false, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, travelled: 0, hit: new Set(), sprite });
    }
  }

  update(dt: number, ctx: RunContext): void {
    this.time += dt;
    const p = ctx.player;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 10) {
      this.aimX = p.vx / sp;
      this.aimY = p.vy / sp;
    }
    const n = ctx.build.numbers(this.id, ctx.mods);
    // Persigue autos: the dog throws itself forward like a bullet (invulnerable).
    const chase = ctx.build.evolved.has(this.id);
    if (chase && p.dashTime > 0) {
      ctx.grid.query(p.x, p.y - 8, 24, this.near);
      for (const id of this.near) {
        const e = ctx.enemies.get(id);
        if (!e?.active || this.dashHits.has(id)) continue;
        if ((e.x - p.x) ** 2 + (e.y - (p.y - 8)) ** 2 > (10 + e.radius) ** 2) continue;
        this.dashHits.add(id);
        ctx.enemies.hit(e, n.damage * 1.5, p.x, p.y - 8, 200, ctx, this.id);
      }
      if (ctx.rng.chance(0.7)) ctx.particles.burst(ctx.rng, p.x, p.y - 4, 2, ['w', 'G'], 20, 0.25);
    }
    if (chase && !p.dead && sp > 20 && this.dashCd.tick(dt, n.cooldown * 1.5)) {
      this.dashHits.clear();
      p.dash(0.25, px(560));
      ctx.sfx.play('golpe', { pitch: 0.5, gain: 1.5 });
    }
    if (!p.dead && this.cd.tick(dt, n.cooldown)) {
      const base = Math.atan2(this.aimY, this.aimX);
      for (let i = 0; i < n.count; i++) this.launch(p.x, p.y - 8, base + (i - (n.count - 1) / 2) * FAN);
      ctx.sfx.play('golpe', { pitch: 0.6 });
    }
    const speed = px(SPEED);
    for (const tj of this.pool) {
      if (!tj.active) continue;
      tj.prevX = tj.x;
      tj.prevY = tj.y;
      tj.x += (tj.vx * speed + ctx.wind.x * 0.4) * dt;
      tj.y += (tj.vy * speed + ctx.wind.y * 0.4) * dt;
      tj.travelled += speed * dt;
      if (tj.travelled > px(RANGE)) {
        tj.active = false;
        tj.sprite.visible = false;
        continue;
      }
      ctx.grid.query(tj.x, tj.y, RADIUS + 12, this.near);
      for (const id of this.near) {
        const e = ctx.enemies.get(id);
        if (!e?.active || tj.hit.has(id)) continue;
        if ((e.x - tj.x) ** 2 + (e.y - tj.y) ** 2 > (RADIUS + e.radius) ** 2) continue;
        tj.hit.add(id);
        ctx.enemies.hit(e, n.damage, tj.x - tj.vx * 10, tj.y - tj.vy * 10, 110, ctx, this.id);
      }
    }
  }

  private launch(x: number, y: number, a: number): void {
    const tj = this.pool.find((it) => !it.active);
    if (!tj) return;
    tj.active = true;
    tj.x = tj.prevX = x;
    tj.y = tj.prevY = y;
    tj.vx = Math.cos(a);
    tj.vy = Math.sin(a);
    tj.travelled = 0;
    tj.hit.clear();
    tj.sprite.visible = true;
  }

  render(alpha: number): void {
    for (const tj of this.pool) {
      if (!tj.active) continue;
      const tex = this.spin.textures[frameAt(this.spin, this.time)];
      if (tex) tj.sprite.texture = tex;
      tj.sprite.position.set(Math.round(tj.prevX + (tj.x - tj.prevX) * alpha), Math.round(tj.prevY + (tj.y - tj.prevY) * alpha));
    }
  }
}
