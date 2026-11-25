import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../art/assets.ts';
import { LEVEL_UP } from '../data/balance.ts';
import type { Offer, Rarity } from '../game/build.ts';
import { t } from '../i18n/index.ts';
import { describe } from './cardText.ts';
import { PixelText } from './text.ts';
import { Button, C, ditherOverlay, panel } from './widgets.ts';

const RARITY_BORDER: Record<Rarity, string> = { comun: 'g', rara: 'b', epica: 'K', legendaria: 'a' };
const RARITY_TEXT: Record<Rarity, string> = { comun: 'g', rara: 'b', epica: 'K', legendaria: 'A' };

export interface LevelUpHandlers {
  pick(index: number): void;
  reroll(): void;
  banish(index: number): void;
  skip(): void;
}

interface CardView {
  root: Container;
  baseY: number;
  hover: boolean;
}

/**
 * The level-up screen: 3 (or 4) playing cards that rise from the bottom with
 * a small bounce, 80 ms apart. Pick with tap/click or keys 1-4; nothing can be
 * picked during the first 0.4 s. Buttons: Otra mano, Ni ahí, Paso.
 */
export class LevelUpView {
  readonly root = new Container();
  private cards: CardView[] = [];
  private age = 0;
  private banishMode = false;
  private readonly handlers: LevelUpHandlers;
  private viewW = 480;
  private viewH = 270;
  private hint: PixelText | null = null;
  private selected = -1;
  private glowFirst = false;
  private readonly glow = new Graphics();

  constructor(handlers: LevelUpHandlers) {
    this.handlers = handlers;
  }

  get open(): boolean {
    return this.root.visible && this.root.children.length > 0;
  }

  get canPick(): boolean {
    return this.age >= LEVEL_UP.pickLockSeconds;
  }

  show(
    offers: readonly Offer[],
    level: number,
    rerolls: number,
    banishes: number,
    viewW: number,
    viewH: number,
    fresh = true,
    stamps: readonly boolean[] = [],
    glowFirst = false,
  ): void {
    this.viewW = viewW;
    this.viewH = viewH;
    this.glowFirst = glowFirst;
    if (fresh) this.selected = -1;
    this.root.removeChildren().forEach((c) => c !== this.glow && c.destroy({ children: true }));
    this.root.visible = true;
    if (fresh) this.age = 0;
    this.banishMode = false;
    this.root.addChild(ditherOverlay(viewW, viewH));

    const portrait = viewH > viewW;
    const title = new PixelText(`${t('ui.nivel')} ${level}`, { color: 'a', outline: 'k' }, 2);
    title.position.set(Math.round((viewW - title.width) / 2), portrait ? 24 : 6);
    this.root.addChild(title);

    const n = offers.length;
    const cw = portrait ? viewW - 30 : Math.min(118, Math.floor((viewW - 20 - (n - 1) * 8) / n));
    const ch = portrait ? 64 : 140;
    const gap = 8;
    this.cards = offers.map((offer, i) => {
      const root = this.buildCard(offer, i, cw, ch, portrait);
      if (stamps[i]) {
        // "¡Evoluciona!" stamp: this card completes an evolution pair.
        const stamp = new PixelText(t('ui.evoluciona'), { color: 'a', outline: 'k' });
        const sg = new Graphics();
        panel(sg, 0, 0, stamp.width + 6, stamp.height + 4, 'R', 'k', 'r', 'R');
        const box = new Container();
        box.addChild(sg, stamp);
        stamp.position.set(3, 2);
        box.position.set(Math.round((cw - stamp.width - 6) / 2), -6);
        root.addChild(box);
      }
      const x = portrait ? 15 : Math.round((viewW - (n * cw + (n - 1) * gap)) / 2) + i * (cw + gap);
      const y = portrait ? 56 + i * (ch + 6) : Math.round((viewH - 30 - ch) / 2) + 8;
      root.position.set(x, y + viewH);
      this.root.addChild(root);
      const view: CardView = { root, baseY: y, hover: false };
      root.on('pointerover', () => (view.hover = true));
      root.on('pointerout', () => (view.hover = false));
      return view;
    });

    const by = portrait ? 56 + n * (ch + 6) + 10 : viewH - 26;
    const bw = portrait ? 76 : 96;
    const bx = Math.round((viewW - (3 * bw + 2 * 6)) / 2);
    const reroll = new Button(t('ui.otrasManos', { n: rerolls }), bw, 18, () => this.handlers.reroll(), 'b');
    reroll.setEnabled(rerolls > 0);
    const banish = new Button(`${t('ui.niAhi')} (${banishes})`, bw, 18, () => this.toggleBanish(), 'r');
    banish.setEnabled(banishes > 0);
    const skip = new Button(t('ui.pasoLucas', { n: LEVEL_UP.skipLucas }), bw, 18, () => this.handlers.skip(), 'a', 'k');
    reroll.position.set(bx, by);
    banish.position.set(bx + bw + 6, by);
    skip.position.set(bx + 2 * (bw + 6), by);
    this.root.addChild(reroll, banish, skip);
  }

  hide(): void {
    this.root.visible = false;
    this.root.removeChildren().forEach((c) => c !== this.glow && c.destroy({ children: true }));
    this.cards = [];
  }

  /** Arrow keys / d-pad: move the selection between cards. */
  move(dir: number): void {
    if (!this.open || this.cards.length === 0) return;
    this.selected = this.selected < 0 ? 0 : (this.selected + dir + this.cards.length) % this.cards.length;
  }

