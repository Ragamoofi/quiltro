import { Container, Graphics, Sprite } from 'pixi.js';
import { anim, type Anim } from '../art/assets.ts';
import { colorOf, hexToNumber } from '../art/palette.ts';

const C = (ch: string): number => hexToNumber(colorOf(ch)?.hex ?? '#FFFFFF');
const MAX_DIGITS = 5;

/** A right-aligned row of pixel digits. */
class Counter {
  readonly root = new Container();
  private readonly digits: Sprite[] = [];
  private readonly set: Anim;
  private last = -1;

  constructor(set: Anim) {
    this.set = set;
    for (let i = 0; i < MAX_DIGITS; i++) {
      const s = new Sprite();
      this.root.addChild(s);
      this.digits.push(s);
    }
  }

  /** Draws `value` so its right edge sits at x = 0. */
  set value(v: number) {
    if (v === this.last) return;
    this.last = v;
    const text = String(Math.max(0, Math.floor(v))).slice(-MAX_DIGITS);
    this.digits.forEach((s, i) => {
      const ch = text[text.length - 1 - i];
      s.visible = ch !== undefined;
      if (ch === undefined) return;
      const tex = this.set.textures[Number(ch)];
      if (tex) s.texture = tex;
      s.position.set(-5 - i * 4, 0);
    });
  }
}

/**
 * Phase 1 HUD (the full HUD comes in Phase 5): health bar with the bone icon
 * top-left, kills and food top-right. Small, never over the centre.
 */
export class Hud {
  readonly root = new Container();
  private readonly bar = new Graphics();
  private readonly bone = new Sprite();
  private readonly kills: Counter;
  private readonly food: Counter;
  private readonly foodIcon = new Sprite();
  private readonly killIcon = new Sprite();
  private width = 480;

  constructor() {
    const white = anim('digitos', 'blanco');
    const gold = anim('digitos', 'oro');
    this.kills = new Counter(white);
    this.food = new Counter(gold);
    const boneTex = anim('hueso', 'icono').textures[0];
    if (boneTex) this.bone.texture = boneTex;
    const foodTex = anim('sopaipilla', 'brillo').textures[0];
    if (foodTex) this.foodIcon.texture = foodTex;
    const killTex = anim('zancudo', 'volar').textures[0];
    if (killTex) this.killIcon.texture = killTex;
    this.bone.position.set(4, 5);
    this.root.addChild(this.bar, this.bone, this.kills.root, this.food.root, this.foodIcon, this.killIcon);
  }

  resize(w: number): void {
    this.width = w;
    this.killIcon.position.set(w - 34, 3);
    this.kills.root.position.set(w - 4, 5);
    this.foodIcon.position.set(w - 32, 15);
    this.food.root.position.set(w - 4, 15);
  }

  render(
    hp: number,
    maxHp: number,
    kills: number,
    food: number,
    stick: { ox: number; oy: number; x: number; y: number } | null = null,
  ): void {
    const g = this.bar;
    g.clear();
    // Floating joystick where the thumb landed (touch only).
    if (stick) {
      g.circle(Math.round(stick.ox), Math.round(stick.oy), 16).stroke({ width: 1, color: C('w') });
      g.circle(Math.round(stick.x), Math.round(stick.y), 6).fill(C('w'));
      g.circle(Math.round(stick.x), Math.round(stick.y), 6).stroke({ width: 1, color: C('k') });
    }
    const x = 15;
    const y = 6;
    const w = Math.min(70, Math.floor(this.width * 0.18));
    const fill = Math.max(0, Math.round((w * hp) / maxHp));
    g.rect(x - 1, y - 1, w + 2, 5).fill(C('k'));
    g.rect(x, y, w, 3).fill(C('K'));
    if (fill > 0) {
      g.rect(x, y, fill, 3).fill(C('r'));
      g.rect(x, y, fill, 1).fill(C('p'));
    }
    this.kills.value = kills;
    this.food.value = food;
  }
}
