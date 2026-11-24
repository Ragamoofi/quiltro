import { Container } from 'pixi.js';
import { PixelText } from './text.ts';

const LIFE = 2.2;

/**
 * Big centred banner ("¡Wena!", "¡Te rodearon!", zone and boss names): drops
 * in with a bounce, holds, then blinks out. Title at ×2, optional subtitle at ×1.
 */
export class Banner {
  readonly root = new Container();
  private text: PixelText | null = null;
  private sub: PixelText | null = null;
  private life = 0;
  private viewW = 480;
  private viewH = 270;

  resize(w: number, h: number): void {
    this.viewW = w;
    this.viewH = h;
  }

  show(message: string, color = 'w', subtitle?: string, scale = 2): void {
    this.text?.destroy();
    this.sub?.destroy();
    this.sub = null;
    const maxWidth = Math.floor((this.viewW - 24) / scale);
    this.text = new PixelText(message, { color, outline: 'k', maxWidth, align: 'center' }, scale);
    this.root.addChild(this.text);
    if (subtitle) {
      this.sub = new PixelText(subtitle, { color: 'w', outline: 'k', maxWidth: this.viewW - 40, align: 'center' });
      this.root.addChild(this.sub);
    }
    this.life = subtitle ? LIFE + 0.8 : LIFE;
  }

  /** Real seconds (banners keep moving during slow motion). */
  update(dt: number): void {
    if (!this.text) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.text.destroy();
      this.sub?.destroy();
      this.text = null;
      this.sub = null;
      return;
    }
    const age = (this.sub ? LIFE + 0.8 : LIFE) - this.life;
    const drop = age < 0.12 ? -12 + age * 100 : age < 0.2 ? 2 : 0;
    const y = Math.round(this.viewH * 0.2 + drop);
    this.text.position.set(Math.round((this.viewW - this.text.width) / 2), y);
    const visible = this.life > 0.35 || Math.floor(this.life * 20) % 2 === 0;
    this.text.visible = visible;
    if (this.sub) {
      this.sub.position.set(Math.round((this.viewW - this.sub.width) / 2), y + this.text.height + 3);
      this.sub.visible = visible && age > 0.25;
    }
  }
}
