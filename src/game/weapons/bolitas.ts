import { Container, Sprite } from 'pixi.js';
import { anim } from '../../art/assets.ts';
import { px } from '../../data/balance.ts';
import type { RunContext } from '../context.ts';
import { Cooldown, type Weapon } from './weapon.ts';

const SPEED = 300;
const LIFE = 1.5;
const RADIUS = 3;
/** Spread between marbles in the burst (radians). */
const FAN = 0.3;
const COLORS = ['azul', 'roja', 'dorada'] as const;

interface Marble {
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
  split: boolean;
  sprite: Sprite;
}

/**
 * Bolitas: a burst of marbles in a fan toward the nearest enemy. Each marble ricochets off the
 * first enemy it hits in a random direction. Canica Reina (evolution): a marble that hits breaks
 * into two more.
 */
export class Bolitas implements Weapon {
  readonly id = 'bolitas';
  readonly root = new Container();
  private readonly pool: Marble[] = [];
  private readonly cd = new Cooldown();
  private readonly near: number[] = [];
  private readonly textures: ReturnType<typeof anim>['textures'][number][];

  constructor() {
    this.textures = COLORS.map((c) => anim('bolita', c).textures[0]).filter((t): t is NonNullable<typeof t> => !!t);
    for (let i = 0; i < 90; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.root.addChild(sprite);
      this.pool.push({ active: false, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, life: 0, bounces: 0, lastHit: -1, split: false, sprite });
    }
  }

  update(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    const n = ctx.build.numbers(this.id, ctx.mods);
    const queen = ctx.build.evolved.has(this.id);
    if (!p.dead && this.cd.tick(dt, n.cooldown)) {
      const target = ctx.enemies.nearest(p.x, p.y - 8, 240, 0);
      const base = target ? Math.atan2(target.y - (p.y - 8), target.x - p.x) : ctx.rng.range(0, Math.PI * 2);
      for (let i = 0; i < n.count; i++) this.launch(p.x, p.y - 8, base + (i - (n.count - 1) / 2) * FAN, n.bounces, false, i);
      ctx.sfx.play('golpe', { pitch: 1.8, gain: 0.8 });
    }
    for (const m of this.pool) {
      if (!m.active) continue;
      m.prevX = m.x;
      m.prevY = m.y;
      m.life -= dt;
      if (m.life <= 0) {
        m.active = false;
        m.sprite.visible = false;
        continue;
      }
      m.x += (m.vx + ctx.wind.x * 0.4) * dt;
      m.y += (m.vy + ctx.wind.y * 0.4) * dt;
      ctx.grid.query(m.x, m.y, RADIUS + 12, this.near);
      for (const id of this.near) {
        const e = ctx.enemies.get(id);
        if (!e?.active || id === m.lastHit) continue;
        if ((e.x - m.x) ** 2 + (e.y - m.y) ** 2 > (RADIUS + e.radius) ** 2) continue;
        ctx.enemies.hit(e, n.damage, m.x - m.vx * 0.05, m.y - m.vy * 0.05, 70, ctx, this.id);
        ctx.sfx.play('golpe', { pitch: 2 + ctx.rng.range(0, 0.4), gain: 0.5 });
        m.lastHit = id;
        // Canica Reina: the marble breaks in two, once.
        if (queen && !m.split) {
          for (let k = 0; k < 2; k++) this.launch(m.x, m.y, ctx.rng.range(0, Math.PI * 2), 0, true, k);
        }
        if (m.bounces <= 0) {
          m.active = false;
          m.sprite.visible = false;
        } else {
          m.bounces--;
          const a = ctx.rng.range(0, Math.PI * 2);
          const s = px(SPEED);
          m.vx = Math.cos(a) * s;
          m.vy = Math.sin(a) * s;
          m.life = Math.max(m.life, 0.7);
        }
        break;
      }
    }
  }

  private launch(x: number, y: number, a: number, bounces: number, split: boolean, color: number): void {
    const m = this.pool.find((it) => !it.active);
    if (!m) return;
    const s = px(SPEED);
    m.active = true;
    m.x = m.prevX = x;
    m.y = m.prevY = y;
    m.vx = Math.cos(a) * s;
    m.vy = Math.sin(a) * s;
    m.life = split ? LIFE * 0.6 : LIFE;
    m.bounces = bounces;
    m.lastHit = -1;
    m.split = split;
    const tex = this.textures[color % this.textures.length];
    if (tex) m.sprite.texture = tex;
    m.sprite.scale.set(split ? 1 : 1.3);
    m.sprite.visible = true;
  }

  render(alpha: number): void {
    for (const m of this.pool) {
      if (!m.active) continue;
      m.sprite.position.set(Math.round(m.prevX + (m.x - m.prevX) * alpha), Math.round(m.prevY + (m.y - m.prevY) * alpha));
    }
  }
}
