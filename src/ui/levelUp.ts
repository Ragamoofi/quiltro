import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../art/assets.ts';
import { LEVEL_UP } from '../data/balance.ts';
import type { Offer, Rarity } from '../game/build.ts';
import { t } from '../i18n/index.ts';
import { describe, type PillarLine } from './cardText.ts';
import { PixelText } from './text.ts';
import { Button, C, ditherOverlay, panel } from './widgets.ts';

/**
 * Each rarity looks different from across the table (colours stay inside the palette):
 * común = cream with a grey band, rara = pale blue, épica = pink and wine red,
 * legendaria = gold. Épica and legendaria also twinkle (see `update`).
 */
interface RarityStyle {
  /** Outer frame. */
  border: string;
  /** Card body. */
  body: string;
  /** Top highlight and bottom shade of the body. */
  light: string;
  shade: string;
  /** Rarity band at the top and its text colour. */
  band: string;
  bandText: string;
  /** Level line and secondary text colours (readable on `body`). */
  accent: string;
  soft: string;
}

const RARITY_STYLE: Record<Rarity, RarityStyle> = {
  comun: { border: 'g', body: 'w', light: 'W', shade: 'n', band: 'g', bandText: 'W', accent: 'B', soft: 'g' },
  rara: { border: 'B', body: 's', light: 'W', shade: 'b', band: 'b', bandText: 'W', accent: 'B', soft: 'K' },
  epica: { border: 'R', body: 'p', light: 'W', shade: 'r', band: 'R', bandText: 'W', accent: 'R', soft: 'K' },
  legendaria: { border: 'A', body: 'y', light: 'W', shade: 'a', band: 'a', bandText: 'k', accent: 'R', soft: 'K' },
};

