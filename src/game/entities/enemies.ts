import { Container, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import type { Rng } from '../../core/rng.ts';
import { enemyDamageMult, enemyHpMult, px } from '../../data/balance.ts';
import { t } from '../../i18n/index.ts';
import { ELITE, ENEMIGOS, GUARDIAN, ENEMIGOS_ESPECIALES, PARTE_DE_JEFE, type EnemyDef } from '../../data/enemigos.ts';
import { PLAYER_BASE } from '../../data/personajes.ts';
import type { RunContext } from '../context.ts';

/** How each enemy looks: sprite, animations, death particles, hitbox, and height above its shadow. */
interface EnemyLook {
  readonly sprite: string;
  readonly anim: string;
  /** Animation while attacking (spitting, charging...). */
  readonly attack?: string;
  readonly particles: readonly string[];
  readonly radius: number;
  /** Distance from the body centre down to the shadow. */
  readonly hover: number;
}

const LOOKS: Readonly<Record<string, EnemyLook>> = {
  zancudo: { sprite: 'zancudo', anim: 'volar', particles: ['K', 'k', 'r', 'G'], radius: 4, hover: 7 },
  paloma: { sprite: 'paloma', anim: 'volar', particles: ['G', 'g', 'T', 'w'], radius: 5, hover: 6 },
  jote: { sprite: 'jote', anim: 'volar', particles: ['K', 'k', 'r', 'g'], radius: 6, hover: 14 },
  guanaco: { sprite: 'guanaco', anim: 'caminar', attack: 'escupir', particles: ['o', 'w', 'O'], radius: 8, hover: 9 },
  micro: { sprite: 'micro', anim: 'andar', particles: ['y', 'b', 'K', 'G'], radius: 10, hover: 7 },
  colectivo: { sprite: 'colectivo', anim: 'andar', particles: ['k', 'y', 'K', 'G'], radius: 9, hover: 6 },
  rata: { sprite: 'rata', anim: 'correr', particles: ['g', 'G', 'p'], radius: 3, hover: 3 },
  gaviota: { sprite: 'gaviota', anim: 'volar', particles: ['w', 'G', 'y'], radius: 5, hover: 9 },
  loboMarino: { sprite: 'loboMarino', anim: 'arrastrarse', attack: 'aplastar', particles: ['C', 'c', 'd'], radius: 10, hover: 8 },
  chonchon: { sprite: 'chonchon', anim: 'volar', particles: ['l', 'C', 'd'], radius: 5, hover: 11 },
  camahueto: { sprite: 'camahueto', anim: 'caminar', particles: ['o', 'A', 'a'], radius: 8, hover: 8 },
  basilisco: { sprite: 'basilisco', anim: 'reptar', particles: ['f', 'v', 'r', 'w'], radius: 7, hover: 8 },
  tempano: { sprite: 'tempano', anim: 'deslizar', particles: ['i', 'W', 'I'], radius: 9, hover: 9 },
  tempanito: { sprite: 'tempanito', anim: 'deslizar', particles: ['i', 'W'], radius: 4, hover: 5 },
  chingue: { sprite: 'chingue', anim: 'correr', particles: ['K', 'w', 'k'], radius: 5, hover: 5 },
  puma: { sprite: 'puma', anim: 'caminar', attack: 'saltar', particles: ['o', 'n', 'C'], radius: 7, hover: 6 },
  parte: { sprite: 'zancudo', anim: 'volar', particles: ['W'], radius: 12, hover: 0 },
};

/** Enemy ids that the director can spawn (art + behaviour exist). */
export const IMPLEMENTED_ENEMIES = ENEMIGOS.map((d) => d.id).filter((id) => id in LOOKS);

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

/** What a boss part forwards hits to. */
export interface BossTarget {
  readonly invulnerable: boolean;
  hit(amount: number, crit: boolean, source: string, ctx: RunContext): void;
}

export interface Enemy {
  readonly id: number;
  active: boolean;
  def: EnemyDef;
  look: EnemyLook;
  elite: boolean;
  /** Fase 11.4: the zone's guardian, an elite that stomps with a warning circle. */
  guardian: boolean;
  /** Seconds to the guardian's next stomp. */
  stompT: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  kx: number;
  ky: number;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  damage: number;
  flash: number;
  kiteCooldown: number;
  stun: number;
  slow: number;
  slowTime: number;
  t: number;
  phase: number;
  facing: number;
  flock: Flock | null;
  offX: number;
  offY: number;
  /** Behaviour state machine. */
  state: string;
  timer: number;
  tx: number;
  ty: number;
  /** XP the gaviota has eaten. */
  stolen: number;
  /** Tutorial ring: does no damage until the first ¡GUAU!. */
  harmless: boolean;
  boss: BossTarget | null;
  sprite: Sprite;
  shadow: Sprite;
  anim: Anim;
  flashAnim: Anim;
  attackAnim: Anim | null;
}

const FLASH_TIME = 2 / 30;
const DEFS = new Map([...ENEMIGOS, ...ENEMIGOS_ESPECIALES, PARTE_DE_JEFE].map((d) => [d.id, d]));

/**
 * Enemy pool with every behaviour from the GDD. Fixed-size arrays and
 * pre-made sprites: nothing is allocated while playing.
 */
export class Enemies {
  readonly list: Enemy[] = [];
  private readonly near: number[] = [];
  private readonly flocks: Flock[] = [];
  activeCount = 0;
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
        guardian: false,
        stompT: 0,
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
        state: '',
        timer: 0,
        tx: 0,
        ty: 0,
        stolen: 0,
        harmless: false,
        boss: null,
        sprite,
        shadow,
        anim: a,
        flashAnim: a,
        attackAnim: null,
      });
    }
  }

  get(id: number): Enemy | undefined {
    return this.list[id];
  }

  /** Spawns one enemy; returns undefined when the pool is full. */
  spawn(defId: string, x: number, y: number, minutes: number, ctx: RunContext, elite = false): Enemy | undefined {
    const def = DEFS.get(defId);
    const look = LOOKS[defId];
    if (!def || !look) throw new Error(`Enemigo desconocido: ${defId}`);
    const e = this.list.find((it) => !it.active);
    if (!e) return undefined;
    e.active = true;
    e.def = def;
    e.look = look;
    e.elite = elite;
    e.guardian = false;
    e.stompT = 3;
    e.x = e.prevX = x;
    e.y = e.prevY = y;
    e.vx = e.vy = e.kx = e.ky = 0;
    e.maxHp = e.hp = def.hp * enemyHpMult(minutes) * (elite ? ELITE.hpMult : 1) * ctx.pasaje.hp;
    e.damage = def.damage * enemyDamageMult(minutes) * ctx.pasaje.damage;
    e.speed = px(def.speed) * ctx.rngDirector.range(0.9, 1.1);
    e.radius = look.radius + (elite ? 2 : 0);
    e.flash = e.kiteCooldown = e.stun = e.slow = e.slowTime = 0;
    e.t = 0;
    e.phase = ctx.rngDirector.range(0, Math.PI * 2);
    e.facing = 1;
    e.flock = null;
    e.state = '';
    e.timer = ctx.rngDirector.range(1, 3);
    e.stolen = 0;
    e.harmless = false;
    e.boss = null;
    const suffix = elite ? '_elite' : '';
    e.anim = anim(look.sprite, `${look.anim}${suffix}`);
    e.flashAnim = anim(look.sprite, `${look.anim}${suffix}_blanco`);
    e.attackAnim = look.attack ? anim(look.sprite, `${look.attack}${suffix}`) : null;
    const isPart = def.behavior === 'parte';
    e.sprite.visible = !isPart;
    e.shadow.visible = !isPart;
    this.activeCount++;
    this.peak = Math.max(this.peak, this.activeCount);
    return e;
  }

  /** An invisible hitbox for a boss; damage goes to the boss. */
  spawnPart(boss: BossTarget, radius: number, damage: number, ctx: RunContext): Enemy | undefined {
    const e = this.spawn('parte', 0, 0, 0, ctx);
    if (!e) return undefined;
    e.boss = boss;
    e.radius = radius;
    e.damage = damage;
    return e;
  }

  spawnFlock(x: number, y: number, size: number, minutes: number, ctx: RunContext): void {
    const p = ctx.player;
    const d = Math.hypot(p.x - x, p.y - y) || 1;
    const flock: Flock = { x, y, dirX: (p.x - x) / d, dirY: (p.y - y) / d, speed: px(DEFS.get('paloma')?.speed ?? 140), members: 0 };
    for (let i = 0; i < size; i++) {
      const e = this.spawn('paloma', x, y, minutes, ctx);
      if (!e) break;
      const ring = Math.floor(i / 6) + 1;
      const a = ctx.rngDirector.range(0, Math.PI * 2);
      e.offX = Math.cos(a) * ring * 9 + ctx.rngDirector.range(-3, 3);
      e.offY = Math.sin(a) * ring * 7 + ctx.rngDirector.range(-3, 3);
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
    this.updateFlocks(dt, ctx);

    const kDecay = Math.exp(-dt / 0.18);
    const steer = 1 - Math.exp(-dt / 0.12);
    for (const e of this.list) {
      if (!e.active || e.def.behavior === 'parte') continue;
      e.prevX = e.x;
      e.prevY = e.y;
      e.t += dt;
      e.flash = Math.max(0, e.flash - dt);
      e.kiteCooldown = Math.max(0, e.kiteCooldown - dt);
      e.stun = Math.max(0, e.stun - dt);
      e.slowTime = Math.max(0, e.slowTime - dt);
      const slow = e.slowTime > 0 ? 1 - e.slow : 1;

      if (e.guardian && e.stun <= 0 && !p.dead) this.guardianStomp(e, dt, ctx);
      let want = { x: 0, y: 0, direct: false };
      if (e.stun <= 0 && !p.dead) want = this.behave(e, dt, ctx);
      if (want.direct) {
        e.vx = want.x;
        e.vy = want.y;
      } else {
        e.vx += (want.x * slow - e.vx) * steer;
        e.vy += (want.y * slow - e.vy) * steer;
      }
      e.kx *= kDecay;
      e.ky *= kDecay;
      e.x += (e.vx + e.kx + ctx.wind.x * 0.5) * dt;
      e.y += (e.vy + e.ky + ctx.wind.y * 0.5) * dt;
      if (Math.abs(e.vx) > 4) e.facing = Math.sign(e.vx);
    }

    // Rebuild the grid (big bodies go in every cell they touch).
    ctx.grid.clear();
    for (const e of this.list) if (e.active) ctx.grid.insertCircle(e.id, e.x, e.y, e.radius);

    for (const e of this.list) {
      if (!e.active) continue;
      const isPart = e.def.behavior === 'parte';
      if (!isPart) this.separate(e, ctx);
      // Micros and camahuetos charging run over the small fry.
      if (e.state === 'carga' && e.def.id === 'micro') this.runOver(e, ctx);
      if (!p.dead && e.stun <= 0 && e.damage > 0 && !e.harmless) {
        const dx = p.x - e.x;
        const dy = p.y - 8 - e.y;
        const rr = p.radius + e.radius;
        if (dx * dx + dy * dy < rr * rr) p.takeDamage(e.damage, e.x, e.y, ctx, e.boss ? 'jefe' : e.def.id);
      }
    }
  }

  private updateFlocks(dt: number, ctx: RunContext): void {
    const p = ctx.player;
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
  }

  /** Desired velocity for one enemy (or a direct velocity for dashes). */
  private behave(e: Enemy, dt: number, ctx: RunContext): { x: number; y: number; direct: boolean } {
    const p = ctx.player;
    const dx = p.x - e.x;
    const dy = p.y - 8 - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d;
    const uy = dy / d;
    const chase = (k = 1): { x: number; y: number; direct: boolean } => ({ x: ux * e.speed * k, y: uy * e.speed * k, direct: false });
    const attackSpeed = px(e.def.attackSpeed ?? e.def.speed * 3);

    switch (e.def.behavior) {
      case 'bandada': {
        if (!e.flock) return chase();
        const tx = e.flock.x + e.offX - e.x;
        const ty = e.flock.y + e.offY - e.y;
        const td = Math.hypot(tx, ty) || 1;
        const s = Math.min(e.speed * 1.6, td * 5);
        return { x: (tx / td) * s, y: (ty / td) * s, direct: false };
      }
      case 'picada': {
        // Circle around the dog; every 4 s, a shadow marks the spot and it dives.
        e.timer -= dt;
        if (e.state === 'picada') {
          const tx = e.tx - e.x;
          const ty = e.ty - e.y;
          const td = Math.hypot(tx, ty);
          if (td < 6 || e.timer < -1) {
            e.state = '';
            e.timer = e.def.params?.diveEvery ?? 4;
          }
          return { x: (tx / (td || 1)) * attackSpeed, y: (ty / (td || 1)) * attackSpeed, direct: true };
        }
        if (e.state === 'aviso') {
          if (e.timer <= 0) {
            e.state = 'picada';
            e.timer = 0;
          }
          return { x: 0, y: 0, direct: false };
        }
        if (e.timer <= 0 && d < 160) {
          e.state = 'aviso';
          e.timer = 0.6;
          e.tx = p.x;
          e.ty = p.y - 8;
          ctx.telegraphs.circle(e.tx, e.ty + 8, 9, 0.6, null);
          return { x: 0, y: 0, direct: false };
        }
        const orbit = 75;
        const a = Math.atan2(e.y - p.y, e.x - p.x) + 1.4 * dt;
        const tx = p.x + Math.cos(a) * orbit - e.x;
        const ty = p.y + Math.sin(a) * orbit - e.y;
        const td = Math.hypot(tx, ty) || 1;
        return { x: (tx / td) * e.speed, y: (ty / td) * e.speed, direct: false };
      }
      case 'escupir': {
        // Keep a distance and spit slow shots.
        e.timer -= dt;
        if (e.state === 'escupe' && e.timer <= 0) e.state = '';
        if (d > 120) return chase();
        if (d < 80) return chase(-0.6);
        if (e.timer <= 0) {
          e.state = 'escupe';
          e.timer = 2.4;
          ctx.shots.fire(e.x + e.facing * 8, e.y - 6, Math.atan2(dy + 6, dx), px(150), e.damage);
        }
        e.facing = Math.sign(dx) || 1;
        return { x: 0, y: 0, direct: false };
      }
      case 'embestir':
      case 'cargar': {
        // Line up, warn (horn / snort), then charge straight without braking.
        const wind = e.def.behavior === 'embestir' ? (e.def.params?.hornTime ?? 0.8) : 0.5;
        e.timer -= dt;
        if (e.state === 'carga') {
          if (e.timer <= 0) {
            e.state = 'descanso';
            e.timer = 1.5;
          }
          return { x: e.tx * attackSpeed, y: e.ty * attackSpeed, direct: true };
        }
        if (e.state === 'aviso') {
          if (e.timer <= 0) {
            e.state = 'carga';
            e.timer = 1.4;
          }
          return { x: 0, y: 0, direct: true };
        }
        if (e.state === 'descanso') {
          if (e.timer <= 0) e.state = '';
          return chase(0.3);
        }
        if (d < 150 && e.timer <= 0) {
          e.state = 'aviso';
          e.timer = wind;
          e.tx = ux;
          e.ty = uy;
          e.facing = Math.sign(ux) || 1;
          ctx.telegraphs.line(e.x, e.y, e.x + ux * 220, e.y + uy * 220, e.radius * 2, wind, null);
          if (e.def.behavior === 'embestir') {
            // Horn + engine 0.8 s before the charge, panned to where the bus is (GDD "Efectos").
            const pan = Math.max(-1, Math.min(1, (e.x - p.x) / 160));
            ctx.sfx.play('bocina', { pan });
            ctx.sfx.play('motor', { pan });
          }
          return { x: 0, y: 0, direct: true };
        }
        return chase();
      }
      case 'robar': {
        // Steal food from the floor and flee; chase the dog if there is none.
        if (e.state === 'huye') {
          e.timer -= dt;
          if (e.timer <= 0) e.state = '';
          return chase(-1.2);
        }
        const food = ctx.food.nearestFood(e.x, e.y + e.look.hover, 220);
        if (!food) return chase();
        const fx = food.x - e.x;
        const fy = food.y - e.look.hover - e.y;
        const fd = Math.hypot(fx, fy) || 1;
        if (fd < 8) {
          e.stolen += ctx.food.take(food);
          if (e.stolen >= 5) {
            e.state = 'huye';
            e.timer = 2.5;
          }
        }
        return { x: (fx / fd) * e.speed, y: (fy / fd) * e.speed, direct: false };
      }
      case 'aplastar': {
        e.timer -= dt;
        if (e.state === 'salto') {
          if (e.timer <= 0) {
            e.state = '';
            e.timer = 2;
            this.slam(e.tx, e.ty, 26, e.damage, ctx);
          }
          return { x: (e.tx - e.x) * 4, y: (e.ty - e.y) * 4, direct: true };
        }
        if (d < 40 && e.timer <= 0) {
          e.state = 'salto';
          e.timer = 0.55;
          e.tx = p.x;
          e.ty = p.y - 8;
          ctx.telegraphs.circle(e.tx, e.ty + 8, 26, 0.55, null);
        }
        return chase();
      }
      case 'ondas': {
        if (ctx.rng.chance(dt * 0.15)) ctx.sfx.play('tuetue');
        const wave = Math.sin(e.t * 4 + e.phase) * 1.1;
        return { x: (ux - uy * wave) * e.speed, y: (uy + ux * wave) * e.speed, direct: false };
      }
      case 'mirada': {
        // Looking straight at it for 1 s slows the dog 30 %.
        const facingIt = Math.sign(e.x - p.x) === p.facing && d < 150;
        e.timer = facingIt ? e.timer + dt : 0;
        e.state = facingIt ? 'mira' : '';
        if (e.timer >= (e.def.params?.gazeTime ?? 1)) {
          e.timer = 0;
          p.slowFor(2, e.def.params?.slow ?? 0.3, ctx);
        }
        return chase();
      }
      case 'zigzag': {
        const side = Math.floor(e.t / 0.4 + e.phase) % 2 === 0 ? 1 : -1;
        return { x: (ux - uy * side * 0.9) * e.speed, y: (uy + ux * side * 0.9) * e.speed, direct: false };
      }
      case 'acechar': {
        // Puma: prowls just outside the camera, then leaps.
        e.timer -= dt;
        if (e.state === 'salto') {
          if (e.timer <= 0) {
            e.state = '';
            e.timer = 3;
          }
          return { x: e.tx * attackSpeed, y: e.ty * attackSpeed, direct: true };
        }
        if (e.state === 'aviso') {
          if (e.timer <= 0) {
            e.state = 'salto';
            e.timer = 0.7;
          }
          return { x: 0, y: 0, direct: true };
        }
        if (e.timer <= 0 && d < 260) {
          e.state = 'aviso';
          e.timer = 0.6;
          e.tx = ux;
          e.ty = uy;
          ctx.telegraphs.line(e.x, e.y, e.x + ux * 230, e.y + uy * 230, 12, 0.6, null);
          ctx.sfx.play('bocina', { pitch: 0.5 });
          return { x: 0, y: 0, direct: true };
        }
        const prowl = 230;
        const a = Math.atan2(e.y - p.y, e.x - p.x) + 0.5 * dt;
        const tx = p.x + Math.cos(a) * prowl - e.x;
        const ty = p.y + Math.sin(a) * prowl * 0.7 - e.y;
        const td = Math.hypot(tx, ty) || 1;
        return { x: (tx / td) * e.speed, y: (ty / td) * e.speed, direct: false };
      }
      default: {
        // perseguir / partirse: straight at the dog with an annoying wobble.
        const wob = e.def.id === 'zancudo' ? Math.sin(e.t * 7 + e.phase) * 0.45 : 0;
        return { x: (ux - uy * wob) * e.speed, y: (uy + ux * wob) * e.speed, direct: false };
      }
    }
  }

  private separate(e: Enemy, ctx: RunContext): void {
    ctx.grid.query(e.x, e.y, 12, this.near);
    for (const id of this.near) {
      if (id <= e.id) continue;
      const o = this.list[id];
      if (!o?.active || o.def.behavior === 'parte') continue;
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
  }

  private runOver(m: Enemy, ctx: RunContext): void {
    ctx.grid.query(m.x, m.y, m.radius + 8, this.near);
    for (const id of [...this.near]) {
      const o = this.list[id];
      if (!o?.active || o === m || o.elite || o.boss || o.def.id === 'micro') continue;
      if ((o.x - m.x) ** 2 + (o.y - m.y) ** 2 < (m.radius + o.radius) ** 2) this.kill(o, ctx, false, 'micro');
    }
  }

  /** Area hit on the dog (lobo marino flop, boss slams). */
  /** The guardian's attack: a wide red circle under the dog that fills up for a second, then a stomp. */
  private guardianStomp(e: Enemy, dt: number, ctx: RunContext): void {
    e.stompT -= dt;
    if (e.stompT > 0) return;
    e.stompT = GUARDIAN.stompEvery;
    const p = ctx.player;
    const sx = p.x;
    const sy = p.y - 8;
    const damage = e.damage * GUARDIAN.stompDamage;
    ctx.telegraphs.circle(sx, sy + 8, GUARDIAN.stompRadius, GUARDIAN.stompWarning, () => {
      this.slam(sx, sy, GUARDIAN.stompRadius, damage, ctx, e.def.id);
      ctx.sfx.play('puf', { pitch: 0.3, gain: 1.5 });
    });
  }

  slam(x: number, y: number, r: number, damage: number, ctx: RunContext, source = 'loboMarino'): void {
    const p = ctx.player;
    ctx.shake.add(0.25);
    ctx.particles.burst(ctx.rng, x, y + 8, 10, ['n', 'm', 'W'], r * 2, 0.3);
    if ((p.x - x) ** 2 + (p.y - 8 - y) ** 2 < (r + p.radius) ** 2) p.takeDamage(damage, x, y, ctx, source);
  }

  /** A weapon hit: rolls the critical, then applies damage. */
  hit(e: Enemy, base: number, fromX: number, fromY: number, knock: number, ctx: RunContext, source: string): void {
    const crit = ctx.rng.chance(ctx.mods.critChance);
    this.damage(e, base * (crit ? PLAYER_BASE.critMultiplier + ctx.mods.critDamage : 1), crit, fromX, fromY, knock * (1 + ctx.mods.knockMult), ctx, source);
  }

  damage(e: Enemy, amount: number, crit: boolean, fromX: number, fromY: number, knock: number, ctx: RunContext, source: string): void {
    if (!e.active) return;
    if (e.boss) {
      if (e.boss.invulnerable) return;
      e.boss.hit(amount, crit, source, ctx);
      ctx.numbers.spawn(e.x, e.y - e.radius, amount, crit ? 'crit' : 'normal');
      return;
    }
    const dealt = Math.min(e.hp, amount);
    e.hp -= amount;
    ctx.stats.damageBy[source] = (ctx.stats.damageBy[source] ?? 0) + dealt;
    e.flash = FLASH_TIME;
    if (knock > 0 && e.state !== 'carga') {
      const d = Math.hypot(e.x - fromX, e.y - fromY) || 1;
      const k = e.elite || e.radius >= 9 ? knock * 0.3 : knock;
      e.kx += ((e.x - fromX) / d) * k;
      e.ky += ((e.y - fromY) / d) * k;
    }
    ctx.numbers.spawn(e.x, e.y - 4, amount, crit ? 'crit' : 'normal');
    if (crit) {
      ctx.hitstop(0.04);
      ctx.shake.add(0.18);
    }
    if (e.hp <= 0) this.kill(e, ctx, false, source);
  }

  kill(e: Enemy, ctx: RunContext, quiet = false, source = ''): void {
    if (!e.active || e.boss) return;
    this.remove(e);
    ctx.stats.kills++;
    ctx.stats.killsBy[e.def.id] = (ctx.stats.killsBy[e.def.id] ?? 0) + 1;
    ctx.onKill(e, source);
    ctx.particles.burst(ctx.rng, e.x, e.y, ctx.rng.int(6, 10) + (e.radius > 7 ? 6 : 0), e.look.particles, 70, 0.35);
    if (!quiet) ctx.sfx.play('puf', { pitch: (e.radius > 7 ? 0.6 : 0.8) + ctx.rng.range(0, 0.45) });
    const gy = e.y + e.look.hover;
    if (e.def.drop === 'robado') {
      if (e.stolen > 0) ctx.food.dropValue(e.stolen, e.x, gy, ctx, 10);
      ctx.food.drop('sopaipilla', e.x, gy, ctx);
    } else {
      ctx.food.drop(e.def.drop, e.x, gy, ctx);
    }
    if (e.def.behavior === 'partirse') {
      for (let i = 0; i < (e.def.params?.pieces ?? 3); i++) {
        const a = (i / 3) * Math.PI * 2;
        const piece = this.spawn('tempanito', e.x + Math.cos(a) * 8, e.y + Math.sin(a) * 8, ctx.time / 60, ctx);
        if (piece) {
          piece.kx = Math.cos(a) * 80;
          piece.ky = Math.sin(a) * 80;
        }
      }
    }
    if (e.def.behavior === 'zigzag') ctx.clouds.add(e.x, gy, e.def.params?.cloudSeconds ?? 3);
    if (e.guardian) {
      // The guardian's own loot: a golden box, a rain of food and some lucas.
      ctx.food.drop('cajaDorada', e.x, gy, ctx);
      ctx.food.dropValue(GUARDIAN.foodRain + ctx.progress.level * 4, e.x, gy, ctx, 30);
      ctx.progress.lucas += GUARDIAN.lucas;
      ctx.shake.add(0.5);
      ctx.banner(t('ui.guardianVencido'), 'a', t('ui.guardianLucas', { n: GUARDIAN.lucas }));
    } else if (e.elite) {
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
    ctx.grid.query(e.x, e.y, 20, this.near);
    for (const id of this.near) {
      const o = this.list[id];
      if (!o?.active || o.boss) continue;
      const dx = o.x - e.x;
      const dy = o.y - e.y;
      const d = Math.hypot(dx, dy);
      if (d > 20 || d === 0) continue;
      o.kx += (dx / d) * 40;
      o.ky += (dy / d) * 40;
    }
  }

  remove(e: Enemy): void {
    if (!e.active) return;
    e.active = false;
    e.sprite.visible = false;
    e.shadow.visible = false;
    this.activeCount--;
    if (e.flock) e.flock.members--;
    e.boss = null;
  }

  /** ¡GUAU!: damage and strong push to everything in the radius. */
  shockwave(x: number, y: number, radius: number, damage: number, ctx: RunContext): void {
    // The tutorial's harmless ring becomes normal after the first bark.
    for (const e of this.list) e.harmless = false;
    ctx.grid.query(x, y, radius, this.near);
    for (const id of [...this.near]) {
      const e = this.list[id];
      if (!e?.active) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d > radius + e.radius) continue;
      if (!e.boss) e.stun = 0.25;
      const strength = 1 - (Math.min(d, radius) / radius) * 0.5;
      this.hit(e, damage, x, y, 380 * strength, ctx, 'guau');
    }
  }

  /** ¡Temblor! item: every normal enemy dies; elites and bosses are only stunned. */
  quake(ctx: RunContext): void {
    for (const e of this.list) {
      if (!e.active) continue;
      if (e.boss) continue;
      if (e.elite) e.stun = 2;
      else this.kill(e, ctx, true, 'temblor');
    }
  }

  /** Temblor event: everybody freezes, scared. */
  scare(seconds: number): void {
    for (const e of this.list) if (e.active && !e.boss) e.stun = Math.max(e.stun, seconds);
  }

  nearest(x: number, y: number, maxDist: number, nth = 0, excludeId = -1): Enemy | undefined {
    const found: { e: Enemy; d: number }[] = [];
    for (const e of this.list) {
      if (!e.active || e.id === excludeId) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d <= (maxDist + e.radius) ** 2) found.push({ e, d });
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

  densest(x: number, y: number, range: number, radius: number, rng: Rng): Enemy | undefined {
    const candidates = this.list.filter((e) => e.active && (e.x - x) ** 2 + (e.y - y) ** 2 < range * range);
    if (candidates.length === 0) return undefined;
    let best: Enemy | undefined;
    let bestN = -1;
    for (let i = 0; i < 6; i++) {
      const c = candidates[rng.int(0, candidates.length - 1)];
      if (!c) continue;
      let n = c.boss ? 8 : 0;
      for (const o of candidates) if ((o.x - c.x) ** 2 + (o.y - c.y) ** 2 < radius * radius) n++;
      if (n > bestN) {
        bestN = n;
        best = c;
      }
    }
    return best;
  }

  /** Every enemy visible on screen (Apagón). */
  visible(cx: number, cy: number, halfW: number, halfH: number): Enemy[] {
    return this.list.filter((e) => e.active && Math.abs(e.x - cx) < halfW && Math.abs(e.y - cy) < halfH);
  }

  clearAround(x: number, y: number, radius: number): void {
    for (const e of this.list) {
      if (e.active && !e.boss && Math.hypot(e.x - x, e.y - y) <= radius) this.remove(e);
    }
  }

  recycleFar(px0: number, py0: number, maxDist: number, ctx: RunContext, viewW: number, viewH: number): void {
    const p = ctx.player;
    for (const e of this.list) {
      if (!e.active || e.flock || e.boss || e.def.behavior === 'acechar') continue;
      const dx = e.x - px0;
      const dy = e.y - py0;
      if (dx * dx + dy * dy < maxDist * maxDist) continue;
      const a = Math.atan2(p.vy, p.vx) + ctx.rng.range(-0.8, 0.8);
      const r = Math.hypot(viewW, viewH) / 2 + 20;
      e.x = e.prevX = px0 + Math.cos(a) * r;
      e.y = e.prevY = py0 + Math.sin(a) * r;
      e.state = '';
    }
  }

  render(alpha: number): void {
    for (const e of this.list) {
      if (!e.active || e.def.behavior === 'parte') continue;
      const x = Math.round(e.prevX + (e.x - e.prevX) * alpha);
      const y = Math.round(e.prevY + (e.y - e.prevY) * alpha);
      const attacking = e.attackAnim && (e.state === 'escupe' || e.state === 'salto' || e.state === 'aviso');
      const a = e.flash > 0 ? e.flashAnim : attacking && e.attackAnim ? e.attackAnim : e.anim;
      const tex = a.textures[frameAt(a, e.t + e.phase)];
      if (tex) e.sprite.texture = tex;
      e.sprite.scale.x = e.facing;
      // Warning blink before a charge or dive.
      e.sprite.visible = e.state !== 'aviso' || Math.floor(e.t * 20) % 2 === 0;
      e.sprite.position.set(x, y);
      e.sprite.zIndex = y + e.look.hover;
      e.shadow.position.set(x, y + e.look.hover);
    }
  }
}
