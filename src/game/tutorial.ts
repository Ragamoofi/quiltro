import { Container, Graphics, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../art/assets.ts';
import { t } from '../i18n/index.ts';
import { PixelText } from '../ui/text.ts';
import { C } from '../ui/widgets.ts';
import type { RunContext } from './context.ts';

type TipId = 'mover' | 'volantines' | 'comida' | 'cartas' | 'guau';

export interface TutorialHooks {
  /** Tips already seen (each one appears only once, ever). */
  seen: readonly string[];
  enabled: boolean;
  touch: boolean;
  markSeen(id: string): void;
  spawnRing(): void;
}

/**
 * First-trip tutorial without text screens (GDD "Tutorial"):
 * 0 s a hand over the keys / joystick — "Muévete" (gone after moving 1 s);
 * 5 s six slow mosquitoes — "Tus volantines atacan solos";
 * first food — "Junta comida para subir de nivel";
 * first level up — a glow on the first card;
 * minute 1 — a big harmless group closes in — "Mantén para dar hilo, suelta
 * para ¡GUAU!" with the button animated, until the dog barks once.
 */
export class Tutorial {
  readonly root = new Container();
  private readonly hooks: TutorialHooks;
  private readonly done = new Set<string>();
  private current: TipId | null = null;
  private left = 0;
  private moved = 0;
  private text: PixelText | null = null;
  private readonly hand: Sprite;
  private readonly handAnim: Anim;
  private readonly keys = new Container();
  private readonly g = new Graphics();
  private time = 0;
  private w = 480;
  private h = 270;
  /** True while the harmless ring of the ¡GUAU! lesson is on. */
  guauLesson = false;

  constructor(hooks: TutorialHooks) {
    this.hooks = hooks;
    for (const id of hooks.seen) this.done.add(id);
    this.handAnim = anim('mano', 'tocar');
    this.hand = new Sprite(this.handAnim.textures[0]);
    this.hand.visible = false;
    this.root.addChild(this.g, this.keys, this.hand);
  }

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
  }

  /** Should the first level-up card glow? */
  get glowFirstCard(): boolean {
    return this.wants('cartas');
  }

  cardsShown(): void {
    if (this.wants('cartas')) this.finish('cartas');
  }

  private wants(id: TipId): boolean {
    return this.hooks.enabled && !this.done.has(id);
  }

  private show(id: TipId, seconds: number): void {
    this.current = id;
    this.left = seconds;
    this.text?.destroy();
    const msg = { mover: 'tutorial.muevete', volantines: 'tutorial.volantines', comida: 'tutorial.comida', cartas: '', guau: 'tutorial.guau' }[id];
    this.text = new PixelText(t(msg), { color: 'w', outline: 'k', maxWidth: Math.floor((this.w - 20) / 2), align: 'center' }, 2);
    this.root.addChild(this.text);
    this.buildKeys(id);
  }

  private finish(id: TipId): void {
    this.done.add(id);
    this.hooks.markSeen(id);
    if (this.current === id) {
      this.current = null;
      this.text?.destroy();
      this.text = null;
      this.keys.removeChildren().forEach((c) => c.destroy());
      this.hand.visible = false;
    }
  }

  /** Keyboard keys or the touch zones to illustrate the tip. */
  private buildKeys(id: TipId): void {
    this.keys.removeChildren().forEach((c) => c.destroy());
    if (this.hooks.touch) return;
    const key = (label: string, x: number, y: number, wide = 1): void => {
      const k = new Sprite(anim('tecla', 'arriba').textures[0]);
      k.scale.set(wide, 1);
      k.position.set(x, y);
      const l = new PixelText(label, { color: 'k', outline: null });
      l.position.set(x + Math.round((13 * wide - l.width) / 2), y + 3);
      this.keys.addChild(k, l);
    };
    if (id === 'mover') {
      key('W', 14, 0);
      key('A', 0, 14);
      key('S', 14, 14);
      key('D', 28, 14);
    } else if (id === 'guau') {
      key('ESPACIO', 0, 0, 4);
    }
  }

  update(dt: number, ctx: RunContext): void {
    this.time += dt;
    const p = ctx.player;
    if (!this.hooks.enabled) return;
    if (this.current === null) {
      if (this.wants('mover') && ctx.time < 20) this.show('mover', 999);
      else if (this.wants('volantines') && ctx.time > 5 && ctx.time < 30) this.show('volantines', 3.5);
      else if (this.wants('comida') && ctx.stats.food > 0) this.show('comida', 3.5);
      else if (this.wants('guau') && ctx.time > 60) {
        this.show('guau', 999);
        this.guauLesson = true;
        this.hooks.spawnRing();
      }
    }
    if (this.current === 'mover') {
      if (Math.hypot(p.vx, p.vy) > 20) this.moved += dt;
      if (this.moved > 1) this.finish('mover');
    } else if (this.current === 'guau') {
      if (p.guauCooldown > 0) {
        this.guauLesson = false;
        this.finish('guau');
      }
    } else if (this.current) {
      this.left -= dt;
      if (this.left <= 0) this.finish(this.current);
    }
  }

  render(): void {
    const g = this.g;
    g.clear();
    if (!this.current) return;
    const y = Math.round(this.h * 0.66);
    if (this.text) this.text.position.set(Math.round((this.w - this.text.width) / 2), y);
    const ty = y + (this.text?.height ?? 14) + 6;
    // Keys centred under the text, the hand pressing them.
    if (this.keys.children.length > 0) {
      this.keys.position.set(Math.round((this.w - this.keys.width) / 2), ty);
    }
    const tex = this.handAnim.textures[frameAt(this.handAnim, this.time)];
    if (tex) this.hand.texture = tex;
    this.hand.visible = this.current === 'mover' || this.current === 'guau';
    if (this.hooks.touch) {
      // Touch: circle on the left half (joystick) or the right half (hold button).
      const cx = this.current === 'guau' ? Math.round(this.w * 0.8) : Math.round(this.w * 0.2);
      const cy = Math.round(this.h * 0.8);
      const pulse = 12 + Math.round(Math.sin(this.time * 5) * 2);
      if (this.hand.visible) g.circle(cx, cy, pulse).stroke({ width: 2, color: C('w') });
      this.hand.position.set(cx + (this.current === 'mover' ? Math.round(Math.sin(this.time * 3) * 8) : 0), cy - 2);
    } else {
      this.hand.position.set(this.keys.x + this.keys.width / 2, ty + 6);
    }
  }
}
