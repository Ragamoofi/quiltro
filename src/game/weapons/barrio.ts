import { Container, Graphics } from 'pixi.js';
import { px } from '../../data/balance.ts';
import { C } from '../../ui/widgets.ts';
import type { RunContext } from '../context.ts';
import type { Enemy } from '../entities/enemies.ts';
import { Cooldown, type Weapon } from './weapon.ts';

/*
 * Fase 11.5 — five weapons from the neighbourhood: Choripán, Pandero, Cacerola, Boleadora and
 * Sopaipilla caliente. Everything is drawn with shapes (no new sprite sheets), and the numbers
 * come from `data/armas.ts` through `build.numbers`.
 */

/** The direction the dog last walked in, kept by the weapons that aim forward. */
class Aim {
  x = 1;
  y = 0;
  update(ctx: RunContext): void {
    const p = ctx.player;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 10) {
      this.x = p.vx / sp;
      this.y = p.vy / sp;
    } else if (Math.abs(this.x) < 0.01 && Math.abs(this.y) < 0.01) {
      this.x = p.facing;
    }
  }
}

const isFoe = (e: Enemy | undefined): e is Enemy => !!e && e.active && !e.boss;

// ---------------------------------------------------------------------------------------------
// Choripán

interface Sausage {
  active: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  target: number;
  bouncesLeft: number;
  damage: number;
  spin: number;
  hit: Set<number>;
}

/**
 * Choripán: flies to the nearest enemy, hits it and ricochets to the next one close by.
 * Asado de domingo (evolution): three more bounces and 30 % more damage.
 */
export class Choripan implements Weapon {
  readonly id = 'choripan';
  readonly root = new Container();
  private readonly g = new Graphics();
  private readonly cd = new Cooldown();
  private readonly pool: Sausage[] = [];

  constructor() {
    this.root.addChild(this.g);
    for (let i = 0; i < 24; i++) {
      this.pool.push({ active: false, x: 0, y: 0, prevX: 0, prevY: 0, target: -1, bouncesLeft: 0, damage: 0, spin: 0, hit: new Set() });
    }
  }

  update(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    const n = ctx.build.numbers(this.id, ctx.mods);
    const evo = ctx.build.evolved.has(this.id);
    if (!p.dead && this.cd.tick(dt, n.cooldown)) {
      for (let i = 0; i < n.count; i++) {
        const e = ctx.enemies.nearest(p.x, p.y - 8, px(260), i);
        const s = this.pool.find((it) => !it.active);
        if (!e || !s) break;
        s.active = true;
        s.x = s.prevX = p.x;
        s.y = s.prevY = p.y - 8;
        s.target = e.id;
        s.bouncesLeft = n.bounces + (evo ? 3 : 0);
        s.damage = n.damage * (evo ? 1.3 : 1);
        s.hit.clear();
      }
      ctx.sfx.play('golpe', { pitch: 1.1, gain: 0.7 });
    }
    const speed = px(300);
    for (const s of this.pool) {
      if (!s.active) continue;
      s.prevX = s.x;
      s.prevY = s.y;
      s.spin += dt * 14;
      const e = ctx.enemies.get(s.target);
      if (!isFoe(e)) {
        const next = ctx.enemies.nearestExcluding(s.x, s.y, px(140), s.hit);
        if (!isFoe(next)) {
          s.active = false;
          continue;
        }
        s.target = next.id;
        continue;
      }
      const dx = e.x - s.x;
      const dy = e.y - s.y;
      const d = Math.hypot(dx, dy) || 1;
      const step = Math.min(d, speed * dt);
      s.x += (dx / d) * step;
      s.y += (dy / d) * step;
      if (d - step <= e.radius + 3) {
        s.hit.add(e.id);
        ctx.enemies.hit(e, s.damage, s.x - dx, s.y - dy, 90, ctx, this.id);
        ctx.particles.burst(ctx.rng, s.x, s.y, 3, ['o', 'y', 'W'], 40, 0.2);
        if (s.bouncesLeft-- <= 0) {
          s.active = false;
          continue;
        }
        const next = ctx.enemies.nearestExcluding(s.x, s.y, px(140), s.hit);
        if (!isFoe(next)) s.active = false;
        else s.target = next.id;
      }
    }
  }

