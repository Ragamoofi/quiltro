import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../art/assets.ts';
import { formatNumber, t } from '../i18n/index.ts';
import type { RunRewards } from '../meta/progress.ts';
import { PixelText } from './text.ts';
import { Button, C, ditherOverlay, panel } from './widgets.ts';

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

  show(
    s: RunSummary,
    viewW: number,
    viewH: number,
    onRetry: () => void,
    onCoin: () => void,
    onContinue?: () => void,
    onCucha?: () => void,
  ): void {
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.root.visible = true;
    this.onCoin = onCoin;
    this.age = 0;
    this.shown = 0;
    this.target = s.lucas;
    this.glow = null;
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

    // Buttons.
    const buttons: Button[] = [];
    const retry = new Button(`${t('ui.otraAlTiro')} (R)`, 0, 22, onRetry, 'a', 'k');
    buttons.push(retry);
    if (onCucha) {
      const c = new Button(t('meta.laCucha'), 0, 22, onCucha, 'v', 'w');
      buttons.push(c);
      if (rw?.affordable) this.glow = c;
    }
    if (onContinue) buttons.push(new Button(t('zonasExtra.seguirAntartica'), 0, 22, onContinue, 'b', 'w'));
    const gap = 6;
    const bw = Math.floor((pw - 24 - gap * (buttons.length - 1)) / buttons.length);
    buttons.forEach((b, i) => {
      b.resize(bw, 22);
      b.position.set(px0 + 12 + i * (bw + gap), y);
      items.push(b);
    });
    y += 22;

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
    // The Cucha button pulses when the lucas buy something.
    if (this.glow) this.glow.highlight = Math.floor(this.age * 3) % 2 === 0;
  }
}
