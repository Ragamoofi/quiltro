import { Container, Sprite, Texture } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { colorOf } from '../../art/palette.ts';
import { px } from '../../data/balance.ts';
import { ENEMIGOS } from '../../data/enemigos.ts';
import type { RunContext } from '../context.ts';
import { inSegment } from '../systems/telegraphs.ts';

type HazardId = 'remolinos' | 'microQueNoPara' | 'neblina' | 'viento' | 'rotativo';

interface Devil {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  sprite: Sprite;
}

interface Bus {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
  sprite: Sprite;
  hitDog: boolean;
}

const MICRO = ENEMIGOS.find((e) => e.id === 'micro');

/**
 * Each zone's environmental hazard (GDD "Zonas"):
 * Norte, dust devils that push · Centro, the bus that never stops crossing in
 * a straight line · Sur, chilote fog that hides the edges · Patagonia, wind
 * that pushes the dog, the enemies and the projectiles · Antártica, all of
 * them in turn.
 */
export class Hazards {
  readonly world = new Container();
  readonly screen = new Container();
  private kind: HazardId = 'remolinos';
  private active: Exclude<HazardId, 'rotativo'> = 'remolinos';
  private timer = 6;
  private rotate = 30;
  private devils: Devil[] = [];
  private buses: Bus[] = [];
  private readonly devilAnim: Anim;
  private readonly busAnim: Anim;
  private readonly fog = new Sprite();
  private readonly halfFog = new Sprite();
  private windTarget = { x: 0, y: 0 };
  private windTimer = 0;
  private time = 0;
  private viewW = 480;
  private viewH = 270;
  /** Caleuche phase 2: fog covers half the screen (-1 left, 1 right, 0 none). */
  halfFogSide = 0;

  constructor() {
    this.devilAnim = anim('remolino', 'girar');
    this.busAnim = anim('micro', 'andar');
    this.fog.visible = false;
    this.halfFog.visible = false;
    this.screen.addChild(this.fog, this.halfFog);
  }

  resize(w: number, h: number): void {
    this.viewW = w;
    this.viewH = h;
    this.fog.texture = fogTexture(w * 2, h * 2, 90);
    this.halfFog.texture = fogTexture(Math.ceil(w / 2), h, -1);
  }

  setZone(hazard: string, ctx: RunContext): void {
    this.kind = hazard as HazardId;
    this.active = this.kind === 'rotativo' ? 'remolinos' : this.kind;
    this.timer = 5;
    this.rotate = 30;
    this.clear(ctx);
  }

  clear(ctx: RunContext): void {
    for (const d of this.devils) d.sprite.destroy();
    for (const b of this.buses) b.sprite.destroy();
    this.devils = [];
    this.buses = [];
    ctx.wind.x = ctx.wind.y = 0;
    this.windTarget = { x: 0, y: 0 };
  }

  update(dt: number, ctx: RunContext): void {
    this.time += dt;
    if (this.kind === 'rotativo') {
      this.rotate -= dt;
      if (this.rotate <= 0) {
        this.rotate = 30;
        const order = ['remolinos', 'microQueNoPara', 'neblina', 'viento'] as const;
        this.active = order[(order.indexOf(this.active) + 1) % order.length] ?? 'remolinos';
        ctx.wind.x = ctx.wind.y = 0;
        this.windTarget = { x: 0, y: 0 };
      }
    }
    const p = ctx.player;
    this.timer -= dt;
    switch (this.active) {
      case 'remolinos':
        if (this.timer <= 0) {
          this.timer = ctx.rng.range(7, 11);
          this.spawnDevil(ctx);
        }
        break;
      case 'microQueNoPara':
        if (this.timer <= 0) {
          this.timer = ctx.rng.range(12, 16);
          this.spawnBus(ctx);
        }
        break;
      case 'viento':
        this.windTimer -= dt;
        if (this.windTimer <= 0) {
          this.windTimer = 8;
          const a = ctx.rng.range(0, Math.PI * 2);
          const s = px(70);
          this.windTarget = { x: Math.cos(a) * s, y: Math.sin(a) * s * 0.6 };
        }
        ctx.wind.x += (this.windTarget.x - ctx.wind.x) * (1 - Math.exp(-dt / 1.2));
        ctx.wind.y += (this.windTarget.y - ctx.wind.y) * (1 - Math.exp(-dt / 1.2));
        break;
      default:
        break;
    }

    // Dust devils wander and fling whatever they touch.
    for (const d of this.devils) {
      d.life -= dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      const dx = p.x - d.x;
      const dy = p.y - d.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 22) {
        p.pushX += ((dx / dist) * 60 - (dy / dist) * 140) * dt * 8;
        p.pushY += ((dy / dist) * 60 + (dx / dist) * 140) * dt * 8;
      }
      for (const e of ctx.enemies.list) {
        if (!e.active || e.boss) continue;
        const ex = e.x - d.x;
        const ey = e.y - d.y;
        if (ex * ex + ey * ey < 22 * 22) {
          e.kx += -ey * 8 * dt * 6;
          e.ky += ex * 8 * dt * 6;
        }
      }
    }
    for (const d of this.devils.filter((it) => it.life <= 0)) d.sprite.destroy();
    this.devils = this.devils.filter((d) => d.life > 0);

