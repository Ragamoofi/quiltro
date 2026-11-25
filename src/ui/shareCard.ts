import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { anim } from '../art/assets.ts';
import { colorOf } from '../art/palette.ts';
import { CIUDADES } from '../data/zonas.ts';
import { PERSONAJES } from '../data/personajes.ts';
import { t } from '../i18n/index.ts';
import { formatNumber } from '../i18n/index.ts';
import { SQUARE_COUNT, squares, zoneIndexAt, ZONE_COLORS, type ShareInfo } from '../meta/daily.ts';
import { chileX, drawChile } from './chileMap.ts';
import { logoSprite } from './logo.ts';
import { PixelText } from './text.ts';
import { C } from './widgets.ts';

/** Story card size: 270×480 native pixels, exactly 1080×1920 when scaled ×4. */
export const CARD_W = 270;
export const CARD_H = 480;
export const CARD_SCALE = 4;

/** Sky colours (top → bottom) of the zone you reached. */
const SKIES: readonly (readonly [string, string])[] = [
  ['k', 'O'], // Norte: starry night over the desert
  ['b', 's'], // Centro: blue sky
  ['F', 'v'], // Sur: forest
  ['I', 'i'], // Patagonia and Antarctica: ice
];

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** A vertical gradient between two palette colours, ordered-dithered (no in-between colours). */
function skyTexture(top: string, bottom: string): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Texture.EMPTY;
  ctx.fillStyle = colorOf(top)?.hex ?? '#000';
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = colorOf(bottom)?.hex ?? '#fff';
  for (let y = 0; y < CARD_H; y++) {
    const k = y / CARD_H;
    for (let x = 0; x < CARD_W; x++) {
      if (k > ((BAYER[(y % 4) * 4 + (x % 4)] ?? 0) + 0.5) / 16) ctx.fillRect(x, y, 1, 1);
    }
  }
  const tex = Texture.from(canvas);
  tex.source.scaleMode = 'nearest';
  return tex;
}

/**
 * The image to post in stories (GDD "Ruta del día"): Chile as a map with the
 * route travelled, the km, the city, the 12 minute squares, the build's icons
 * and the invitation. Built as a Pixi container at the native resolution so it
 * has exactly the same pixel art as the game.
 */
