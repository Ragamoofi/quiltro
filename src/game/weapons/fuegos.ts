import { Container, Graphics, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { colorOf, hexToNumber } from '../../art/palette.ts';
import { px } from '../../data/balance.ts';
import type { RunContext } from '../context.ts';
import { Cooldown, type Weapon } from './weapon.ts';

const FLIGHT = 0.55;
/** How high the rocket arcs (it is a top-down game, so the arc is drawn as a vertical offset). */
const ARC = 40;
const BURST_COLORS = [['r', 'y', 'W'], ['b', 's', 'W'], ['p', 't', 'W'], ['a', 'y', 'W']] as const;

interface Rocket {
  active: boolean;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  t: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  palette: number;
  sprite: Sprite;
}

interface Blast {
  x: number;
  y: number;
  r: number;
  life: number;
  palette: number;
}

/** Fuegos artificiales: rockets arc onto the biggest group and burst in an area. */
export class Fuegos implements Weapon {
  readonly id = 'fuegos';
  readonly root = new Container();
  private readonly g = new Graphics();
  private readonly pool: Rocket[] = [];
  private blasts: Blast[] = [];
  private readonly cd = new Cooldown();
  private readonly fly: Anim;
  private readonly near: number[] = [];
  private time = 0;

  constructor() {
    this.fly = anim('cohete', 'volar');
    this.root.addChild(this.g);
    for (let i = 0; i < 30; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.root.addChild(sprite);
      this.pool.push({ active: false, sx: 0, sy: 0, tx: 0, ty: 0, t: 0, x: 0, y: 0, prevX: 0, prevY: 0, palette: 0, sprite });
    }
  }

  update(dt: number, ctx: RunContext): void {
    this.time += dt;
    const p = ctx.player;
    const n = ctx.build.numbers(this.id, ctx.mods);
    const radius = px(n.area);
    if (!p.dead && this.cd.tick(dt, n.cooldown)) {
      for (let i = 0; i < n.count; i++) {
        const target = ctx.enemies.densest(p.x, p.y, 200, radius, ctx.rng);
        const tx = target ? target.x : p.x + ctx.rng.range(-80, 80);
        const ty = target ? target.y : p.y + ctx.rng.range(-60, 60);
        this.launch(p.x, p.y - 12, tx + ctx.rng.range(-8, 8), ty + ctx.rng.range(-8, 8), ctx.rng.int(0, 3));
      }
    }
    for (const r of this.pool) {
      if (!r.active) continue;
      r.prevX = r.x;
      r.prevY = r.y;
      r.t += dt / FLIGHT;
      const k = Math.min(1, r.t);
      r.x = r.sx + (r.tx - r.sx) * k;
      r.y = r.sy + (r.ty - r.sy) * k - Math.sin(k * Math.PI) * ARC;
      if (ctx.rng.chance(0.6)) ctx.particles.burst(ctx.rng, r.x, r.y, 1, ['a', 'y'], 10, 0.2);
      if (r.t >= 1) {
        r.active = false;
        r.sprite.visible = false;
        this.explode(r.tx, r.ty, radius, n.damage, r.palette, ctx);
      }
    }
    for (const b of this.blasts) b.life -= dt;
    this.blasts = this.blasts.filter((b) => b.life > 0);
  }

  private launch(sx: number, sy: number, tx: number, ty: number, palette: number): void {
    const r = this.pool.find((it) => !it.active);
    if (!r) return;
    Object.assign(r, { active: true, sx, sy, tx, ty, t: 0, x: sx, y: sy, prevX: sx, prevY: sy, palette });
    r.sprite.visible = true;
  }

  private explode(x: number, y: number, radius: number, damage: number, palette: number, ctx: RunContext): void {
    ctx.grid.query(x, y, radius + 8, this.near);
    for (const id of this.near) {
      const e = ctx.enemies.get(id);
      if (!e?.active) continue;
      if ((e.x - x) ** 2 + (e.y - y) ** 2 > (radius + e.radius) ** 2) continue;
      ctx.enemies.hit(e, damage, x, y, 120, ctx, this.id);
    }
    const colors = BURST_COLORS[palette] ?? BURST_COLORS[0];
    ctx.particles.burst(ctx.rng, x, y, 18, colors, radius * 3.2, 0.5);
    this.blasts.push({ x, y, r: radius, life: 0.18, palette });
    ctx.shake.add(0.08);
    ctx.sfx.play('puf', { pitch: 0.5 + ctx.rng.range(0, 0.15), gain: 1.4 });
  }

  render(alpha: number): void {
    for (const r of this.pool) {
      if (!r.active) continue;
      const tex = this.fly.textures[frameAt(this.fly, this.time)];
      if (tex) r.sprite.texture = tex;
      r.sprite.position.set(Math.round(r.prevX + (r.x - r.prevX) * alpha), Math.round(r.prevY + (r.y - r.prevY) * alpha));
    }
    const g = this.g;
    g.clear();
    for (const b of this.blasts) {
      const colors = BURST_COLORS[b.palette] ?? BURST_COLORS[0];
      const k = 1 - b.life / 0.18;
      const color = hexToNumber(colorOf(k < 0.5 ? 'W' : colors[0])?.hex ?? '#FFFFFF');
      g.circle(Math.round(b.x), Math.round(b.y), Math.max(2, Math.round(b.r * (0.4 + k * 0.6)))).stroke({ width: 2, color });
    }
  }
}
