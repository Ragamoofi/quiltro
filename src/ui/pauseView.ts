import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../art/assets.ts';
import type { Build } from '../game/build.ts';
import { t } from '../i18n/index.ts';
import { PixelText } from './text.ts';
import { Button, C, ditherOverlay, panel } from './widgets.ts';

/** "Pausa pa'l tecito": current build with levels, Seguir and Pa' la casa (with confirmation). */
export class PauseView {
  readonly root = new Container();
  private confirming = false;

  get open(): boolean {
    return this.root.visible;
  }

  show(build: Build, viewW: number, viewH: number, onResume: () => void, onQuit: () => void): void {
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.root.visible = true;
    this.confirming = false;
    this.root.addChild(ditherOverlay(viewW, viewH));
    const pw = Math.min(viewW - 20, 260);
    const ph = 170;
    const x0 = Math.round((viewW - pw) / 2);
    const y0 = Math.round((viewH - ph) / 2);
    const g = new Graphics();
    panel(g, x0, y0, pw, ph, 'K', 'k', 'g', 'k');
    this.root.addChild(g);
    const title = new PixelText(t('ui.pausa'), { color: 'w', outline: 'k' }, 2);
    title.position.set(Math.round((viewW - title.width) / 2), y0 + 8);
    this.root.addChild(title);

    // Weapons row then traits row, each icon with its level as dots.
    const rows: { icon: string; level: number; max: number }[][] = [
      build.weapons.map((w) => ({ icon: w.def.id, level: w.level, max: w.def.maxLevel })),
      build.traits.map((tr) => ({ icon: tr.def.id, level: tr.level, max: tr.def.maxLevel })),
    ];
    const dots = new Graphics();
    rows.forEach((row, r) => {
      const y = y0 + 40 + r * 30;
      const total = row.length * 22;
      row.forEach((item, i) => {
        const x = Math.round((viewW - total) / 2) + i * 22;
        const s = new Sprite(anim('icono', item.icon).textures[0]);
        s.position.set(x, y);
        this.root.addChild(s);
        for (let d = 0; d < item.max; d++) {
          dots.rect(x + 1 + d * 3, y + 18, 2, 2).fill(C(d < item.level ? 'a' : 'g'));
        }
      });
    });
    this.root.addChild(dots);

    const bw = 90;
    const resume = new Button(t('ui.seguir'), bw, 20, onResume, 'v', 'w');
    const quit = new Button(t('ui.paLaCasa'), bw, 20, () => {
      if (this.confirming) {
        onQuit();
        return;
      }
      this.confirming = true;
      quit.setText(t('ui.confirmarSalir').split('.')[0] ?? '¿Seguro?');
    }, 'r', 'w');
    resume.position.set(Math.round(viewW / 2 - bw - 4), y0 + ph - 30);
    quit.position.set(Math.round(viewW / 2 + 4), y0 + ph - 30);
    this.root.addChild(resume, quit);
  }

  hide(): void {
    this.root.visible = false;
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
  }
}
