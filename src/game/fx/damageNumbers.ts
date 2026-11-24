import { Container, Sprite } from 'pixi.js';
import { anim, type Anim } from '../../art/assets.ts';

interface Num {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  life: number;
  root: Container;
  digits: Sprite[];
}

const MAX_DIGITS = 4;
const ADVANCE = 4;

/**
 * Damage numbers in pixel digits that jump up and fall (GDD juice table).
 * Criticals are gold and drawn at ×2.
 */
export class DamageNumbers {
  readonly root = new Container();
  enabled = true;
  private readonly pool: Num[] = [];
  private next = 0;
  private readonly white: Anim;
  private readonly gold: Anim;
  private readonly red: Anim;
  private readonly green: Anim;

  constructor(size = 96) {
    this.white = anim('digitos', 'blanco');
    this.gold = anim('digitos', 'oro');
    this.red = anim('digitos', 'rojo');
    this.green = anim('digitos', 'verde');
    for (let i = 0; i < size; i++) {
      const root = new Container();
      root.visible = false;
      const digits: Sprite[] = [];
      for (let d = 0; d < MAX_DIGITS; d++) {
        const s = new Sprite();
        root.addChild(s);
        digits.push(s);
      }
      this.root.addChild(root);
      this.pool.push({ active: false, x: 0, y: 0, vy: 0, life: 0, root, digits });
    }
  }

  spawn(x: number, y: number, value: number, style: 'normal' | 'crit' | 'player' | 'heal'): void {
    if (!this.enabled && (style === 'normal' || style === 'crit')) return;
    const n = this.pool[this.next];
    this.next = (this.next + 1) % this.pool.length;
    if (!n) return;
    const text = String(Math.max(1, Math.round(value))).slice(0, MAX_DIGITS);
    const set =
      style === 'crit' ? this.gold : style === 'player' ? this.red : style === 'heal' ? this.green : this.white;
    n.digits.forEach((s, i) => {
      const ch = text[i];
      if (ch === undefined) {
        s.visible = false;
        return;
      }
      const tex = set.textures[Number(ch)];
      if (tex) s.texture = tex;
      s.visible = true;
      s.position.set(i * ADVANCE, 0);
    });
    const scale = style === 'crit' ? 2 : 1;
    n.root.scale.set(scale);
    n.active = true;
    n.x = x - Math.floor((text.length * ADVANCE * scale) / 2);
    n.y = y - 10;
    n.vy = style === 'crit' ? -110 : -80;
    n.life = style === 'crit' ? 0.8 : 0.6;
    n.root.visible = true;
  }

  update(dt: number): void {
    for (const n of this.pool) {
      if (!n.active) continue;
      n.life -= dt;
      if (n.life <= 0) {
        n.active = false;
        n.root.visible = false;
        continue;
      }
      n.vy += 260 * dt;
      n.y += n.vy * dt;
    }
  }

  render(): void {
    for (const n of this.pool) {
      if (n.active) n.root.position.set(Math.round(n.x), Math.round(n.y));
    }
  }
}
