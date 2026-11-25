import { Container, Graphics } from 'pixi.js';
import { C } from '../../ui/widgets.ts';

interface Circle {
  kind: 'circle';
  x: number;
  y: number;
  r: number;
  t: number;
  delay: number;
  color: string;
  onFire: (() => void) | null;
}

interface Line {
  kind: 'line';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
  t: number;
  delay: number;
  color: string;
  onFire: (() => void) | null;
}

type Warning = Circle | Line;

/**
 * Attack warnings: red circles and lines that fill up, then fire their
 * callback. Every dangerous boss/enemy/hazard move is announced this way so
 * the player can read and dodge it. Safe zones use the same shapes in green.
 */
export class Telegraphs {
  readonly root = new Container();
  private readonly g = new Graphics();
  private list: Warning[] = [];
  private time = 0;
  /** Colour-blind mode: danger zones get an X, safe zones a +, not only red/green. */
  colorblind = false;

  constructor() {
    this.root.addChild(this.g);
  }

  circle(x: number, y: number, r: number, delay: number, onFire: (() => void) | null, color = 'r'): void {
    this.list.push({ kind: 'circle', x, y, r, t: 0, delay, color, onFire });
  }

  line(x0: number, y0: number, x1: number, y1: number, width: number, delay: number, onFire: (() => void) | null, color = 'r'): void {
    this.list.push({ kind: 'line', x0, y0, x1, y1, width, t: 0, delay, color, onFire });
  }

  clear(): void {
    this.list = [];
  }

  update(dt: number): void {
    this.time += dt;
    for (const w of this.list) {
      w.t += dt;
      if (w.t >= w.delay && w.onFire) {
        const fire = w.onFire;
        w.onFire = null;
        fire();
      }
    }
    this.list = this.list.filter((w) => w.t < w.delay + 0.08);
  }

  render(): void {
    const g = this.g;
    g.clear();
    const blink = Math.floor(this.time * 12) % 2 === 0;
    for (const w of this.list) {
      const k = Math.min(1, w.t / w.delay);
      const edge = C(w.color === 'r' ? (blink ? 'r' : 'R') : w.color);
      if (w.kind === 'circle') {
        const x = Math.round(w.x);
        const y = Math.round(w.y);
        g.circle(x, y, Math.round(w.r)).stroke({ width: 1, color: edge });
        if (k > 0.05) g.circle(x, y, Math.max(1, Math.round(w.r * k))).stroke({ width: 1, color: C(w.color === 'r' ? 'p' : w.color) });
        if (w.t >= w.delay) g.circle(x, y, Math.round(w.r)).fill(C('W'));
        if (this.colorblind && w.r >= 8) {
          const s = Math.round(w.r * 0.5);
          if (w.color === 'v') {
            g.rect(x - s, y, s * 2 + 1, 1).fill(C('W')).rect(x, y - s, 1, s * 2 + 1).fill(C('W'));
          } else if (w.color === 'r') {
            g.moveTo(x - s + 0.5, y - s + 0.5).lineTo(x + s + 0.5, y + s + 0.5).moveTo(x + s + 0.5, y - s + 0.5).lineTo(x - s + 0.5, y + s + 0.5).stroke({ width: 1, color: C('W') });
          }
        }
      } else {
        const dx = w.x1 - w.x0;
        const dy = w.y1 - w.y0;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * (w.width / 2);
        const ny = (dx / len) * (w.width / 2);
        // Dashed edges, filling from the origin toward the end.
        const steps = Math.floor(len / 6);
        for (let i = 0; i < steps; i += 2) {
          const t0 = i / steps;
          const t1 = (i + 1) / steps;
          for (const s of [-1, 1]) {
            g.moveTo(Math.round(w.x0 + dx * t0 + nx * s) + 0.5, Math.round(w.y0 + dy * t0 + ny * s) + 0.5)
              .lineTo(Math.round(w.x0 + dx * t1 + nx * s) + 0.5, Math.round(w.y0 + dy * t1 + ny * s) + 0.5);
          }
        }
        g.stroke({ width: 1, color: edge });
        g.moveTo(Math.round(w.x0) + 0.5, Math.round(w.y0) + 0.5)
          .lineTo(Math.round(w.x0 + dx * k) + 0.5, Math.round(w.y0 + dy * k) + 0.5)
          .stroke({ width: Math.max(1, Math.round(w.width / 3)), color: C(w.color === 'r' ? 'p' : w.color) });
      }
    }
  }
}

/** Is point p inside the thick segment (x0,y0)-(x1,y1)? */
export function inSegment(px: number, py: number, x0: number, y0: number, x1: number, y1: number, halfWidth: number): boolean {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / len2));
  const cx = x0 + dx * t;
  const cy = y0 + dy * t;
  return (px - cx) ** 2 + (py - cy) ** 2 <= halfWidth * halfWidth;
}
