import { Container, Graphics } from 'pixi.js';
import { t } from '../i18n/index.ts';
import type { Settings } from '../meta/save.ts';
import { PixelText } from './text.ts';
import { Button, C, ditherOverlay, panel } from './widgets.ts';

export interface OptionsHooks {
  /** Settings changed: apply and save. */
  changed(): void;
  exportCode(): string;
  importCode(code: string): boolean;
  wipe(): void;
  replayIntro(): void;
  close(): void;
}

type Row =
  | { kind: 'slider'; label: string; get: () => number; set: (v: number) => void }
  | { kind: 'choice'; label: string; options: { value: string; label: string }[]; get: () => string; set: (v: string) => void };

/**
 * Opciones (GDD): music and effects volume, shake 0–100 %, damage numbers,
 * reduce flashes, colour-blind mode, hold/toggle for the line, floating or
 * fixed joystick, graphics quality, language, tips, copy/paste progress and
 * wipe it (double confirmation). Usable as a full screen or over the pause.
 */
export class OptionsView {
  readonly root = new Container();
  private readonly s: Settings;
  private readonly hooks: OptionsHooks;
  private viewW = 480;
  private viewH = 270;
  private wipeStep = 0;
  private note = '';

  constructor(settings: Settings, hooks: OptionsHooks) {
    this.s = settings;
    this.hooks = hooks;
  }

  get open(): boolean {
    return this.root.visible && this.root.children.length > 0;
  }

  show(viewW: number, viewH: number): void {
    this.viewW = viewW;
    this.viewH = viewH;
    this.root.visible = true;
    this.build();
  }

  hide(): void {
    this.root.visible = false;
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.wipeStep = 0;
    this.note = '';
  }

  private rows(): Row[] {
    const s = this.s;
    const yesNo = [
      { value: 'si', label: t('opciones.si') },
      { value: 'no', label: t('opciones.no') },
    ];
    const bool = (label: string, get: () => boolean, set: (v: boolean) => void): Row => ({
      kind: 'choice',
      label,
      options: yesNo,
      get: () => (get() ? 'si' : 'no'),
      set: (v) => set(v === 'si'),
    });
    return [
      { kind: 'slider', label: t('opciones.musica'), get: () => s.music, set: (v) => (s.music = v) },
      { kind: 'slider', label: t('opciones.efectos'), get: () => s.sfx, set: (v) => (s.sfx = v) },
      { kind: 'slider', label: t('opciones.sacudida'), get: () => s.shake, set: (v) => (s.shake = v) },
      bool(t('opciones.numeros'), () => s.damageNumbers, (v) => (s.damageNumbers = v)),
      bool(t('opciones.destellos'), () => s.reduceFlashes, (v) => (s.reduceFlashes = v)),
      bool(t('opciones.daltonismo'), () => s.colorblind, (v) => (s.colorblind = v)),
      {
        kind: 'choice',
        label: t('opciones.hilo'),
        options: [
          { value: 'mantener', label: t('opciones.mantener') },
          { value: 'alternar', label: t('opciones.alternar') },
        ],
        get: () => s.holdMode,
        set: (v) => (s.holdMode = v as Settings['holdMode']),
      },
      {
        kind: 'choice',
        label: t('opciones.joystick'),
        options: [
          { value: 'flotante', label: t('opciones.flotante') },
          { value: 'fijo', label: t('opciones.fijo') },
        ],
        get: () => s.joystick,
        set: (v) => (s.joystick = v as Settings['joystick']),
      },
      {
        kind: 'choice',
        label: t('opciones.calidad'),
        options: (['auto', 'alta', 'baja'] as const).map((q) => ({ value: q, label: t(`opciones.${q}`) })),
        get: () => s.quality,
        set: (v) => (s.quality = v as Settings['quality']),
      },
      {
        kind: 'choice',
        label: t('opciones.idioma'),
        options: [{ value: 'es-CL', label: t('opciones.espanolChile') }],
        get: () => s.language,
        set: (v) => (s.language = v),
      },
      bool(t('opciones.consejos'), () => s.tips, (v) => (s.tips = v)),
    ];
  }

