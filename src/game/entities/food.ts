import { Container, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { FOOD, PICKUPS, px } from '../../data/balance.ts';
import { PLAYER_BASE } from '../../data/personajes.ts';
import { t } from '../../i18n/index.ts';
import type { RunContext } from '../context.ts';

export type PickupKind = 'sopaipilla' | 'completo' | 'chorrillana' | 'mote' | 'silbido' | 'temblor' | 'caja' | 'cajaDorada';

const XP: Partial<Record<PickupKind, number>> = {
  sopaipilla: FOOD.sopaipilla.xp,
  completo: FOOD.completo.xp,
  chorrillana: FOOD.chorrillana.xp,
};

const LOOK: Record<PickupKind, { sprite: string; anim: string }> = {
  sopaipilla: { sprite: 'sopaipilla', anim: 'brillo' },
  completo: { sprite: 'completo', anim: 'brillo' },
  chorrillana: { sprite: 'chorrillana', anim: 'brillo' },
  mote: { sprite: 'mote', anim: 'brillo' },
  silbido: { sprite: 'silbido', anim: 'brillo' },
  temblor: { sprite: 'temblor', anim: 'brillo' },
  caja: { sprite: 'caja', anim: 'normal' },
  cajaDorada: { sprite: 'caja', anim: 'dorada' },
};

export interface Piece {
  active: boolean;
  kind: PickupKind;
  xp: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  t: number;
  pulled: boolean;
  sprite: Sprite;
}

/**
 * Everything on the floor: food (pulled in by the dog's nose, gives XP),
 * rare items (touch to use) and the Caja del Almacén. Past 300 pieces new
 * food merges into an existing one (GDD).
 */
export class Food {
  readonly root = new Container();
  private readonly pool: Piece[] = [];
  private readonly anims: Record<PickupKind, Anim>;
  private foodCount = 0;

  constructor(capacity = 420) {
    this.anims = Object.fromEntries(
      Object.entries(LOOK).map(([k, v]) => [k, anim(v.sprite, v.anim)]),
    ) as Record<PickupKind, Anim>;
    for (let i = 0; i < capacity; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.root.addChild(sprite);
      this.pool.push({ active: false, kind: 'sopaipilla', xp: 0, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, t: 0, pulled: false, sprite });
    }
  }

  drop(kind: PickupKind, x: number, y: number, ctx: RunContext): void {
    const xp = XP[kind] ?? 0;
    if (xp > 0 && this.foodCount >= FOOD.mergeAbove) {
      const target = this.pool.find((p) => p.active && p.xp > 0 && !p.pulled);
      if (target) {
        target.xp += xp;
        return;
      }
    }
    const p = this.pool.find((it) => !it.active);
    if (!p) return;
    const a = ctx.rng.range(0, Math.PI * 2);
    const pop = xp > 0 ? 18 : 10;
    p.active = true;
    p.kind = kind;
    p.xp = xp;
    p.x = p.prevX = x;
    p.y = p.prevY = y;
    p.vx = Math.cos(a) * pop;
    p.vy = Math.sin(a) * pop;
    p.t = ctx.rng.range(0, 1);
    p.pulled = false;
    p.sprite.visible = true;
    p.sprite.zIndex = xp > 0 ? 0 : 1;
    if (xp > 0) this.foodCount++;
  }

  update(dt: number, ctx: RunContext): void {
    const pl = ctx.player;
    const radius = px(PLAYER_BASE.pickupRadius) * ctx.mods.pickupMult;
    const drag = Math.exp(-dt / 0.08);
    for (const p of this.pool) {
      if (!p.active) continue;
      p.prevX = p.x;
      p.prevY = p.y;
      p.t += dt;
      const dx = pl.x - p.x;
      const dy = pl.y - 8 - p.y;
      const d = Math.hypot(dx, dy);
      if (p.xp > 0 && !pl.dead && (p.pulled || d < radius)) {
        p.pulled = true;
        // Accelerate toward the nose; always faster than the dog.
        const speed = Math.min(420, 60 + p.t * 600);
        p.vx += ((dx / (d || 1)) * speed - p.vx) * 0.35;
        p.vy += ((dy / (d || 1)) * speed - p.vy) * 0.35;
        if (d < 7) {
          this.collect(p, ctx);
          continue;
        }
      } else {
        p.vx *= drag;
        p.vy *= drag;
        if (p.xp === 0 && !pl.dead && d < 12) {
          this.use(p, ctx);
          continue;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private release(p: Piece): void {
    p.active = false;
    p.sprite.visible = false;
    if (p.xp > 0) this.foodCount--;
  }

  private collect(p: Piece, ctx: RunContext): void {
    this.release(p);
    ctx.stats.food += 1;
    ctx.progress.xp += p.xp * ctx.mods.xpMult;
    ctx.sfx.pickup();
    ctx.particles.burst(ctx.rng, p.x, p.y, 3, ['y', 'W', 'a'], 30, 0.2);
  }

  /** Rare items and boxes act on touch. */
  private use(p: Piece, ctx: RunContext): void {
    this.release(p);
    ctx.particles.burst(ctx.rng, p.x, p.y, 8, ['W', 'y', 'a'], 60, 0.3);
    switch (p.kind) {
      case 'mote':
        ctx.player.heal(PICKUPS.moteConHuesillo.heal, ctx);
        ctx.sfx.play('cargaLista');
        break;
      case 'silbido':
        this.pullAll();
        ctx.sfx.play('cargaLista', { pitch: 1.5 });
        break;
      case 'temblor':
        ctx.enemies.quake(ctx);
        ctx.shake.add(1);
        ctx.sfx.play('puf', { pitch: 0.3, gain: 2 });
        ctx.banner(t('ui.temblor'), 'w');
        break;
      case 'caja':
      case 'cajaDorada':
        ctx.openCaja(p.kind === 'cajaDorada');
        break;
      default:
        break;
    }
  }

  /** Nearest food piece on the floor (not already flying to the dog), for the gaviota. */
  nearestFood(x: number, y: number, maxDist: number): Piece | undefined {
    let best: Piece | undefined;
    let bd = maxDist * maxDist;
    for (const p of this.pool) {
      if (!p.active || p.xp === 0 || p.pulled) continue;
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  /** Removes a piece (eaten by a gaviota) and returns its XP. */
  take(p: Piece): number {
    if (!p.active) return 0;
    const xp = p.xp;
    this.release(p);
    return xp;
  }

  /** Drops food worth `xp` in total as the biggest pieces that fit (stolen food, boss rain). */
  dropValue(xp: number, x: number, y: number, ctx: RunContext, spread = 6): void {
    let left = Math.round(xp);
    let guard = 0;
    while (left > 0 && guard++ < 40) {
      const kind: PickupKind = left >= FOOD.chorrillana.xp ? 'chorrillana' : left >= FOOD.completo.xp ? 'completo' : 'sopaipilla';
      left -= XP[kind] ?? 1;
      this.drop(kind, x + ctx.rng.range(-spread, spread), y + ctx.rng.range(-spread, spread), ctx);
    }
  }

  /** Silbido de la vecina: every piece of food flies to the dog. */
  pullAll(): void {
    for (const p of this.pool) if (p.active && p.xp > 0) p.pulled = true;
  }

  render(alpha: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      const a = this.anims[p.kind];
      const tex = a.textures[frameAt(a, p.t)];
      if (tex) p.sprite.texture = tex;
      // Items bob 1 px so they read as "pick me up".
      const bob = p.xp === 0 ? (Math.floor(p.t * 3) % 2 === 0 ? -1 : 0) : 0;
      p.sprite.position.set(
        Math.round(p.prevX + (p.x - p.prevX) * alpha),
        Math.round(p.prevY + (p.y - p.prevY) * alpha) + bob,
      );
    }
  }
}