  render(alpha: number): void {
    const g = this.g;
    g.clear();
    for (const s of this.pool) {
      if (!s.active) continue;
      const x = Math.round(s.prevX + (s.x - s.prevX) * alpha);
      const y = Math.round(s.prevY + (s.y - s.prevY) * alpha);
      const a = s.spin;
      const dx = Math.round(Math.cos(a) * 4);
      const dy = Math.round(Math.sin(a) * 4);
      g.moveTo(x - dx, y - dy).lineTo(x + dx, y + dy).stroke({ width: 5, color: C('k') });
      g.moveTo(x - dx, y - dy).lineTo(x + dx, y + dy).stroke({ width: 3, color: C('O') });
      g.moveTo(x - dx / 2, y - dy / 2).lineTo(x + dx / 2, y + dy / 2).stroke({ width: 1, color: C('y') });
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Pandero

interface Pulse {
  angle: number;
  age: number;
  delay: number;
  full: boolean;
  fired: boolean;
  radius: number;
  damage: number;
}

const PULSE_LIFE = 0.28;
const CONE_HALF = 0.95;

/**
 * Pandero: a wide pulse in front of the dog that hits whatever is in the cone and shoves it
 * forward. Cueca Brava (evolution): the pulse goes all around and sounds twice in a row.
 */
export class Pandero implements Weapon {
  readonly id = 'pandero';
  readonly root = new Container();
  private readonly g = new Graphics();
  private readonly cd = new Cooldown();
  private readonly aim = new Aim();
  private readonly near: number[] = [];
  private pulses: Pulse[] = [];

  constructor() {
    this.root.addChild(this.g);
  }

  update(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    const n = ctx.build.numbers(this.id, ctx.mods);
    const evo = ctx.build.evolved.has(this.id);
    this.aim.update(ctx);
    if (!p.dead && this.cd.tick(dt, n.cooldown)) {
      // It sounds towards the nearest enemy (or where the dog walks, if nobody is close).
      const foe = ctx.enemies.nearest(p.x, p.y - 8, px(n.area) * 1.4);
      const angle = foe ? Math.atan2(foe.y - (p.y - 8), foe.x - p.x) : Math.atan2(this.aim.y, this.aim.x);
      const radius = px(n.area);
      // One pulse per count (La jauría adds more), spread around the dog.
      const pulses = Math.max(1, n.count);
      for (let i = 0; i < pulses; i++) {
        const a = angle + (i * Math.PI * 2) / pulses;
        this.pulses.push({ angle: a, age: 0, delay: i * 0.08, full: evo, fired: false, radius, damage: n.damage });
      }
      if (evo) this.pulses.push({ angle, age: 0, delay: 0.3, full: true, fired: false, radius: radius * 1.2, damage: n.damage });
    }
    const cx = p.x;
    const cy = p.y - 8;
    for (const pu of this.pulses) {
      if (pu.delay > 0) {
        pu.delay -= dt;
        continue;
      }
      if (!pu.fired) {
        pu.fired = true;
        ctx.sfx.play('golpe', { pitch: 0.55, gain: 1 });
        ctx.shake.add(0.12);
        ctx.grid.query(cx, cy, pu.radius + 16, this.near);
        for (const id of this.near) {
          const e = ctx.enemies.get(id);
          if (!e?.active) continue;
          const dx = e.x - cx;
          const dy = e.y - cy;
          const d = Math.hypot(dx, dy);
          if (d > pu.radius + e.radius) continue;
          if (!pu.full) {
            let diff = Math.atan2(dy, dx) - pu.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            if (Math.abs(diff) > CONE_HALF && d > e.radius + 8) continue;
          }
          ctx.enemies.hit(e, pu.damage, cx, cy, 260, ctx, this.id);
        }
      }
      pu.age += dt;
    }
    this.pulses = this.pulses.filter((pu) => pu.age < PULSE_LIFE);
  }

  render(alpha: number, ctx: RunContext): void {
    const g = this.g;
    g.clear();
    const p = ctx.player;
    const cx = Math.round(p.prevX + (p.x - p.prevX) * alpha);
    const cy = Math.round(p.prevY + (p.y - p.prevY) * alpha) - 8;
    for (const pu of this.pulses) {
      if (pu.delay > 0) continue;
      const k = Math.min(1, pu.age / PULSE_LIFE);
      const r = Math.round(pu.radius * (0.35 + 0.65 * k));
      const a = pu.full ? 0 : pu.angle - CONE_HALF;
      const b = pu.full ? Math.PI * 2 : pu.angle + CONE_HALF;
      const alphaStroke = 1 - k * 0.8;
      g.arc(cx, cy, r, a, b).stroke({ width: 4, color: C('k'), alpha: alphaStroke });
      g.arc(cx, cy, r, a, b).stroke({ width: 2, color: C(k < 0.5 ? 'W' : 'y'), alpha: alphaStroke });
      if (!pu.full) g.arc(cx, cy, Math.max(2, r - 5), a + 0.15, b - 0.15).stroke({ width: 1, color: C('a'), alpha: alphaStroke * 0.8 });
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Cacerola

interface Bonk {
  age: number;
  radius: number;
}

const BONK_LIFE = 0.3;

/**
 * Cacerola: bangs a pot around the dog every few seconds and, whenever something hurts the dog,
 * answers right away with a bigger bang (the damage taken adds to the hit). Cacerolazo
 * (evolution): wider, stronger, and it stuns whatever it hits.
 */
export class Cacerola implements Weapon {
  readonly id = 'cacerola';
  readonly root = new Container();
  private readonly g = new Graphics();
  private readonly cd = new Cooldown();
  private readonly near: number[] = [];
  private lastHp = -1;
  private queued = 0;
  private queueT = 0;
  private guard = 0;
  private bonks: Bonk[] = [];

  constructor() {
    this.root.addChild(this.g);
  }

  private bang(ctx: RunContext, radius: number, damage: number, evo: boolean): void {
    const p = ctx.player;
    const cx = p.x;
    const cy = p.y - 8;
    this.bonks.push({ age: 0, radius });
    ctx.sfx.play('golpe', { pitch: 1.5, gain: 1 });
    ctx.shake.add(0.15);
    ctx.grid.query(cx, cy, radius + 16, this.near);
    for (const id of this.near) {
      const e = ctx.enemies.get(id);
      if (!e?.active) continue;
      if ((e.x - cx) ** 2 + (e.y - cy) ** 2 > (radius + e.radius) ** 2) continue;
      if (evo && !e.boss) e.stun = Math.max(e.stun, 0.8);
      ctx.enemies.hit(e, damage, cx, cy, 300, ctx, this.id);
    }
  }

  update(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    const n = ctx.build.numbers(this.id, ctx.mods);
    const evo = ctx.build.evolved.has(this.id);
    this.guard = Math.max(0, this.guard - dt);
    const radius = px(n.area) * (evo ? 1.3 : 1);
    if (this.lastHp < 0) this.lastHp = p.hp;
    if (!p.dead) {
      const lost = this.lastHp - p.hp;
      if (lost > 0.5 && this.guard <= 0) {
        this.guard = 0.5;
        this.bang(ctx, radius * 1.25, (n.damage + lost * 1.5) * (evo ? 1.5 : 1), evo);
      } else if (this.cd.tick(dt, n.cooldown)) {
        // One bang per count (La jauría adds more), in quick succession.
        this.queued = Math.max(1, n.count);
        this.queueT = 0;
      }
      if (this.queued > 0) {
        this.queueT -= dt;
        if (this.queueT <= 0) {
          this.queued--;
          this.queueT = 0.18;
          this.bang(ctx, radius, n.damage * 0.8 * (evo ? 1.5 : 1), evo);
        }
      }
    }
    this.lastHp = p.hp;
    for (const b of this.bonks) b.age += dt;
    this.bonks = this.bonks.filter((b) => b.age < BONK_LIFE);
  }

  render(alpha: number, ctx: RunContext): void {
    const g = this.g;
    g.clear();
    const p = ctx.player;
    const cx = Math.round(p.prevX + (p.x - p.prevX) * alpha);
    const cy = Math.round(p.prevY + (p.y - p.prevY) * alpha) - 8;
    for (const b of this.bonks) {
      const k = b.age / BONK_LIFE;
      const r = Math.round(b.radius * (0.3 + 0.7 * k));
      g.circle(cx, cy, r).stroke({ width: 4, color: C('k'), alpha: 1 - k * 0.8 });
      g.circle(cx, cy, r).stroke({ width: 2, color: C('a'), alpha: 1 - k * 0.8 });
      // A little pot spinning at the top of the ring.
      const px0 = cx + Math.round(Math.cos(k * 9) * r);
      const py0 = cy + Math.round(Math.sin(k * 9) * r);
      g.rect(px0 - 2, py0 - 1, 5, 3).fill(C('s'));
      g.rect(px0 - 3, py0 - 1, 1, 1).fill(C('k'));
      g.rect(px0 + 3, py0 - 1, 1, 1).fill(C('k'));
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Boleadora

interface Link {
  a: number;
  b: number;
  left: number;
  tick: number;
}

/**
 * Boleadora: ties two enemies with a rope. While it holds, both are slowed and hurt, and so is
 * whatever gets caught in the rope; if they drift too far apart it snaps. Las Tres Marías
 * (evolution): one more rope and more damage.
 */
export class Boleadora implements Weapon {
  readonly id = 'boleadora';
  readonly root = new Container();
  private readonly g = new Graphics();
  private readonly cd = new Cooldown();
  private readonly near: number[] = [];
  private links: Link[] = [];

  constructor() {
    this.root.addChild(this.g);
  }

  update(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    const n = ctx.build.numbers(this.id, ctx.mods);
    const evo = ctx.build.evolved.has(this.id);
    const reach = px(n.area);
    if (!p.dead && this.cd.tick(dt, n.cooldown)) {
      const busy = new Set<number>();
      for (const l of this.links) {
        busy.add(l.a);
        busy.add(l.b);
      }
      const ropes = n.count + (evo ? 1 : 0);
      for (let i = 0; i < ropes; i++) {
        const a = ctx.enemies.nearestExcluding(p.x, p.y - 8, px(230), busy);
        if (!isFoe(a)) break;
        busy.add(a.id);
        const b = ctx.enemies.nearestExcluding(a.x, a.y, reach, busy);
        if (!isFoe(b)) continue;
        busy.add(b.id);
        this.links.push({ a: a.id, b: b.id, left: n.duration, tick: 0 });
        ctx.sfx.play('golpe', { pitch: 1.3, gain: 0.6 });
      }
    }
    const dmg = n.damage * (evo ? 1.25 : 1);
    this.links = this.links.filter((l) => {
      const a = ctx.enemies.get(l.a);
      const b = ctx.enemies.get(l.b);
      l.left -= dt;
      if (l.left <= 0 || !isFoe(a) || !isFoe(b)) return false;
      if (Math.hypot(a.x - b.x, a.y - b.y) > reach * 1.8) return false;
      // The two tied enemies are pulled towards each other a little and slowed.
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      a.kx += (mx - a.x) * 1.2 * dt;
      a.ky += (my - a.y) * 1.2 * dt;
      b.kx += (mx - b.x) * 1.2 * dt;
      b.ky += (my - b.y) * 1.2 * dt;
      a.slow = b.slow = Math.max(a.slow, n.slow);
      a.slowTime = b.slowTime = 0.3;
      l.tick -= dt;
      if (l.tick <= 0) {
        l.tick = n.tick;
        ctx.enemies.hit(a, dmg, mx, my, 0, ctx, this.id);
        ctx.enemies.hit(b, dmg, mx, my, 0, ctx, this.id);
        ctx.grid.query(mx, my, Math.hypot(a.x - b.x, a.y - b.y) / 2 + 12, this.near);
        for (const id of this.near) {
          if (id === l.a || id === l.b) continue;
          const e = ctx.enemies.get(id);
          if (!isFoe(e)) continue;
          if (distToSegment(e.x, e.y, a.x, a.y, b.x, b.y) > e.radius + 3) continue;
          ctx.enemies.hit(e, dmg, mx, my, 40, ctx, this.id);
        }
      }
      return true;
    });
    this.ropes = this.links.map((l) => ({ a: ctx.enemies.get(l.a), b: ctx.enemies.get(l.b) }));
  }

  private ropes: { a: Enemy | undefined; b: Enemy | undefined }[] = [];

  render(): void {
    const g = this.g;
    g.clear();
    for (const r of this.ropes) {
      if (!r.a || !r.b) continue;
      const ax = Math.round(r.a.x);
      const ay = Math.round(r.a.y);
      const bx = Math.round(r.b.x);
      const by = Math.round(r.b.y);
      g.moveTo(ax, ay).lineTo(bx, by).stroke({ width: 3, color: C('k') });
      g.moveTo(ax, ay).lineTo(bx, by).stroke({ width: 1, color: C('l') });
      g.circle(ax, ay, 3).fill(C('d')).stroke({ width: 1, color: C('k') });
      g.circle(bx, by, 3).fill(C('d')).stroke({ width: 1, color: C('k') });
    }
  }
}

function distToSegment(x: number, y: number, x0: number, y0: number, x1: number, y1: number): number {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / len2));
  return Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy));
}

// ---------------------------------------------------------------------------------------------
// Sopaipilla caliente

interface Puddle {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  left: number;
  tick: number;
  damage: number;
  life: number;
}

/**
 * Sopaipilla caliente: lands near the enemies and leaves boiling oil that burns whatever stands
 * in it. Sopaipilla pasada (evolution): a bigger, longer-lasting puddle that burns harder.
 */
export class SopaipillaCaliente implements Weapon {
  readonly id = 'sopaipillaCaliente';
  readonly root = new Container();
  private readonly g = new Graphics();
  private readonly cd = new Cooldown();
  private readonly near: number[] = [];
  private readonly pool: Puddle[] = [];
  private time = 0;

  constructor() {
    this.root.addChild(this.g);
    for (let i = 0; i < 32; i++) this.pool.push({ active: false, x: 0, y: 0, radius: 0, left: 0, tick: 0, damage: 0, life: 1 });
  }

  update(dt: number, ctx: RunContext): void {
    this.time += dt;
    const p = ctx.player;
    const n = ctx.build.numbers(this.id, ctx.mods);
    const evo = ctx.build.evolved.has(this.id);
    if (!p.dead && this.cd.tick(dt, n.cooldown)) {
      for (let i = 0; i < n.count; i++) {
        const e = ctx.enemies.nearest(p.x, p.y - 8, px(190), i);
        const pd = this.pool.find((it) => !it.active);
        if (!pd) break;
        pd.active = true;
        pd.x = (e ? e.x : p.x + ctx.rng.range(-50, 50)) + ctx.rng.range(-6, 6);
        pd.y = (e ? e.y : p.y + ctx.rng.range(-40, 40)) + ctx.rng.range(-4, 4);
        pd.radius = px(n.area) * (evo ? 1.4 : 1);
        pd.life = pd.left = n.duration * (evo ? 1.5 : 1);
        pd.tick = 0.1;
        pd.damage = n.damage * (evo ? 1.5 : 1);
        ctx.particles.burst(ctx.rng, pd.x, pd.y, 5, ['O', 'y', 'W'], 40, 0.25);
      }
      ctx.sfx.play('puf', { pitch: 1.6, gain: 0.5 });
    }
    for (const pd of this.pool) {
      if (!pd.active) continue;
      pd.left -= dt;
      if (pd.left <= 0) {
        pd.active = false;
        continue;
      }
      pd.tick -= dt;
      if (pd.tick > 0) continue;
      pd.tick = n.tick;
      ctx.grid.query(pd.x, pd.y, pd.radius + 16, this.near);
      for (const id of this.near) {
        const e = ctx.enemies.get(id);
        if (!e?.active) continue;
        if ((e.x - pd.x) ** 2 + (e.y - pd.y) ** 2 > (pd.radius + e.radius) ** 2) continue;
        ctx.enemies.hit(e, pd.damage, pd.x, pd.y, 0, ctx, this.id);
      }
    }
  }

  render(): void {
    const g = this.g;
    g.clear();
    for (const pd of this.pool) {
      if (!pd.active) continue;
      const fade = Math.min(1, pd.left / 0.6);
      const x = Math.round(pd.x);
      const y = Math.round(pd.y);
      const r = Math.round(pd.radius);
      g.ellipse(x, y, r, Math.max(3, Math.round(r * 0.6))).fill({ color: C('o'), alpha: 0.55 * fade });
      g.ellipse(x, y, Math.round(r * 0.6), Math.max(2, Math.round(r * 0.35))).fill({ color: C('O'), alpha: 0.6 * fade });
      // Bubbles that pop.
      for (let i = 0; i < 3; i++) {
        const t = (this.time * 2 + i * 0.37 + pd.x * 0.1) % 1;
        const bx = x + Math.round(Math.cos(i * 2.1 + pd.y) * r * 0.5);
        const by = y - Math.round(t * 5);
        g.rect(bx, by, 1, 1).fill({ color: C('y'), alpha: (1 - t) * fade });
      }
    }
  }
}
