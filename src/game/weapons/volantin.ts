import { Container, Graphics, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { colorOf, hexToNumber } from '../../art/palette.ts';
import { VOLANTIN_COLA, VOLANTIN_VARIANTES } from '../../art/sprites/armas.ts';
import { VOLANTIN_ORBIT } from '../../data/armas.ts';
import { px } from '../../data/balance.ts';
import type { RunContext } from '../context.ts';
import type { Weapon } from './weapon.ts';

/** Kites hit an enemy at most this often. */
const HIT_COOLDOWN = 0.22;
const KITE_RADIUS = 5;
const TAIL = 10;
/** Height of the line's anchor on the dog (its back). */
const HAND_Y = 12;
const LINE = hexToNumber(colorOf('w')?.hex ?? '#FBF3E4');

interface Kite {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  sprite: Sprite;
  anim: Anim;
  tailX: number[];
  tailY: number[];
  tailColor: number;
}

/**
 * El Volantín: kites orbiting on a line. Short line (default) = tight, fast,
 * +25 % damage; holding opens the orbit in 0.35 s, slower and wider.
 */
export class Volantin implements Weapon {
  readonly id = 'volantin';
  readonly root = new Container();
  private readonly lines = new Graphics();
  private readonly kites: Kite[] = [];
  /** 0 = short line, 1 = full line given. */
  hilo = 0;
  private angle = 0;
  private time = 0;
  private readonly near: number[] = [];
  private count = 0;
  /** Debug override for the number of kites (0 = use the build). */
  forceCount = 0;

  constructor() {
    this.root.addChild(this.lines);
  }

  private ensure(n: number): void {
    while (this.kites.length < n) {
      const i = this.kites.length;
      const variant = i % VOLANTIN_VARIANTES;
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      this.root.addChild(sprite);
      this.kites.push({
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        sprite,
        anim: anim('volantin', `v${variant}`),
        tailX: [],
        tailY: [],
        tailColor: hexToNumber(colorOf(VOLANTIN_COLA[variant] ?? 'r')?.hex ?? '#E63946'),
      });
    }
    if (n !== this.count) {
      this.kites.forEach((k, i) => {
        k.sprite.visible = i < n;
        k.tailX.length = 0;
        k.tailY.length = 0;
      });
      this.count = n;
    }
  }

  /** Orbit radius in native px (Cachai widens it). */
  radius(ctx: RunContext): number {
    const e = this.hilo * this.hilo * (3 - 2 * this.hilo);
    return (
      px(VOLANTIN_ORBIT.shortRadius + (VOLANTIN_ORBIT.longRadius - VOLANTIN_ORBIT.shortRadius) * e) *
      ctx.mods.areaMult
    );
  }

  update(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    const n = ctx.build.numbers('volantin', ctx.mods);
    this.ensure(this.forceCount || n.count);
    this.time += dt;
    const giving = p.holding && !p.dead;
    // Open smoothly while holding; reel in fast on release ("recoge el hilo de golpe").
    this.hilo = giving ? Math.min(1, this.hilo + dt / VOLANTIN_ORBIT.openTime) : Math.max(0, this.hilo - dt / 0.12);

    const turns =
      VOLANTIN_ORBIT.shortTurnsPerSecond +
      (VOLANTIN_ORBIT.longTurnsPerSecond - VOLANTIN_ORBIT.shortTurnsPerSecond) * this.hilo;
    this.angle += turns * Math.PI * 2 * dt;
    const r = this.radius(ctx);
    const cx = p.x;
    const cy = p.y - HAND_Y;
    const damage = n.damage * (1 + VOLANTIN_ORBIT.shortDamageBonus * (1 - this.hilo));

    for (let i = 0; i < this.count; i++) {
      const k = this.kites[i];
      if (!k) continue;
      k.prevX = k.x;
      k.prevY = k.y;
      const a = this.angle + (i / this.count) * Math.PI * 2;
      k.x = cx + Math.cos(a) * r;
      k.y = cy + Math.sin(a) * r;
      k.tailX.unshift(k.x);
      k.tailY.unshift(k.y);
      if (k.tailX.length > TAIL) {
        k.tailX.length = TAIL;
        k.tailY.length = TAIL;
      }
      if (p.dead) continue;
      // Two samples per step so fast kites do not tunnel through small enemies.
      this.hitAt((k.x + k.prevX) / 2, (k.y + k.prevY) / 2, damage, ctx);
      this.hitAt(k.x, k.y, damage, ctx);
    }
  }

  private hitAt(x: number, y: number, damage: number, ctx: RunContext): void {
    ctx.grid.query(x, y, KITE_RADIUS + 12, this.near);
    for (const id of this.near) {
      const e = ctx.enemies.get(id);
      if (!e?.active || e.kiteCooldown > 0) continue;
      const rr = KITE_RADIUS + e.radius;
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy > rr * rr) continue;
      e.kiteCooldown = HIT_COOLDOWN;
      ctx.sfx.play('golpe', { pitch: 0.9 + ctx.rng.range(0, 0.25) });
      ctx.enemies.hit(e, damage, ctx.player.x, ctx.player.y, 70, ctx, this.id);
    }
  }

  render(alpha: number, ctx: RunContext): void {
    const g = this.lines;
    g.clear();
    const p = ctx.player;
    this.root.visible = !p.dead;
    if (p.dead) return;
    const hx = Math.round(p.prevX + (p.x - p.prevX) * alpha);
    const hy = Math.round(p.prevY + (p.y - p.prevY) * alpha) - HAND_Y;
    for (let i = 0; i < this.count; i++) {
      const k = this.kites[i];
      if (!k) continue;
      const x = Math.round(k.prevX + (k.x - k.prevX) * alpha);
      const y = Math.round(k.prevY + (k.y - k.prevY) * alpha);
      g.moveTo(hx + 0.5, hy + 0.5).lineTo(x + 0.5, y + 0.5);
      g.stroke({ width: 1, color: LINE });
      for (let t = 2; t < k.tailX.length; t += 2) {
        const tx = k.tailX[t];
        const ty = k.tailY[t];
        if (tx === undefined || ty === undefined) continue;
        g.rect(Math.round(tx), Math.round(ty) + 4, 1, 1).fill(t % 4 === 0 ? k.tailColor : LINE);
      }
      const tex = k.anim.textures[frameAt(k.anim, this.time + i * 0.3)];
      if (tex) k.sprite.texture = tex;
      k.sprite.position.set(x, y);
    }
  }
}