  private build(): void {
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
    const w = this.viewW;
    const h = this.viewH;
    this.root.addChild(ditherOverlay(w, h));
    const pw = Math.min(w - 12, 340);
    const x0 = Math.round((w - pw) / 2);
    const box = new Container();
    const g = new Graphics();
    box.addChild(g);
    let y = 6;
    const title = new PixelText(t('opciones.titulo'), { color: 'w', outline: 'k' }, 2);
    title.position.set(Math.round((pw - title.width) / 2), y);
    box.addChild(title);
    y += title.height + 6;
    const rowH = 15;
    const labelW = Math.round(pw * 0.42);
    for (const row of this.rows()) {
      const label = new PixelText(row.label, { color: 'w', outline: 'k' });
      label.position.set(8, y + 3);
      box.addChild(label);
      const cx = labelW;
      const cw = pw - labelW - 8;
      if (row.kind === 'slider') {
        const minus = new Button('-', 14, 13, () => this.change(() => row.set(Math.max(0, round(row.get() - 0.1)))), 'K', 'w');
        const plus = new Button('+', 14, 13, () => this.change(() => row.set(Math.min(1, round(row.get() + 0.1)))), 'K', 'w');
        const bar = new Graphics();
        const bw = cw - 36;
        bar.rect(0, 0, bw, 7).fill(C('k')).rect(1, 1, Math.round((bw - 2) * row.get()), 5).fill(C('a'));
        minus.position.set(cx, y);
        bar.position.set(cx + 17, y + 3);
        plus.position.set(cx + cw - 14, y);
        const pct = new PixelText(`${Math.round(row.get() * 100)}%`, { color: 'w', outline: 'k' });
        pct.position.set(cx + 17 + Math.round((bw - pct.width) / 2), y + 2);
        box.addChild(minus, bar, pct, plus);
      } else {
        const n = row.options.length;
        const bw = Math.floor((cw - (n - 1) * 3) / n);
        row.options.forEach((o, i) => {
          const selected = row.get() === o.value;
          const b = new Button(o.label, bw, 13, () => this.change(() => row.set(o.value)), selected ? 'b' : 'K', 'w');
          b.position.set(cx + i * (bw + 3), y);
          box.addChild(b);
        });
      }
      y += rowH;
    }
    y += 4;
    // Progress: copy/paste code, wipe with double confirmation, replay intro.
    const third = Math.floor((pw - 16 - 6) / 3);
    const exp = new Button(t('opciones.exportar'), third, 15, () => this.exportProgress(), 'v', 'w');
    const imp = new Button(t('opciones.importar'), third, 15, () => this.importProgress(), 'v', 'w');
    const wipeLabel = this.wipeStep === 0 ? t('opciones.borrar') : this.wipeStep === 1 ? t('opciones.borrarSeguro') : t('opciones.borrarSeguro2');
    const wipe = new Button(wipeLabel, third, 15, () => this.wipe(), 'r', 'w');
    exp.position.set(8, y);
    imp.position.set(8 + third + 3, y);
    wipe.position.set(8 + 2 * (third + 3), y);
    box.addChild(exp, imp, wipe);
    y += 19;
    const intro = new Button(t('opciones.verIntro'), third, 15, () => this.hooks.replayIntro(), 'K', 'w');
    const done = new Button(t('opciones.listo'), third * 2 + 3, 15, () => this.hooks.close(), 'a', 'k');
    intro.position.set(8, y);
    done.position.set(8 + third + 3, y);
    box.addChild(intro, done);
    y += 19;
    if (this.note) {
      const n = new PixelText(this.note, { color: 'V', outline: 'k' });
      n.position.set(Math.round((pw - n.width) / 2), y);
      box.addChild(n);
      y += n.height + 3;
    }
    panel(g, 0, 0, pw, y + 4, 'K', 'k', 'g', 'k');
    // Scale down only by integers: if it does not fit, it scrolls by starting higher.
    box.position.set(x0, Math.max(2, Math.round((h - y - 4) / 2)));
    this.root.addChild(box);
  }

  private change(fn: () => void): void {
    fn();
    this.wipeStep = 0;
    this.hooks.changed();
    this.build();
  }

  private exportProgress(): void {
    const code = this.hooks.exportCode();
    void navigator.clipboard?.writeText(code).catch(() => window.prompt('', code));
    if (!navigator.clipboard) window.prompt('', code);
    this.note = t('opciones.copiado');
    this.build();
  }

  private importProgress(): void {
    const code = window.prompt(t('opciones.importar'));
    if (code && this.hooks.importCode(code)) this.hooks.close();
  }

  private wipe(): void {
    this.wipeStep++;
    if (this.wipeStep >= 3) {
      this.hooks.wipe();
      return;
    }
    this.build();
  }
}

const round = (v: number): number => Math.round(v * 10) / 10;
