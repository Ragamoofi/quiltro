import { Container, Sprite } from 'pixi.js';
import { anim } from '../../art/assets.ts';
import type { RunContext } from '../context.ts';
import type { Weapon } from './weapon.ts';

/** Patches are dropped every this many px walked (and slowly while standing). */
const SPACING = 9;
const PATCH_RADIUS = 9;

interface Patch {
  active: boolean;
  x: number;
  y: number;
  life: number;
  sprite: Sprite;
}

/**
 * Chaya: a trail of confetti and streamers. Enemies on it take damage every
 * tick and move 40 % slower.
 */
export class Chaya implements Weapon {
  readonly id = 'chaya';
  readonly root = new Container();
  private readonly pool: Patch[] = [];
  private lastX = Number.NaN;
  private lastY = Number.NaN;
  private tickT = 0;
  private idleT = 0;
  private next = 0;
  private readonly near: number[] = [];
  private readonly hitThisTick = new Set<number>();

  constructor() {
    const variants = [0, 1, 2].map((i) => anim('confeti', `v${i}`).textures[0]);
    for (let i = 0; i < 160; i++) {
      const sprite = new Sprite(variants[i % 3]);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.root.addChild(sprite);
      this.pool.push({ active: false, x: 0, y: 0, life: 0, sprite });
    }
  }

  update(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    const n = ctx.build.numbers(this.id, ctx.mods);
    const scale = Math.max(1, ctx.mods.areaMult);
    if (!p.dead) {
      if (Number.isNaN(this.lastX)) {
        this.lastX = p.x;
        this.lastY = p.y;
      }
      this.idleT += dt;
      const moved = Math.hypot(p.x - this.lastX, p.y - this.lastY);
      if (moved >= SPACING || this.idleT > 0.5) {
        this.drop(p.x + ctx.rng.range(-2, 2), p.y + ctx.rng.range(-2, 2), n.duration);
        // Extra projectiles = wider trail: side patches.
        for (let i = 1; i < n.count; i++) {
          const side = i % 2 === 0 ? 1 : -1;
          this.drop(p.x + side * 8 * Math.ceil(i / 2), p.y, n.duration);
        }
        this.lastX = p.x;
        this.lastY = p.y;
        this.idleT = 0;
      }
    }
    for (const patch of this.pool) {
      if (!patch.active) continue;
      patch.life -= dt;
      if (patch.life <= 0) {
        patch.active = false;
        patch.sprite.visible = false;
      }
    }

    this.tickT -= dt;
    const doTick = this.tickT <= 0;
    if (doTick) {
      this.tickT += n.tick;
      this.hitThisTick.clear();
    }
    const r = PATCH_RADIUS * scale;
    for (const patch of this.pool) {
      if (!patch.active) continue;
      ctx.grid.query(patch.x, patch.y, r + 8, this.near);
      for (const id of this.near) {
        const e = ctx.enemies.get(id);
        if (!e?.active) continue;
        if ((e.x - patch.x) ** 2 + (e.y + e.look.hover - patch.y) ** 2 > (r + e.radius) ** 2) continue;
        e.slow = n.slow;
        e.slowTime = 0.2;
        if (doTick && !this.hitThisTick.has(id)) {
          this.hitThisTick.add(id);
          ctx.enemies.hit(e, n.damage, e.x, e.y, 0, ctx, this.id);
        }
      }
    }
  }

  private drop(x: number, y: number, duration: number): void {
    const patch = this.pool[this.next];
    this.next = (this.next + 1) % this.pool.length;
    if (!patch) return;
    patch.active = true;
    patch.x = x;
    patch.y = y;
    patch.life = duration;
    patch.sprite.visible = true;
    patch.sprite.position.set(Math.round(x), Math.round(y));
  }

  render(): void {
    for (const patch of this.pool) {
      if (!patch.active) continue;
      // Blink out during the last 0.4 s.
      patch.sprite.visible = patch.life > 0.4 || Math.floor(patch.life * 20) % 2 === 0;
    }
  }
}
