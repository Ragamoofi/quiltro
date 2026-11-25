import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../art/assets.ts';
import type { Build } from '../game/build.ts';
import { formatNumber, t } from '../i18n/index.ts';
import { PixelText } from './text.ts';
import { Button, C, ditherOverlay, FocusList, panel } from './widgets.ts';

export interface PauseStats {
  seconds: number;
  km: number;
  kills: number;
  level: number;
  hp: number;
  maxHp: number;
}

/**
 * "Pausa pa'l tecito": the run behind a dither, the current build with every
 * weapon and trait and its level, the run's numbers, and Seguir, Opciones and
 * Pa' la casa (asks for confirmation).
 */
export class PauseView {
  readonly root = new Container();
  readonly focus = new FocusList();
  private confirming = false;

  get open(): boolean {
    return this.root.visible;
  }

  show(
    build: Build,
    viewW: number,
    viewH: number,
    onResume: () => void,
    onQuit: () => void,
    onOptions: () => void,
    stats: PauseStats,
  ): void {
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.root.visible = true;
    this.confirming = false;
    this.root.addChild(ditherOverlay(viewW, viewH));
    const pw = Math.min(viewW - 20, 280);
    const ph = 190;
    const x0 = Math.round((viewW - pw) / 2);
    const y0 = Math.round((viewH - ph) / 2);
    const g = new Graphics();
    panel(g, x0, y0, pw, ph, 'K', 'k', 'g', 'k');
    this.root.addChild(g);
    const title = new PixelText(t('ui.pausa'), { color: 'w', outline: 'k' }, 2);
    title.position.set(Math.round((viewW - title.width) / 2), y0 + 8);
    this.root.addChild(title);

    const time = `${Math.floor(stats.seconds / 60)}:${String(Math.floor(stats.seconds % 60)).padStart(2, '0')}`;
    const line = new PixelText(
      `${time}  ·  ${formatNumber(stats.km)} km  ·  ${t('ui.enemigos')} ${formatNumber(stats.kills)}  ·  ${t('ui.nivelCorto', { n: stats.level })}  ·  ${stats.hp}/${stats.maxHp}`,
      { color: 'G', outline: 'k', maxWidth: pw - 16, align: 'center' },
    );
    line.position.set(Math.round((viewW - line.width) / 2), y0 + 30);
    this.root.addChild(line);

    // Weapons row then traits row, each icon with its level as dots.
    const rows: { icon: string; level: number; max: number; evo: boolean }[][] = [
      build.weapons.map((w) => ({ icon: w.def.id, level: w.level, max: w.def.maxLevel, evo: build.evolved.has(w.def.id) })),
      build.traits.map((tr) => ({ icon: tr.def.id, level: tr.level, max: tr.def.maxLevel, evo: false })),
    ];
    const dots = new Graphics();
    rows.forEach((row, r) => {
      const y = y0 + 50 + r * 30;
      const total = row.length * 22;
      row.forEach((item, i) => {
        const x = Math.round((viewW - total) / 2) + i * 22;
        const s = new Sprite(anim('icono', item.icon).textures[0]);
        s.position.set(x, y);
        this.root.addChild(s);
        if (item.evo) dots.rect(x - 1, y - 1, 18, 18).stroke({ width: 1, color: C('a') });
        for (let d = 0; d < item.max; d++) dots.rect(x + 1 + d * 3, y + 18, 2, 2).fill(C(d < item.level ? 'a' : 'g'));
      });
    });
    this.root.addChild(dots);

    const bw = Math.floor((pw - 24 - 12) / 3);
    const by = y0 + ph - 30;
    const resume = new Button(t('ui.seguir'), bw, 20, onResume, 'v', 'w');
    const options = new Button(t('ui.opciones'), bw, 20, onOptions, 'K', 'w');
    const quit = new Button(t('ui.paLaCasa'), bw, 20, () => {
      if (this.confirming) {
        onQuit();
        return;
      }
      this.confirming = true;
      quit.setText(t('ui.confirmarSalir').split('.')[0] ?? '¿Seguro?');
    }, 'r', 'w');
    resume.position.set(x0 + 12, by);
    options.position.set(x0 + 18 + bw, by);
    quit.position.set(x0 + 24 + bw * 2, by);
    this.root.addChild(resume, options, quit);
    this.focus.set([resume, options, quit]);
  }

  hide(): void {
    this.root.visible = false;
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
  }
}
