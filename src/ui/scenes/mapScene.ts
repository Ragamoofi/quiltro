import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../../art/assets.ts';
import type { Input } from '../../core/input.ts';
import type { Scene } from '../../core/scene.ts';
import { CIUDADES } from '../../data/zonas.ts';
import { t } from '../../i18n/index.ts';
import type { SaveData } from '../../meta/save.ts';
import { cityAt } from '../../meta/progress.ts';
import { chileX, drawChile } from '../chileMap.ts';
import { PixelText } from '../text.ts';
import { C } from '../widgets.ts';

const DURATION = 1.5;

/**
 * Mapa de inicio (1.5 s, skippable): Chile standing up, a dotted line leaving
 * Arica and the personal record marked ("Tu récord: Temuco").
 */
export class MapScene implements Scene {
  readonly root = new Container();
  private readonly data: SaveData;
  private readonly onDone: () => void;
  private readonly line = new Graphics();
  private kmToY: (km: number) => number = () => 0;
  private mapX = 0;
  private mapW = 8;
  private time = 0;
  private done = false;
  private readonly dog = new Sprite();

  constructor(input: Input, data: SaveData, onDone: () => void) {
    this.data = data;
    this.onDone = onDone;
    const skip = (): void => this.finish();
    for (const code of ['Enter', 'Space', 'Escape', 'GamepadA']) input.onPress(code, skip);
    this.root.eventMode = 'static';
    this.root.on('pointertap', skip);
  }

  enter(): void {}
  exit(): void {}

  resize(w: number, h: number): void {
    this.root.removeChildren().forEach((c) => c !== this.line && c !== this.dog && c.destroy());
    this.root.addChild(new Graphics().rect(0, 0, w, h).fill(C('B')));
    // Sea texture: dithered waves.
    const sea = new Graphics();
    for (let y = 2; y < h; y += 6) for (let x = (y / 6) % 2 === 0 ? 0 : 4; x < w; x += 9) sea.rect(x, y, 3, 1).fill(C('b'));
    this.root.addChild(sea);
    const mh = h - 30;
    this.mapW = 10;
    this.mapX = Math.round(w / 2 - 5);
    const g = new Graphics();
    this.kmToY = drawChile(g, this.mapX, 14, mh, this.mapW);
    this.root.addChild(g, this.line);
    for (const c of CIUDADES.filter((x) => x.hud)) {
      const y = this.kmToY(c.km);
      const cx = chileX(this.mapX, this.mapW, (y - 14) / mh);
      g.rect(cx, y, 2, 2).fill(C('w'));
      const label = new PixelText(t(c.i18n), { color: 'w', outline: 'k' });
      label.position.set(cx + 8, y - 3);
      this.root.addChild(label);
    }
    // Personal record.
    const best = this.data.best.km;
    const ry = this.kmToY(best);
    const rx = chileX(this.mapX, this.mapW, (ry - 14) / mh);
    const city = CIUDADES.find((c) => c.id === cityAt(best));
    const rec = new PixelText(best > 0 ? t('menu.tuRecord', { lugar: city ? t(city.i18n) : '' }) : t('menu.sinRecord'), { color: 'a', outline: 'k' });
    rec.position.set(rx - rec.width - 10, ry - 3);
    const flag = new Graphics().rect(rx - 6, ry, 5, 1).fill(C('a')).rect(rx - 2, ry - 2, 2, 5).fill(C('a'));
    this.root.addChild(rec, flag);
    const tex = anim('quiltro', 'quieto').textures[0];
    if (tex) this.dog.texture = tex;
    this.dog.anchor.set(0.5, 22 / 24);
    this.root.addChild(this.dog);
    const skip = new PixelText(t('menu.saltar'), { color: 'G', outline: 'k' });
    skip.position.set(w - skip.width - 6, h - 12);
    this.root.addChild(skip);
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    this.onDone();
  }

  update(dt: number): void {
    this.time += dt;
    if (this.time >= DURATION) this.finish();
  }

  render(): void {
    // Dotted line travelling south from Arica as the screen plays.
    const k = Math.min(1, this.time / DURATION);
    const target = Math.max(300, this.data.best.km) * k;
    const g = this.line;
    g.clear();
    const y0 = this.kmToY(0);
    const y1 = this.kmToY(target);
    for (let y = y0; y < y1; y += 3) g.rect(chileX(this.mapX, this.mapW, (y - y0) / Math.max(1, this.kmToY(4300) - y0)) + 1, y, 1, 2).fill(C('r'));
    this.dog.position.set(chileX(this.mapX, this.mapW, 0) - 10, y0 + 2);
  }
}
