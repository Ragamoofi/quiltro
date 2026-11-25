import { Container, Graphics } from 'pixi.js';
import { LOGROS } from '../data/logros.ts';
import { t } from '../i18n/index.ts';
import { PixelText } from './text.ts';
import { Button, C, ditherOverlay, panel } from './widgets.ts';

/** Achievement list (secret ones hidden until earned), with each one's bandana colour. */
export function achievementsView(earned: readonly string[], viewW: number, viewH: number, onClose: () => void): Container {
  const root = new Container();
  root.addChild(ditherOverlay(viewW, viewH));
  const w = Math.min(viewW - 20, 300);
  const box = new Container();
  const g = new Graphics();
  box.addChild(g);
  let y = 8;
  const title = new PixelText(t('meta.logrosTitulo'), { color: 'a', outline: 'k' }, 2);
  title.position.set(Math.round((w - title.width) / 2), y);
  box.addChild(title);
  y += title.height + 6;
  for (const l of LOGROS) {
    const got = earned.includes(l.id);
    const hidden = l.secret && !got;
    const name = new PixelText(`${got ? '+' : '·'} ${hidden ? '???' : t(`${l.i18n}.nombre`)}`, { color: got ? 'a' : 'G', outline: 'k' });
    const desc = new PixelText(hidden ? '???' : `${t(`${l.i18n}.desc`)} (${l.lucas})`, { color: got ? 'w' : 'g', outline: 'k', maxWidth: w - 24 });
    const swatch = new Graphics().rect(0, 0, 6, 6).fill(C(l.bandana)).stroke({ width: 1, color: C('k') });
    swatch.position.set(w - 16, y + 1);
    name.position.set(10, y);
    desc.position.set(18, y + name.height + 1);
    box.addChild(name, desc, swatch);
    y += name.height + desc.height + 5;
  }
  const close = new Button(t('meta.cerrar'), 70, 18, onClose, 'K', 'w');
  close.position.set(Math.round((w - 70) / 2), y + 2);
  box.addChild(close);
  panel(g, 0, 0, w, y + 26, 'K', 'k', 'g', 'k');
  box.position.set(Math.round((viewW - w) / 2), Math.max(4, Math.round((viewH - y - 26) / 2)));
  root.addChild(box);
  return root;
}
