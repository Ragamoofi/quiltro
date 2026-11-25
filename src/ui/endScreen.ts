import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../art/assets.ts';
import { formatNumber, t } from '../i18n/index.ts';
import type { RunRewards } from '../meta/progress.ts';
import { PixelText } from './text.ts';
import { Button, C, ditherOverlay, FocusList, panel } from './widgets.ts';

export interface RunSummary {
  victory: boolean;
  km: number;
  city: string;
  seconds: number;
  kills: number;
  level: number;
  lucas: number;
  damageBy: Record<string, number>;
  rewards?: RunRewards & { affordable?: string | null; newCharacterNames?: string[] };
}

const fmtTime = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Fin del viaje: big title ("Se te fue la micro" / "¡De Arica a Punta Arenas!"),
 * km and city (and "¡Llegaste más lejos que nunca!"), stats, damage per weapon
 * as bars, lucas counting up with their breakdown, new characters, "Te
 * alcanza para…", and the buttons ¡Otra, al tiro! (R), La Cucha and, after
 * the final boss, Seguir a La Antártica.
 */
export class EndScreen {
  readonly root = new Container();
  private lucasText: PixelText | null = null;
  private shown = 0;
  private target = 0;
  private age = 0;
  private onCoin: () => void = () => {};
  private content = new Container();
  private glow: Button | null = null;
  readonly focus = new FocusList();
  private glowFocused = false;
  private note: PixelText | null = null;

  show(
    s: RunSummary,
    viewW: number,
    viewH: number,
    onRetry: () => void,
    onCoin: () => void,
    onContinue?: () => void,
    onCucha?: () => void,
    onMenu?: () => void,
    share?: { copy: () => Promise<string>; share: () => Promise<string> },
    dailyLabel?: string,
  ): void {
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.root.visible = true;
    this.onCoin = onCoin;
    this.age = 0;
    this.shown = 0;
    this.target = s.lucas;
    this.glow = null;
    this.note = null;
    this.root.addChild(ditherOverlay(viewW, viewH, 'k', 2));
    this.content = new Container();
    this.root.addChild(this.content);

    const portrait = viewH > viewW;
    const pw = Math.min(viewW - 12, 320);
    const px0 = Math.round((viewW - pw) / 2);
    const g = new Graphics();
    this.content.addChild(g);
    const items: Container[] = [];
    let y = 0;
    const center = (node: Container, gap = 4): void => {
      node.position.set(Math.round((viewW - node.width) / 2), y);
      items.push(node);
      y += node.height + gap;
    };

    center(
      new PixelText(s.victory ? t('ui.victoria') : t('ui.muerte'), {
        color: s.victory ? 'a' : 'r',
        outline: 'k',
        maxWidth: Math.floor((pw - 16) / 2),
        align: 'center',
      }, 2),
      5,
    );
    if (dailyLabel) center(new PixelText(dailyLabel, { color: 'i', outline: 'k' }), 3);
    center(new PixelText(`${formatNumber(s.km)} km · ${t('ui.llegasteA', { lugar: s.city })}`, { color: 'w', outline: 'k' }));
    if (s.rewards?.newRecord) center(new PixelText(t('ui.nuevoRecord'), { color: 'a', outline: 'k' }));
    center(
      new PixelText(`${t('ui.tiempo')} ${fmtTime(s.seconds)}   ${t('ui.enemigos')} ${formatNumber(s.kills)}   ${t('ui.nivel')} ${s.level}`, {
        color: 'G',
        outline: 'k',
      }),
      6,
    );

    // Damage per weapon.
    const entries = Object.entries(s.damageBy).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, portrait ? 6 : 4);
    const max = Math.max(1, ...entries.map(([, v]) => v));
    const barW = pw - 24 - 18 - 44;
    const bars = new Graphics();
    const barTop = y;
    for (const [id, v] of entries) {
      const icon = new Sprite(anim('icono', id).textures[0]);
      icon.position.set(px0 + 12, y);
      items.push(icon);
      const w = Math.max(1, Math.round((barW * v) / max));
      bars.rect(px0 + 31, y + 5, barW + 2, 6).fill(C('k'));
      bars.rect(px0 + 32, y + 6, w, 4).fill(C('a'));
      const num = new PixelText(formatNumber(v), { color: 'w', outline: 'k' });
      num.position.set(px0 + 34 + barW + 2, y + 4);
      items.push(num);
      y += 16;
    }
    void barTop;
    y += 3;

