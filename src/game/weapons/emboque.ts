import { Container, Graphics, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { px } from '../../data/balance.ts';
import { C } from '../../ui/widgets.ts';
import type { RunContext } from '../context.ts';
import { Cooldown, type Weapon } from './weapon.ts';

const SPEED_OUT = 300;
const SPEED_BACK = 360;
const RADIUS = 6;

interface Ball {
  active: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  angle: number;
  travelled: number;
  back: boolean;
  trips: number;
  hit: Set<number>;
  sprite: Sprite;
}

/**
 * Emboque: the ball on a string. It flies toward the nearest enemy up to the string's length and
 * comes back to the dog, hitting everything on the way out and on the way back. Emboque Eterno
 * (evolution): a bigger ball that goes out and back twice.
 */
export class Emboque implements Weapon {
  readonly id = 'emboque';
  readonly root = new Container();
  private readonly pool: Ball[] = [];
  private readonly cd = new Cooldown();
  private readonly spin: Anim;
  private readonly near: number[] = [];
  private readonly string = new Graphics();
  private time = 0;

  constructor() {
    this.spin = anim('emboque', 'girar');
    this.root.addChild(this.string);
    for (let i = 0; i < 8; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.root.addChild(sprite);
      this.pool.push({ active: false, x: 0, y: 0, prevX: 0, prevY: 0, angle: 0, travelled: 0, back: false, trips: 0, hit: new Set(), sprite });
    }
  }

  update(dt: number, ctx: RunContext): void {
    this.time += dt;
    const p = ctx.player;
    const n = ctx.build.numbers(this.id, ctx.mods);
    const eternal = ctx.build.evolved.has(this.id);
    const reach = px(n.area) * (eternal ? 1.2 : 1);
    const radius = eternal ? RADIUS * 1.6 : RADIUS;
    const damage = n.damage * (eternal ? 1.3 : 1);

    if (!p.dead && this.cd.tick(dt, n.cooldown)) {
      for (let i = 0; i < n.count; i++) {
        const target = ctx.enemies.nearest(p.x, p.y - 8, reach + 40, i);
        const a = target ? Math.atan2(target.y - (p.y - 8), target.x - p.x) : ctx.rng.range(0, Math.PI * 2);
        this.launch(p.x, p.y - 8, a + (i > 0 ? (i % 2 === 0 ? 1 : -1) * 0.35 : 0), eternal);
      }
      ctx.sfx.play('golpe', { pitch: 0.8 });
    }

    for (const b of this.pool) {
      if (!b.active) continue;
      b.prevX = b.x;
      b.prevY = b.y;
      if (!b.back) {
        const step = px(SPEED_OUT) * dt;
        b.x += Math.cos(b.angle) * step;
        b.y += Math.sin(b.angle) * step;
        b.travelled += step;
        if (b.travelled >= reach) {
          b.back = true;
          b.hit.clear();
        }
      } else {
        const dx = p.x - b.x;
        const dy = p.y - 8 - b.y;
        const d = Math.hypot(dx, dy) || 1;
        const step = px(SPEED_BACK) * dt;
        if (d <= step + 6) {
          // Caught. The eternal one throws itself out again once.
          if (eternal && b.trips < 2) {
            b.trips++;
            b.back = false;
            b.travelled = 0;
            b.hit.clear();
          } else {
            b.active = false;
            b.sprite.visible = false;
          }
          continue;
        }
        b.x += (dx / d) * step;
        b.y += (dy / d) * step;
      }
      b.sprite.scale.set(eternal ? 1.6 : 1.2);
      ctx.grid.query(b.x, b.y, radius + 12, this.near);
      for (const id of this.near) {
        const e = ctx.enemies.get(id);
        if (!e?.active || b.hit.has(id)) continue;
        if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 > (radius + e.radius) ** 2) continue;
        b.hit.add(id);
        ctx.enemies.hit(e, damage, b.prevX, b.prevY, 90, ctx, this.id);
        ctx.sfx.play('golpe', { pitch: 1 + ctx.rng.range(0, 0.2) });
      }
    }
  }

  private launch(x: number, y: number, a: number, eternal: boolean): void {
    const b = this.pool.find((it) => !it.active);
    if (!b) return;
    b.active = true;
    b.x = b.prevX = x;
    b.y = b.prevY = y;
    b.angle = a;
    b.travelled = 0;
    b.back = false;
    b.trips = eternal ? 0 : 2;
    b.hit.clear();
    b.sprite.visible = true;
  }

  render(alpha: number, ctx: RunContext): void {
    const g = this.string;
    g.clear();
    const px0 = Math.round(ctx.player.prevX + (ctx.player.x - ctx.player.prevX) * alpha);
    const py0 = Math.round(ctx.player.prevY + (ctx.player.y - ctx.player.prevY) * alpha) - 8;
    for (const b of this.pool) {
      if (!b.active) continue;
      const x = Math.round(b.prevX + (b.x - b.prevX) * alpha);
      const y = Math.round(b.prevY + (b.y - b.prevY) * alpha);
      const tex = this.spin.textures[frameAt(this.spin, this.time)];
      if (tex) b.sprite.texture = tex;
      b.sprite.position.set(x, y);
      g.moveTo(px0 + 0.5, py0 + 0.5).lineTo(x + 0.5, y + 0.5).stroke({ width: 1, color: C('w') });
    }
  }
}
