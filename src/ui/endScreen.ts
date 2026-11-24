import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../art/assets.ts';
import { formatNumber, t } from '../i18n/index.ts';
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
}

const fmtTime = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Fin del viaje: big title ("Se te fue la micro" / "¡De Arica a Punta Arenas!"),
 * km and city, stats, damage per weapon as bars, lucas counting up, and the
 * big "¡Otra, al tiro!" button (R).
 */
export class EndScreen {
  readonly root = new Container();
  private lucasText: PixelText | null = null;
  private shown = 0;
  private target = 0;
  private age = 0;
  private onCoin: () => void = () => {};
  private content = new Container();

  show(s: RunSummary, viewW: number, viewH: number, onRetry: () => void, onCoin: () => void): void {
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.root.visible = true;
    this.onCoin = onCoin;
    this.age = 0;
    this.shown = 0;
    this.target = s.lucas;
    this.root.addChild(ditherOverlay(viewW, viewH, 'k', 2));
    this.content = new Container();
    this.root.addChild(this.content);

    const portrait = viewH > viewW;
    const pw = Math.min(viewW - 16, 300);
    const g = new Graphics();
    const entryCount = Object.values(s.damageBy).filter((v) => v > 0).slice(0, 6).length;
    const ph = Math.min(viewH - 16, 118 + entryCount * 17 + (portrait ? 20 : 0));
    const px0 = Math.round((viewW - pw) / 2);
    const py0 = Math.round((viewH - ph) / 2);
    panel(g, px0, py0, pw, ph, 'K', 'k', 'g', 'k');
    this.content.addChild(g);

    let y = py0 + 8;
    const center = (node: Container, yy: number): void => {
      node.position.set(Math.round((viewW - node.width) / 2), yy);
      this.content.addChild(node);
    };
    const title = new PixelText(s.victory ? t('ui.victoria') : t('ui.muerte'), {
      color: s.victory ? 'a' : 'r',
      outline: 'k',
      maxWidth: Math.floor((pw - 16) / 2),
      align: 'center',
    }, 2);
    center(title, y);
    y += title.height + 6;

    const km = new PixelText(`${formatNumber(s.km)} km · ${t('ui.llegasteA', { lugar: s.city })}`, { color: 'w', outline: 'k' });
    center(km, y);
    y += km.height + 6;

    const stats = new PixelText(
      `${t('ui.tiempo')} ${fmtTime(s.seconds)}   ${t('ui.enemigos')} ${formatNumber(s.kills)}   ${t('ui.nivel')} ${s.level}`,
      { color: 'G', outline: 'k' },
    );
    center(stats, y);
    y += stats.height + 8;

    // Damage per weapon.
    const head = new PixelText(t('ui.dañoPorArma'), { color: 'w', outline: 'k' });
    head.position.set(px0 + 12, y);
    this.content.addChild(head);
    y += head.height + 3;
    const entries = Object.entries(s.damageBy).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = Math.max(1, ...entries.map(([, v]) => v));
    const barW = pw - 24 - 18 - 40;
    const bars = new Graphics();
    this.content.addChild(bars);
    for (const [id, v] of entries) {
      const icon = new Sprite(anim('icono', id).textures[0]);
      icon.position.set(px0 + 12, y);
      this.content.addChild(icon);
      const w = Math.max(1, Math.round((barW * v) / max));
      bars.rect(px0 + 31, y + 5, barW + 2, 6).fill(C('k'));
      bars.rect(px0 + 32, y + 6, w, 4).fill(C('a'));
      const num = new PixelText(formatNumber(v), { color: 'w', outline: 'k' });
      num.position.set(px0 + 34 + barW + 2, y + 4);
      this.content.addChild(num);
      y += 17;
    }
    y += 4;

    this.lucasText = new PixelText(`${t('ui.lucasGanadas')}: 0`, { color: 'a', outline: 'k' });
    center(this.lucasText, y);
    y += this.lucasText.height + 8;

    const retry = new Button(`${t('ui.otraAlTiro')} (R)`, Math.min(pw - 24, 160), 22, onRetry, 'a', 'k');
    retry.position.set(Math.round((viewW - Math.min(pw - 24, 160)) / 2), Math.min(y, py0 + ph - 30));
    this.content.addChild(retry);
  }

  hide(): void {
    this.root.visible = false;
  }

  update(dt: number): void {
    if (!this.root.visible) return;
    this.age += dt;
    // Panel slides up during the first 0.25 s.
    const k = Math.min(1, this.age / 0.25);
    this.content.y = Math.round((1 - k) ** 2 * 40);
    if (this.age > 0.5 && this.shown < this.target && this.lucasText) {
      const step = Math.max(1, Math.ceil(this.target / 40));
      this.shown = Math.min(this.target, this.shown + step);
      this.lucasText.text = `${t('ui.lucasGanadas')}: ${formatNumber(this.shown)}`;
      this.onCoin();
    }
  }
}
