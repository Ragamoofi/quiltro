import { Sprite, Texture } from 'pixi.js';
import { outlined, type Frame } from '../art/types.ts';
import { textRows, wrapText } from '../art/font.ts';
import { colorOf } from '../art/palette.ts';

export interface TextStyle {
  /** Palette char of the letters. */
  color?: string;
  /** Palette char of the outline, or null for none. */
  outline?: string | null;
  /** Wrap at this many px (before outline). */
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  /** Extra px between lines. */
  lineGap?: number;
  /** Drop the accent rows when a single line has none. */
  compact?: boolean;
}

/** Lays out text (with wrapping) as one palette frame. */
export function textFrame(text: string, style: TextStyle = {}): Frame {
  const color = style.color ?? 'w';
  const lines = style.maxWidth ? wrapText(text, style.maxWidth) : text.split('\n');
  const compact = style.compact ?? lines.length === 1;
  const rendered = lines.map((l) => textRows(l, color, compact));
  const width = Math.max(1, ...rendered.map((r) => r[0]?.length ?? 0));
  const gap = style.lineGap ?? 1;
  const rows: string[] = [];
  rendered.forEach((r, i) => {
    const w = r[0]?.length ?? 0;
    const pad = width - w;
    const left = style.align === 'center' ? Math.floor(pad / 2) : style.align === 'right' ? pad : 0;
    for (const row of r) rows.push('.'.repeat(left) + row + '.'.repeat(pad - left));
    if (i < rendered.length - 1) for (let g = 0; g < gap; g++) rows.push('.'.repeat(width));
  });
  const outline = style.outline === undefined ? 'k' : style.outline;
  return outline ? outlined(rows, outline) : rows;
}

/** Texture for a palette frame (pixel-exact, nearest). */
export function frameTexture(frame: Frame): Texture {
  const h = frame.length;
  const w = frame[0]?.length ?? 0;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) return Texture.EMPTY;
  frame.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = colorOf(row[x] ?? '.');
      if (!c) continue;
      ctx.fillStyle = c.hex;
      ctx.fillRect(x, y, 1, 1);
    }
  });
  const tex = Texture.from(canvas);
  tex.source.scaleMode = 'nearest';
  return tex;
}

/** A new texture for a text in a style (the caller owns it). */
export function textTexture(text: string, style: TextStyle = {}): Texture {
  return frameTexture(textFrame(text, style));
}

/**
 * A sprite showing pixel text; set `.text` to change it. Scale only by
 * integers. Each instance owns its texture and frees it when the text changes
 * or the sprite is destroyed.
 */
export class PixelText extends Sprite {
  private current = '';
  private readonly style: TextStyle;

  constructor(text: string, style: TextStyle = {}, scale = 1) {
    super(textTexture(text, style));
    this.style = style;
    this.current = text;
    this.scale.set(scale);
  }

  get text(): string {
    return this.current;
  }

  set text(v: string) {
    if (v === this.current) return;
    this.current = v;
    const old = this.texture;
    this.texture = textTexture(v, this.style);
    old.destroy(true);
  }

  override destroy(options?: Parameters<Sprite['destroy']>[0]): void {
    const tex = this.texture;
    super.destroy(options);
    if (!tex.destroyed) tex.destroy(true);
  }
}
