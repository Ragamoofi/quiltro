import { Container } from 'pixi.js';
import { PixelText } from './text.ts';

const LIFE = 1.8;

/**
 * Big centred banner ("¡Wena!", "¡Te rodearon!", the Temblor line): drops in
 * with a bounce, holds, then blinks out. Text drawn at ×2.
 */
export class Banner {
  readonly root = new Container();
  private text: PixelText | null = null;
  private life = 0;
  private viewW = 480;
  private viewH = 270;

  resize(w: number, h: number): void {
    this.viewW = w;
    this.viewH = h;
  }

  show(message: string, color = 'w', scale = 2): void {
    this.text?.destroy();
    const maxWidth = Math.floor((this.viewW - 24) / scale);
    this.text = new PixelText(message, { color, outline: 'k', maxWidth, align: 'center' }, scale);
    this.root.addChild(this.text);
    this.life = LIFE;
  }

  /** Real seconds (banners keep moving during slow motion). */
  update(dt: number): void {
    if (!this.text) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.text.destroy();
      this.text = null;
      return;
    }
    const age = LIFE - this.life;
    const drop = age < 0.12 ? -12 + age * 100 : age < 0.2 ? 2 : 0;
    this.text.position.set(
      Math.round((this.viewW - this.text.width) / 2),
      Math.round(this.viewH * 0.22 + drop),
    );
    this.text.visible = this.life > 0.35 || Math.floor(this.life * 20) % 2 === 0;
  }
}
