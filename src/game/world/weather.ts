import { Container, Graphics } from 'pixi.js';
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

  constructor() {
    this.root.addChild(this.g);
  }

  setZone(zone: string, w: number, h: number, rng: Rng): void {
    this.zone = zone;
    this.w = w;
    this.h = h;
    // The southern rain is lighter than before (80 → 45 drops) so it does not pile noise on the mist.
    const count = { norte: 26, centro: 0, sur: 45, patagonia: 70, antartica: 50 }[zone] ?? 0;
    this.drops = Array.from({ length: count }, () => ({ x: rng.range(0, w), y: rng.range(0, h), s: rng.range(0.6, 1.4) }));
  }

  update(dt: number, windX: number, rng: Rng): void {
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
          d.x -= 50 * d.s * dt;
          d.y += 190 * d.s * dt;
          break;
        default:
          d.x += (windX * 2.2 + 20) * d.s * dt;
          d.y += 22 * d.s * dt;
      }
      wrap(d);
    }
    if (this.zone === 'centro') {
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
        break;
      case 'sur':
        for (const d of this.drops) {
          const x = Math.round(d.x);
          const y = Math.round(d.y);
          g.rect(x, y, 1, 1).fill(C('s')).rect(x - 1, y + 1, 1, 1).fill(C('s')).rect(x - 2, y + 2, 1, 1).fill(C('G'));
        }
        break;
      case 'centro':
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
