import { Container, Sprite, Texture } from 'pixi.js';
import { hexToNumber, colorOf } from '../../art/palette.ts';
import type { Rng } from '../../core/rng.ts';

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  sprite: Sprite;
}

/**
 * Pixel particles: 1–2 px squares of a palette colour (white texture tinted,
 * so the colour stays exactly in the palette). Pooled, no allocation per frame.
 */
export class Particles {
  readonly root = new Container();
  private readonly pool: Particle[] = [];
  private next = 0;
  /** Graphics quality: 0.5 on "baja". */
  scale = 1;

  constructor(size = 600) {
    for (let i = 0; i < size; i++) {
      const sprite = new Sprite(Texture.WHITE);
      sprite.visible = false;
      sprite.width = 1;
      sprite.height = 1;
      this.root.addChild(sprite);
      this.pool.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, sprite });
    }
  }

  /** Burst of `count` pixels from (x, y) in the given palette chars. */
  burst(
    rng: Rng,
    x: number,
    y: number,
    count: number,
    colors: readonly string[],
    speed = 60,
    life = 0.4,
  ): void {
    const n = Math.max(1, Math.round(count * this.scale));
    for (let i = 0; i < n; i++) {
      const p = this.pool[this.next];
      this.next = (this.next + 1) % this.pool.length;
      if (!p) continue;
      const a = rng.range(0, Math.PI * 2);
      const s = rng.range(speed * 0.4, speed);
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      p.maxLife = p.life = rng.range(life * 0.6, life);
      const ch = colors[i % colors.length] ?? 'W';
      p.sprite.tint = hexToNumber(colorOf(ch)?.hex ?? '#FFFFFF');
      const big = rng.chance(0.35) ? 2 : 1;
      p.sprite.width = big;
      p.sprite.height = big;
      p.sprite.visible = true;
    }
  }

  update(dt: number): void {
    const drag = Math.exp(-dt / 0.15);
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.sprite.visible = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= drag;
      p.vy *= drag;
    }
  }

  render(): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.sprite.position.set(Math.round(p.x), Math.round(p.y));
      // Blink out during the last quarter of life instead of fading (no alpha).
      p.sprite.visible = p.life > p.maxLife * 0.25 || Math.floor(p.life * 30) % 2 === 0;
    }
  }
}
