import { GLYPHS, outlinedText } from '../font.ts';
import { blank, outlined, paste, recolor, type Frame, type SpriteDef } from '../types.ts';

/* Comida, sombras, números de daño, globo ¡GUAU! e íconos del HUD. */

const SOPAIPILLA: Frame = [
  '..kkkk..',
  '.kayyak.',
  'kayaaaAk',
  'kaaaaaAk',
  'kaaAaaAk',
  'kAaaaAAk',
  '.kAAAAk.',
  '..kkkk..',
];
const SOPAIPILLA_BRILLO: Frame = [
  '..kkkk..',
  '.kaWyak.',
  'kayaaaAk',
  'kaaaaaAk',
  'kaaAaaAk',
  'kAaaaAAk',
  '.kAAAAk.',
  '..kkkk..',
];

export const sopaipilla: SpriteDef = {
  name: 'sopaipilla',
  group: 'comida',
  width: 8,
  height: 8,
  anchor: { x: 0.5, y: 0.5 },
  animations: {
    brillo: { fps: 3, frames: [SOPAIPILLA, SOPAIPILLA, SOPAIPILLA_BRILLO] },
  },
};

export const sombras: SpriteDef = {
  name: 'sombra',
  group: 'efectos',
  width: 14,
  height: 4,
  anchor: { x: 0.5, y: 0.5 },
  animations: {
    grande: { fps: 1, frames: [['...MMMMMMMM...', '.MMMMMMMMMMMM.', '.MMMMMMMMMMMM.', '...MMMMMMMM...']] },
    chica: { fps: 1, frames: [['..............', '....MMMMMM....', '...MMMMMMMM...', '....MMMMMM....']] },
  },
};

/** Damage digits 0–9, white and gold (critical), 5×7 with outline. */
const digits = (color: string): Frame[] =>
  Array.from({ length: 10 }, (_, n) => outlined((GLYPHS[String(n)] ?? []).map((r) => r.replace(/#/g, color))));

export const digitos: SpriteDef = {
  name: 'digitos',
  group: 'ui',
  width: 5,
  height: 7,
  anchor: { x: 0, y: 0 },
  animations: {
    blanco: { fps: 1, frames: digits('W') },
    oro: { fps: 1, frames: digits('a') },
    rojo: { fps: 1, frames: digits('r') },
  },
};

/** Comic balloon with "¡GUAU!" in red letters. */
function balloon(): Frame {
  const text = outlinedText('¡GUAU!', 'r');
  const tw = text[0]?.length ?? 0;
  const th = text.length;
  const w = tw + 6;
  const h = th + 4;
  let f = blank(w, h + 3);
  const body: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const edgeX = x === 0 || x === w - 1;
      const edgeY = y === 0 || y === h - 1;
      const corner = (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
      row += corner ? '.' : edgeX || edgeY ? 'k' : 'w';
    }
    body.push(row);
  }
  f = paste(f, body, 0, 0);
  f = paste(f, text, 3, 2);
  // Tail pointing down-left toward the dog's mouth.
  f = paste(f, ['kwwk', '.kwk', '..kk'], 4, h - 1);
  return f;
}

const GLOBO = balloon();

export const globoGuau: SpriteDef = {
  name: 'globo_guau',
  group: 'efectos',
  width: GLOBO[0]?.length ?? 0,
  height: GLOBO.length,
  anchor: { x: 0.2, y: 1 },
  animations: {
    globo: { fps: 1, frames: [GLOBO] },
  },
};

/** HUD bone icon for the health bar. */
export const hueso: SpriteDef = {
  name: 'hueso',
  group: 'ui',
  width: 9,
  height: 5,
  anchor: { x: 0, y: 0 },
  animations: {
    icono: { fps: 1, frames: [['kk.....kk', 'kwkkkkkwk', '.kwwwwwk.', 'kwkkkkkwk', 'kk.....kk']] },
    gris: { fps: 1, frames: [recolor(['kk.....kk', 'kwkkkkkwk', '.kwwwwwk.', 'kwkkkkkwk', 'kk.....kk'], { w: 'g' })] },
  },
};
