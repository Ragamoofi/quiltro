import { Container, Graphics, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { px } from '../../data/balance.ts';
import { C } from '../../ui/widgets.ts';
import type { RunContext } from '../context.ts';

const BELL_BASE = 24;
const BELL_PER_POINT = 9;
const PET_SPEED = 300;
const PET_RANGE = 150;
const BITE_EVERY = 0.55;
const MAX_PETS = 3;

interface Pet {
  sprite: Sprite;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  bite: number;
  facing: number;
}

/**
 * The passives that act on their own instead of changing a number:
 *  - Cascabel: a ring around the dog that pushes small enemies away.
 *  - Manada chica: friendly dogs that run at the nearest enemy and bite it.
 */
export class Passives {
  /** Goes under the shadows (the bell ring). */
  readonly ground = new Container();
  /** Goes with the y-sorted world (the dogs). */
  readonly pets = new Container();
  private readonly ring = new Graphics();
  private readonly list: Pet[] = [];
  private readonly run: Anim;
  private readonly near: number[] = [];
  private time = 0;
  private bellRadius = 0;
  private auraT = 0;

  constructor() {
    this.run = anim('quiltra', 'trotar');
    this.ground.addChild(this.ring);
    for (let i = 0; i < MAX_PETS; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5, 22 / 24);
      sprite.visible = false;
      this.pets.addChild(sprite);
      this.list.push({ sprite, x: 0, y: 0, prevX: 0, prevY: 0, bite: 0, facing: 1 });
    }
  }

  update(dt: number, ctx: RunContext): void {
    this.time += dt;
    const p = ctx.player;
    const cx = p.x;
    const cy = p.y - 8;

    // Cascabel: a gentle constant push on everything small that gets too close.
    this.bellRadius = ctx.mods.bell > 0 ? px(BELL_BASE + BELL_PER_POINT * ctx.mods.bell) : 0;
    if (this.bellRadius > 0 && !p.dead) {
      ctx.grid.query(cx, cy, this.bellRadius + 16, this.near);
      for (const id of this.near) {
        const e = ctx.enemies.get(id);
        if (!e?.active || e.boss || e.elite) continue;
        const dx = e.x - cx;
        const dy = e.y - cy;
        const d = Math.hypot(dx, dy) || 1;
        if (d > this.bellRadius + e.radius) continue;
        e.kx += (dx / d) * 500 * dt;
        e.ky += (dy / d) * 500 * dt;
      }
    }

    // Chingue's perfume: whatever comes close takes damage twice a second.
    if (p.auraDps > 0 && !p.dead) {
      this.auraT -= dt;
      if (this.auraT <= 0) {
        this.auraT = 0.5;
        const r = px(p.auraRadius);
        ctx.grid.query(cx, cy, r + 16, this.near);
        for (const id of this.near) {
          const e = ctx.enemies.get(id);
          if (!e?.active) continue;
          if ((e.x - cx) ** 2 + (e.y - cy) ** 2 > (r + e.radius) ** 2) continue;
          ctx.enemies.hit(e, p.auraDps * 0.5 * ctx.mods.damageMult, cx, cy, 0, ctx, 'perfume');
        }
      }
    }

    // Manada chica: the dogs.
    const count = Math.min(MAX_PETS, Math.round(ctx.mods.pets));
    const damage = (6 + 2 * count) * ctx.mods.damageMult;
    this.list.forEach((pet, i) => {
      pet.sprite.visible = i < count && !p.dead;
      if (i >= count) return;
      if (pet.x === 0 && pet.y === 0) {
        pet.x = pet.prevX = cx - 14;
        pet.y = pet.prevY = p.y;
      }
      pet.prevX = pet.x;
      pet.prevY = pet.y;
      pet.bite -= dt;
      const target = ctx.enemies.nearest(cx, cy, px(PET_RANGE), i);
      let tx: number;
      let ty: number;
      if (target) {
        tx = target.x;
        ty = target.y + 6;
        if (pet.bite <= 0 && (target.x - pet.x) ** 2 + (target.y + 6 - pet.y) ** 2 < (10 + target.radius) ** 2) {
          pet.bite = BITE_EVERY;
          ctx.enemies.hit(target, damage, pet.x, pet.y, 80, ctx, 'manadaChica');
          ctx.sfx.play('golpe', { pitch: 1.6, gain: 0.5 });
        }
      } else {
        // Nothing to bite: trot behind the dog, each one at its own spot.
        tx = cx + (i === 0 ? -16 : i === 1 ? 16 : 0);
        ty = p.y + (i === 2 ? 14 : 4);
      }
      const dx = tx - pet.x;
      const dy = ty - pet.y;
      const d = Math.hypot(dx, dy);
      const step = Math.min(d, px(PET_SPEED) * dt);
      if (d > 1) {
        pet.x += (dx / d) * step;
        pet.y += (dy / d) * step;
        if (Math.abs(dx) > 1) pet.facing = Math.sign(dx);
      }
      // If the dog runs far away, they catch up at once.
      if ((pet.x - cx) ** 2 + (pet.y - p.y) ** 2 > px(500) ** 2) {
        pet.x = cx;
        pet.y = p.y;
      }
    });
  }

  render(alpha: number, ctx: RunContext): void {
    const p = ctx.player;
    // The bell ring: little gold dots that blink around the dog.
    const g = this.ring;
    g.clear();
    if (this.bellRadius > 0 && !p.dead) {
      const cx = Math.round(p.prevX + (p.x - p.prevX) * alpha);
      const cy = Math.round(p.prevY + (p.y - p.prevY) * alpha) - 8;
      const dots = Math.max(10, Math.round(this.bellRadius * 0.5));
      for (let i = 0; i < dots; i++) {
        if ((i + Math.floor(this.time * 5)) % 2 === 0) continue;
        const a = (i / dots) * Math.PI * 2;
        g.rect(Math.round(cx + Math.cos(a) * this.bellRadius), Math.round(cy + Math.sin(a) * this.bellRadius), 1, 1).fill(C('a'));
      }
    }
    // Chingue's perfume: a faint green ring so you can see how far it reaches.
    if (p.auraDps > 0 && !p.dead) {
      const cx = Math.round(p.prevX + (p.x - p.prevX) * alpha);
      const cy = Math.round(p.prevY + (p.y - p.prevY) * alpha) - 8;
      const r = px(p.auraRadius);
      const dots = Math.max(10, Math.round(r * 0.6));
      for (let i = 0; i < dots; i++) {
        if ((i + Math.floor(this.time * 3)) % 3 !== 0) continue;
        const a = (i / dots) * Math.PI * 2;
        g.rect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1).fill(C('V'));
      }
    }
    for (const pet of this.list) {
      if (!pet.sprite.visible) continue;
      const tex = this.run.textures[frameAt(this.run, this.time + pet.x * 0.02)];
      if (tex) pet.sprite.texture = tex;
      const x = Math.round(pet.prevX + (pet.x - pet.prevX) * alpha);
      const y = Math.round(pet.prevY + (pet.y - pet.prevY) * alpha);
      pet.sprite.position.set(x, y);
      pet.sprite.scale.x = pet.facing;
      pet.sprite.zIndex = y;
    }
  }
}
