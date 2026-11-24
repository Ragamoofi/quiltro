import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../art/assets.ts';
import { ICON_IDS } from '../art/sprites/iconos.ts';
import { CAJA } from '../data/balance.ts';
import type { Offer } from '../game/build.ts';
import { t } from '../i18n/index.ts';
import { describe } from './cardText.ts';
import { PixelText } from './text.ts';
import { ditherOverlay, panel } from './widgets.ts';

/**
 * Caja del Almacén: the box shakes, a roulette of icons spins for 2.5 s and
 * slows down, then the rewards (1, 3 or 5 upgrades) are shown. Tap to go on.
 */
export class CajaView {
  readonly root = new Container();
  private age = 0;
  private rewards: Offer[] = [];
  private box: Sprite | null = null;
  private wheel: Sprite | null = null;
  private lastIcon = -1;
  private revealed = false;
  private viewW = 480;
  private viewH = 270;
  private onTick: () => void = () => {};
  private onReveal: () => void = () => {};
  done = false;

  get open(): boolean {
    return this.root.visible && !this.done;
  }

  show(rewards: Offer[], golden: boolean, viewW: number, viewH: number, onTick: () => void, onReveal: () => void): void {
    this.viewW = viewW;
    this.viewH = viewH;
    this.rewards = rewards;
    this.onTick = onTick;
    this.onReveal = onReveal;
    this.age = 0;
    this.revealed = false;
    this.done = false;
    this.lastIcon = -1;
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.root.visible = true;
    const overlay = ditherOverlay(viewW, viewH);
    overlay.on('pointertap', () => this.tap());
    this.root.addChild(overlay);
    const title = new PixelText(t('ui.cajaTitulo'), { color: golden ? 'a' : 'w', outline: 'k' }, 2);
    title.position.set(Math.round((viewW - title.width) / 2), 16);
    this.box = new Sprite(anim('caja', golden ? 'dorada' : 'normal').textures[0]);
    this.box.anchor.set(0.5);
    this.box.scale.set(3);
    this.wheel = new Sprite();
    this.wheel.anchor.set(0.5);
    this.wheel.scale.set(2);
    this.root.addChild(title, this.box, this.wheel);
  }

  /** Skip the spin, or close once the rewards are visible. */
  tap(): void {
    if (!this.root.visible) return;
    if (!this.revealed) {
      this.age = CAJA.spinSeconds;
      return;
    }
    if (this.age > CAJA.spinSeconds + 0.4) {
      this.done = true;
      this.root.visible = false;
    }
  }

  update(dt: number): void {
    if (!this.root.visible || !this.box || !this.wheel) return;
    this.age += dt;
    const cx = Math.round(this.viewW / 2);
    const cy = Math.round(this.viewH / 2);
    if (this.age < CAJA.spinSeconds) {
      // Shake the box, spin the icons slower and slower.
      const shake = Math.round(Math.sin(this.age * 60) * 2);
      this.box.position.set(cx + shake, cy + 30);
      const k = this.age / CAJA.spinSeconds;
      const idx = Math.floor((this.age * 18) * (1 - k * 0.7));
      if (idx !== this.lastIcon) {
        this.lastIcon = idx;
        const id = ICON_IDS[idx % ICON_IDS.length] ?? 'guau';
        this.wheel.texture = anim('icono', id).textures[0] ?? this.wheel.texture;
        this.onTick();
      }
      this.wheel.position.set(cx, cy - 16);
      return;
    }
    if (!this.revealed) {
      this.revealed = true;
      this.wheel.visible = false;
      this.box.texture = anim('caja', 'abierta').textures[0] ?? this.box.texture;
      this.box.position.set(cx, cy + 50);
      this.onReveal();
      const head = new PixelText(
        this.rewards.length === 1 ? t('ui.cajaUna') : t('ui.cajaMejoras', { n: this.rewards.length }),
        { color: 'a', outline: 'k' },
      );
      head.position.set(Math.round((this.viewW - head.width) / 2), 40);
      this.root.addChild(head);
      const rowH = 20;
      const top = Math.max(54, cy - (this.rewards.length * rowH) / 2 - 10);
      const back = new Graphics();
      const bw = Math.min(this.viewW - 20, 220);
      panel(back, Math.round((this.viewW - bw) / 2), top - 6, bw, this.rewards.length * rowH + 10, 'K', 'k', 'g', 'k');
      this.root.addChild(back);
      this.rewards.forEach((r, i) => {
        const d = describe(r);
        const icon = new Sprite(anim('icono', d.icon).textures[0]);
        const label = new PixelText(`${d.title} · ${d.level}`, { color: 'w', outline: 'k' });
        const rowW = 18 + label.width;
        const x = Math.round((this.viewW - rowW) / 2);
        icon.position.set(x, top + i * rowH);
        label.position.set(x + 20, top + i * rowH + 4);
        this.root.addChild(icon, label);
      });
      const cont = new PixelText(t('ui.tocaParaSeguir'), { color: 'G', outline: 'k' });
      cont.position.set(Math.round((this.viewW - cont.width) / 2), this.viewH - 16);
      this.root.addChild(cont);
    }
  }
}