/** Band height inside the frame. */
const BAND = 11;

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
  rarity: Rarity;
  w: number;
  h: number;
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
    pillars: readonly (PillarLine | null)[] = [],
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
      const root = this.buildCard(offer, i, cw, ch, portrait, pillars[i] ?? null);
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
      const view: CardView = { root, baseY: y, hover: false, rarity: offer.rarity, w: cw, h: ch };
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

  private buildCard(offer: Offer, index: number, w: number, h: number, portrait: boolean, pillar: PillarLine | null): Container {
    const text = describe(offer);
    const style = RARITY_STYLE[offer.rarity];
    const root = new Container();
    root.eventMode = 'static';
    root.cursor = 'pointer';
    root.on('pointertap', (e) => {
      e.stopPropagation();
      this.activate(index);
    });
    const g = new Graphics();
    g.rect(1, 2, w, h).fill(C('k'));
    panel(g, 0, 0, w, h, style.border, 'k', style.border, style.border);
    panel(g, 2, 2, w - 4, h - 4, style.body, 'k', style.light, style.shade);
    // The rarity band across the top, with its name in it.
    g.rect(3, 3, w - 6, BAND).fill(C(style.band));
    g.rect(3, 3 + BAND, w - 6, 1).fill(C('k'));
    root.addChild(g);

    const iconTex = anim('icono', text.icon).textures[0];
    const icon = new Sprite(iconTex);
    icon.scale.set(2);
    const rarity = new PixelText(t(`rareza.${offer.rarity}`), { color: style.bandText, outline: null });
    rarity.position.set(Math.round((w - rarity.width) / 2), 3 + Math.round((BAND - rarity.height) / 2));
    const keyHint = new PixelText(String(index + 1), { color: style.soft, outline: null });
    const pad = 6;
    const top = 3 + BAND + 2;
    if (portrait) {
      icon.position.set(pad, top + Math.round((h - top - 32) / 2));
      const tx = pad + 36;
      const tw = w - tx - pad;
      const title = new PixelText(text.title, { color: 'k', outline: null, maxWidth: tw });
      const level = new PixelText(text.level, { color: style.accent, outline: null });
      const effect = new PixelText(text.effect, { color: 'K', outline: null, maxWidth: tw });
      title.position.set(tx, top + 2);
      level.position.set(tx, title.y + title.height + 1);
      effect.position.set(tx, level.y + level.height + 2);
      keyHint.position.set(w - keyHint.width - pad, h - keyHint.height - 4);
      root.addChild(icon, title, level, effect, rarity, keyHint);
      if (pillar) root.addChild(this.pillarText(pillar, tx, effect.y + effect.height + 2));
    } else {
      const tw = w - 2 * pad;
      icon.position.set(Math.round((w - 32) / 2), top + 3);
      const title = new PixelText(text.title, { color: 'k', outline: null, maxWidth: tw, align: 'center' });
      title.position.set(Math.round((w - title.width) / 2), top + 40);
      const level = new PixelText(text.level, { color: style.accent, outline: null });
      level.position.set(Math.round((w - level.width) / 2), title.y + title.height + 2);
      const effect = new PixelText(text.effect, { color: 'K', outline: null, maxWidth: tw, align: 'center' });
      effect.position.set(Math.round((w - effect.width) / 2), level.y + level.height + 5);
      root.addChild(rarity, icon, title, level, effect);
      if (pillar) {
        const line = this.pillarText(pillar, 0, effect.y + effect.height + 4);
        line.x = Math.round((w - line.width) / 2);
        root.addChild(line);
      }
      if (text.flavor) {
        const flavor = new PixelText(text.flavor, { color: style.soft, outline: null, maxWidth: tw, align: 'center' });
        flavor.position.set(Math.round((w - flavor.width) / 2), h - flavor.height - 14);
        root.addChild(flavor);
      }
      keyHint.position.set(Math.round((w - keyHint.width) / 2), h - keyHint.height - 4);
      root.addChild(keyHint);
    }
    return root;
  }

  /** "Aguante 2/3", in the pillar's colour on a small ink tag; gold with a star when the card unlocks the bonus. */
  private pillarText(line: PillarLine, x: number, y: number): Container {
    const box = new Container();
    const label = new PixelText(line.unlocks ? `${line.text} !` : line.text, { color: line.unlocks ? 'a' : 'W', outline: null });
    const bg = new Graphics();
    bg.rect(0, 0, label.width + 6, label.height + 4).fill(C('k'));
    bg.rect(1, 1, label.width + 4, label.height + 2).fill(C(line.unlocks ? 'R' : line.color));
    label.position.set(3, 2);
    box.addChild(bg, label);
    box.position.set(x, y);
    return box;
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
    // Épica and legendaria shimmer: a blinking edge and four sparkles walking around the card.
    for (const c of this.cards) {
      if ((c.rarity !== 'epica' && c.rarity !== 'legendaria') || this.age < 0.35) continue;
      const gold = c.rarity === 'legendaria';
      const x0 = c.root.x - 1;
      const y0 = c.root.y - 1;
      const w = c.w + 2;
      const h = c.h + 2;
      const edge = Math.floor(this.age * (gold ? 8 : 4)) % 2 === 0 ? (gold ? 'a' : 'p') : 'W';
      g.rect(x0, y0, w, h).stroke({ width: 1, color: C(edge), alignment: 1 });
      const perimeter = 2 * (w + h);
      for (let k = 0; k < (gold ? 6 : 4); k++) {
        const u = ((this.age * (gold ? 0.5 : 0.3) + k / (gold ? 6 : 4)) % 1) * perimeter;
        let sx: number;
        let sy: number;
        if (u < w) {
          sx = x0 + u;
          sy = y0;
        } else if (u < w + h) {
          sx = x0 + w;
          sy = y0 + (u - w);
        } else if (u < 2 * w + h) {
          sx = x0 + w - (u - w - h);
          sy = y0 + h;
        } else {
          sx = x0;
          sy = y0 + h - (u - 2 * w - h);
        }
        const big = Math.floor(this.age * 6 + k) % 2 === 0;
        const px = Math.round(sx);
        const py = Math.round(sy);
        g.rect(px - 1, py - 1, 3, 3).fill(C('W'));
        if (big) g.rect(px - 2, py, 5, 1).fill(C('W')).rect(px, py - 2, 1, 5).fill(C('W'));
      }
    }
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
