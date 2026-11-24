/**
 * /sprites.html: every sprite animated at ×4 over the floor of every zone,
 * plus the palette. Plain canvas 2D so it does not depend on the game code.
 */
import { PALETTE } from './palette.ts';

interface SheetFrame {
  frame: { x: number; y: number; w: number; h: number };
  anchor: { x: number; y: number };
}
interface SheetJson {
  frames: Record<string, SheetFrame>;
  animations: Record<string, string[]>;
  meta: { animMeta: Record<string, { fps: number; loop: boolean }> };
}

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

async function main(): Promise<void> {
  const [sheet, image] = await Promise.all([
    fetch('./assets/sprites.json').then((r) => r.json() as Promise<SheetJson>),
    new Promise<HTMLImageElement>((ok, fail) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = fail;
      img.src = './assets/sprites.png';
    }),
  ]);

  renderPalette();

  const animKeys = Object.keys(sheet.animations);
  const floors = animKeys.filter((k) => k.startsWith('suelo_'));
  const bySprite = new Map<string, string[]>();
  for (const k of animKeys) {
    const sprite = k.split('/')[0] ?? k;
    bySprite.set(sprite, [...(bySprite.get(sprite) ?? []), k]);
  }

  const cells: { canvas: HTMLCanvasElement; anim: string; floor: string | null }[] = [];
  const sections = $('sections');

  // Floors: a tiled patch mixing all variants.
  const floorSection = section(sections, 'Suelos');
  for (const f of floors) {
    const c = document.createElement('canvas');
    cells.push({ canvas: c, anim: '', floor: f });
    floorSection.append(figure(c, `${f} · ${sheet.animations[f]?.length ?? 0} variantes`));
  }

  // Everything else: one cell per animation per floor.
  const spriteSection = section(sections, 'Sprites');
  for (const [sprite, anims] of bySprite) {
    if (sprite.startsWith('suelo_')) continue;
    for (const anim of anims) {
      const meta = sheet.meta.animMeta[anim];
      for (const floor of floors.length > 0 ? floors : [null]) {
        const c = document.createElement('canvas');
        cells.push({ canvas: c, anim, floor });
        const n = sheet.animations[anim]?.length ?? 0;
        spriteSection.append(
          figure(c, `${anim} · ${n} cuadro${n === 1 ? '' : 's'} @ ${meta?.fps ?? '?'} fps${floor ? ` · ${floor}` : ''}`),
        );
      }
    }
  }

  const start = performance.now();
  const frame = (now: number): void => {
    const zoom = Number(($('zoom') as HTMLSelectElement).value);
    const flip = ($('flip') as HTMLInputElement).checked;
    const speed = ($('slow') as HTMLInputElement).checked ? 0.25 : 1;
    const t = ((now - start) / 1000) * speed;
    for (const cell of cells) draw(cell, sheet, image, zoom, flip, t);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function draw(
  cell: { canvas: HTMLCanvasElement; anim: string; floor: string | null },
  sheet: SheetJson,
  image: HTMLImageElement,
  zoom: number,
  flip: boolean,
  t: number,
): void {
  const W = 48;
  const H = 40;
  const { canvas } = cell;
  if (canvas.width !== W * zoom) {
    canvas.width = W * zoom;
    canvas.height = H * zoom;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
  ctx.fillStyle = '#2A2233';
  ctx.fillRect(0, 0, W, H);

  if (cell.floor) {
    const variants = sheet.animations[cell.floor] ?? [];
    for (let ty = 0; ty < Math.ceil(H / 16); ty++) {
      for (let tx = 0; tx < Math.ceil(W / 16); tx++) {
        const v = variants[(tx * 7 + ty * 13) % variants.length];
        const f = v ? sheet.frames[v] : undefined;
        if (f) blit(ctx, image, f, tx * 16, ty * 16, false);
      }
    }
  }
  if (!cell.anim) return;

  const keys = sheet.animations[cell.anim] ?? [];
  const meta = sheet.meta.animMeta[cell.anim] ?? { fps: 8, loop: true };
  let i = Math.floor(t * meta.fps);
  i = meta.loop ? i % keys.length : Math.min(i % (keys.length + meta.fps), keys.length - 1);
  const f = sheet.frames[keys[i] ?? ''];
  if (!f) return;
  const x = Math.round(W / 2 - f.anchor.x * f.frame.w);
  const y = Math.round(H - 6 - f.anchor.y * f.frame.h);
  blit(ctx, image, f, x, y, flip);
}

function blit(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  f: SheetFrame,
  x: number,
  y: number,
  flip: boolean,
): void {
  const { x: sx, y: sy, w, h } = f.frame;
  if (flip) {
    ctx.save();
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(image, sx, sy, w, h, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(image, sx, sy, w, h, x, y, w, h);
  }
}

function renderPalette(): void {
  const el = $('palette');
  for (const c of PALETTE) {
    const s = document.createElement('div');
    s.className = 'swatch';
    s.title = c.use;
    s.innerHTML = `<i style="background:${c.hex}"></i><span><b>${c.char}</b> ${c.name}<br>${c.hex}</span>`;
    el.append(s);
  }
}

function section(parent: HTMLElement, title: string): HTMLElement {
  const h = document.createElement('h2');
  h.textContent = title;
  const grid = document.createElement('div');
  grid.className = 'grid';
  parent.append(h, grid);
  return grid;
}

function figure(canvas: HTMLCanvasElement, caption: string): HTMLElement {
  const fig = document.createElement('figure');
  const cap = document.createElement('figcaption');
  cap.textContent = caption;
  fig.append(canvas, cap);
  return fig;
}

main().catch((err: unknown) => {
  const p = document.createElement('p');
  p.className = 'error';
  p.textContent = `No se pudo cargar la hoja de sprites: ${String(err)}. ¿Corriste npm run sprites?`;
  document.body.append(p);
});
