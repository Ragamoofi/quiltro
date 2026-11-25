import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../../art/assets.ts';
import { px } from '../../data/balance.ts';
import { deriveSeed, Rng } from '../../core/rng.ts';
import { t } from '../../i18n/index.ts';
import { PixelText } from '../../ui/text.ts';
import { C } from '../../ui/widgets.ts';
import type { BaseMods } from '../build.ts';
import type { RunContext } from '../context.ts';

/**
 * Fase 11.10 — animitas as shrines (like Megabonk's): little roadside shrines that appear around
 * the dog. Each shows the blessing it gives before you touch it; stand inside its circle until the
 * ring fills and the bonus stays for the rest of the trip. Leaving the circle empties it slowly.
 */
export const SHRINE = {
  /** First one, then one every so often (never two too close in time). */
  first: 25,
  every: 40,
  maxAlive: 2,
  /** Radius of the prayer circle in GDD px, and the seconds you must stay. */
  radius: 64,
  seconds: 4,
  /** Further than this from the dog and an unused shrine is forgotten. */
  forget: 900,
} as const;

export interface Blessing {
  id: string;
  /** What it adds to the run's base bonuses. */
  apply: Partial<Record<keyof BaseMods, number>>;
}

/** The blessings an animita can give; each adds up if you find it again. */
export const BLESSINGS: readonly Blessing[] = [
  { id: 'dano', apply: { damageMult: 0.08 } },
  { id: 'vida', apply: { maxHp: 15 } },
  { id: 'velocidad', apply: { speedMult: 0.06 } },
  { id: 'area', apply: { areaMult: 0.08 } },
  { id: 'espera', apply: { cooldownMult: -0.06 } },
  { id: 'critico', apply: { critChance: 0.04 } },
  { id: 'iman', apply: { pickupMult: 0.2 } },
  { id: 'armadura', apply: { armor: 1 } },
  { id: 'exp', apply: { xpMult: 0.1 } },
];

interface Shrine {
  x: number;
  y: number;
  blessing: Blessing;
  charge: number;
  used: number;
  sprite: Sprite;
  label: PixelText;
}

export class Shrines {
  /** The prayer circles, on the floor (under the shadows). */
  readonly ground = new Graphics();
  private readonly world: Container;
  private readonly rng: Rng;
  private list: Shrine[] = [];
  private next: number = SHRINE.first;
  private time = 0;
  /** How many blessings were taken this trip. */
  taken = 0;

  constructor(seed: number, world: Container) {
    this.world = world;
    this.rng = new Rng(deriveSeed(seed, 5));
  }

  update(dt: number, ctx: RunContext, bossActive: boolean): void {
    this.time += dt;
    const p = ctx.player;
    if (ctx.time >= this.next && !bossActive && !p.dead) {
      this.next = ctx.time + SHRINE.every;
      if (this.list.filter((s) => s.used === 0).length < SHRINE.maxAlive) this.place(ctx);
    }
    const r = px(SHRINE.radius);
    for (const s of this.list) {
      if (s.used > 0) {
        s.used += dt;
        s.sprite.alpha = Math.max(0, 1 - (s.used - 1.5) / 1.5);
        s.label.alpha = s.sprite.alpha;
        continue;
      }
      const inside = !p.dead && Math.hypot(p.x - s.x, p.y - s.y) < r;
      s.charge = Math.max(0, Math.min(1, s.charge + (inside ? dt / SHRINE.seconds : -dt / (SHRINE.seconds * 2))));
      if (inside && Math.floor(this.time * 6) !== Math.floor((this.time - dt) * 6)) {
        ctx.particles.burst(this.rng, s.x + this.rng.range(-6, 6), s.y - 12, 1, ['y', 'a'], 20, 0.5);
      }
      if (s.charge >= 1) this.bless(ctx, s);
    }
    // Forget faded ones and the ones left far behind.
    this.list = this.list.filter((s) => {
      const gone = s.used > 3 || (s.used === 0 && Math.hypot(p.x - s.x, p.y - s.y) > px(SHRINE.forget));
      if (gone) {
        s.sprite.destroy();
        s.label.destroy();
      }
      return !gone;
    });
  }

