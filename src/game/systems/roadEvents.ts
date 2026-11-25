import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../../art/assets.ts';
import { deriveSeed, Rng } from '../../core/rng.ts';
import { t } from '../../i18n/index.ts';
import { PixelText } from '../../ui/text.ts';
import { C } from '../../ui/widgets.ts';
import type { RunContext } from '../context.ts';

export type EventKind = 'cofre' | 'animita' | 'feriante';

/** Seconds before the first event, between events (min, max) and how long one waits to be used. */
export const EVENT_TIMING = { first: 50, between: [70, 100], stays: 45 } as const;
/** How close the dog must be to use an event, and how long the animita takes (seconds). */
const REACH = { cofre: 18, animita: 34, feriante: 22 } as const;
const PRAYER_SECONDS = 3;
/** Chest price: this share of the experience the current level asks for, growing with every chest opened. */
/** Sopaipillas (the counter under the life bar): a base plus some per level, 35 % more per chest opened. */
export const CHEST_PRICE = { base: 15, perLevel: 4, perOpened: 0.35 } as const;
const BLESSINGS = ['escudo', 'viento', 'abrigo', 'fervor'] as const;
export type Blessing = (typeof BLESSINGS)[number];

/**
 * Price of the next chest in sopaipillas. It used to be paid with the experience of the current
 * level while the sign said sopaipillas, so a dog with 1.270 sopaipillas on the counter was told
 * it was short. Now it is paid from the counter itself.
 */
export function chestPrice(level: number, opened: number): number {
  return Math.round((CHEST_PRICE.base + CHEST_PRICE.perLevel * level) * (1 + CHEST_PRICE.perOpened * opened));
}

interface Active {
  kind: EventKind;
  x: number;
  y: number;
  age: number;
  /** Animita: 0..1 prayer progress. */
  charge: number;
  sprite: Sprite;
  label: PixelText | null;
  /** Throttle for the "not enough" message. */
  nag: number;
}

/**
 * Little things on the road (Fase 11.3), one at a time and never during a boss: a chest that is paid
 * with sopaipillas and opens a Caja del Almacén, an animita that blesses whoever stays with it a
 * moment, and a feriante whose deal brings food — and the whole neighbourhood behind it. They use
 * their own dice, so the road is the same for everybody on the same seed.
 */
export class RoadEvents {
  /** The y-sorted world (the chest, the animita and the stall sort with everything else). */
  readonly root: Container;
  private readonly ring = new Graphics();
  private readonly rng: Rng;
  private readonly onCrowd: (count: number) => void;
  private next: number = EVENT_TIMING.first;
  private active: Active | null = null;
  /** Chests opened in this run (each one costs more). */
  opened = 0;

  constructor(seed: number, onCrowd: (count: number) => void, layer: Container = new Container()) {
    this.root = layer;
    this.rng = new Rng(deriveSeed(seed, 4));
    this.onCrowd = onCrowd;
    this.root.sortableChildren = true;
    // The ring is drawn on the floor, under everything that stands.
    this.ring.zIndex = -1e7;
    this.root.addChild(this.ring);
  }

  get current(): EventKind | null {
    return this.active?.kind ?? null;
  }

  update(dt: number, ctx: RunContext, bossActive: boolean): void {
    const a = this.active;
    if (!a) {
      if (ctx.time >= this.next && !bossActive && !ctx.player.dead) this.spawn(ctx);
      return;
    }
    a.age += dt;
    a.nag -= dt;
    // A boss arrives or the wait is over: the event goes away until the next one.
    if (a.age > EVENT_TIMING.stays || (bossActive && a.age > 1)) {
      this.finish(ctx);
      return;
    }
    const p = ctx.player;
    const dist = Math.hypot(p.x - a.x, p.y - a.y);
    this.ring.clear();
    switch (a.kind) {
      case 'cofre': {
        a.sprite.y = Math.round(a.y + Math.sin(a.age * 3) * 1);
        if (dist < REACH.cofre && !p.dead) {
          const price = chestPrice(ctx.progress.level, this.opened);
          if (ctx.progress.wallet >= price) {
            ctx.progress.wallet -= price;
            this.opened++;
            this.burst(ctx, a, ['a', 'y', 'W']);
            ctx.sfx.play('campana');
            ctx.banner(t('eventos.cofre.abierto'), 'a');
            this.finish(ctx);
            ctx.openCaja(false);
          } else if (a.nag <= 0) {
            a.nag = 4;
            ctx.banner(t('eventos.cofre.faltan', { n: price - ctx.progress.wallet }), 'w', t('eventos.cofre.faltanSub'));
          }
        }
        if (this.active === a && a.label) a.label.text = t('eventos.cofre.precio', { n: chestPrice(ctx.progress.level, this.opened) });
        break;
      }
      case 'animita': {
        const near = dist < REACH.animita && !p.dead;
        a.charge = Math.max(0, Math.min(1, a.charge + (near ? dt / PRAYER_SECONDS : -dt / 6)));
        // The prayer circle: it fills while the dog stays.
        const r = REACH.animita;
        this.ring.circle(a.x, a.y - 4, r).stroke({ width: 1, color: C('K') });
        if (a.charge > 0) this.ring.arc(a.x, a.y - 4, r, -Math.PI / 2, -Math.PI / 2 + a.charge * Math.PI * 2).stroke({ width: 2, color: C('y') });
        if (a.charge >= 1) {
          this.bless(ctx, a);
          this.finish(ctx);
        }
        break;
      }
      case 'feriante': {
        if (dist < REACH.feriante && !p.dead) {
          ctx.food.dropValue(70 + ctx.progress.level * 8, p.x, p.y - 14, ctx, 40);
          ctx.food.drop('mote', p.x + 20, p.y - 12, ctx);
          this.burst(ctx, a, ['y', 'p', 't', 'W']);
          ctx.sfx.play('campana', { pitch: 0.9 });
          ctx.banner(t('eventos.feriante.nombre'), 'r', t('eventos.feriante.trato'));
          this.finish(ctx);
          // "Lleva, lleva…": and then the neighbourhood arrives.
          this.onCrowd(18 + Math.floor(ctx.time / 120));
        }
        break;
      }
    }
  }