    // The bus that never stops: runs over everything in its way.
    const busSpeed = px(MICRO?.attackSpeed ?? 420);
    for (const b of this.buses) {
      b.life -= dt;
      if (b.life > 0) continue;
      b.x += b.dx * busSpeed * dt;
      b.y += b.dy * busSpeed * dt;
      if (!b.hitDog && !p.hazardProof && (p.x - b.x) ** 2 + (p.y - 8 - b.y) ** 2 < 16 ** 2) {
        b.hitDog = true;
        p.takeDamage(MICRO?.damage ?? 18, b.x, b.y, ctx);
      }
      for (const e of ctx.enemies.list) {
        if (!e.active || e.boss || e.elite) continue;
        if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < (14 + e.radius) ** 2) ctx.enemies.kill(e, ctx, false, 'micro');
      }
    }
    const gone = (b: Bus): boolean => b.life < -3;
    for (const b of this.buses.filter(gone)) b.sprite.destroy();
    this.buses = this.buses.filter((b) => !gone(b));
  }

  private spawnDevil(ctx: RunContext): void {
    const p = ctx.player;
    const a = ctx.rng.range(0, Math.PI * 2);
    const r = 200;
    const sprite = new Sprite();
    sprite.anchor.set(0.5, 1);
    sprite.scale.set(2);
    this.world.addChild(sprite);
    const sx = p.x + Math.cos(a) * r;
    const sy = p.y + Math.sin(a) * r * 0.7;
    const to = Math.atan2(p.y - sy, p.x - sx) + ctx.rng.range(-0.3, 0.3);
    const s = px(70);
    this.devils.push({ x: sx, y: sy, vx: Math.cos(to) * s, vy: Math.sin(to) * s, life: 8, sprite });
  }

  private spawnBus(ctx: RunContext): void {
    const p = ctx.player;
    // A horizontal or diagonal avenue through the dog's position, announced 0.8 s ahead.
    const angle = ctx.rng.pick([0, Math.PI, 0.35, Math.PI - 0.35, -0.35, Math.PI + 0.35]);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const off = ctx.rng.range(-20, 20);
    const sx = p.x - dx * 320 - dy * off;
    const sy = p.y - 8 - dy * 320 + dx * off;
    const horn = MICRO?.params?.hornTime ?? 0.8;
    ctx.telegraphs.line(sx, sy, sx + dx * 640, sy + dy * 640, 22, horn, null);
    ctx.sfx.play('bocina');
    const sprite = new Sprite();
    sprite.anchor.set(0.5);
    sprite.scale.x = dx >= 0 ? 1 : -1;
    this.world.addChild(sprite);
    this.buses.push({ x: sx, y: sy, dx, dy, life: horn, sprite, hitDog: false });
  }

  /** Is the dog inside a bus lane right now? (used by tests/debug) */
  inLane(x: number, y: number): boolean {
    return this.buses.some((b) => inSegment(x, y, b.x - b.dx * 40, b.y - b.dy * 40, b.x + b.dx * 40, b.y + b.dy * 40, 12));
  }

  render(playerScreenX: number, playerScreenY: number): void {
    for (const d of this.devils) {
      const tex = this.devilAnim.textures[frameAt(this.devilAnim, this.time)];
      if (tex) d.sprite.texture = tex;
      d.sprite.position.set(Math.round(d.x), Math.round(d.y));
      d.sprite.zIndex = Math.round(d.y);
    }
    for (const b of this.buses) {
      const tex = this.busAnim.textures[frameAt(this.busAnim, this.time)];
      if (tex) b.sprite.texture = tex;
      b.sprite.visible = b.life <= 0;
      b.sprite.position.set(Math.round(b.x), Math.round(b.y));
    }
    const foggy = this.active === 'neblina';
    this.fog.visible = foggy;
    if (foggy) this.fog.position.set(Math.round(playerScreenX - this.viewW), Math.round(playerScreenY - this.viewH));
    this.halfFog.visible = this.halfFogSide !== 0;
    this.halfFog.x = this.halfFogSide < 0 ? 0 : Math.floor(this.viewW / 2);
  }

  get current(): string {
    return this.active;
  }
}

/** Dithered fog with a clear hole of `hole` px in the middle (-1 = no hole, uniform). */
function fogTexture(w: number, h: number, hole: number): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Texture.EMPTY;
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  ctx.fillStyle = colorOf('G')?.hex ?? '#B8AEC4';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let density: number;
      if (hole < 0) density = 0.45;
      else {
        const d = Math.hypot(x - w / 2, (y - h / 2) * 1.3);
        density = Math.min(0.62, Math.max(0, (d - hole) / 130));
      }
      if (density > ((bayer[(y % 4) * 4 + (x % 4)] ?? 0) + 0.5) / 16) ctx.fillRect(x, y, 1, 1);
    }
  }
  const t = Texture.from(canvas);
  t.source.scaleMode = 'nearest';
  return t;
}