    this.lucasText = new PixelText(`${t('ui.lucasGanadas')}: 0`, { color: 'a', outline: 'k' });
    center(this.lucasText, 2);
    const rw = s.rewards;
    if (rw) {
      const parts = [t('meta.lucasViaje', { n: rw.runLucas })];
      if (rw.zoneBonus > 0) parts.push(t('meta.zonaNueva', { n: rw.zoneBonus }));
      if (rw.achievementLucas > 0) parts.push(t('meta.logrosLucas', { n: rw.achievementLucas }));
      center(new PixelText(parts.join('  ·  '), { color: 'G', outline: 'k' }), 3);
      for (const name of rw.newCharacterNames ?? []) center(new PixelText(t('meta.nuevoPersonaje', { nombre: name }), { color: 's', outline: 'k' }), 3);
      if (rw.affordable) center(new PixelText(t('ui.teAlcanza', { mejora: rw.affordable }), { color: 'V', outline: 'k' }), 3);
    }
    if (onContinue) center(new PixelText(t('zonasExtra.antarticaDesbloqueada'), { color: 'i', outline: 'k' }), 3);
    y += 3;

    // Buttons, two rows: play again / La Cucha / Menú, then share / continue.
    const retry = new Button(`${t('ui.otraAlTiro')} (R)`, 0, 22, onRetry, 'a', 'k');
    const row1: Button[] = [retry];
    if (onCucha) {
      const c = new Button(t('meta.laCucha'), 0, 22, onCucha, 'v', 'w');
      row1.push(c);
      if (rw?.affordable) this.glow = c;
    }
    if (onMenu) row1.push(new Button(t('ui.menu'), 0, 22, onMenu, 'K', 'w'));
    const row2: Button[] = [];
    if (share) {
      const note = new PixelText(' ', { color: 'V', outline: 'k' });
      this.note = note;
      const say = (p: Promise<string>): void => {
        void p.then((msg) => {
          note.text = msg;
          note.x = Math.round((viewW - note.width) / 2);
        });
      };
      row2.push(new Button(t('compartir.copiar'), 0, 18, () => say(share.copy()), 'b', 'w'));
      row2.push(new Button(t('compartir.compartir'), 0, 18, () => say(share.share()), 'b', 'w'));
    }
    if (onContinue) row2.push(new Button(t('zonasExtra.seguirAntartica'), 0, 18, onContinue, 'a', 'k'));
    this.focus.set([...row1, ...row2]);
    const gap = 6;
    for (const [ri, row] of [row1, row2].entries()) {
      if (row.length === 0) continue;
      const h = ri === 0 ? 22 : 18;
      const bw = Math.floor((pw - 24 - gap * (row.length - 1)) / row.length);
      row.forEach((b, i) => {
        b.resize(bw, h);
        b.position.set(px0 + 12 + i * (bw + gap), y);
        items.push(b);
      });
      y += h + 5;
    }
    if (this.note) {
      this.note.position.set(Math.round(viewW / 2), y);
      items.push(this.note);
      y += 10;
    }
    y += 0;

    // Center the whole block vertically inside a panel.
    const ph = y + 16;
    const offY = Math.max(4, Math.round((viewH - ph) / 2));
    panel(g, px0, offY, pw, ph, 'K', 'k', 'g', 'k');
    bars.position.set(0, offY + 8);
    this.content.addChild(bars);
    for (const it of items) {
      it.y += offY + 8;
      this.content.addChild(it);
    }
  }

  hide(): void {
    this.root.visible = false;
  }

  update(dt: number): void {
    if (!this.root.visible) return;
    this.age += dt;
    const k = Math.min(1, this.age / 0.25);
    this.content.y = Math.round((1 - k) ** 2 * 40);
    if (this.age > 0.5 && this.shown < this.target && this.lucasText) {
      const step = Math.max(1, Math.ceil(this.target / 40));
      this.shown = Math.min(this.target, this.shown + step);
      this.lucasText.text = `${t('ui.lucasGanadas')}: ${formatNumber(this.shown)}`;
      this.onCoin();
    }
    // The Cucha button pulses when the lucas buy something (unless it has the keyboard focus).
    if (this.glow && !this.glowFocused) this.glow.highlight = Math.floor(this.age * 3) % 2 === 0;
  }
}