  /** Forces an event now (debug and tests). */
  force(ctx: RunContext, kind: EventKind): void {
    if (this.active) this.finish(ctx);
    this.place(ctx, kind);
  }

  private spawn(ctx: RunContext): void {
    // The animitas now live on their own as shrines (systems/shrines.ts); the road keeps the chest and the stall.
    const kind: EventKind = (['cofre', 'animita', 'feriante'] as const)[this.rng.weighted([55, 0, 45])] ?? 'cofre';
    this.place(ctx, kind);
  }

  private place(ctx: RunContext, kind: EventKind): void {
    const p = ctx.player;
    // Close enough to be on screen and to walk to, in a direction the dice choose.
    const ang = this.rng.range(0, Math.PI * 2);
    const dist = this.rng.range(95, 130);
    const x = Math.round(p.x + Math.cos(ang) * dist);
    const y = Math.round(p.y + Math.sin(ang) * dist * 0.6);
    const name = kind === 'cofre' ? 'cofre_ruta' : kind === 'animita' ? 'animita' : 'puesto_toldo';
    const sprite = new Sprite(anim(name, 'quieto').textures[0]);
    sprite.anchor.set(0.5, 1);
    sprite.position.set(x, y);
    sprite.zIndex = y;
    this.root.addChild(sprite);
    let label: PixelText | null = null;
    if (kind === 'cofre') {
      label = new PixelText(t('eventos.cofre.precio', { n: chestPrice(ctx.progress.level, this.opened) }), { color: 'a', outline: 'k' });
      label.position.set(x - Math.round(label.width / 2), y - 30);
      label.zIndex = 1e7;
      this.root.addChild(label);
    }
    this.active = { kind, x, y, age: 0, charge: 0, sprite, label, nag: 0 };
    const text = kind === 'cofre' ? 'eventos.cofre' : kind === 'animita' ? 'eventos.animita' : 'eventos.feriante';
    ctx.banner(t(`${text}.nombre`), 'a', t(`${text}.aviso`));
    ctx.sfx.play('zona', { pitch: 1.4, gain: 0.6 });
  }

  private finish(ctx: RunContext): void {
    const a = this.active;
    if (!a) return;
    a.sprite.destroy();
    a.label?.destroy();
    this.ring.clear();
    this.active = null;
    this.next = ctx.time + this.rng.range(EVENT_TIMING.between[0], EVENT_TIMING.between[1]);
  }

  private bless(ctx: RunContext, a: Active): void {
    const p = ctx.player;
    // Only blessings that do something right now: no healing at full life, no second shield.
    const useful = BLESSINGS.filter((b) => !(b === 'abrigo' && p.hp > p.maxHp * 0.85) && !(b === 'escudo' && p.shield));
    const id = this.rng.pick(useful.length > 0 ? [...useful] : [...BLESSINGS]);
    switch (id) {
      case 'escudo':
        p.shield = true;
        break;
      case 'viento':
        p.hasteT = 30;
        p.hasteAmount = 0.3;
        break;
      case 'abrigo':
        p.heal(Math.round(p.maxHp * 0.4), ctx);
        break;
      case 'fervor':
        ctx.food.dropValue(40 + ctx.progress.level * 6, p.x, p.y - 14, ctx, 40);
        break;
    }
    this.burst(ctx, a, ['y', 'w', 'W']);
    ctx.sfx.play('cargaLista', { pitch: 1.3 });
    ctx.banner(t('eventos.animita.nombre'), 'a', t(`eventos.animita.${id}`));
  }

  /** Sparkles with the events' own dice (the scenery never touches the run's random stream). */
  private burst(ctx: RunContext, a: Active, colors: string[]): void {
    ctx.particles.burst(this.rng, a.x, a.y - 8, 14, colors, 80, 0.5);
  }
}