  render(): void {
    const g = this.ground;
    g.clear();
    const r = px(SHRINE.radius);
    for (const s of this.list) {
      if (s.used > 0) {
        if (s.used < 0.6) g.circle(s.x, s.y, r * (1 + s.used)).stroke({ width: 2, color: C('y'), alpha: 1 - s.used / 0.6 });
        continue;
      }
      // A soft golden floor and a dashed edge so the area always reads, then the filling ring.
      g.ellipse(s.x, s.y, r, r * 0.75).fill({ color: C('y'), alpha: 0.1 + 0.15 * s.charge });
      const dashes = 28;
      for (let i = 0; i < dashes; i += 2) {
        const a0 = (i / dashes) * Math.PI * 2 + this.time * 0.4;
        const a1 = ((i + 1) / dashes) * Math.PI * 2 + this.time * 0.4;
        g.moveTo(s.x + Math.cos(a0) * r, s.y + Math.sin(a0) * r * 0.75)
          .lineTo(s.x + Math.cos(a1) * r, s.y + Math.sin(a1) * r * 0.75)
          .stroke({ width: 1, color: C('a'), alpha: 0.9 });
      }
      if (s.charge > 0) {
        const steps = Math.max(2, Math.round(48 * s.charge));
        g.moveTo(s.x, s.y - r * 0.75);
        for (let i = 1; i <= steps; i++) {
          const a = -Math.PI / 2 + (i / steps) * s.charge * Math.PI * 2;
          g.lineTo(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r * 0.75);
        }
        g.stroke({ width: 3, color: C('y') });
      }
    }
  }

  private place(ctx: RunContext): void {
    const p = ctx.player;
    const a = this.rng.range(0, Math.PI * 2);
    const d = px(this.rng.range(170, 260));
    const x = Math.round(p.x + Math.cos(a) * d);
    const y = Math.round(p.y + Math.sin(a) * d * 0.7);
    const blessing = this.rng.pick([...BLESSINGS]);
    const sprite = new Sprite(anim('animita', 'quieto').textures[0]);
    sprite.anchor.set(0.5, 1);
    sprite.position.set(x, y);
    sprite.zIndex = y;
    const label = new PixelText(t(`animitas.${blessing.id}`), { color: 'a', outline: 'k' });
    label.position.set(x - Math.round(label.width / 2), y - 30);
    label.zIndex = 1e7;
    this.world.addChild(sprite, label);
    this.list.push({ x, y, blessing, charge: 0, used: 0, sprite, label });
    ctx.banner(t('animitas.aparece'), 'a', t(`animitas.${blessing.id}`));
  }

  private bless(ctx: RunContext, s: Shrine): void {
    s.used = 0.0001;
    s.charge = 1;
    this.taken++;
    const base = ctx.build.base as unknown as Record<string, number>;
    for (const [k, v] of Object.entries(s.blessing.apply)) base[k] = (base[k] ?? 0) + (v ?? 0);
    const hpBefore = ctx.player.maxHp;
    ctx.refreshMods();
    // More life comes already filled.
    if (ctx.player.maxHp > hpBefore) ctx.player.heal(ctx.player.maxHp - hpBefore, ctx);
    ctx.particles.burst(this.rng, s.x, s.y - 10, 18, ['y', 'a', 'W'], 90, 0.6);
    ctx.sfx.play('cargaLista', { pitch: 1.3 });
    ctx.sfx.play('campana', { pitch: 1.2, gain: 0.6 });
    ctx.banner(t('animitas.bendicion'), 'a', t(`animitas.${s.blessing.id}`));
    s.label.text = t('animitas.lista');
    s.label.x = s.x - Math.round(s.label.width / 2);
  }
}