export function buildShareCard(info: ShareInfo): Container {
  const root = new Container();
  const [top, bottom] = SKIES[Math.min(SKIES.length - 1, zoneIndexAt(info.km))] ?? SKIES[0] ?? ['k', 'K'];
  root.addChild(new Sprite(skyTexture(top, bottom)));

  // Logo and title.
  const logo = logoSprite(3);
  logo.position.set(Math.round((CARD_W - logo.width) / 2), 8);
  const heading = new PixelText(
    info.daily ? t('compartir.tarjetaRuta', { n: info.daily.number }) : t('compartir.tarjetaViaje'),
    { color: 'w', outline: 'k' },
    1,
  );
  heading.position.set(Math.round((CARD_W - heading.width) / 2), logo.y + logo.height + 4);
  root.addChild(logo, heading);

  // The map with the route.
  const mapTop = 66;
  const mapH = 296;
  const mapX = 34;
  const mapW = 12;
  const g = new Graphics();
  root.addChild(g);
  g.rect(mapX - 26, mapTop - 6, 62, mapH + 12).fill(C('k'));
  g.rect(mapX - 25, mapTop - 5, 60, mapH + 10).fill(C('B'));
  const kmToY = drawChile(g, mapX, mapTop, mapH, mapW);
  const y0 = kmToY(0);
  const y1 = kmToY(info.km);
  // The route: a dotted red line, 2 px wide, with a white highlight so it reads over every colour.
  for (let y = y0; y < y1; y += 4) {
    const rx = chileX(mapX, mapW, (y - y0) / mapH);
    g.rect(rx - 1, y - 1, 4, 4).fill(C('k')).rect(rx, y, 2, 2).fill(C('r'));
  }
  for (const c of CIUDADES.filter((x) => x.hud)) {
    const y = kmToY(c.km);
    const reached = info.km >= c.km;
    const x = chileX(mapX, mapW, (y - mapTop) / mapH);
    g.rect(x, y, 2, 2).fill(C(reached ? 'W' : 'g'));
    const label = new PixelText(t(c.i18n), { color: reached ? 'w' : 'G', outline: 'k' });
    label.position.set(x + 7, y - 3);
    root.addChild(label);
  }
  // Where the dog stopped: a flag on the route.
  const fx = chileX(mapX, mapW, (y1 - mapTop) / mapH);
  g.rect(fx - 1, y1 - 12, 3, 14).fill(C('k')).rect(fx, y1 - 11, 1, 12).fill(C('W'));
  g.rect(fx + 1, y1 - 12, 9, 7).fill(C('k')).rect(fx + 2, y1 - 11, 7, 5).fill(C('a'));

  // Right column: km, city, the dog.
  const colX = 142;
  const colW = CARD_W - colX - 8;
  const km = new PixelText(t('compartir.tarjetaKm', { km: formatNumber(info.km) }), { color: 'a', outline: 'k' }, 2);
  km.position.set(Math.round(colX + (colW - km.width) / 2), 92);
  const where = new PixelText(t('compartir.tarjetaLlegue', { lugar: info.city }), {
    color: 'w',
    outline: 'k',
    maxWidth: colW,
    align: 'center',
  });
  where.position.set(Math.round(colX + (colW - where.width) / 2), km.y + km.height + 8);
  root.addChild(km, where);

  const sprite = PERSONAJES.find((p) => p.id === info.character)?.sprite ?? 'quiltro';
  const dog = new Sprite(anim(sprite, 'trotar').textures[0]);
  dog.anchor.set(0.5, 22 / 24);
  dog.scale.set(3);
  dog.position.set(Math.round(colX + colW / 2), 250);
  root.addChild(dog);
  if (info.victory) {
    const win = new PixelText(t('ui.victoria'), { color: 'a', outline: 'k', maxWidth: colW, align: 'center' });
    win.position.set(Math.round(colX + (colW - win.width) / 2), 270);
    root.addChild(win);
  }

  // The 12 minute squares.
  const row = new Graphics();
  const sq = squares(info.km);
  const sw = 9;
  const startX = Math.round((CARD_W - SQUARE_COUNT * sw) / 2);
  sq.forEach((emoji, i) => {
    const zone = Math.min(3, Math.floor(i / 3));
    const reached = emoji !== '⬛';
    row.rect(startX + i * sw, 372, 8, 8).fill(C('k'));
    row.rect(startX + i * sw + 1, 373, 6, 6).fill(C(reached ? (ZONE_COLORS[zone] ?? 'y') : 'K'));
  });
  root.addChild(row);

  // What defined the build.
  if (info.build) {
    const build = new PixelText(info.build, { color: 'w', outline: 'k', maxWidth: CARD_W - 20, align: 'center' });
    build.position.set(Math.round((CARD_W - build.width) / 2), 388);
    root.addChild(build);
  }
  const icons = info.icons.slice(0, 8);
  const iconW = 17;
  icons.forEach((id, i) => {
    const tex = anim('icono', id).textures[0];
    if (!tex) return;
    const s = new Sprite(tex);
    s.position.set(Math.round((CARD_W - icons.length * iconW) / 2) + i * iconW, 404);
    root.addChild(s);
  });

  // Footer: the invitation and the address.
  const invite = new PixelText(t('compartir.tarjetaInvitacion'), { color: 'a', outline: 'k' }, 1);
  invite.position.set(Math.round((CARD_W - invite.width) / 2), 436);
  const link = new PixelText(info.link.replace(/^https?:\/\//, '').replace(/\/$/, ''), { color: 'w', outline: 'k', maxWidth: CARD_W - 12, align: 'center' });
  link.position.set(Math.round((CARD_W - link.width) / 2), 450);
  root.addChild(invite, link);
  return root;
}
