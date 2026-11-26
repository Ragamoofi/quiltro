import { Container, Sprite } from 'pixi.js';
import { anim } from '../../art/assets.ts';
import type { RunContext } from '../context.ts';

interface Shot {
  active: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  sprite: Sprite;
}

/** Enemy projectiles: red with a white centre, hurt the dog, pushed by the wind. */
export class EnemyShots {
  readonly root = new Container();
  private readonly pool: Shot[] = [];

  constructor(size = 160) {
    const tex = anim('proyectil', 'rojo').textures[0];
    for (let i = 0; i < size; i++) {
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.root.addChild(sprite);
      this.pool.push({ active: false, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, life: 0, damage: 0, sprite });
    }
  }

  fire(x: number, y: number, angle: number, speed: number, damage: number, life = 4): void {
    const s = this.pool.find((it) => !it.active);
    if (!s) return;
    s.active = true;
    s.x = s.prevX = x;
    s.y = s.prevY = y;
    s.vx = Math.cos(angle) * speed;
    s.vy = Math.sin(angle) * speed;
    s.life = life;
    s.damage = damage;
    s.sprite.visible = true;
  }

  /** A fan of `count` shots spread over `spread` radians toward `angle`. */
  fan(x: number, y: number, angle: number, count: number, spread: number, speed: number, damage: number): void {
    for (let i = 0; i < count; i++) {
      const a = count === 1 ? angle : angle - spread / 2 + (spread * i) / (count - 1);
      this.fire(x, y, a, speed, damage);
    }
  }

  clear(): void {
    for (const s of this.pool) {
      s.active = false;
      s.sprite.visible = false;
    }
  }

  update(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    for (const s of this.pool) {
      if (!s.active) continue;
      s.prevX = s.x;
      s.prevY = s.y;
      s.vx += ctx.wind.x * 0.6 * dt;
      s.vy += ctx.wind.y * 0.6 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const hit = !p.dead && (s.x - p.x) ** 2 + (s.y - (p.y - 8)) ** 2 < (p.radius + 3) ** 2;
      if (!hit && !p.dead) {
        const distance = Math.hypot(s.x - p.x, s.y - (p.y - 8));
        const previous = Math.hypot(s.prevX - p.x, s.prevY - (p.y - 8));
        if (distance <= p.radius + 8 && distance > previous) ctx.fair?.nearMiss(ctx);
      }
      if (hit) p.takeDamage(s.damage, s.x, s.y, ctx, 'proyectil');
      if (hit || s.life <= 0) {
        s.active = false;
        s.sprite.visible = false;
      }
    }
  }

  render(alpha: number): void {
    for (const s of this.pool) {
      if (s.active) s.sprite.position.set(Math.round(s.prevX + (s.x - s.prevX) * alpha), Math.round(s.prevY + (s.y - s.prevY) * alpha));
    }
  }
}