  /** Enter / A: take the selected card (the first one if none is selected). */
  confirm(): void {
    if (!this.open) return;
    this.pressNumber(Math.max(0, this.selected));
  }

  /** Keyboard 1..4. */
  pressNumber(i: number): void {
    if (!this.open || !this.canPick || i >= this.cards.length) return;
    this.activate(i);
  }

  private activate(i: number): void {
    if (!this.canPick) return;
    if (this.banishMode) this.handlers.banish(i);
    else this.handlers.pick(i);
  }

  private toggleBanish(): void {
    this.banishMode = !this.banishMode;
    this.hint?.destroy();
    this.hint = null;
    if (this.banishMode) {
      this.hint = new PixelText(t('ui.elegirNiAhi'), { color: 'r', outline: 'k' });
      this.hint.position.set(Math.round((this.viewW - this.hint.width) / 2), this.viewH > this.viewW ? 44 : 22);
      this.root.addChild(this.hint);
    }
  }

  private buildCard(offer: Offer, index: number, w: number, h: number, portrait: boolean): Container {
    const text = describe(offer);
    const root = new Container();
    root.eventMode = 'static';
    root.cursor = 'pointer';
    root.on('pointertap', (e) => {
      e.stopPropagation();
      this.activate(index);
    });
    const g = new Graphics();
    const border = RARITY_BORDER[offer.rarity];
    g.rect(1, 2, w, h).fill(C('k'));
    panel(g, 0, 0, w, h, border, 'k', border, border);
    panel(g, 2, 2, w - 4, h - 4, 'w', border === 'a' ? 'A' : 'k', 'W', 'n');
    root.addChild(g);

    const iconTex = anim('icono', text.icon).textures[0];
    const icon = new Sprite(iconTex);
    icon.scale.set(2);
    const rarity = new PixelText(t(`rareza.${offer.rarity}`), { color: RARITY_TEXT[offer.rarity], outline: null });
    const keyHint = new PixelText(String(index + 1), { color: 'g', outline: null });
    const pad = 6;
    if (portrait) {
      icon.position.set(pad, Math.round((h - 32) / 2));
      const tx = pad + 36;
      const tw = w - tx - pad;
      const title = new PixelText(text.title, { color: 'k', outline: null, maxWidth: tw });
      const level = new PixelText(text.level, { color: 'B', outline: null });
      const effect = new PixelText(text.effect, { color: 'K', outline: null, maxWidth: tw });
      title.position.set(tx, 6);
      level.position.set(tx, 6 + title.height + 1);
      effect.position.set(tx, level.y + level.height + 2);
      rarity.position.set(w - rarity.width - pad, 6);
      keyHint.position.set(w - keyHint.width - pad, h - keyHint.height - 4);
      root.addChild(icon, title, level, effect, rarity, keyHint);
    } else {
      const tw = w - 2 * pad;
      rarity.position.set(Math.round((w - rarity.width) / 2), 5);
      icon.position.set(Math.round((w - 32) / 2), 16);
      const title = new PixelText(text.title, { color: 'k', outline: null, maxWidth: tw, align: 'center' });
      title.position.set(Math.round((w - title.width) / 2), 54);
      const level = new PixelText(text.level, { color: 'B', outline: null });
      level.position.set(Math.round((w - level.width) / 2), title.y + title.height + 2);
      const effect = new PixelText(text.effect, { color: 'K', outline: null, maxWidth: tw, align: 'center' });
      effect.position.set(Math.round((w - effect.width) / 2), level.y + level.height + 6);
      root.addChild(rarity, icon, title, level, effect);
      if (text.flavor) {
        const flavor = new PixelText(text.flavor, { color: 'g', outline: null, maxWidth: tw, align: 'center' });
        flavor.position.set(Math.round((w - flavor.width) / 2), h - flavor.height - 14);
        root.addChild(flavor);
      }
      keyHint.position.set(Math.round((w - keyHint.width) / 2), h - keyHint.height - 4);
      root.addChild(keyHint);
    }
    return root;
  }

  /** Real-time animation (the game is paused). */
  update(dt: number): void {
    if (!this.open) return;
    this.age += dt;
    this.cards.forEach((c, i) => {
      const t0 = this.age - i * LEVEL_UP.cardStaggerSeconds;
      const k = Math.max(0, Math.min(1, t0 / 0.28));
      // Ease-out-back: overshoots a little, then settles (the "rebote").
      const s = 1.6;
      const e = 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2;
      const lift = (c.hover || i === this.selected) && this.canPick ? -3 : 0;
      c.root.y = Math.round(c.baseY + (1 - e) * this.viewH + lift);
    });
    if (this.hint) this.hint.visible = Math.floor(this.age * 4) % 2 === 0;

    // Gold frame around the selected card; the first card glows on the very first level-up.
    const g = this.glow;
    g.clear();
    if (!g.parent) this.root.addChild(g);
    const target = this.selected >= 0 ? this.selected : this.glowFirst ? 0 : -1;
    const card = this.cards[target];
    if (card && this.age > 0.3) {
      const b = card.root.getLocalBounds();
      const on = this.selected >= 0 || Math.floor(this.age * 3) % 2 === 0;
      if (on) {
        g.rect(card.root.x + b.x - 3, card.root.y + b.y - 3, b.width + 6, b.height + 6).stroke({ width: 2, color: C('a') });
      }
    }
  }
}
