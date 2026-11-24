import { Container, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import type { Rng } from '../../core/rng.ts';
import { enemyDamageMult, enemyHpMult, px } from '../../data/balance.ts';
import { ELITE, ENEMIGOS, type EnemyDef } from '../../data/enemigos.ts';
import { PLAYER_BASE } from '../../data/personajes.ts';
import type { RunContext } from '../context.ts';

/** How each enemy looks: sprite, death particle colours, hitbox and shadow. */
interface EnemyLook {
  readonly sprite: string;
  readonly anim: string;
  readonly particles: readonly string[];
  readonly radius: number;
  /** Flying enemies hover this many px above their shadow. */
  readonly hover: number;
}

const LOOKS: Readonly<Record<string, EnemyLook>> = {
  zancudo: { sprite: 'zancudo', anim: 'volar', particles: ['K', 'k', 'r', 'G'], radius: 4, hover: 7 },
  paloma: { sprite: 'paloma', anim: 'volar', particles: ['G', 'g', 'T', 'w'], radius: 5, hover: 6 },
};

/** Enemy ids that have art and behaviour (the director only spawns these). */
export const IMPLEMENTED_ENEMIES = Object.keys(LOOKS);

/** Chance per kill of a rare floor item. */
const RARE_DROPS = [
  { kind: 'mote', chance: 0.004 },
  { kind: 'silbido', chance: 0.0015 },
  { kind: 'temblor', chance: 0.001 },
] as const;

export interface Flock {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  speed: number;
  members: number;
}

export interface Enemy {
  readonly id: number;
  active: boolean;
  def: EnemyDef;
  look: EnemyLook;
  elite: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  /** Knockback velocity, decays on its own. */
  kx: number;
  ky: number;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  damage: number;
  /** Seconds left of the white hit flash. */
  flash: number;
  kiteCooldown: number;
  /** Frozen with fear / stunned. */
  stun: number;
  /** 0..1 slow (chaya) while slowTime > 0. */
  slow: number;
  slowTime: number;
  t: number;
  phase: number;
  facing: number;
  flock: Flock | null;
  offX: number;
  offY: number;
  sprite: Sprite;
  shadow: Sprite;
  anim: Anim;
  flashAnim: Anim;
}

const FLASH_TIME = 2 / 30;

/**
 * Enemy pool. Fixed-size arrays and pre-made sprites: nothing is allocated
 * while playing. Behaviours are chosen by the data's `behavior` id.
 */
export class Enemies {
  readonly list: Enemy[] = [];
  private readonly defs = new Map(ENEMIGOS.map((d) => [d.id, d]));
  private readonly near: number[] = [];
  private readonly flocks: Flock[] = [];
  activeCount = 0;
  /** Highest number on screen this run ("Pa' la foto"). */
  peak = 0;

  constructor(capacity: number, shadows: Container, world: Container) {
    const shadowSmall = anim('sombra', 'chica').textures[0];
    const placeholder = ENEMIGOS[0];
    const look = LOOKS.zancudo;
    if (!placeholder || !look) throw new Error('Faltan datos de enemigos');
    const a = anim(look.sprite, look.anim);
    for (let i = 0; i < capacity; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      const shadow = new Sprite(shadowSmall);
      shadow.anchor.set(0.5);
      shadow.visible = false;
      world.addChild(sprite);
      shadows.addChild(shadow);
      this.list.push({
        id: i,
        active: false,
        def: placeholder,
        look,
        elite: false,
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        vx: 0,
        vy: 0,
        kx: 0,
        ky: 0,
        hp: 0,
        maxHp: 0,
        radius: 4,
        speed: 0,
        damage: 0,
        flash: 0,
        kiteCooldown: 0,
        stun: 0,
        slow: 0,
        slowTime: 0,
        t: 0,
        phase: 0,
        facing: 1,
        flock: null,
        offX: 0,
        offY: 0,
        sprite,
        shadow,
        anim: a,
        flashAnim: a,
      });
    }
  }

  get(id: number): Enemy | undefined {
    return this.list[id];
  }

  /** Spawns one enemy of `defId`; returns undefined when the pool is full. */
  spawn(defId: string, x: number, y: number, minutes: number, ctx: RunContext, elite = false): Enemy | undefined {
    const def = this.defs.get(defId);
    const look = LOOKS[defId];
    if (!def || !look) throw new Error(`Enemigo desconocido: ${defId}`);
    const e = this.list.find((it) => !it.active);
    if (!e) return undefined;
    e.active = true;
    e.def = def;
    e.look = look;
    e.elite = elite;
    e.x = e.prevX = x;
    e.y = e.prevY = y;
    e.vx = e.vy = e.kx = e.ky = 0;
    e.maxHp = e.hp = def.hp * enemyHpMult(minutes) * (elite ? ELITE.hpMult : 1);
    e.damage = def.damage * enemyDamageMult(minutes);
    e.speed = px(def.speed) * ctx.rng.range(0.9, 1.1);
    e.radius = look.radius + (elite ? 2 : 0);
    e.flash = e.kiteCooldown = e.stun = e.slow = e.slowTime = 0;
    e.t = 0;
    e.phase = ctx.rng.range(0, Math.PI * 2);
    e.facing = 1;
    e.flock = null;
    const suffix = elite ? '_elite' : '';
    e.anim = anim(look.sprite, `${look.anim}${suffix}`);
    e.flashAnim = anim(look.sprite, `${look.anim}${suffix}_blanco`);
    e.sprite.visible = true;
    e.shadow.visible = true;
    this.activeCount++;
    this.peak = Math.max(this.peak, this.activeCount);
    return e;
  }

  /** A flock of pigeons that flies as one, swooping at the player. */
  spawnFlock(x: number, y: number, size: number, minutes: number, ctx: RunContext): void {
    const p = ctx.player;
    const d = Math.hypot(p.x - x, p.y - y) || 1;
    const flock: Flock = {
      x,
      y,
      dirX: (p.x - x) / d,
      dirY: (p.y - y) / d,
      speed: px(this.defs.get('paloma')?.speed ?? 140),
      members: 0,
    };
    for (let i = 0; i < size; i++) {
      const e = this.spawn('paloma', x, y, minutes, ctx);
      if (!e) break;
      const ring = Math.floor(i / 6) + 1;
      const a = ctx.rng.range(0, Math.PI * 2);
      e.offX = Math.cos(a) * ring * 9 + ctx.rng.range(-3, 3);
      e.offY = Math.sin(a) * ring * 7 + ctx.rng.range(-3, 3);
      e.x = e.prevX = x + e.offX;
      e.y = e.prevY = y + e.offY;
      e.flock = flock;
      flock.members++;
    }
    this.flocks.push(flock);
    ctx.sfx.play('aleteo');
  }

  update(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    // Flocks steer toward the player with a limited turn rate, so they overshoot and swoop.
    for (let i = this.flocks.length - 1; i >= 0; i--) {
      const f = this.flocks[i];
      if (!f) continue;
      if (f.members <= 0) {
        this.flocks.splice(i, 1);
        continue;
      }
      const dx = p.x - f.x;
      const dy = p.y - f.y;
      const d = Math.hypot(dx, dy) || 1;
      const want = Math.atan2(dy, dx);
      const cur = Math.atan2(f.dirY, f.dirX);
      let diff = want - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const turn = Math.max(-1.6 * dt, Math.min(1.6 * dt, diff));
      f.dirX = Math.cos(cur + turn);
      f.dirY = Math.sin(cur + turn);
      const boost = d > 220 ? 1.3 : 1;
      f.x += f.dirX * f.speed * boost * dt;
      f.y += f.dirY * f.speed * boost * dt;
    }

    const kDecay = Math.exp(-dt / 0.18);
    const steer = 1 - Math.exp(-dt / 0.12);
    for (const e of this.list) {
      if (!e.active) continue;
      e.prevX = e.x;
      e.prevY = e.y;
      e.t += dt;
      e.flash = Math.max(0, e.flash - dt);
      e.kiteCooldown = Math.max(0, e.kiteCooldown - dt);
      e.stun = Math.max(0, e.stun - dt);
      e.slowTime = Math.max(0, e.slowTime - dt);
      const slow = e.slowTime > 0 ? 1 - e.slow : 1;

      let wantX = 0;
      let wantY = 0;
      if (e.stun <= 0 && !p.dead) {
        if (e.flock) {
          const tx = e.flock.x + e.offX - e.x;
          const ty = e.flock.y + e.offY - e.y;
          const td = Math.hypot(tx, ty) || 1;
          const s = Math.min(e.speed * 1.6, td * 5);
          wantX = (tx / td) * s;
          wantY = (ty / td) * s;
        } else {
          // perseguir: straight at the player with an annoying sideways wobble.
          const dx = p.x - e.x;
          const dy = p.y - 8 - e.y;
          const d = Math.hypot(dx, dy) || 1;
          const wob = Math.sin(e.t * 7 + e.phase) * 0.45;
          wantX = (dx / d - (dy / d) * wob) * e.speed;
          wantY = (dy / d + (dx / d) * wob) * e.speed;
        }
      }
      e.vx += (wantX * slow - e.vx) * steer;
      e.vy += (wantY * slow - e.vy) * steer;
      e.kx *= kDecay;
      e.ky *= kDecay;
      e.x += (e.vx + e.kx) * dt;
      e.y += (e.vy + e.ky) * dt;
      if (Math.abs(e.vx) > 4) e.facing = Math.sign(e.vx);
    }

    // Rebuild the grid, then separate and resolve contact with the player.
    ctx.grid.clear();
    for (const e of this.list) if (e.active) ctx.grid.insert(e.id, e.x, e.y);
    for (const e of this.list) {
      if (!e.active) continue;
      ctx.grid.query(e.x, e.y, 12, this.near);
      for (const id of this.near) {
        if (id <= e.id) continue;
        const o = this.list[id];
        if (!o?.active) continue;
        const dx = o.x - e.x;
        const dy = o.y - e.y;
        const min = (e.radius + o.radius) * 0.9;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) continue;
        const d = Math.sqrt(d2);
        const push = ((min - d) / d) * 0.5;
        e.x -= dx * push;
        e.y -= dy * push;
        o.x += dx * push;
        o.y += dy * push;
      }
      if (!p.dead && e.stun <= 0) {
        const dx = p.x - e.x;
        const dy = p.y - 8 - e.y;
        const rr = p.radius + e.radius;
        if (dx * dx + dy * dy < rr * rr) p.takeDamage(e.damage, e.x, e.y, ctx);
      }
    }
  }

  /** A weapon hit: rolls the critical, then applies damage. */
  hit(e: Enemy, base: number, fromX: number, fromY: number, knock: number, ctx: RunContext, source: string): void {
    const crit = ctx.rng.chance(PLAYER_BASE.critChance);
    this.damage(e, base * (crit ? PLAYER_BASE.critMultiplier : 1), crit, fromX, fromY, knock, ctx, source);
  }

  /** Applies damage with flash, number, knockback; kills when HP runs out. */
  damage(
    e: Enemy,
    amount: number,
    crit: boolean,
    fromX: number,
    fromY: number,
    knock: number,
    ctx: RunContext,
    source: string,
  ): void {
    if (!e.active) return;
    const dealt = Math.min(e.hp, amount);
    e.hp -= amount;
    ctx.stats.damageBy[source] = (ctx.stats.damageBy[source] ?? 0) + dealt;
    e.flash = FLASH_TIME;
    if (knock > 0) {
      const d = Math.hypot(e.x - fromX, e.y - fromY) || 1;
      const k = e.elite ? knock * 0.3 : knock;
      e.kx += ((e.x - fromX) / d) * k;
      e.ky += ((e.y - fromY) / d) * k;
    }
    ctx.numbers.spawn(e.x, e.y - 4, amount, crit ? 'crit' : 'normal');
    if (crit) {
      ctx.hitstop(0.04);
      ctx.shake.add(0.18);
    }
    if (e.hp <= 0) this.kill(e, ctx);
  }

  kill(e: Enemy, ctx: RunContext, quiet = false): void {
    if (!e.active) return;
    this.remove(e);
    ctx.stats.kills++;
    ctx.particles.burst(ctx.rng, e.x, e.y, ctx.rng.int(6, 10), e.look.particles, 70, 0.35);
    if (!quiet) ctx.sfx.play('puf', { pitch: 0.8 + ctx.rng.range(0, 0.45) });
    const gy = e.y + e.look.hover;
    ctx.food.drop(e.def.drop === 'robado' ? 'sopaipilla' : e.def.drop, e.x, gy, ctx);
    if (e.elite) {
      ctx.food.drop('caja', e.x, gy, ctx);
      ctx.shake.add(0.3);
    } else {
      for (const r of RARE_DROPS) {
        if (ctx.rng.chance(r.chance)) {
          ctx.food.drop(r.kind, e.x + 6, gy, ctx);
          break;
        }
      }
    }
    // Small shove to the neighbours.
    ctx.grid.query(e.x, e.y, 20, this.near);
    for (const id of this.near) {
      const o = this.list[id];
      if (!o?.active) continue;
      const dx = o.x - e.x;
      const dy = o.y - e.y;
      const d = Math.hypot(dx, dy);
      if (d > 20 || d === 0) continue;
      o.kx += (dx / d) * 40;
      o.ky += (dy / d) * 40;
    }
  }

  private remove(e: Enemy): void {
    e.active = false;
    e.sprite.visible = false;
    e.shadow.visible = false;
    this.activeCount--;
    if (e.flock) e.flock.members--;
  }

  /** ¡GUAU!: damage and strong push to everything in the radius. */
  shockwave(x: number, y: number, radius: number, damage: number, ctx: RunContext): void {
    ctx.grid.query(x, y, radius, this.near);
    const hits = [...this.near];
    for (const id of hits) {
      const e = this.list[id];
      if (!e?.active) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d > radius) continue;
      e.stun = 0.25;
      const strength = 1 - (d / radius) * 0.5;
      this.hit(e, damage, x, y, 380 * strength, ctx, 'guau');
    }
  }

  /** ¡Temblor!: every normal enemy dies; elites are only stunned. */
  quake(ctx: RunContext): void {
    for (const e of this.list) {
      if (!e.active) continue;
      if (e.elite) e.stun = 2;
      else this.kill(e, ctx, true);
    }
  }

  /** The n-th nearest enemy within maxDist (n = 0 is the closest). */
  nearest(x: number, y: number, maxDist: number, nth = 0, excludeId = -1): Enemy | undefined {
    const found: { e: Enemy; d: number }[] = [];
    for (const e of this.list) {
      if (!e.active || e.id === excludeId) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d <= maxDist * maxDist) found.push({ e, d });
    }
    if (found.length === 0) return undefined;
    found.sort((a, b) => a.d - b.d);
    return found[Math.min(nth, found.length - 1)]?.e;
  }

  nearestExcluding(x: number, y: number, maxDist: number, exclude: ReadonlySet<number>): Enemy | undefined {
    let best: Enemy | undefined;
    let bestD = maxDist * maxDist;
    for (const e of this.list) {
      if (!e.active || exclude.has(e.id)) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  /** A good target for area damage: samples a few enemies, keeps the one with most neighbours. */
  densest(x: number, y: number, range: number, radius: number, rng: Rng): Enemy | undefined {
    const candidates = this.list.filter((e) => e.active && (e.x - x) ** 2 + (e.y - y) ** 2 < range * range);
    if (candidates.length === 0) return undefined;
    let best: Enemy | undefined;
    let bestN = -1;
    for (let i = 0; i < 6; i++) {
      const c = candidates[rng.int(0, candidates.length - 1)];
      if (!c) continue;
      let n = 0;
      for (const o of candidates) if ((o.x - c.x) ** 2 + (o.y - c.y) ** 2 < radius * radius) n++;
      if (n > bestN) {
        bestN = n;
        best = c;
      }
    }
    return best;
  }

  /** Removes enemies near a point. */
  clearAround(x: number, y: number, radius: number): void {
    for (const e of this.list) {
      if (e.active && Math.hypot(e.x - x, e.y - y) <= radius) this.remove(e);
    }
  }

  /** Moves enemies that fell too far behind to just outside the view ahead (GDD cap rule). */
  recycleFar(px0: number, py0: number, maxDist: number, ctx: RunContext, viewW: number, viewH: number): void {
    const p = ctx.player;
    for (const e of this.list) {
      if (!e.active || e.flock) continue;
      const dx = e.x - px0;
      const dy = e.y - py0;
      if (dx * dx + dy * dy < maxDist * maxDist) continue;
      const a = Math.atan2(p.vy, p.vx) + ctx.rng.range(-0.8, 0.8);
      const r = Math.hypot(viewW, viewH) / 2 + 20;
      e.x = e.prevX = px0 + Math.cos(a) * r;
      e.y = e.prevY = py0 + Math.sin(a) * r;
    }
  }

  render(alpha: number): void {
    for (const e of this.list) {
      if (!e.active) continue;
      const x = Math.round(e.prevX + (e.x - e.prevX) * alpha);
      const y = Math.round(e.prevY + (e.y - e.prevY) * alpha);
      const a = e.flash > 0 ? e.flashAnim : e.anim;
      const tex = a.textures[frameAt(a, e.t + e.phase)];
      if (tex) e.sprite.texture = tex;
      e.sprite.scale.x = e.facing;
      // (x, y) is the body centre; the shadow sits `hover` px below on the ground.
      e.sprite.position.set(x, y);
      e.sprite.zIndex = y + e.look.hover;
      e.shadow.position.set(x, y + e.look.hover);
    }
  }
}
