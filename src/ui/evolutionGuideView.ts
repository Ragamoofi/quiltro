import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../art/assets.ts';
import { ARMAS } from '../data/armas.ts';
import { RASGOS } from '../data/rasgos.ts';
import type { Build } from '../game/build.ts';
import { evolutionProgress } from '../game/evolutionGuide.ts';
import { t } from '../i18n/index.ts';
import { PixelText } from './text.ts';
import { Button, ditherOverlay, type FocusList, panel } from './widgets.ts';

/** Paged recipes with actual run progress; usable with touch, keyboard and controller focus. */
export function evolutionGuideView(build: Build, viewW: number, viewH: number, focus: FocusList, close: () => void): Container {
  const root = new Container();
  root.addChild(ditherOverlay(viewW, viewH));
  const w = Math.min(viewW - 16, 420), h = Math.min(viewH - 12, 440);
  const box = new Container();
  box.position.set(Math.round((viewW - w) / 2), Math.round((viewH - h) / 2));
  root.addChild(box);
  const entries = evolutionProgress(build);
  const rowH = w < 300 ? 56 : 42, top = w < 300 ? 64 : 51;
  const perPage = Math.max(1, Math.floor((h - top - 30) / rowH));
  const pages = Math.ceil(entries.length / perPage);
  let page = 0;
  const draw = (): void => {
    box.removeChildren().forEach(c => c.destroy({ children: true }));
    const bg = new Graphics();
    panel(bg, 0, 0, w, h, 'K', 'k', 'g', 'k');
    box.addChild(bg);
    const title = new PixelText(t('guiaEvoluciones.titulo'), { color: 'a', outline: 'k' }, 2);
    title.position.set(Math.round((w - title.width) / 2), 8);
    const help = new PixelText(t('guiaEvoluciones.ayuda'), { color: 'w', maxWidth: w - 20, align: 'center' });
    help.position.set(Math.round((w - help.width) / 2), 27);
    box.addChild(title, help);
    entries.slice(page * perPage, (page + 1) * perPage).forEach((entry, i) => {
      const { evolution: e, level, maxLevel, hasTrait, status } = entry;
      const y = top + i * rowH;
      const weapon = ARMAS.find(a => a.id === e.weapon);
      const trait = RASGOS.find(a => a.id === e.trait);
      const color = status === 'ready' || status === 'evolved' ? 'a' : 'w';
      const icon = new Sprite(anim('icono', e.weapon).textures[0]);
      icon.position.set(10, y + 7);
      const name = new PixelText(t(e.nameKey), { color, maxWidth: w - 44 });
      name.position.set(32, y);
      const recipe = new PixelText(t('guiaEvoluciones.receta', {
        arma: weapon ? t(`${weapon.i18n}.nombre`) : e.weapon, nivel: level, max: maxLevel,
        rasgo: trait ? t(`${trait.i18n}.nombre`) : e.trait, tiene: hasTrait ? '+' : '-',
      }), { color: 'G', maxWidth: w - 44 });
      recipe.position.set(32, y + 10);
      const hint = new PixelText(t(`guiaEvoluciones.${status}`), { color, maxWidth: w - 44 });
      hint.position.set(32, recipe.y + recipe.height + 2);
      box.addChild(icon, name, recipe, hint);
    });
    const prev = new Button('<', 24, 18, () => { page = (page + pages - 1) % pages; draw(); }, 'K', 'w');
    const next = new Button('>', 24, 18, () => { page = (page + 1) % pages; draw(); }, 'K', 'w');
    prev.position.set(10, h - 25);
    next.position.set(40, h - 25);
    prev.setEnabled(pages > 1); next.setEnabled(pages > 1);
    const number = new PixelText(`${page + 1}/${pages}`, { color: 'w' });
    number.position.set(72, h - 20);
    const back = new Button(t('meta.cerrar'), 70, 18, close, 'a', 'k');
    back.position.set(w - 80, h - 25);
    box.addChild(prev, next, number, back);
    focus.set([prev, next, back]);
  };
  draw();
  return root;
}
