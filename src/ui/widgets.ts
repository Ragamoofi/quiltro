import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { colorOf, hexToNumber } from '../art/palette.ts';
import { PixelText } from './text.ts';

export const C = (ch: string): number => hexToNumber(colorOf(ch)?.hex ?? '#FFFFFF');

/** Pixel panel: ink border, fill, 1 px light on top and shade at the bottom. */
export function panel(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  fill = 'w',
  border = 'k',
  light = 'W',
  shade = 'n',
): Graphics {
  g.rect(x, y, w, h).fill(C(border));
  g.rect(x + 1, y + 1, w - 2, h - 2).fill(C(fill));
  g.rect(x + 2, y + 1, w - 4, 1).fill(C(light));
  g.rect(x + 1, y + h - 2, w - 2, 1).fill(C(shade));
  // Rounded corners: knock out the 4 corner pixels.
  return g;
}

/** Ordered-dither darkening for overlays (stays inside the palette, no alpha). */
export function ditherOverlay(w: number, h: number, ch = 'k', density: 1 | 2 = 2): Sprite {
  // A flat translucent veil (it used to be a 1-pixel checkerboard, which looked like static).
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.globalAlpha = density === 2 ? 0.62 : 0.35;
    ctx.fillStyle = colorOf(ch)?.hex ?? '#2A2233';
    ctx.fillRect(0, 0, w, h);
  }
  const tex = Texture.from(canvas);
  tex.source.scaleMode = 'nearest';
  const s = new Sprite(tex);
  s.eventMode = 'static';
  return s;
}

/**
 * Sticker-style button with hover and pressed states (GDD: no button without a
 * pressed state). Calls `onPress` on pointer tap.
 */
export class Button extends Container {
  private readonly bg = new Graphics();
  private readonly caption: PixelText;
  private w: number;
  private h: number;
  private glow = false;
  private readonly onPress: () => void;

  /** Keyboard / gamepad activation (same as a tap). */
  activate(): void {
    if (this.enabled) this.onPress();
  }
  private readonly fill: string;
  private pressed = false;
  private hover = false;
  enabled = true;

  constructor(text: string, w: number, h: number, onPress: () => void, fill = 'b', textColor = 'w') {
    super();
    this.w = w;
    this.h = h;
    this.fill = fill;
    this.onPress = onPress;
    this.caption = new PixelText(text, { color: textColor, outline: 'k' });
    this.addChild(this.bg, this.caption);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', (e) => {
      e.stopPropagation();
      this.pressed = true;
      this.draw();
    });
    this.on('pointerup', () => {
      this.pressed = false;
      this.draw();
    });
    this.on('pointerupoutside', () => {
      this.pressed = false;
      this.draw();
    });
    this.on('pointerover', () => {
      this.hover = true;
      this.draw();
    });
    this.on('pointerout', () => {
      this.hover = false;
      this.pressed = false;
      this.draw();
    });
    this.on('pointertap', (e) => {
      e.stopPropagation();
      if (this.enabled) onPress();
    });
    this.draw();
  }

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.draw();
  }

  /** Gold border that the caller can blink to draw attention. */
  set highlight(v: boolean) {
    if (v === this.glow) return;
    this.glow = v;
    this.draw();
  }

  setText(text: string): void {
    this.caption.text = text;
    this.draw();
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    this.cursor = v ? 'pointer' : 'default';
    this.draw();
  }

  private draw(): void {
    if (this.destroyed) return;
    const g = this.bg;
    g.clear();
    const down = this.pressed && this.enabled ? 1 : 0;
    // Drop shadow that disappears when pressed.
    if (!down) g.rect(1, 2, this.w, this.h).fill(C('k'));
    const fill = !this.enabled ? 'g' : this.hover ? lighter(this.fill) : this.fill;
    panel(g, 0, down, this.w, this.h, fill, this.glow ? 'a' : 'k', 'W', darker(fill));
    this.caption.position.set(
      Math.floor((this.w - this.caption.width) / 2),
      Math.floor((this.h - this.caption.height) / 2) + down,
    );
  }
}

/**
 * Keyboard / gamepad navigation over a list of buttons: arrows move a gold
 * focus border, Enter / A presses. Touch and mouse keep working as usual.
 */
export class FocusList {
  private items: Button[] = [];
  private index = 0;

  set(items: Button[], keepIndex = false): void {
    // Screens that rebuild themselves destroy their old buttons first: skip those.
    this.items.forEach((b) => {
      if (!b.destroyed) b.highlight = false;
    });
    this.items = items;
    if (!keepIndex) this.index = Math.max(0, items.findIndex((b) => b.enabled));
    this.index = Math.min(this.index, items.length - 1);
    this.show();
  }

  move(dir: number): void {
    if (this.items.length === 0) return;
    for (let i = 0; i < this.items.length; i++) {
      this.index = (this.index + dir + this.items.length) % this.items.length;
      if (this.items[this.index]?.enabled) break;
    }
    this.show();
  }

  press(): void {
    this.items[this.index]?.activate();
  }

  private show(): void {
    this.items.forEach((b, i) => (b.highlight = i === this.index));
  }
}

function lighter(ch: string): string {
  return ({ b: 's', r: 'p', a: 'y', v: 'V', w: 'W', K: 'g', f: 'v' } as Record<string, string>)[ch] ?? ch;
}

function darker(ch: string): string {
  return ({ b: 'B', s: 'b', r: 'R', p: 'r', a: 'A', y: 'a', v: 'f', V: 'v', w: 'n', W: 'w', g: 'K', K: 'k', f: 'F' } as Record<
    string,
    string
  >)[ch] ?? 'k';
}
