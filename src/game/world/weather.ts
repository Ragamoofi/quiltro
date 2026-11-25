import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { Rng } from '../../core/rng.ts';
import { C } from '../../ui/widgets.ts';

interface Drop {
  x: number;
  y: number;
  s: number;
}

/**
 * Screen-space weather per zone: dust in the north, gulls over the centre,
 * diagonal pixel rain in the south, sideways snow in Patagonia and
 * Antarctica (pushed by the wind).
 */
export class Weather {
  readonly root = new Container();
  private readonly g = new Graphics();
  private drops: Drop[] = [];
  private zone = '';
  private w = 480;
  private h = 270;
  private gullX = -40;
  private gullY = 40;
  /** The desert sun: a soft warm glow from the top-right corner (a smooth gradient), drawn once per size. */
  private readonly glare = new Sprite();
  private heat: { x: number; y: number; w: number; s: number }[] = [];
  private time = 0;

  constructor() {
    this.glare.visible = false;
    this.root.addChild(this.glare, this.g);
  }

  setZone(zone: string, w: number, h: number, rng: Rng): void {
    this.zone = zone;
    this.w = w;
    this.h = h;
    // The southern rain is lighter than before (80 → 45 drops) so it does not pile noise on the mist.
    const count = { norte: 26, centro: 0, ciudad: 0, costa: 0, sur: 45, lagos: 30, patagonia: 70, antartica: 50 }[zone] ?? 0;
    this.drops = Array.from({ length: count }, () => ({ x: rng.range(0, w), y: rng.range(0, h), s: rng.range(0.6, 1.4) }));
    this.glare.visible = zone === 'norte';
    if (zone === 'norte') {
      this.glare.texture = glareTexture(w, h);
      // Wavering air over the sand: short pale dashes that slide slowly (heat haze).
      // (Fixed spacing, no dice: the weather must not touch the run's random stream.)
      this.heat = Array.from({ length: 14 }, (_, i) => ({ x: (i * 97) % w, y: 46 + ((i * 53) % Math.max(1, Math.round(h * 0.8) - 46)), w: 10 + ((i * 13) % 24), s: 4 + ((i * 5) % 8) }));
    } else this.heat = [];
  }

  update(dt: number, windX: number, rng: Rng): void {
    this.time += dt;
    for (const hz of this.heat) {
      hz.x += hz.s * dt;
      if (hz.x > this.w + 40) hz.x = -hz.w;
    }
    const wrap = (d: Drop): void => {
      if (d.y > this.h) d.y -= this.h + 4;
      if (d.y < -4) d.y += this.h + 4;
      if (d.x > this.w) d.x -= this.w + 4;
      if (d.x < -4) d.x += this.w + 4;
    };
    for (const d of this.drops) {
      switch (this.zone) {
        case 'norte':
          d.x += (14 + windX) * d.s * dt;
          d.y += Math.sin(d.x * 0.05) * 6 * dt;
          break;
        case 'sur':
        case 'lagos':
          d.x -= 50 * d.s * dt;
          d.y += 190 * d.s * dt;
          break;
        default:
          d.x += (windX * 2.2 + 20) * d.s * dt;
          d.y += 22 * d.s * dt;
      }
      wrap(d);
    }
    // Gulls cross the sky over the coast and the lakes (and the old Centro look), never over Santiago.
    if (this.zone === 'centro' || this.zone === 'costa' || this.zone === 'lagos') {
      this.gullX += 30 * dt;
      if (this.gullX > this.w + 60) {
        this.gullX = -60;
        this.gullY = rng.range(36, this.h * 0.5);
      }
    }
  }

  render(): void {
    const g = this.g;
    g.clear();
    switch (this.zone) {
      case 'norte':
        for (const d of this.drops) g.rect(Math.round(d.x), Math.round(d.y), 1, 1).fill(C('n'));
        for (const hz of this.heat) {
          const y = Math.round(hz.y + Math.sin(this.time * 2.2 + hz.x * 0.05) * 1.5);
          g.rect(Math.round(hz.x), y, Math.round(hz.w), 1).fill({ color: C('W'), alpha: 0.2 });
        }
        break;
      case 'sur':
      case 'lagos':
        for (const d of this.drops) {
          const x = Math.round(d.x);
          const y = Math.round(d.y);
          g.rect(x, y, 1, 1).fill(C('s')).rect(x - 1, y + 1, 1, 1).fill(C('s')).rect(x - 2, y + 2, 1, 1).fill(C('G'));
        }
        break;
      case 'ciudad':
        break;
      case 'centro':
      case 'costa':
        // Two gulls gliding far away (pure scenery).
        for (const [ox, oy] of [
          [0, 0],
          [14, 6],
        ] as const) {
          const x = Math.round(this.gullX + ox);
          const y = Math.round(this.gullY + oy);
          g.rect(x, y, 2, 1).fill(C('w')).rect(x + 2, y + 1, 1, 1).fill(C('w')).rect(x + 3, y, 2, 1).fill(C('w'));
        }
        break;
      default:
        for (const d of this.drops) g.rect(Math.round(d.x), Math.round(d.y), d.s > 1.1 ? 2 : 1, 1).fill(C('W'));
    }
  }
}

/**
 * A warm, translucent glow strongest in the top-right corner. It used to be an ordered dither over
 * the whole screen, which read as a checkerboard on the sand; now it is a smooth gradient that
 * fades out before the middle of the screen.
 */
function glareTexture(w: number, h: number): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Texture.EMPTY;
  const r = Math.max(w, h) * 0.75;
  const grad = ctx.createRadialGradient(w * 0.8, -h * 0.1, 0, w * 0.8, -h * 0.1, r);
  grad.addColorStop(0, 'rgba(255, 224, 140, 0.30)');
  grad.addColorStop(0.45, 'rgba(255, 209, 102, 0.12)');
  grad.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  const tex = Texture.from(canvas);
  tex.source.scaleMode = 'linear';
  return tex;
}
